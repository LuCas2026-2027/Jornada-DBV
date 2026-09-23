import React, { useRef } from 'react';
import { BannerIllustration } from '../common/BannerIllustration';
import { Course, Activity, SchoolNotice, Teacher, User, AppNotification } from '../../types';
import { ActivityCarouselRow } from './ActivityCarousel';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Database,
  Atom,
  Clock,
  Award,
  Sparkles,
  Bell,
  Star,
  MessageSquare,
  Send,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  courses: Course[];
  activities: Activity[];
  notices: SchoolNotice[];
  teachers: Teacher[];
  notifications?: AppNotification[];
  onNavigateTab: (tab: string) => void;
  onSelectCourse: (course: Course) => void;
  onSelectActivity: (activity: Activity) => void;
  onSelectNotice: (notice: SchoolNotice) => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onMarkNotificationAsRead?: (notifId: string) => void;
  onContactTeacher: (teacher: Teacher) => void;
}

export function StudentDashboard({
  user,
  courses,
  activities,
  notices,
  teachers,
  notifications = [],
  onNavigateTab,
  onSelectCourse,
  onSelectActivity,
  onSelectNotice,
  onSelectNotification,
  onMarkNotificationAsRead,
  onContactTeacher,
}: StudentDashboardProps) {
  const continueStudyingScrollRef = useRef<HTMLDivElement>(null);

  // Filter notifications relevant to current student
  const studentNotifications = notifications.filter((n) => {
    if (n.recipientRole === 'ALL') return true;
    if (n.recipientRole === 'ALUNO') {
      if (n.recipientId) return n.recipientId === user.id;
      return true;
    }
    return false;
  });

  // Recent graded activities for "Resultados recentes"
  const gradedActivities = activities
    .filter((act) => act.submissions[user.id]?.status === 'AVALIADO')
    .sort((a, b) => {
      const dateA = new Date(a.submissions[user.id]?.submittedAt || 0).getTime();
      const dateB = new Date(b.submissions[user.id]?.submittedAt || 0).getTime();
      return dateB - dateA;
    });

  // Active or pending activities
  const activeActivities = activities.filter((a) => !a.isArchived);

  // Format date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const scrollContinueStudying = (direction: 'left' | 'right') => {
    if (continueStudyingScrollRef.current) {
      const scrollAmount = 300 * (direction === 'left' ? -1 : 1);
      continueStudyingScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'NEW_ACTIVITY':
      case 'ACTIVITY_NEW':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'DUE_SOON':
      case 'ACTIVITY_DUE_SOON':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'ACTIVITY_GRADED':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'TEACHER_FEEDBACK':
      case 'TEACHER_COMMENT':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'SUBMISSION_RECEIVED':
      case 'STUDENT_SUBMITTED':
        return <Send className="w-4 h-4 text-purple-600" />;
      case 'PENDING_CORRECTION':
      case 'SUBMISSION_PENDING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'ACTIVITY_COMPLETED':
      case 'STUDENT_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div id="student-dashboard" className="space-y-6 sm:space-y-8">
      {/* ================================================================
          1. BANNER DE BOAS-VINDAS
          "Olá, [Nome]!"
          "Continue seus estudos."
          ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7445f8] via-[#8555f9] to-[#9969ff] text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-purple-600/15">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-900/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-md text-center sm:text-left">
            <span className="inline-block text-xs sm:text-sm font-medium text-purple-200 mb-3 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
              {todayFormatted}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Olá, {user.name}!
            </h1>
            <p className="text-sm sm:text-base text-purple-100 mt-2 font-medium leading-relaxed opacity-95">
              Continue seus estudos.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                id="banner-view-activities-btn"
                onClick={() => onNavigateTab('ACTIVITIES')}
                className="px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-purple-900/20 transition cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Ver Atividades</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('RESULTS')}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold rounded-2xl border border-white/20 backdrop-blur-md transition cursor-pointer active:scale-95"
              >
                Ver Minhas Notas
              </button>
            </div>
          </div>

          {/* 3D Illustration */}
          <div className="shrink-0 flex items-center justify-center">
            <BannerIllustration />
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN GRID: ÁREA PRINCIPAL (2 COLUNAS) + LATERAL (1 COLUNA)
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* ÁREA PRINCIPAL (2/3 da tela no desktop) */}
        <div className="lg:col-span-2 space-y-7 sm:space-y-8 min-w-0">

          {/* ================================================================
              2. "SUAS ATIVIDADES" - Carrossel de Atividades com Touch Swipe
              ================================================================ */}
          <section id="suas-atividades-section" className="space-y-3">
            <ActivityCarouselRow
              title="Suas atividades"
              subtitle="Atividades disponíveis para entrega e andamento"
              activities={activeActivities}
              user={user}
              onOpenActivity={onSelectActivity}
            />
          </section>

          {/* ================================================================
              3. "CONTINUE ESTUDANDO" - Carrossel de Disciplinas e Cursos
              ================================================================ */}
          <section id="continue-estudando-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Continue estudando</span>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {courses.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Retome os módulos e aulas do seu plano de estudo
                </p>
              </div>

              {/* Botões de rolagem para desktop */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollContinueStudying('left')}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer active:scale-95"
                  aria-label="Rolar para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollContinueStudying('right')}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer active:scale-95"
                  aria-label="Rolar para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Carrossel responsivo com suporte a deslizar com o dedo (touch-pan-x) */}
            <div
              ref={continueStudyingScrollRef}
              className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory touch-pan-x scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
            >
              {courses.map((course, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={course.id}
                    onClick={() => onSelectCourse(course)}
                    className={`snap-start shrink-0 w-[270px] sm:w-[300px] rounded-3xl p-5 border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer flex flex-col justify-between select-none ${
                      isEven
                        ? 'bg-[#f4effe] border-purple-200/90 shadow-sm'
                        : 'bg-[#eeeafe] border-indigo-200/90 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-purple-700 bg-white/80 px-2 py-0.5 rounded-full border border-purple-100">
                            {course.code}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-snug line-clamp-2">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {course.instructorName}
                          </p>
                        </div>

                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-purple-100">
                          {isEven ? (
                            <Laptop className="w-6 h-6 text-purple-600" />
                          ) : (
                            <Database className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                      </div>

                      {/* Progresso do Curso */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-semibold">
                          <span>Progresso</span>
                          <span className="text-purple-700">{course.progressPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {course.completedLessons}/{course.totalLessons} aulas
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCourse(course);
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-600/20 transition cursor-pointer active:scale-95"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================
              4. "RESULTADOS RECENTES" - Cards mostrando as últimas notas
              ================================================================ */}
          <section id="resultados-recentes-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Resultados recentes</span>
                  {gradedActivities.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {gradedActivities.length} {gradedActivities.length === 1 ? 'nota' : 'notas'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Últimas avaliações, notas e correções do corpo docente
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('RESULTS')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 transition underline cursor-pointer"
              >
                Ver histórico completo
              </button>
            </div>

            {gradedActivities.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Nenhuma nota recente disponível ainda
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Assim que você responder suas atividades e os professores avaliarem suas entregas, suas notas e correções detalhadas aparecerão aqui!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('ACTIVITIES')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Responder Atividades</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gradedActivities.slice(0, 4).map((act) => {
                  const sub = act.submissions[user.id];
                  const grade = sub?.grade ?? 10;
                  const isGreat = grade >= 7.0;

                  return (
                    <div
                      key={act.id}
                      onClick={() => onSelectActivity(act)}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                            {act.subject}
                          </span>

                          {/* Badge de Nota */}
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-sm ${
                              isGreat
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {grade.toFixed(1)} / {act.maxScore || 10}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-700 transition line-clamp-2 leading-snug">
                          {act.title}
                        </h4>

                        {sub?.feedback && (
                          <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2 italic">
                            &quot;{sub.feedback}&quot;
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {sub?.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString('pt-BR')
                            : 'Avaliado'}
                        </span>

                        <span className="font-bold text-purple-700 group-hover:underline flex items-center gap-1">
                          <span>Ver correção</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ================================================================
            NA LATERAL (QUANDO HOUVER ESPAÇO)
            - "Notificações recentes"
            - "Professores da Turma"
            - "Avisos Diários"
            ================================================================ */}
        <aside className="space-y-6">

          {/* 5. "NOTIFICAÇÕES RECENTES" (Exigido pelo item 16) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Notificações recentes
                </h3>
              </div>

              {studentNotifications.filter((n) => !n.read).length > 0 && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {studentNotifications.filter((n) => !n.read).length} nova(s)
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
              {studentNotifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhuma notificação recente.
                </div>
              ) : (
                studentNotifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (onMarkNotificationAsRead) onMarkNotificationAsRead(notif.id);
                      if (onSelectNotification) onSelectNotification(notif);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-2.5 ${
                      notif.read
                        ? 'bg-white border-slate-100 hover:bg-slate-50'
                        : 'bg-purple-50/70 border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                      {getNotifIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </h5>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(notif.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Professores da Turma */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900">
                Professores da Turma
              </h3>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Disponíveis
              </span>
            </div>

            <div className="flex items-center justify-around py-2">
              {teachers.slice(0, 4).map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => onContactTeacher(teacher)}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                  title={`Falar com ${teacher.name}`}
                >
                  <div className="relative">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-600 transition shadow-xs"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 mt-1.5 max-w-[65px] truncate text-center">
                    {teacher.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 max-w-[65px] truncate text-center">
                    {teacher.subject.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Avisos Diários */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-900">
                Avisos Diários
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('NOTICES')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {notices.slice(0, 2).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-purple-200 transition"
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold text-purple-600 uppercase tracking-wider">
                      {notice.category}
                    </span>
                    <span className="text-slate-400">{notice.publishDate}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {notice.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {notice.content}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectNotice(notice)}
                    className="mt-2 text-[11px] font-bold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Ver comunicado</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
