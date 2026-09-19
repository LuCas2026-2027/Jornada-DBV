import React, { useState } from 'react';
import { Activity, User } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

interface StudentAnswersViewProps {
  user: User;
  activities: Activity[];
  onOpenActivity: (activity: Activity) => void;
}

export function StudentAnswersView({
  user,
  activities,
  onOpenActivity,
}: StudentAnswersViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'CORRECTED' | 'WAITING'>('ALL');

  // Filter activities that user has submitted or has answers in progress
  const answeredActivities = activities.filter((act) => {
    const hasSubmission = !!act.submissions[user.id];
    const hasDraft = !!act.drafts?.[user.id] && Object.keys(act.drafts[user.id].answers || {}).length > 0;
    return hasSubmission || hasDraft;
  });

  const filtered = answeredActivities.filter((act) => {
    const sub = act.submissions[user.id];
    if (filter === 'CORRECTED') return sub?.status === 'AVALIADO';
    if (filter === 'WAITING') return sub?.status === 'PENDENTE' || !sub;
    return true;
  });

  return (
    <div id="student-answers-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Minhas Respostas</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consulte todas as respostas que você enviou ou rascunhos em andamento com correções e notas.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'ALL' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({answeredActivities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('CORRECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'CORRECTED' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Corrigidas
          </button>
          <button
            type="button"
            onClick={() => setFilter('WAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'WAITING' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Em Espera
          </button>
        </div>
      </div>

      {/* Answers List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma resposta encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Você ainda não enviou respostas para as atividades deste filtro. Acesse a aba "Atividades" para começar!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((act) => {
            const sub = act.submissions[user.id];
            const draft = act.drafts?.[user.id];
            const isEvaluated = sub?.status === 'AVALIADO';
            const isSubmitted = !!sub;

            return (
              <div
                key={act.id}
                onClick={() => onOpenActivity(act)}
                className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {act.subject}
                    </span>

                    {isEvaluated ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Nota: {sub?.grade?.toFixed(1)} / {act.maxScore}
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Enviada (Aguardando)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                        Rascunho em Andamento
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {sub?.content || Object.values(draft?.answers || {}).join(' - ') || 'Respostas salvas no sistema.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {sub?.submittedAt
                      ? `Enviado em: ${new Date(sub.submittedAt).toLocaleDateString('pt-BR')}`
                      : 'Em andamento'}
                  </span>

                  <span className="font-bold text-purple-700 flex items-center gap-1">
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
