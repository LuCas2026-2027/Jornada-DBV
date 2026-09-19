import React from 'react';
import { Activity, User } from '../../types';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Calendar,
  AlertCircle,
  BarChart3,
  Star,
  FileCheck
} from 'lucide-react';

interface StudentResultsViewProps {
  user: User;
  activities: Activity[];
  onOpenActivity?: (activity: Activity) => void;
}

export function StudentResultsView({
  user,
  activities,
  onOpenActivity,
}: StudentResultsViewProps) {
  // Compute student results
  const studentEvaluations = activities
    .map((act) => ({
      activity: act,
      submission: act.submissions[user.id],
    }))
    .filter((item) => item.submission?.status === 'AVALIADO' && item.submission?.grade !== undefined);

  const totalPoints = studentEvaluations.reduce(
    (acc, curr) => acc + (curr.submission?.grade || 0),
    0
  );
  const maxPossible = studentEvaluations.reduce(
    (acc, curr) => acc + curr.activity.maxScore,
    0
  );

  const averageGrade = studentEvaluations.length > 0
    ? (totalPoints / studentEvaluations.length).toFixed(1)
    : '10.0';

  // Group by subject
  const subjectsMap: Record<
    string,
    { grades: number[]; total: number; count: number }
  > = {};

  activities.forEach((act) => {
    if (!subjectsMap[act.subject]) {
      subjectsMap[act.subject] = { grades: [], total: 0, count: 0 };
    }
    const sub = act.submissions[user.id];
    if (sub && sub.status === 'AVALIADO' && sub.grade !== undefined) {
      subjectsMap[act.subject].grades.push(sub.grade);
      subjectsMap[act.subject].total += sub.grade;
      subjectsMap[act.subject].count += 1;
    }
  });

  return (
    <div id="student-results-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-purple-900/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
            Desempenho Geral
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2.5">
            Resultados e Avaliações
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-lg">
            Acompanhe o rendimento acumulado de todas as atividades corrigidas e seu aproveitamento por disciplina.
          </p>
        </div>

        {/* Big Score Stamp */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center shrink-0 min-w-[160px]">
          <span className="text-xs text-purple-200 font-semibold block">Média Geral</span>
          <div className="text-4xl font-black text-white my-1">{averageGrade}</div>
          <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded-full inline-block">
            Excelente Aproveitamento
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{studentEvaluations.length}</div>
            <div className="text-xs font-semibold text-slate-500">Atividades Avaliadas</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{totalPoints.toFixed(1)} pts</div>
            <div className="text-xs font-semibold text-slate-500">Pontuação Total Obtida</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">100%</div>
            <div className="text-xs font-semibold text-slate-500">Taxa de Conclusão</div>
          </div>
        </div>
      </div>

      {/* Breakdown per subject */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Desempenho por Matéria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(subjectsMap).map(([subject, data]) => {
            const avg = data.count > 0 ? (data.total / data.count).toFixed(1) : '—';
            return (
              <div
                key={subject}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{subject}</h4>
                  <span className="text-[11px] text-slate-400">
                    {data.count} {data.count === 1 ? 'avaliação corrigida' : 'avaliações corrigidas'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-purple-700">{avg}</div>
                  <span className="text-[10px] font-bold text-slate-400">Média</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graded Activities List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Histórico Detalhado de Notas e Feedbacks
        </h3>

        {studentEvaluations.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhuma atividade foi corrigida até o momento.
          </p>
        ) : (
          <div className="space-y-3">
            {studentEvaluations.map(({ activity, submission }) => (
              <div
                key={activity.id}
                onClick={() => onOpenActivity && onOpenActivity(activity)}
                className="p-4 rounded-2xl border border-slate-100 hover:border-purple-200 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {activity.subject}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {activity.title}
                  </h4>
                  {submission?.feedback && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      "{submission.feedback}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-emerald-600">
                    {submission?.grade?.toFixed(1)}{' '}
                    <span className="text-xs font-normal text-slate-400">/ {activity.maxScore}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {submission?.submittedAt &&
                      new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
