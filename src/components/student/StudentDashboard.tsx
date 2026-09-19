import React from 'react';
import { BannerIllustration } from '../common/BannerIllustration';
import { Course, Activity, SchoolNotice, Teacher, User } from '../../types';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Laptop,
  Database,
  Atom,
  Clock,
  MessageCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  courses: Course[];
  activities: Activity[];
  notices: SchoolNotice[];
  teachers: Teacher[];
  onNavigateTab: (tab: string) => void;
  onSelectCourse: (course: Course) => void;
  onSelectActivity: (activity: Activity) => void;
  onSelectNotice: (notice: SchoolNotice) => void;
  onContactTeacher: (teacher: Teacher) => void;
}

export function StudentDashboard({
  user,
  courses,
  activities,
  notices,
  teachers,
  onNavigateTab,
  onSelectCourse,
  onSelectActivity,
  onSelectNotice,
  onContactTeacher,
}: StudentDashboardProps) {
  const firstName = user.name.split(' ')[0] || 'Aluno';

  // Calculate statistics according to requested 4 categories:
  // - Atividades disponíveis
  // - Atividades pendentes
  // - Atividades enviadas
  // - Atividades corrigidas
  const totalAvailable = activities.length;

  const pendingActivities = activities.filter(
    (act) => !act.submissions[user.id]
  );

  const submittedActivities = activities.filter(
    (act) => !!act.submissions[user.id]
  );

  const gradedActivities = activities.filter(
    (act) => act.submissions[user.id]?.status === 'AVALIADO'
  );

  // Format date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div id="student-dashboard" className="space-y-6">
      {/* 1. WELCOME HERO BANNER (Strictly adhering to user specification: "Olá, [nome do aluno]!" + "Continue seus estudos e conclua suas atividades.") */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7445f8] via-[#8555f9] to-[#9969ff] text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-purple-600/15">
        {/* Subtle decorative glow circles */}
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
              Continue seus estudos e conclua suas atividades.
            </p>

            <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                id="banner-view-activities-btn"
                onClick={() => onNavigateTab('ACTIVITIES')}
                className="px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-purple-900/20 transition cursor-pointer flex items-center gap-2"
              >
                <span>Explorar Atividades</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Illustration matching reference graphic */}
          <div className="shrink-0 flex items-center justify-center">
            <BannerIllustration />
          </div>
        </div>
      </div>

      {/* 2. STATS SECTION: 4 Requested Cards */}
      {/* - Atividades disponíveis */}
      {/* - Atividades pendentes */}
      {/* - Atividades enviadas */}
      {/* - Atividades corrigidas */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3.5 flex items-center justify-between">
          <span>Visão Geral das Atividades</span>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
            Ano Letivo 2026
          </span>
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Atividades disponíveis */}
          <div
            onClick={() => onNavigateTab('ACTIVITIES')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="w-13 h-13 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2.5 group-hover:scale-105 transition">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalAvailable}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              Atividades disponíveis
            </div>
            <span className="text-[11px] text-purple-600 font-medium mt-1">
              No catálogo
            </span>
          </div>

          {/* Card 2: Atividades pendentes */}
          <div
            onClick={() => onNavigateTab('ACTIVITIES')}
            className="bg-white rounded-3xl p-5 border-2 border-purple-300 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group relative overflow-hidden"
          >
            <div className="w-13 h-13 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2.5 group-hover:scale-105 transition">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-2xl font-extrabold text-purple-900">
              {pendingActivities.length}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">
              Atividades pendentes
            </div>
            <span className="text-[11px] text-amber-600 font-medium mt-1">
              {pendingActivities.length > 0 ? 'Aguardando entrega' : 'Nenhuma pendente!'}
            </span>
          </div>

          {/* Card 3: Atividades enviadas */}
          <div
            onClick={() => onNavigateTab('MY_ANSWERS')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="w-13 h-13 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2.5 group-hover:scale-105 transition">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {submittedActivities.length}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              Atividades enviadas
            </div>
            <span className="text-[11px] text-indigo-600 font-medium mt-1">
              Entregas realizadas
            </span>
          </div>

          {/* Card 4: Atividades corrigidas */}
          <div
            onClick={() => onNavigateTab('RESULTS')}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="w-13 h-13 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2.5 group-hover:scale-105 transition">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {gradedActivities.length}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              Atividades corrigidas
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">
              Com notas e feedback
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (Courses, Teachers & Notices) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">

          {/* B. ENROLLED COURSES (Especialidades Matriculadas) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-slate-800">
                Especialidades Matriculadas
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('COURSES')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 transition"
              >
                Ver todas
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.slice(0, 2).map((course, idx) => {
                const isFirst = idx === 0;
                return (
                  <div
                    key={course.id}
                    className={`rounded-3xl p-5 transition-all duration-200 border relative ${
                      isFirst
                        ? 'bg-[#f1ebfd] border-purple-300/80 shadow-sm'
                        : 'bg-[#ede7fc] border-purple-200/70 shadow-sm'
                    } flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[11px] font-bold text-purple-700 bg-white/70 px-2 py-0.5 rounded-full">
                            {course.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug line-clamp-2">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {course.instructorName}
                          </p>
                        </div>

                        {/* Graphic Icon like reference image */}
                        <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                          {idx === 0 ? (
                            <Laptop className="w-7 h-7 text-purple-600" />
                          ) : (
                            <Database className="w-7 h-7 text-indigo-600" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-medium">
                          <span>Progresso</span>
                          <span>{course.progressPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-purple-200/50 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {course.completedLessons}/{course.totalLessons} aulas concluídas
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(course)}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition cursor-pointer"
                      >
                        Acessar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* 1. Professores & Tutores da Turma */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Professores da Turma
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('COURSES')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                Ver todos
              </button>
            </div>

            {/* Circular Avatars Row - Exact match to reference image! */}
            <div className="flex items-center justify-around py-2">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => onContactTeacher(teacher)}
                  className="flex flex-col items-center group cursor-pointer"
                  title={`Falar com ${teacher.name}`}
                >
                  <div className="relative">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-600 transition shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 mt-1.5 max-w-[70px] truncate text-center">
                    {teacher.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 max-w-[70px] truncate text-center">
                    {teacher.subject.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mural de Avisos Diários (Daily Notice) - Exact match to reference! */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Avisos Diários
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('NOTICES')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-4">
              {notices.slice(0, 2).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-purple-200 transition"
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
                    className="mt-2 text-[11px] font-bold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 transition"
                  >
                    <span>Ver aviso completo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
