import { useState } from 'react';
import { Course } from '../../types';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  Clock,
  PlayCircle,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';

interface CoursesViewProps {
  courses: Course[];
  initialSelectedCourse?: Course | null;
  onToggleLessonComplete: (courseId: string, lessonId: string) => void;
}

export function CoursesView({
  courses,
  initialSelectedCourse = null,
  onToggleLessonComplete,
}: CoursesViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialSelectedCourse);

  if (selectedCourse) {
    // Current state of the selected course
    const currentCourse = courses.find((c) => c.id === selectedCourse.id) || selectedCourse;

    return (
      <div id="course-detail-view" className="space-y-6">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => setSelectedCourse(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-4 py-2 rounded-2xl border border-purple-100 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Especialidades</span>
        </button>

        {/* Hero Header for the Subject */}
        <div className="bg-gradient-to-r from-[#7445f8] via-[#8555f9] to-[#9969ff] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-600/15">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-purple-100">
                {currentCourse.code}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">
                {currentCourse.title}
              </h2>
              <p className="text-xs sm:text-sm text-purple-100 mt-2 max-w-xl leading-relaxed opacity-95">
                {currentCourse.description}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0">
              <img
                src={currentCourse.instructorAvatar}
                alt={currentCourse.instructorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
              />
              <div>
                <div className="text-[11px] text-purple-200 uppercase font-semibold">Professor(a)</div>
                <div className="text-xs sm:text-sm font-bold text-white">{currentCourse.instructorName}</div>
              </div>
            </div>
          </div>

          {/* Progress bar in header */}
          <div className="mt-6 pt-5 border-t border-white/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Seu Progresso no Conteúdo</span>
              <span>{currentCourse.progressPercentage}% concluído</span>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${currentCourse.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grid of Lessons & Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons List (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Cronograma de Aulas & Roteiros</span>
              <span className="text-xs font-normal text-slate-500">
                {currentCourse.completedLessons} de {currentCourse.lessons.length} aulas finalizadas
              </span>
            </h3>

            <div className="space-y-3">
              {currentCourse.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex items-start justify-between gap-4 shadow-sm ${
                    lesson.completed ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-slate-100 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleLessonComplete(currentCourse.id, lesson.id)}
                      className="mt-0.5 text-slate-400 hover:text-purple-600 transition"
                      title={lesson.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          Aula {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                      </div>
                      {lesson.summary && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {lesson.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lesson.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Materials (1/3) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Apostilas & Materiais de Estudo
            </h3>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              {currentCourse.materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/70 flex items-center justify-between gap-3 hover:bg-purple-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{mat.title}</div>
                      {mat.size && <span className="text-[10px] text-slate-400">{mat.size}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert(`Iniciando download de: ${mat.title}`)}
                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-white rounded-xl transition"
                    title="Baixar material de estudo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course Overview Cards List
  return (
    <div id="courses-list-view" className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900">Minhas Especialidades</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Acesse os conteúdos das especialidades matriculadas no 3º Ano do Ensino Médio, apostilas e roteiros.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  {course.code}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ativa
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {course.title}
              </h3>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              {/* Instructor info */}
              <div className="mt-4 flex items-center gap-2.5">
                <img
                  src={course.instructorAvatar}
                  alt={course.instructorName}
                  className="w-8 h-8 rounded-full object-cover border border-purple-200"
                />
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none">Instrutor(a)</span>
                  <span className="text-xs font-bold text-slate-800">{course.instructorName}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-semibold">
                  <span>Progresso do Aluno</span>
                  <span>{course.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    style={{ width: `${course.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {course.totalLessons} aulas registradas
              </span>

              <button
                type="button"
                onClick={() => setSelectedCourse(course)}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Especialidade</span>
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
