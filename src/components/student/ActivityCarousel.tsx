import React, { useRef } from 'react';
import { Activity, User } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  User as UserIcon,
  HelpCircle,
  Award
} from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  user: User;
  onOpenActivity: (activity: Activity) => void;
}

export function ActivityCard({ activity, user, onOpenActivity }: ActivityCardProps) {
  const submission = activity.submissions[user.id];
  const draft = activity.drafts?.[user.id];

  // Determine status: NÃO INICIADA, EM ANDAMENTO, ENVIADA, CORRIGIDA
  let status: 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'ENVIADA' | 'CORRIGIDA' = 'NAO_INICIADA';
  if (submission) {
    if (submission.status === 'AVALIADO') {
      status = 'CORRIGIDA';
    } else {
      status = 'ENVIADA';
    }
  } else if (draft && Object.keys(draft.answers || {}).length > 0) {
    status = 'EM_ANDAMENTO';
  }

  const questionCount = activity.questions?.length || 3;

  const getStatusBadge = () => {
    switch (status) {
      case 'NAO_INICIADA':
        return {
          label: 'Não iniciada',
          bg: 'bg-slate-900/80 backdrop-blur-md text-white border border-white/20',
        };
      case 'EM_ANDAMENTO':
        return {
          label: 'Em andamento',
          bg: 'bg-amber-500/95 backdrop-blur-md text-white border border-amber-300/40 shadow-sm',
        };
      case 'ENVIADA':
        return {
          label: 'Enviada',
          bg: 'bg-indigo-600/95 backdrop-blur-md text-white border border-indigo-300/40 shadow-sm',
        };
      case 'CORRIGIDA':
        return {
          label: `Nota: ${submission?.grade?.toFixed(1) || '10.0'}`,
          bg: 'bg-emerald-600/95 backdrop-blur-md text-white border border-emerald-300/40 shadow-sm',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      onClick={() => onOpenActivity(activity)}
      className="group relative shrink-0 w-[260px] sm:w-[290px] md:w-[310px] bg-white rounded-3xl border border-slate-100/90 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col select-none"
    >
      {/* Cover Image Container */}
      <div className="relative h-40 sm:h-44 w-full bg-slate-900 overflow-hidden">
        <img
          src={
            activity.coverImage ||
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
          }
          alt={activity.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />

        {/* Gradient Overlay for Netflix-like contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-purple-600/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
            {activity.subject}
          </span>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.bg}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Due date if exists */}
        {activity.dueDate && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-medium text-purple-200 bg-slate-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
            <Clock className="w-3 h-3 text-amber-300" />
            <span>Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors">
            {activity.title}
          </h4>

          {/* Teacher and Questions Info */}
          <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src={
                  activity.teacherAvatar ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                }
                alt={activity.teacherName || 'Professor'}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
              <span className="truncate font-medium text-slate-600 text-[11px]">
                {activity.teacherName || 'Prof. Responsável'}
              </span>
            </div>

            <span className="font-semibold text-purple-700 text-[11px] shrink-0 bg-purple-50 px-2 py-0.5 rounded-lg">
              {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
            </span>
          </div>
        </div>

        {/* Action Button: Começar atividade */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenActivity(activity);
          }}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
            status === 'CORRIGIDA'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              : status === 'ENVIADA'
              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              : status === 'EM_ANDAMENTO'
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
          }`}
        >
          {status === 'CORRIGIDA' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Correção</span>
            </>
          ) : status === 'ENVIADA' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ver Respostas Enviadas</span>
            </>
          ) : status === 'EM_ANDAMENTO' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continuar Atividade</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Começar atividade</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface ActivityCarouselRowProps {
  title: string;
  subtitle?: string;
  activities: Activity[];
  user: User;
  onOpenActivity: (activity: Activity) => void;
}

export function ActivityCarouselRow({
  title,
  subtitle,
  activities,
  user,
  onOpenActivity,
}: ActivityCarouselRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (activities.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320 * (direction === 'left' ? -1 : 1);
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 relative group/row">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
              {activities.length}
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Scroll Buttons for Desktop */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-80 group-hover/row:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel (Touch and Swipe Enabled on Mobile with momentum scrolling) */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
      >
        {activities.map((activity) => (
          <div key={activity.id} className="snap-start shrink-0">
            <ActivityCard
              activity={activity}
              user={user}
              onOpenActivity={onOpenActivity}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
