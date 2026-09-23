import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Award,
  Bell,
  Users,
  PlusCircle,
} from 'lucide-react';
import { UserRole } from '../../types';

interface MobileNavProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: any) => void;
  pendingActivitiesCount?: number;
  unreadNoticesCount?: number;
}

export function MobileNav({
  role,
  activeTab,
  onTabChange,
  pendingActivitiesCount = 0,
  unreadNoticesCount = 0,
}: MobileNavProps) {
  const isDirector = role === 'DIRETOR';

  const items = isDirector
    ? [
        { id: 'DIR_DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'DIR_STUDENTS', label: 'Alunos', icon: Users },
        { id: 'DIR_ACTIVITIES', label: 'Atividades', icon: CheckSquare },
        { id: 'DIR_SUBMISSIONS', label: 'Respostas', icon: Award },
        { id: 'DIR_CORRECTIONS', label: 'Correções', icon: Bell },
      ]
    : [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ACTIVITIES', label: 'Atividades', icon: CheckSquare, badge: pendingActivitiesCount },
        { id: 'MY_ANSWERS', label: 'Respostas', icon: Award },
        { id: 'RESULTS', label: 'Resultados', icon: Bell },
        { id: 'PROFILE', label: 'Perfil', icon: Users },
      ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-purple-100 px-3 py-2 flex items-center justify-around shadow-lg shadow-purple-950/10"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
              isActive ? 'text-purple-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-purple-100' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>

            {Boolean(item.badge && item.badge > 0) && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-sm">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
