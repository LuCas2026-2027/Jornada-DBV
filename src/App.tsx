import { useState, useEffect } from 'react';
import {
  getInitialState,
  persistSession,
  persistActivities,
  persistNotices,
  persistCourses,
  persistStudents,
  persistNotifications,
  saveActivityDraft,
  getSystemConfig,
  saveSystemConfig,
  isFirstTimeSetupNeeded,
  StorageState,
} from './services/storage';
import {
  User,
  Activity,
  SchoolNotice,
  Course,
  Teacher,
  AppNotification,
  ToastMessage,
  ToastType,
  SystemConfig,
} from './types';
import { AuthPortal } from './components/auth/AuthPortal';
import { Sidebar, StudentTab, DirectorTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { StudentDashboard } from './components/student/StudentDashboard';
import { CoursesView } from './components/student/CoursesView';
import { ActivitiesView } from './components/student/ActivitiesView';
import { GradesView } from './components/student/GradesView';
import { NoticesView } from './components/student/NoticesView';
import { ScheduleView } from './components/student/ScheduleView';
import { StudentAnswersView } from './components/student/StudentAnswersView';
import { StudentResultsView } from './components/student/StudentResultsView';
import { StudentProfilePage } from './components/student/StudentProfilePage';
import { DirectorDashboard } from './components/director/DirectorDashboard';
import { ProfileModal } from './components/student/ProfileModal';
import { TeacherContactModal } from './components/student/TeacherContactModal';
import { SupabaseModal } from './components/common/SupabaseModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';
import { FirstTimeSetupModal } from './components/auth/FirstTimeSetupModal';
import {
  fetchStudentsFromSupabase,
  fetchActivitiesFromSupabase,
  fetchNoticesFromSupabase,
} from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [appState, setAppState] = useState<StorageState>(() => getInitialState());
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [contactTeacher, setContactTeacher] = useState<Teacher | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // System Configuration & UX States (Sections 17, 18, 20)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => getSystemConfig());
  const [showSetupModal, setShowSetupModal] = useState<boolean>(() => isFirstTimeSetupNeeded());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'purple' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const addToast = (
    title: string,
    message?: string,
    type: ToastType = 'SUCCESS',
    duration = 4500
  ) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCompleteSetup = (newConfig: SystemConfig) => {
    setSystemConfig(newConfig);
    setShowSetupModal(false);
    addToast(
      'Configurações salvas!',
      `A instituição "${newConfig.schoolName}" e a direção foram inicializadas.`,
      'SUCCESS'
    );
  };

  // Sync state changes with localStorage
  const { currentUser, students, activities, notices, courses, teachers, schedule, notifications = [] } = appState;

  // Load data from Supabase if configured and available
  const loadSupabaseData = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const [remoteStudents, remoteActivities, remoteNotices] = await Promise.all([
        fetchStudentsFromSupabase(),
        fetchActivitiesFromSupabase(),
        fetchNoticesFromSupabase(),
      ]);

      setAppState((prev) => ({
        ...prev,
        students: remoteStudents && remoteStudents.length > 0 ? remoteStudents : prev.students,
        activities: remoteActivities && remoteActivities.length > 0 ? remoteActivities : prev.activities,
        notices: remoteNotices && remoteNotices.length > 0 ? remoteNotices : prev.notices,
      }));
    } catch (e) {
      console.warn('Erro ao carregar dados do Supabase:', e);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  useEffect(() => {
    // When director logs in, default tab is director dashboard
    if (currentUser?.role === 'DIRETOR') {
      if (!activeTab.startsWith('DIR_') && activeTab !== 'GRADES') {
        setActiveTab('DIR_DASHBOARD');
      }
    } else if (currentUser?.role === 'ALUNO') {
      if (activeTab.startsWith('DIR_')) {
        setActiveTab('DASHBOARD');
      }
    }
  }, [currentUser]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    const freshState = getInitialState();
    setAppState((prev) => ({
      ...prev,
      currentUser: user,
      students: freshState.students,
    }));
    if (user.role === 'DIRETOR') {
      setActiveTab('DIR_DASHBOARD');
    } else {
      setActiveTab('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'Deseja realmente sair?',
      message: 'Sua sessão atual no portal será encerrada com segurança.',
      confirmText: 'Sim, Sair',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        persistSession(null);
        setAppState((prev) => ({ ...prev, currentUser: null }));
        setActiveTab('DASHBOARD');
        setShowProfileModal(false);
        addToast('Sessão encerrada', 'Você saiu com segurança do portal.', 'INFO', 3000);
      },
    });
  };

  // Student Actions
  const handleSubmitActivity = (
    activityId: string,
    answerText: string,
    answersMap?: Record<string, string>
  ) => {
    if (!currentUser || currentUser.role !== 'ALUNO') {
      console.warn('[Security] Ação não autorizada: Apenas alunos podem submeter atividades.');
      return;
    }

    const currentAct = activities.find((a) => a.id === activityId);
    const actTitle = currentAct?.title || 'Atividade';

    const updatedActivities = activities.map((act) => {
      if (act.id === activityId) {
        return {
          ...act,
          submissions: {
            ...act.submissions,
            [currentUser.id]: {
              studentId: currentUser.id,
              studentName: currentUser.name,
              studentAvatar: currentUser.avatar,
              submittedAt: new Date().toISOString(),
              content: answerText,
              answers: answersMap,
              status: 'PENDENTE' as const,
            },
          },
        };
      }
      return act;
    });

    // Update student monitoring status to ONLINE
    const updatedStudents = students.map((stu) => {
      if (stu.id === currentUser.id) {
        return {
          ...stu,
          onlineStatus: 'ONLINE' as const,
          activeActivityProgress: undefined,
          lastAccess: 'Agora mesmo',
        };
      }
      return stu;
    });

    // Notify director of submission
    const directorNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'DIRETOR',
      title: 'Novo envio de atividade',
      message: `${currentUser.name} enviou respostas para "${actTitle}".`,
      type: 'STUDENT_SUBMITTED',
      createdAt: new Date().toISOString(),
      read: false,
      activityId,
      studentId: currentUser.id,
    };
    const updatedNotifications = [directorNotif, ...(notifications || [])];

    persistActivities(updatedActivities);
    persistNotifications(updatedNotifications);
    setAppState((prev) => ({
      ...prev,
      activities: updatedActivities,
      students: updatedStudents,
      notifications: updatedNotifications,
    }));

    addToast(
      'Atividade enviada com sucesso!',
      `Sua resposta em "${actTitle}" foi encaminhada para correção.`,
      'SUCCESS'
    );
  };

  const handleAutoSaveDraft = (
    activityId: string,
    questionIndex: number,
    answers: Record<string, string>
  ) => {
    if (!currentUser) return;
    saveActivityDraft(activityId, currentUser.id, questionIndex, answers);

    const act = activities.find((a) => a.id === activityId);
    const actTitle = act?.title || 'Atividade em Andamento';
    const totalQ = act?.questions?.length || 1;

    // Update in-memory state smoothly including live monitoring
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((stu) => {
        if (stu.id === currentUser.id) {
          return {
            ...stu,
            onlineStatus: 'RESPONDENDO' as const,
            activeActivityProgress: {
              activityId,
              activityTitle: actTitle,
              currentQuestion: questionIndex + 1,
              totalQuestions: totalQ,
              isPrivateWhileAnswering: true,
            },
            lastAccess: 'Agora mesmo',
          };
        }
        return stu;
      }),
      activities: prev.activities.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            drafts: {
              ...(act.drafts || {}),
              [currentUser.id]: {
                currentQuestionIndex: questionIndex,
                answers,
                lastSavedAt: new Date().toISOString(),
              },
            },
          };
        }
        return act;
      }),
    }));
  };

  const handleToggleLessonComplete = (courseId: string, lessonId: string) => {
    const updatedCourses = courses.map((crs) => {
      if (crs.id === courseId) {
        const updatedLessons = crs.lessons.map((l) =>
          l.id === lessonId ? { ...l, completed: !l.completed } : l
        );
        const completedCount = updatedLessons.filter((l) => l.completed).length;
        const newPct = Math.round((completedCount / updatedLessons.length) * 100);
        return {
          ...crs,
          lessons: updatedLessons,
          completedLessons: completedCount,
          progressPercentage: newPct,
        };
      }
      return crs;
    });

    persistCourses(updatedCourses);
    setAppState((prev) => ({ ...prev, courses: updatedCourses }));
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: newAvatarUrl };
    persistSession(updatedUser);

    // If student, update also in students list
    const updatedStudents = students.map((s) =>
      s.id === currentUser.id ? { ...s, avatar: newAvatarUrl } : s
    );
    persistStudents(updatedStudents);

    setAppState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      students: updatedStudents,
    }));
  };

  // User Profile Updates
  const handleUpdateUser = (updatedUser: User) => {
    const updatedStudents = students.map((s) =>
      s.id === updatedUser.id ? { ...s, ...updatedUser } : s
    );
    persistStudents(updatedStudents);
    setAppState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      students: updatedStudents,
    }));
  };

  // Notification Handlers
  const handleMarkNotificationAsRead = (notifId: string) => {
    const updated = (notifications || []).map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    persistNotifications(updated);
    setAppState((prev) => ({ ...prev, notifications: updated }));
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = (notifications || []).map((n) => ({ ...n, read: true }));
    persistNotifications(updated);
    setAppState((prev) => ({ ...prev, notifications: updated }));
  };

  const handleSelectNotification = (notif: AppNotification) => {
    handleMarkNotificationAsRead(notif.id);
    if (notif.activityId) {
      setSelectedActivityId(notif.activityId);
      setActiveTab('ACTIVITIES');
    } else if (notif.noticeId) {
      setSelectedNoticeId(notif.noticeId);
      setActiveTab('NOTICES');
    }
  };

  // Director Actions
  const handleCreateActivity = (newActData: Activity) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode criar atividades.');
      return;
    }
    const newActivity: Activity = {
      ...newActData,
      id: newActData.id || `act-${Date.now()}`,
      submissions: newActData.submissions || {},
    };

    const updated = [newActivity, ...activities];
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
    addToast('Atividade criada!', `"${newActData.title}" foi publicada com sucesso.`, 'SUCCESS');
  };

  const handleUpdateActivity = (updatedActivity: Activity) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode editar atividades.');
      return;
    }
    const updated = activities.map((a) => (a.id === updatedActivity.id ? updatedActivity : a));
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
    addToast('Atividade atualizada!', `"${updatedActivity.title}" foi salva com sucesso.`, 'SUCCESS');
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode excluir atividades.');
      return;
    }
    const updated = activities.filter((a) => a.id !== activityId);
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
    addToast('Atividade excluída', 'A atividade foi removida do sistema.', 'INFO');
  };

  const handleDuplicateActivity = (activityId: string) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode duplicar atividades.');
      return;
    }
    const original = activities.find((a) => a.id === activityId);
    if (!original) return;
    const duplicated: Activity = {
      ...original,
      id: `act-${Date.now()}`,
      title: `${original.title} (Cópia)`,
      submissions: {},
      isArchived: false,
    };
    const updated = [duplicated, ...activities];
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
    addToast('Atividade duplicada!', 'Uma cópia da atividade foi criada.', 'SUCCESS');
  };

  const handleToggleArchiveActivity = (activityId: string) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode arquivar atividades.');
      return;
    }
    const updated = activities.map((a) =>
      a.id === activityId ? { ...a, isArchived: !a.isArchived } : a
    );
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
  };

  const handleGradeSubmission = (
    activityId: string,
    studentId: string,
    grade: number,
    feedback: string,
    questionScores?: Record<string, number>
  ) => {
    if (!currentUser || currentUser.role !== 'DIRETOR') {
      console.warn('[Security] Ação não autorizada: Apenas a direção pode atribuir notas e correções.');
      return;
    }
    const updatedActivities = activities.map((act) => {
      if (act.id === activityId && act.submissions[studentId]) {
        return {
          ...act,
          submissions: {
            ...act.submissions,
            [studentId]: {
              ...act.submissions[studentId],
              status: 'AVALIADO' as const,
              grade,
              feedback,
              questionScores: questionScores || act.submissions[studentId].questionScores,
            },
          },
        };
      }
      return act;
    });

    const act = activities.find((a) => a.id === activityId);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Atividade Avaliada!',
      message: `Sua atividade "${act?.title || 'Atividade'}" foi avaliada com nota ${grade}/${act?.maxScore || 10}.`,
      createdAt: new Date().toISOString(),
      type: 'ACTIVITY_GRADED',
      read: false,
      recipientRole: 'ALUNO',
      recipientId: studentId,
      activityId,
      studentId,
    };
    const updatedNotifications = [newNotif, ...(notifications || [])];
    persistNotifications(updatedNotifications);

    persistActivities(updatedActivities);
    setAppState((prev) => ({
      ...prev,
      activities: updatedActivities,
      notifications: updatedNotifications,
    }));

    addToast(
      'Correção lançada com sucesso!',
      `Nota ${grade}/${act?.maxScore || 10} registrada e o aluno foi notificado.`,
      'SUCCESS'
    );
  };

  const handleCreateNotice = (newNoticeData: Omit<SchoolNotice, 'id' | 'publishDate'>) => {
    const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const newNotice: SchoolNotice = {
      ...newNoticeData,
      id: `not-${Date.now()}`,
      publishDate: todayFormatted,
    };

    const updated = [newNotice, ...notices];
    persistNotices(updated);
    setAppState((prev) => ({ ...prev, notices: updated }));
    addToast('Comunicado publicado!', 'O aviso foi fixado no mural escolar.', 'SUCCESS');
  };

  const handleDeleteNotice = (noticeId: string) => {
    const updated = notices.filter((n) => n.id !== noticeId);
    persistNotices(updated);
    setAppState((prev) => ({ ...prev, notices: updated }));
    addToast('Comunicado excluído', 'O aviso foi removido do mural.', 'INFO');
  };

  // If user is not authenticated, display AuthPortal
  if (!currentUser) {
    return (
      <>
        <AuthPortal
          onLoginSuccess={handleLoginSuccess}
          onOpenSupabaseModal={() => setShowSupabaseModal(true)}
          systemConfig={systemConfig}
          onOpenSetupModal={() => setShowSetupModal(true)}
        />
        <SupabaseModal
          isOpen={showSupabaseModal}
          onClose={() => setShowSupabaseModal(false)}
          appState={appState}
          onDataRefreshed={loadSupabaseData}
        />
        {showSetupModal && (
          <FirstTimeSetupModal
            isOpen={showSetupModal}
            initialConfig={systemConfig}
            onComplete={handleCompleteSetup}
            onClose={() => setShowSetupModal(false)}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          title={confirmModalState.title}
          message={confirmModalState.message}
          confirmText={confirmModalState.confirmText}
          cancelText={confirmModalState.cancelText}
          variant={confirmModalState.variant}
          onConfirm={confirmModalState.onConfirm}
          onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        />
      </>
    );
  }

  // Pending count for student
  const studentPendingCount = activities.filter(
    (act) => !act.submissions || !act.submissions[currentUser.id]
  ).length;

  // Pending corrections for director
  const directorPendingCorrectionsCount = activities.reduce(
    (acc, act) =>
      acc +
      Object.values(act.submissions || {}).filter((sub) => sub.status === 'PENDENTE').length,
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f2fb] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Outer Card Container - Replicating the exact floating dashboard framing from the reference image */}
      <div
        id="app-container"
        className="w-full max-w-[1440px] bg-[#fbfaff] rounded-[28px] sm:rounded-[36px] p-3 sm:p-5 md:p-6 shadow-2xl shadow-purple-950/8 border border-purple-100/80 flex flex-col md:flex-row gap-5 relative overflow-hidden"
      >
        {/* Left Sidebar */}
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedCourseForDetail(null);
          }}
          onLogout={handleLogout}
          pendingActivitiesCount={currentUser.role === 'ALUNO' ? studentPendingCount : undefined}
          pendingCorrectionsCount={currentUser.role === 'DIRETOR' ? directorPendingCorrectionsCount : undefined}
          unreadNoticesCount={notices.length}
          schoolName={systemConfig.schoolName}
          schoolLogo={systemConfig.schoolLogo}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          {/* Top Header */}
          <Header
            user={currentUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            notices={notices}
            notifications={notifications}
            systemConfig={systemConfig}
            onOpenProfile={() => setActiveTab('PROFILE')}
            onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            onOpenSetupModal={() => setShowSetupModal(true)}
            onSelectNotice={(notice) => {
              setSelectedNoticeId(notice.id);
              setActiveTab('NOTICES');
            }}
            onSelectNotification={handleSelectNotification}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onLogout={handleLogout}
          />

          {/* Quick Demo Switcher helper pill on bottom right or header */}
          <div className="mb-4 flex items-center justify-between bg-purple-50/70 border border-purple-100 px-4 py-2 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900">
                {currentUser.role === 'DIRETOR' ? 'Modo: Direção Pedagógica' : 'Modo: Portal do Aluno'}
              </span>
              <span className="text-slate-400 hidden sm:inline">&bull;</span>
              <span className="text-slate-600 hidden sm:inline">
                {currentUser.name} ({currentUser.email})
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Trocar de Usuário / Sair
            </button>
          </div>

          {/* Views for DIRETOR */}
          {currentUser.role === 'DIRETOR' && (
            <DirectorDashboard
              director={currentUser}
              students={students}
              activities={activities}
              notices={notices}
              activeDirectorTab={activeTab}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
              onOpenSetupModal={() => setShowSetupModal(true)}
              systemConfig={systemConfig}
              onCreateActivity={handleCreateActivity}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onDuplicateActivity={handleDuplicateActivity}
              onToggleArchiveActivity={handleToggleArchiveActivity}
              onGradeSubmission={handleGradeSubmission}
              onCreateNotice={handleCreateNotice}
              onDeleteNotice={handleDeleteNotice}
            />
          )}

          {/* Views for ALUNO */}
          {currentUser.role === 'ALUNO' && (
            <>
              {activeTab === 'DASHBOARD' && (
                <StudentDashboard
                  user={currentUser}
                  courses={courses}
                  activities={activities}
                  notices={notices}
                  teachers={teachers}
                  notifications={notifications}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    setSelectedCourseForDetail(null);
                  }}
                  onSelectCourse={(course) => {
                    setSelectedCourseForDetail(course);
                    setActiveTab('COURSES');
                  }}
                  onSelectActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                  onSelectNotice={(notice) => {
                    setSelectedNoticeId(notice.id);
                    setActiveTab('NOTICES');
                  }}
                  onSelectNotification={handleSelectNotification}
                  onMarkNotificationAsRead={handleMarkNotificationAsRead}
                  onContactTeacher={(teacher) => setContactTeacher(teacher)}
                />
              )}

              {activeTab === 'ACTIVITIES' && (
                <ActivitiesView
                  user={currentUser}
                  activities={activities}
                  onSubmitActivity={handleSubmitActivity}
                  onAutoSaveDraft={handleAutoSaveDraft}
                  selectedActivityId={selectedActivityId}
                />
              )}

              {activeTab === 'MY_ANSWERS' && (
                <StudentAnswersView
                  user={currentUser}
                  activities={activities}
                  onOpenActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                />
              )}

              {activeTab === 'RESULTS' && (
                <StudentResultsView
                  user={currentUser}
                  activities={activities}
                  onOpenActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                />
              )}

              {activeTab === 'PROFILE' && (
                <StudentProfilePage
                  user={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              )}

              {activeTab === 'COURSES' && (
                <CoursesView
                  courses={courses}
                  initialSelectedCourse={selectedCourseForDetail}
                  onToggleLessonComplete={handleToggleLessonComplete}
                />
              )}

              {activeTab === 'NOTICES' && (
                <NoticesView notices={notices} selectedNoticeId={selectedNoticeId} />
              )}

              {activeTab === 'SCHEDULE' && (
                <ScheduleView schedule={schedule} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        role={currentUser.role}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedCourseForDetail(null);
        }}
        pendingActivitiesCount={currentUser.role === 'ALUNO' ? studentPendingCount : undefined}
        unreadNoticesCount={notices.length}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateAvatar={handleUpdateAvatar}
          onLogout={handleLogout}
        />
      )}

      {/* Teacher Contact Modal */}
      {contactTeacher && (
        <TeacherContactModal
          teacher={contactTeacher}
          onClose={() => setContactTeacher(null)}
        />
      )}

      {/* First Time Setup / Configuration Modal (Section 20) */}
      {showSetupModal && (
        <FirstTimeSetupModal
          isOpen={showSetupModal}
          initialConfig={systemConfig}
          onComplete={handleCompleteSetup}
          onClose={() => setShowSetupModal(false)}
        />
      )}

      {/* Reusable Toast Notifications (Section 17) */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Reusable Confirmation Dialog (Section 17) */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Supabase Connection & Synchronization Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        appState={appState}
        onDataRefreshed={loadSupabaseData}
      />
    </div>
  );
}
