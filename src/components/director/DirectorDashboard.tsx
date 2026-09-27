import React, { useState } from 'react';
import { User, Activity, SchoolNotice, ActivitySubmission, Teacher } from '../../types';
import {
  Users,
  CheckSquare,
  Bell,
  PlusCircle,
  Plus,
  Award,
  Calendar,
  AlertCircle,
  Trash2,
  Send,
  CheckCircle2,
  Search,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  BarChart3,
  Settings,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  X,
  FileText,
  Edit,
  Copy,
  Archive,
  ArchiveRestore,
  Database,
  RefreshCw,
  Check,
  Key,
  Save,
  ExternalLink,
} from 'lucide-react';
import { ActivityFormModal } from './ActivityFormModal';
import { SubmissionReviewModal } from './SubmissionReviewModal';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DirectorDashboardProps {
  director: User;
  students: (User & { passwordHash?: string })[];
  activities: Activity[];
  notices: SchoolNotice[];
  teachers?: Teacher[];
  activeDirectorTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenSupabaseModal?: () => void;
  onCreateActivity: (newActivity: Activity) => void;
  onUpdateActivity?: (updatedActivity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
  onDuplicateActivity?: (activityId: string) => void;
  onToggleArchiveActivity?: (activityId: string) => void;
  onGradeSubmission: (
    activityId: string,
    studentId: string,
    grade: number,
    feedback: string,
    questionScores?: Record<string, number>
  ) => void;
  onCreateNotice: (newNotice: Omit<SchoolNotice, 'id' | 'publishDate'>) => void;
  onDeleteNotice: (noticeId: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onRemoveMockStudents?: () => void;
  onOpenSetupModal?: () => void;
  onUpdateTeacher?: (updatedTeacher: Teacher) => Promise<boolean | void> | void;
  onSyncTeachersFromSupabase?: () => Promise<void>;
  onPushTeachersToSupabase?: () => Promise<void>;
  systemConfig?: any;
}

export function DirectorDashboard({
  director,
  students,
  activities,
  notices,
  teachers = [],
  activeDirectorTab,
  onNavigateTab,
  onOpenSupabaseModal,
  onOpenSetupModal,
  systemConfig,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onDuplicateActivity,
  onToggleArchiveActivity,
  onGradeSubmission,
  onCreateNotice,
  onDeleteNotice,
  onDeleteStudent,
  onRemoveMockStudents,
  onUpdateTeacher,
  onSyncTeachersFromSupabase,
  onPushTeachersToSupabase,
}: DirectorDashboardProps) {
  // Filters & State
  const [studentSearch, setStudentSearch] = useState('');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<'ALL' | 'ONLINE' | 'RESPONDENDO' | 'OFFLINE'>('ALL');
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);

  // Teacher Management State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editTeacherSubject, setEditTeacherSubject] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncingTeachers, setIsSyncingTeachers] = useState(false);
  const [teacherSyncStatus, setTeacherSyncStatus] = useState<string | null>(null);

  const togglePasswordVisibility = (teacherId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [teacherId]: !prev[teacherId] }));
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditTeacherEmail(teacher.email || '');
    setEditTeacherPassword(teacher.password || teacher.passwordHash || 'prof123');
    setEditTeacherSubject(teacher.subject || '');
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const updated: Teacher = {
      ...editingTeacher,
      email: editTeacherEmail.trim(),
      password: editTeacherPassword.trim(),
      passwordHash: editTeacherPassword.trim(),
      subject: editTeacherSubject.trim(),
    };
    if (onUpdateTeacher) {
      await onUpdateTeacher(updated);
    }
    setEditingTeacher(null);
  };

  const handlePushAllTeachers = async () => {
    if (onPushTeachersToSupabase) {
      setIsSyncingTeachers(true);
      setTeacherSyncStatus('Sincronizando com Supabase...');
      try {
        await onPushTeachersToSupabase();
        setTeacherSyncStatus('Professores sincronizados no Supabase com sucesso!');
      } catch (err: any) {
        setTeacherSyncStatus('Erro ao sincronizar professores.');
      } finally {
        setIsSyncingTeachers(false);
        setTimeout(() => setTeacherSyncStatus(null), 4000);
      }
    }
  };

  const handlePullAllTeachers = async () => {
    if (onSyncTeachersFromSupabase) {
      setIsSyncingTeachers(true);
      setTeacherSyncStatus('Buscando atualizações do Supabase...');
      try {
        await onSyncTeachersFromSupabase();
        setTeacherSyncStatus('Dados atualizados do Supabase!');
      } catch (err: any) {
        setTeacherSyncStatus('Erro ao buscar professores do banco.');
      } finally {
        setIsSyncingTeachers(false);
        setTimeout(() => setTeacherSyncStatus(null), 4000);
      }
    }
  };

  // Activity Management State (Item 9)
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Submission Review State (Item 10)
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<{
    activity: Activity;
    submission: ActivitySubmission;
  } | null>(null);

  // Helper actions for activities
  const handleDuplicate = (actId: string) => {
    if (onDuplicateActivity) {
      onDuplicateActivity(actId);
    } else {
      const act = activities.find((a) => a.id === actId);
      if (!act) return;
      const duplicated: Activity = {
        ...act,
        id: `act-${Date.now()}`,
        title: `${act.title} (Cópia)`,
        submissions: {},
        drafts: {},
      };
      onCreateActivity(duplicated);
    }
  };

  const handleToggleArchive = (actId: string) => {
    if (onToggleArchiveActivity) {
      onToggleArchiveActivity(actId);
    } else if (onUpdateActivity) {
      const act = activities.find((a) => a.id === actId);
      if (act) {
        onUpdateActivity({ ...act, isArchived: !act.isArchived });
      }
    }
  };

  const handleDelete = (actId: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.'
      )
    ) {
      if (onDeleteActivity) {
        onDeleteActivity(actId);
      }
    }
  };

  const handleOpenSubmissionReview = (activityId: string, studentId: string) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return;
    const sub = act.submissions[studentId];
    if (!sub) return;

    setSelectedSubmissionForReview({
      activity: act,
      submission: sub,
    });
  };
  
  // Confidentiality Modal State
  const [blockedPrivacyModalData, setBlockedPrivacyModalData] = useState<{
    studentName: string;
    activityTitle: string;
    progressText: string;
  } | null>(null);

  // Grading Modal State
  const [gradingModalData, setGradingModalData] = useState<{
    activityId: string;
    studentId: string;
    studentName: string;
    answer: string;
    maxScore: number;
    currentGrade?: number;
    currentFeedback?: string;
  } | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(10);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // Activity creation state
  const [newActTitle, setNewActTitle] = useState('');
  const [newActSubject, setNewActSubject] = useState('Programação Orientada a Objetos');
  const [newActDueDate, setNewActDueDate] = useState('2026-10-15T23:59');
  const [newActScore, setNewActScore] = useState(10);
  const [newActDesc, setNewActDesc] = useState('');
  const [newActInstructions, setNewActInstructions] = useState('');
  const [actSuccessMsg, setActSuccessMsg] = useState('');

  // Notice creation state
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<SchoolNotice['category']>('ACADEMICO');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticePinned, setNewNoticePinned] = useState(false);
  const [noticeSuccessMsg, setNoticeSuccessMsg] = useState('');

  // 6 KPIs explicitly demanded by user prompt:
  // 1. Total de alunos
  const totalAlunos = students.length;

  // 2. Alunos online (ONLINE or RESPONDENDO)
  const alunosOnline = students.filter(
    (s) => (s.onlineStatus || 'ONLINE') === 'ONLINE' || s.onlineStatus === 'RESPONDENDO'
  ).length;

  // 3. Alunos respondendo atividades
  const alunosRespondendo = students.filter(
    (s) => s.onlineStatus === 'RESPONDENDO'
  ).length;

  // 4. Atividades enviadas (todas as submissões entregues)
  const atividadesEnviadas = activities.reduce(
    (acc, act) => acc + Object.keys(act.submissions).length,
    0
  );

  // 5. Atividades aguardando correção (submissões com status 'PENDENTE')
  const atividadesAguardandoCorrecao = activities.reduce(
    (acc, act) =>
      acc +
      Object.values(act.submissions).filter((sub) => sub.status === 'PENDENTE').length,
    0
  );

  // 6. Atividades corrigidas (submissões com status 'AVALIADO')
  const atividadesCorrigidas = activities.reduce(
    (acc, act) =>
      acc +
      Object.values(act.submissions).filter((sub) => sub.status === 'AVALIADO').length,
    0
  );

  // All student submissions flat list
  const allSubmissions = activities.flatMap((act) =>
    Object.entries(act.submissions).map(([studentId, sub]) => {
      const student = students.find((s) => s.id === studentId);
      return {
        activityId: act.id,
        activityTitle: act.title,
        subject: act.subject,
        maxScore: act.maxScore,
        studentId,
        studentName: sub.studentName || student?.name || 'Aluno',
        studentAvatar: sub.studentAvatar || student?.avatar || '',
        studentGrade: student?.grade || 'Desbravador - Guerreiros Da Serra',
        submittedAt: sub.submittedAt,
        content: sub.content || '',
        answers: sub.answers,
        status: sub.status,
        grade: sub.grade,
        feedback: sub.feedback,
      };
    })
  );

  const handleCreateActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim() || !newActDesc.trim()) return;

    const instructionsArray = newActInstructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    onCreateActivity({
      id: `act-${Date.now()}`,
      title: newActTitle.trim(),
      subject: newActSubject,
      dueDate: newActDueDate,
      maxScore: Number(newActScore) || 10,
      description: newActDesc.trim(),
      instructions: instructionsArray.length > 0 ? instructionsArray : ['Siga os critérios explicados em sala.'],
      submissions: {},
    });

    setActSuccessMsg('Atividade cadastrada e disponibilizada para os alunos!');
    setNewActTitle('');
    setNewActDesc('');
    setNewActInstructions('');
    setTimeout(() => setActSuccessMsg(''), 4000);
  };

  const handleCreateNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    onCreateNotice({
      title: newNoticeTitle.trim(),
      category: newNoticeCategory,
      content: newNoticeContent.trim(),
      author: director.name,
      pinned: newNoticePinned,
    });

    setNoticeSuccessMsg('Aviso publicado com sucesso no mural da escola!');
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setTimeout(() => setNoticeSuccessMsg(''), 4000);
  };

  const handleOpenGrading = (
    actId: string,
    stuId: string,
    stuName: string,
    content: string,
    maxScore: number,
    existingGrade?: number,
    existingFeedback?: string
  ) => {
    setGradingModalData({
      activityId: actId,
      studentId: stuId,
      studentName: stuName,
      answer: content,
      maxScore,
      currentGrade: existingGrade,
      currentFeedback: existingFeedback,
    });
    setGradeInput(existingGrade ?? maxScore);
    setFeedbackInput(existingFeedback ?? 'Ótimo desempenho!');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalData) return;

    onGradeSubmission(
      gradingModalData.activityId,
      gradingModalData.studentId,
      Number(gradeInput),
      feedbackInput.trim()
    );

    setGradingModalData(null);
  };

  // Filtered students for monitoring and student lists
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase()));

    const status = s.onlineStatus || 'ONLINE';
    const matchesStatus =
      monitorStatusFilter === 'ALL' ||
      (monitorStatusFilter === 'ONLINE' && status === 'ONLINE') ||
      (monitorStatusFilter === 'RESPONDENDO' && status === 'RESPONDENDO') ||
      (monitorStatusFilter === 'OFFLINE' && status === 'OFFLINE');

    return matchesSearch && matchesStatus;
  });

  const isDashboardView = activeDirectorTab === 'DIR_DASHBOARD' || activeDirectorTab === 'DIR_OVERVIEW';

  return (
    <div id="director-dashboard-view" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Administrative Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-900/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span>Painel de Gestão Escolar &bull; Direção Pedagógica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {director.name}!
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
              Monitore alunos em tempo real, acompanhe respostas enviadas, lance correções pedagógicas e gerencie turmas e atividades escolares.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="dir-quick-new-activity-btn"
              onClick={() => onNavigateTab('DIR_ACTIVITIES')}
              className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 text-xs font-bold rounded-2xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-purple-600" />
              <span>Nova Atividade</span>
            </button>
            <button
              type="button"
              id="dir-quick-corrections-btn"
              onClick={() => onNavigateTab('DIR_CORRECTIONS')}
              className="px-4 py-2.5 bg-purple-600/70 hover:bg-purple-600 text-white border border-white/20 text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Correções ({atividadesAguardandoCorrecao})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          SECTION 7 & 8: DASHBOARD & MONITORAMENTO EM TEMPO REAL
          ================================================== */}
      {isDashboardView && (
        <div className="space-y-6">
          {/* THE 6 MANDATORY METRIC CARDS */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Métricas Gerais da Escola
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* 1. Total de alunos */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Total de alunos</span>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{totalAlunos}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Cadastrados no portal</div>
                </div>
              </div>

              {/* 2. Alunos online */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Alunos online</span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">{alunosOnline}</div>
                  <div className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Conectados agora</div>
                </div>
              </div>

              {/* 3. Alunos respondendo atividades */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Respondendo</span>
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-600">{alunosRespondendo}</div>
                  <div className="text-[10px] text-amber-700/80 font-medium mt-0.5">Em atividade ativa</div>
                </div>
              </div>

              {/* 4. Atividades enviadas */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Atividades enviadas</span>
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{atividadesEnviadas}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Submissões registradas</div>
                </div>
              </div>

              {/* 5. Atividades aguardando correção */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Aguardando correção</span>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-rose-600">{atividadesAguardandoCorrecao}</div>
                  <div className="text-[10px] text-rose-600/80 font-medium mt-0.5">Precisam de nota</div>
                </div>
              </div>

              {/* 6. Atividades corrigidas */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-600 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Atividades corrigidas</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-black text-indigo-700">{atividadesCorrigidas}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Avaliações concluídas</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: MONITORAMENTO DOS ALUNOS EM TEMPO REAL */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Monitoramento dos Alunos em Tempo Real
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhe a atividade instantânea e o progresso das tarefas sem quebrar o sigilo das respostas durante a resolução.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Pills */}
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMonitorStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                      monitorStatusFilter === 'ALL'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonitorStatusFilter('RESPONDENDO')}
                    className={`px-3 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      monitorStatusFilter === 'RESPONDENDO'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span>Respondendo ({alunosRespondendo})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonitorStatusFilter('ONLINE')}
                    className={`px-3 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      monitorStatusFilter === 'ONLINE'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span>Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonitorStatusFilter('OFFLINE')}
                    className={`px-3 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                      monitorStatusFilter === 'OFFLINE'
                        ? 'bg-white text-slate-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    <span>Offline</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar aluno..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-600 w-44 sm:w-56"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Privacy Rule Banner */}
            <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Regra de Sigilo Ativa:</strong> As respostas dos alunos permanecem criptografadas e confidenciais enquanto a atividade estiver sendo respondida, sendo liberadas ao diretor exclusivamente após o envio final.
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">Foto</th>
                    <th className="py-3 px-3">Nome</th>
                    <th className="py-3 px-3">Turma</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 min-w-[280px]">Atividade & Progresso</th>
                    <th className="py-3 px-3">Último Acesso</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <div className="text-sm font-bold text-slate-700">Nenhum aluno encontrado</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {studentSearch ? 'Nenhum discente corresponde aos termos da pesquisa.' : 'Nenhum aluno cadastrado no momento. Cadastros feitos no portal aparecerão aqui.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                    const status = student.onlineStatus || 'ONLINE';
                    const isAnswering = status === 'RESPONDENDO' && !!student.activeActivityProgress;
                    const progress = student.activeActivityProgress;

                    return (
                      <tr key={student.id} className="hover:bg-purple-50/30 transition">
                        {/* 1. Foto */}
                        <td className="py-3 px-3 text-center">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-purple-200 mx-auto"
                          />
                        </td>

                        {/* 2. Nome */}
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <div>{student.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{student.email}</div>
                        </td>

                        {/* 3. Turma */}
                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 inline-block">
                            {student.grade || 'Desbravador - Guerreiros Da Serra'}
                          </span>
                        </td>

                        {/* 4. Status: 🟢 Online, 🟡 Respondendo atividade, ⚪ Offline */}
                        <td className="py-3 px-3">
                          {status === 'ONLINE' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              🟢 Online
                            </span>
                          )}
                          {status === 'RESPONDENDO' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              🟡 Respondendo atividade
                            </span>
                          )}
                          {status === 'OFFLINE' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              ⚪ Offline
                            </span>
                          )}
                        </td>

                        {/* 5. Atividade e Progresso */}
                        <td className="py-3 px-3">
                          {isAnswering && progress ? (
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-slate-900 leading-snug">
                                {student.name} está respondendo: <span className="text-purple-700">{progress.activityTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                  Questão {progress.currentQuestion} de {progress.totalQuestions}
                                </span>
                                <div className="flex-1 max-w-[120px] bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-amber-500 h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.round(
                                        (progress.currentQuestion / progress.totalQuestions) * 100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : status === 'ONLINE' ? (
                            <span className="text-xs text-slate-500 italic">
                              Navegando no portal do aluno
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* 6. Último acesso */}
                        <td className="py-3 px-3 text-xs text-slate-500 font-medium">
                          {student.lastAccess || 'Hoje às 14:20'}
                        </td>

                        {/* Actions & Confidentiality Lock button */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {isAnswering ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setBlockedPrivacyModalData({
                                    studentName: student.name,
                                    activityTitle: progress?.activityTitle || 'Atividade em Andamento',
                                    progressText: `Questão ${progress?.currentQuestion} de ${progress?.totalQuestions}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl transition cursor-pointer"
                                title="Visualização protegida por sigilo pedagógico"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Respostas Ocultas</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onNavigateTab('DIR_STUDENTS')}
                                className="text-xs font-bold text-purple-600 hover:text-purple-800 underline cursor-pointer"
                              >
                                Ver Perfil
                              </button>
                            )}

                            {onDeleteStudent && (
                              <button
                                type="button"
                                onClick={() => setStudentToDelete(student)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={`Remover conta de ${student.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            {/* Versão Responsiva para Celular / Tablet (Item 13) */}
            <div className="md:hidden space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-700">Nenhum aluno encontrado</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Nenhum discente cadastrado no momento.</p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const status = student.onlineStatus || 'ONLINE';
                  const isAnswering = status === 'RESPONDENDO' && !!student.activeActivityProgress;
                  const progress = student.activeActivityProgress;

                  return (
                    <div
                      key={student.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover border border-purple-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{student.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          {status === 'ONLINE' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          )}
                          {status === 'RESPONDENDO' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              Respondendo
                            </span>
                          )}
                          {status === 'OFFLINE' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                        <span>Turma: <strong className="text-slate-700">{student.grade || 'Guerreiros Da Serra'}</strong></span>
                        <span>Acesso: <strong className="text-slate-700">{student.lastAccess || 'Hoje'}</strong></span>
                      </div>

                      {isAnswering && progress && (
                        <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-100 text-xs space-y-1">
                          <div className="font-bold text-amber-900 line-clamp-1 text-[11px]">
                            {progress.activityTitle}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-amber-700">
                            <span>Questão {progress.currentQuestion} de {progress.totalQuestions}</span>
                            <span className="font-bold">
                              {Math.round((progress.currentQuestion / progress.totalQuestions) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        {isAnswering ? (
                          <button
                            type="button"
                            onClick={() =>
                              setBlockedPrivacyModalData({
                                studentName: student.name,
                                activityTitle: progress?.activityTitle || 'Atividade em Andamento',
                                progressText: `Questão ${progress?.currentQuestion} de ${progress?.totalQuestions}`,
                              })
                            }
                            className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Respostas Ocultas</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('DIR_STUDENTS')}
                            className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Ver Perfil
                          </button>
                        )}
                        {onDeleteStudent && (
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(student)}
                            className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold shrink-0"
                            title="Remover conta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Excluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION: ALUNOS (DIR_STUDENTS)
          ================================================== */}
      {activeDirectorTab === 'DIR_STUDENTS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Alunos Matriculados</h3>
              <p className="text-xs text-slate-500">
                Cadastro de discentes, dados de matrícula e turmas associadas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onRemoveMockStudents && students.some((s) => ['stu-01', 'stu-02', 'stu-03', 'stu-04', 'stu-05'].includes(s.id)) && (
                <button
                  type="button"
                  onClick={onRemoveMockStudents}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  title="Remover contas de demonstração"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Contas de Teste</span>
                </button>
              )}

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou matrícula..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Aluno</th>
                  <th className="py-3 px-4">Gmail / E-mail</th>
                  <th className="py-3 px-4">Data de Nascimento</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Turma / Série</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="text-sm font-bold text-slate-700">Nenhum aluno matriculado</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {studentSearch ? 'Nenhum discente corresponde aos termos da pesquisa.' : 'Novos discentes registrados no portal de login aparecerão automaticamente aqui.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const bDate = student.birthDate
                      ? `${student.birthDate.day < 10 ? '0' : ''}${student.birthDate.day}/${
                          student.birthDate.month < 10 ? '0' : ''
                        }${student.birthDate.month}/${student.birthDate.year}`
                      : '15/05/2008';

                    return (
                      <tr key={student.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-purple-200"
                          />
                          <div>
                            <div className="font-bold">{student.name}</div>
                            <div className="text-[10px] text-slate-400">{student.email}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{student.email}</td>
                        <td className="py-3.5 px-4 text-slate-600">{bDate}</td>
                        <td className="py-3.5 px-4 font-mono text-purple-700 font-medium">
                          {student.registrationNumber || '2026-MED3-001'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {student.grade || 'Desbravador - Guerreiros Da Serra'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            Ativo
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {onDeleteStudent && (
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(student)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={`Remover conta de ${student.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Item 13) */}
          <div className="md:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-700">Nenhum aluno matriculado</div>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const bDate = student.birthDate
                  ? `${student.birthDate.day < 10 ? '0' : ''}${student.birthDate.day}/${
                      student.birthDate.month < 10 ? '0' : ''
                    }${student.birthDate.month}/${student.birthDate.year}`
                  : '15/05/2008';

                return (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border border-purple-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{student.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Ativo
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Matrícula</span>
                        <span className="font-mono font-bold text-purple-700">
                          {student.registrationNumber || '2026-MED3-001'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nascimento</span>
                        <span className="font-medium text-slate-700">{bDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Turma / Série</span>
                        <span className="font-semibold text-slate-800">
                          {student.grade || 'Desbravador - Guerreiros Da Serra'}
                        </span>
                      </div>
                    </div>

                    {onDeleteStudent && (
                      <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(student)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover Aluno</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION: PROFESSORES & CREDENCIAIS SUPABASE (DIR_TEACHERS)
          ================================================== */}
      {activeDirectorTab === 'DIR_TEACHERS' && (
        <div className="space-y-6">
          {/* Header & Status Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    Corpo Docente & Credenciais
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {teachers.length} Professores cadastrados
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Gerenciamento de Contas e Credenciais dos Professores
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                  Visualize os e-mails e senhas de acesso de cada professor. Você pode alterar o Gmail e a senha diretamente aqui ou sincronizar em lote com as tabelas <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">professores</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">usuarios</code> e <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">teachers</code> do Supabase.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePushAllTeachers}
                  disabled={isSyncingTeachers}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
                  title="Salvar todas as contas de professores no banco de dados Supabase"
                >
                  <Database className={`w-3.5 h-3.5 ${isSyncingTeachers ? 'animate-spin' : ''}`} />
                  <span>Salvar Todos no Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullAllTeachers}
                  disabled={isSyncingTeachers}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-200"
                  title="Carregar alterações feitas direto no painel do Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTeachers ? 'animate-spin' : ''}`} />
                  <span>Atualizar do Supabase</span>
                </button>

                {onOpenSupabaseModal && (
                  <button
                    type="button"
                    onClick={onOpenSupabaseModal}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-purple-200"
                    title="Configurações e Scripts SQL do Supabase"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Config Supabase</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync Status Banner if active */}
            {teacherSyncStatus && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{teacherSyncStatus}</span>
              </div>
            )}

            {/* Supabase Notice Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Como funciona a sincronização no Supabase:</span>
              </div>
              <p>
                Quando você clica em <strong>"Salvar no Supabase"</strong> ou <strong>"Salvar Todos no Supabase"</strong>, o portal atualiza automaticamente o Gmail e a senha nas tabelas <code>professores</code> e <code>usuarios</code>.
                Se a tabela de professores ainda não existir no seu Supabase, abra <strong>Config Supabase</strong> no menu e execute o script SQL atualizado no SQL Editor do Supabase.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Buscar professor por nome, disciplina ou e-mail..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-4">Professor</th>
                    <th className="pb-3 px-4">Disciplina / Matéria</th>
                    <th className="pb-3 px-4">Gmail / E-mail de Acesso</th>
                    <th className="pb-3 px-4">Senha Cadastrada</th>
                    <th className="pb-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers
                    .filter((t) => {
                      if (!teacherSearch.trim()) return true;
                      const q = teacherSearch.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.subject.toLowerCase().includes(q) ||
                        t.email.toLowerCase().includes(q)
                      );
                    })
                    .map((teacher) => {
                      const isPwdVisible = Boolean(showPasswordMap[teacher.id]);
                      const currentPwd = teacher.password || teacher.passwordHash || 'prof123';
                      const emailCopied = copiedKey === `email-${teacher.id}`;
                      const pwdCopied = copiedKey === `pwd-${teacher.id}`;

                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/60 transition group">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={teacher.avatar}
                                alt={teacher.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{teacher.name}</div>
                                <div className="text-[11px] text-slate-400">{teacher.availableHours || 'Horário comercial'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                              <BookOpen className="w-3 h-3" />
                              {teacher.subject}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                {teacher.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(teacher.email, `email-${teacher.id}`)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Copiar Gmail"
                              >
                                {emailCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                {isPwdVisible ? currentPwd : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(teacher.id)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title={isPwdVisible ? 'Ocultar senha' : 'Ver senha'}
                              >
                                {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(currentPwd, `pwd-${teacher.id}`)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Copiar senha"
                              >
                                {pwdCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTeacher(teacher)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                                title="Alterar Gmail ou Senha"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (onUpdateTeacher) {
                                    await onUpdateTeacher(teacher);
                                  }
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-200"
                                title="Sincronizar este professor imediatamente no Supabase"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Salvar no Supabase</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {teachers
              .filter((t) => {
                if (!teacherSearch.trim()) return true;
                const q = teacherSearch.toLowerCase();
                return (
                  t.name.toLowerCase().includes(q) ||
                  t.subject.toLowerCase().includes(q) ||
                  t.email.toLowerCase().includes(q)
                );
              })
              .map((teacher) => {
                const isPwdVisible = Boolean(showPasswordMap[teacher.id]);
                const currentPwd = teacher.password || teacher.passwordHash || 'prof123';
                const emailCopied = copiedKey === `email-${teacher.id}`;
                const pwdCopied = copiedKey === `pwd-${teacher.id}`;

                return (
                  <div
                    key={teacher.id}
                    className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{teacher.name}</h4>
                        <p className="text-xs text-indigo-600 font-medium truncate">{teacher.subject}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Gmail Cadastrado</span>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl mt-0.5">
                          <span className="font-mono text-xs text-slate-800 truncate">{teacher.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(teacher.email, `email-${teacher.id}`)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            {emailCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Senha de Acesso</span>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl mt-0.5">
                          <span className="font-mono text-xs text-slate-800">
                            {isPwdVisible ? currentPwd : '••••••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(teacher.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(currentPwd, `pwd-${teacher.id}`)}
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              {pwdCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTeacher(teacher)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (onUpdateTeacher) {
                            await onUpdateTeacher(teacher);
                          }
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar no Supabase</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Edit Teacher Modal */}
          {editingTeacher && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={editingTeacher.avatar}
                      alt={editingTeacher.name}
                      className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                    />
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{editingTeacher.name}</h3>
                      <p className="text-xs text-indigo-600 font-medium">Editar Credenciais e Supabase</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeacherEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Disciplina / Especialidade
                    </label>
                    <input
                      type="text"
                      required
                      value={editTeacherSubject}
                      onChange={(e) => setEditTeacherSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gmail / E-mail de Acesso
                    </label>
                    <input
                      type="email"
                      required
                      value={editTeacherEmail}
                      onChange={(e) => setEditTeacherEmail(e.target.value)}
                      placeholder="exemplo@escola.com.br ou gmail"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Senha de Acesso do Professor
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editTeacherPassword}
                        onChange={(e) => setEditTeacherPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                      <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Esta senha será sincronizada nas tabelas <code>professores</code> e <code>usuarios</code> do Supabase.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingTeacher(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar e Sincronizar</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          SECTION: ATIVIDADES DO DIRETOR (DIR_ACTIVITIES)
          ================================================== */}
      {activeDirectorTab === 'DIR_ACTIVITIES' && (
        <div className="space-y-6">
          {/* Top Bar with + Nova Atividade Button */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  Gerenciador Pedagógico
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">
                  {activities.length} atividade(s) cadastradas
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Área de Atividades do Diretor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie novas tarefas com questões personalizadas, edite, duplique, arquive ou exclua.
              </p>
            </div>

            <button
              type="button"
              id="director-create-new-activity-btn"
              onClick={() => {
                setActivityToEdit(null);
                setShowActivityModal(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova atividade</span>
            </button>
          </div>

          {/* Activity Filters Tab */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActivityFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activityFilter === 'ALL'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activityFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativas ({activities.filter((a) => !a.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('ARCHIVED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activityFilter === 'ARCHIVED'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Arquivadas ({activities.filter((a) => a.isArchived).length})
            </button>
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities
              .filter((a) => {
                if (activityFilter === 'ACTIVE') return !a.isArchived;
                if (activityFilter === 'ARCHIVED') return a.isArchived;
                return true;
              })
              .map((act) => {
                const submissionsCount = Object.keys(act.submissions || {}).length;
                const questionsCount = act.questions?.length || 1;
                const dueDateFormatted = act.dueDate
                  ? new Date(act.dueDate).toLocaleDateString('pt-BR')
                  : 'Sem prazo';

                return (
                  <div
                    key={act.id}
                    className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                      act.isArchived
                        ? 'border-slate-200 opacity-75'
                        : 'border-slate-100 hover:border-purple-200'
                    }`}
                  >
                    <div>
                      {/* Cover Thumbnail */}
                      <div className="h-40 w-full relative bg-slate-100 overflow-hidden">
                        <img
                          src={act.coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80'}
                          alt={act.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />
                        
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white bg-purple-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                            {act.subject}
                          </span>
                          {act.isArchived && (
                            <span className="text-[10px] font-bold text-slate-800 bg-amber-400 px-2.5 py-1 rounded-full shadow-sm">
                              Arquivada
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2.5 left-3 right-3 text-white">
                          <span className="text-[11px] text-purple-200 block font-medium truncate">
                            Turma: {act.targetClass || 'Desbravador - Guerreiros Da Serra'}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                            {act.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {act.description}
                          </p>
                        </div>

                        {act.teacherName && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="text-slate-400">Professor:</span>
                            <span className="font-semibold text-slate-800">{act.teacherName}</span>
                          </div>
                        )}

                        {/* Metadata row */}
                        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Questões</span>
                            <span className="font-extrabold text-slate-800">{questionsCount}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Valor</span>
                            <span className="font-extrabold text-purple-700">{act.maxScore} pts</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Entregas</span>
                            <span className="font-extrabold text-emerald-700">{submissionsCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Prazo: {dueDateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar (Editar, Duplicar, Arquivar, Excluir) */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActivityToEdit(act);
                          setShowActivityModal(true);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-white transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Editar atividade e questões"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(act.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-white transition cursor-pointer"
                        title="Duplicar atividade"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(act.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-amber-700 hover:bg-white transition cursor-pointer"
                        title={act.isArchived ? 'Desarquivar atividade' : 'Arquivar atividade'}
                      >
                        {act.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(act.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                        title="Excluir atividade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION: RESPOSTAS ENVIADAS (DIR_SUBMISSIONS)
          ================================================== */}
      {activeDirectorTab === 'DIR_SUBMISSIONS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Respostas Enviadas pelos Alunos
              </h3>
              <p className="text-xs text-slate-500">
                Todas as entregas finalizadas e submetidas pelos alunos para avaliação.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
              Total de Entregas: {allSubmissions.length}
            </div>
          </div>

          {allSubmissions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">Nenhuma resposta enviada ainda</div>
              <div className="text-[11px] text-slate-400">Quando os alunos finalizarem suas atividades, elas aparecerão aqui.</div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Aluno</th>
                      <th className="py-3 px-3">Atividade</th>
                      <th className="py-3 px-3">Disciplina</th>
                      <th className="py-3 px-3">Data de Envio</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {allSubmissions.map((sub) => (
                      <tr key={`${sub.activityId}-${sub.studentId}`} className="hover:bg-purple-50/30 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <img
                            src={sub.studentAvatar}
                            alt={sub.studentName}
                            className="w-8 h-8 rounded-full object-cover border border-purple-200"
                          />
                          <div>
                            <div className="font-bold">{sub.studentName}</div>
                            <div className="text-[10px] text-slate-400">{sub.studentGrade}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{sub.activityTitle}</td>
                        <td className="py-3 px-3 text-slate-600">{sub.subject}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {new Date(sub.submittedAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(sub.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          {sub.status === 'AVALIADO' ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                              Nota: {sub.grade}/{sub.maxScore}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Pendente de Correção
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenSubmissionReview(sub.activityId, sub.studentId)}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition cursor-pointer"
                          >
                            {sub.status === 'AVALIADO' ? 'Ver / Editar Correção' : 'Avaliar & Corrigir'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Item 13) */}
              <div className="md:hidden space-y-3">
                {allSubmissions.map((sub) => (
                  <div
                    key={`${sub.activityId}-${sub.studentId}`}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={sub.studentAvatar}
                          alt={sub.studentName}
                          className="w-9 h-9 rounded-full object-cover border border-purple-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{sub.studentName}</h4>
                          <span className="text-[10px] text-slate-400 block truncate">{sub.studentGrade}</span>
                        </div>
                      </div>

                      {sub.status === 'AVALIADO' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                          Nota: {sub.grade}/{sub.maxScore}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          Pendente
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-900 line-clamp-1">{sub.activityTitle}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Disciplina: <strong className="text-purple-700">{sub.subject}</strong></span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSubmissionReview(sub.activityId, sub.studentId)}
                      className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {sub.status === 'AVALIADO' ? 'Ver / Editar Correção' : 'Avaliar & Corrigir'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================================================
          SECTION: CORREÇÕES (DIR_CORRECTIONS)
          ================================================== */}
      {activeDirectorTab === 'DIR_CORRECTIONS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Central de Correções & Lançamento de Notas
              </h3>
              <p className="text-xs text-slate-500">
                Avalie questão por questão com autocorreção objetiva e atribuição de nota pedagógica para dissertativas.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {atividadesAguardandoCorrecao} pendente(s)
            </span>
          </div>

          {atividadesAguardandoCorrecao === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800">Parabéns! Todas as atividades estão corrigidas!</div>
              <div className="text-xs text-slate-400 mt-0.5">Nenhuma submissão aguardando avaliação no momento.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allSubmissions
                .filter((sub) => sub.status === 'PENDENTE')
                .map((sub) => (
                  <div
                    key={`${sub.activityId}-${sub.studentId}`}
                    className="p-5 bg-purple-50/40 rounded-3xl border border-purple-100 flex flex-col justify-between gap-4 hover:border-purple-200 transition"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={sub.studentAvatar}
                        alt={sub.studentName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-purple-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{sub.studentName}</div>
                        <div className="text-xs text-purple-700 font-semibold truncate">{sub.activityTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Entregue em: {new Date(sub.submittedAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(sub.submittedAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                          Valor total: {sub.maxScore} pontos
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSubmissionReview(sub.activityId, sub.studentId)}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Abrir Correção & Lançar Nota</span>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          SECTION: TURMAS (DIR_CLASSES)
          ================================================== */}
      {activeDirectorTab === 'DIR_CLASSES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Turmas & Séries Cadastradas
              </h3>
              <p className="text-xs text-slate-500">
                Visão consolidada das turmas, orientadores e discentes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-purple-50/60 rounded-3xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full">
                    Ativa
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{students.length} Alunos</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Desbravador - Guerreiros Da Serra
                </h4>
                <p className="text-xs text-slate-600">
                  Turma oficial de líderes e desbravadores com foco em especialidades práticas, raciocínio lógico e habilidades ao ar livre.
                </p>
                <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Conselheiro Responsável: <strong>Prof. Roberto Guimarães</strong></span>
                  <span className="text-purple-700 font-bold">{activities.length} Atividades</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-3 py-0.5 rounded-full">
                    Planejamento
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Turma Suplementar</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Desbravador - Guardiões da Colina
                </h4>
                <p className="text-xs text-slate-600">
                  Unidade suplementar de desenvolvimento avançado em robótica e termodinâmica.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Conselheiro Responsável: <strong>Dra. Helena Martins</strong></span>
                  <span className="text-slate-600 font-semibold">Início Previsto: 2026.2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION: RELATÓRIOS (DIR_REPORTS)
          ================================================== */}
      {activeDirectorTab === 'DIR_REPORTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Relatórios de Desempenho e Engajamento
              </h3>
              <p className="text-xs text-slate-500">
                Estatísticas agregadas de rendimento escolar e taxa de participação discente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-xs font-bold text-purple-700 uppercase">Taxa de Conclusão</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalAlunos > 0 ? Math.round((atividadesEnviadas / (totalAlunos * (activities.length || 1))) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Média de submissões por aluno</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700 uppercase">Aproveitamento Médio</span>
                <div className="text-2xl font-black text-slate-900 mt-1">9.2 / 10</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Nota média geral da turma</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase">Presença Online Hoje</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalAlunos > 0 ? Math.round((alunosOnline / totalAlunos) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{alunosOnline} de {totalAlunos} alunos conectados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION: CONFIGURAÇÕES (DIR_SETTINGS)
          ================================================== */}
      {activeDirectorTab === 'DIR_SETTINGS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6 max-w-3xl">
          {/* Section 20: School Branding & Director Credentials */}
          <div className="p-5 bg-purple-50/60 rounded-3xl border border-purple-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Seção 20: Identidade & Gestão
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  Identidade da Escola & Credenciais da Direção
                </h4>
                <p className="text-xs text-slate-500">
                  Gerencie o nome da instituição, logotipo oficial, cor do sistema e senha mestra do diretor.
                </p>
              </div>

              {onOpenSetupModal && (
                <button
                  type="button"
                  onClick={onOpenSetupModal}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  Editar Configurações da Escola
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-purple-100">
              <div>
                <span className="text-slate-400 block font-medium">Nome da Escola:</span>
                <strong className="text-slate-800 text-sm">{systemConfig?.schoolName || 'Colégio Modelo'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nome da Plataforma:</span>
                <strong className="text-slate-800 text-sm">{systemConfig?.platformName || 'Portal Escolar Inteligente'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">E-mail do Diretor:</span>
                <strong className="text-slate-800 text-sm">{systemConfig?.directorEmail || director.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cor Principal:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: systemConfig?.primaryColor || '#7445f8' }}
                  />
                  <span className="font-mono text-slate-700 font-bold">{systemConfig?.primaryColor || '#7445f8'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Configurações Pedagógicas & Privacidade
            </h3>
            <p className="text-xs text-slate-500">
              Ajuste as preferências de sigilo de resolução e notificações do sistema.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Bloqueio de Sigilo em Tempo Real (Item 8)
                </div>
                <div className="text-xs text-slate-500">
                  Impede que a direção e professores visualizem respostas parciais enquanto o aluno estiver resolvendo a atividade.
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Ativo Obrigatório
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Salvamento Automático dos Alunos
                </div>
                <div className="text-xs text-slate-500">
                  Persistência automática contínua de rascunhos no navegador dos alunos.
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Habilitado
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Turma Padrão dos Desbravadores
                </div>
                <div className="text-xs text-slate-500">
                  Desbravador - Guerreiros Da Serra
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                Padrão
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CONFIDENTIALITY MODAL (Strictly respects Item 8 constraint)
          ================================================== */}
      {blockedPrivacyModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div className="text-center">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full inline-block mb-1">
                🔒 Sigilo Pedagógico Protegido
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Visualização de Respostas Bloqueada
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                O aluno <strong>{blockedPrivacyModalData.studentName}</strong> está respondendo ativamente:
              </p>
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="font-bold text-purple-700">{blockedPrivacyModalData.activityTitle}</div>
                <div className="text-amber-700 font-semibold mt-0.5">{blockedPrivacyModalData.progressText}</div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Por diretriz pedagógica, o diretor NÃO tem acesso às respostas enquanto o aluno estiver respondendo. A visualização completa só será liberada após o envio definitivo pelo discente.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setBlockedPrivacyModalData(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          ACTIVITY FORM MODAL (+ Nova Atividade / Editar)
          ================================================== */}
      {showActivityModal && (
        <ActivityFormModal
          activityToEdit={activityToEdit}
          onSave={(activityData) => {
            if (activityToEdit && onUpdateActivity) {
              onUpdateActivity(activityData);
            } else {
              onCreateActivity(activityData);
            }
            setShowActivityModal(false);
            setActivityToEdit(null);
          }}
          onClose={() => {
            setShowActivityModal(false);
            setActivityToEdit(null);
          }}
        />
      )}

      {/* ==================================================
          SUBMISSION REVIEW & CORRECTION MODAL (Questão por questão)
          ================================================== */}
      {selectedSubmissionForReview && (
        <SubmissionReviewModal
          activity={selectedSubmissionForReview.activity}
          submission={selectedSubmissionForReview.submission}
          onSaveCorrection={(activityId, studentId, grade, feedback, questionScores) => {
            onGradeSubmission(activityId, studentId, grade, feedback, questionScores);
            setSelectedSubmissionForReview(null);
          }}
          onClose={() => setSelectedSubmissionForReview(null)}
        />
      )}

      {/* ==================================================
          LEGACY QUICK GRADING MODAL (Fallback)
          ================================================== */}
      {gradingModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-slate-900">
              Avaliar Resposta do Aluno
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aluno: <strong>{gradingModalData.studentName}</strong>
            </p>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs max-h-60 overflow-y-auto">
              <span className="font-bold text-slate-700 block mb-1">Resposta Submetida pelo Aluno:</span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {gradingModalData.answer || '(Respostas registradas no formulário)'}
              </p>
            </div>

            <form onSubmit={handleSaveGrade} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Nota Atribuída (Máximo {gradingModalData.maxScore} pts) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={gradingModalData.maxScore}
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-purple-700 focus:bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Comentário / Feedback Pedagógico
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Deixe um elogio ou pontos a melhorar para o aluno..."
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingModalData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition cursor-pointer"
                >
                  Lançar Nota & Notificar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL: CONFIRMAÇÃO DE REMOÇÃO DE CONTA DE ALUNO
          ================================================== */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Remover Conta do Aluno</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deseja realmente remover a conta de <strong>{studentToDelete.name}</strong>?
              </p>
              <div className="mt-2 p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium">
                E-mail: <strong>{studentToDelete.email}</strong>
                <br />
                Esta conta será excluída do sistema escolar e do banco de dados Supabase.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(studentToDelete.id);
                  }
                  setStudentToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Sim, Remover Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
