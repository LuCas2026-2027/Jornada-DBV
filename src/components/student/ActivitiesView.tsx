import React, { useState } from 'react';
import { Activity, User } from '../../types';
import { ActivityCarouselRow } from './ActivityCarousel';
import { ActivityPlayerView } from './ActivityPlayerView';
import {
  Sparkles,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';

interface ActivitiesViewProps {
  user: User;
  activities: Activity[];
  onSubmitActivity: (activityId: string, answerText: string, answersMap?: Record<string, string>) => void;
  onAutoSaveDraft?: (activityId: string, questionIndex: number, answers: Record<string, string>) => void;
  selectedActivityId?: string | null;
}

export function ActivitiesView({
  user,
  activities,
  onSubmitActivity,
  onAutoSaveDraft,
  selectedActivityId = null,
}: ActivitiesViewProps) {
  const [activeActivity, setActiveActivity] = useState<Activity | null>(() => {
    if (selectedActivityId) {
      return activities.find((a) => a.id === selectedActivityId) || null;
    }
    return null;
  });

  const [searchFilter, setSearchFilter] = useState('');

  // When an activity is opened, render the full ActivityPlayerView
  if (activeActivity) {
    // Keep reference updated with fresh activities array
    const freshAct = activities.find((a) => a.id === activeActivity.id) || activeActivity;

    return (
      <ActivityPlayerView
        activity={freshAct}
        user={user}
        onBack={() => setActiveActivity(null)}
        onSubmit={(actId, answersMap, summary) => {
          onSubmitActivity(actId, summary, answersMap);
          setActiveActivity(null);
        }}
        onAutoSaveDraft={onAutoSaveDraft}
      />
    );
  }

  // Filter if search input has text
  const filteredActivities = searchFilter.trim()
    ? activities.filter(
        (a) =>
          a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (a.teacherName && a.teacherName.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : activities;

  // 1. "Continue estudando" (activities in progress with draft or submitted awaiting evaluation)
  const continueStudying = filteredActivities.filter((act) => {
    const hasDraft = !!act.drafts?.[user.id] && Object.keys(act.drafts[user.id].answers || {}).length > 0;
    const isSubmitted = !!act.submissions[user.id];
    return hasDraft && !isSubmitted;
  });

  // 2. "Novas atividades" (unstarted activities)
  const newActivities = filteredActivities.filter((act) => {
    const hasDraft = !!act.drafts?.[user.id] && Object.keys(act.drafts[user.id].answers || {}).length > 0;
    const isSubmitted = !!act.submissions[user.id];
    return !hasDraft && !isSubmitted;
  });

  // 3. Subject-specific rows (ex: Matemática, Programação, Física)
  const mathActivities = filteredActivities.filter((act) =>
    act.subject.toLowerCase().includes('matemática') || act.subject.toLowerCase().includes('estatística')
  );

  const programmingActivities = filteredActivities.filter((act) =>
    act.subject.toLowerCase().includes('programação') || act.subject.toLowerCase().includes('banco de dados')
  );

  const physicsActivities = filteredActivities.filter((act) =>
    act.subject.toLowerCase().includes('física') || act.subject.toLowerCase().includes('termodinâmica')
  );

  return (
    <div id="student-activities-catalog" className="space-y-8 animate-in fade-in duration-200">
      {/* Catalog Banner / Search */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-3 border border-purple-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catálogo de Atividades</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Atividades em Formato Carrossel
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-2 leading-relaxed">
            Navegue pelos carrosséis horizontais inspirados no catálogo Netflix. Deslize ou use as setas para explorar suas tarefas escolares.
          </p>

          {/* Quick Search in catalog */}
          <div className="mt-5 relative max-w-md">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por matéria, título ou professor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 text-white placeholder-purple-200/60 text-xs sm:text-sm border border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-md"
            />
            <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 1: Continue Estudando (Netflix style) */}
      {continueStudying.length > 0 && (
        <ActivityCarouselRow
          title="Continue estudando"
          subtitle="Atividades que você já começou e pode continuar de onde parou"
          activities={continueStudying}
          user={user}
          onOpenActivity={(act) => setActiveActivity(act)}
        />
      )}

      {/* Row 2: Novas atividades */}
      <ActivityCarouselRow
        title="Novas atividades"
        subtitle="Atividades recém-disponibilizadas para sua turma"
        activities={newActivities.length > 0 ? newActivities : filteredActivities}
        user={user}
        onOpenActivity={(act) => setActiveActivity(act)}
      />

      {/* Row 3: Atividades de Matemática */}
      {mathActivities.length > 0 && (
        <ActivityCarouselRow
          title="Atividades de Matemática"
          subtitle="Álgebra, matrizes, geometria e análise estatística"
          activities={mathActivities}
          user={user}
          onOpenActivity={(act) => setActiveActivity(act)}
        />
      )}

      {/* Row 4: Atividades de Tecnologia e Programação */}
      {programmingActivities.length > 0 && (
        <ActivityCarouselRow
          title="Atividades de Tecnologia & POO"
          subtitle="Banco de dados, modelagem de sistemas e algoritmos"
          activities={programmingActivities}
          user={user}
          onOpenActivity={(act) => setActiveActivity(act)}
        />
      )}

      {/* Row 5: Atividades de Física */}
      {physicsActivities.length > 0 && (
        <ActivityCarouselRow
          title="Atividades de Física"
          subtitle="Termodinâmica, cinemática e leis da mecânica"
          activities={physicsActivities}
          user={user}
          onOpenActivity={(act) => setActiveActivity(act)}
        />
      )}
    </div>
  );
}
