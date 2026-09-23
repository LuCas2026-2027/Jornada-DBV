import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Award,
  Bell,
  Calendar,
  LogOut,
  Users,
  PlusCircle,
  FileCheck,
  User as UserIcon,
  BarChart3,
  MessageSquareQuote,
  Send,
  GraduationCap,
  Settings,
  ClipboardCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

export type StudentTab =
  | 'DASHBOARD'
  | 'ACTIVITIES'
  | 'MY_ANSWERS'
  | 'RESULTS'
  | 'PROFILE'
  | 'COURSES'
  | 'NOTICES'
  | 'SCHEDULE';

export type DirectorTab =
  | 'DIR_DASHBOARD'
  | 'DIR_STUDENTS'
  | 'DIR_ACTIVITIES'
  | 'DIR_SUBMISSIONS'
  | 'DIR_CORRECTIONS'
  | 'DIR_CLASSES'
  | 'DIR_REPORTS'
  | 'DIR_SETTINGS';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
  unreadNoticesCount?: number;
  pendingActivitiesCount?: number;
  pendingCorrectionsCount?: number;
  schoolName?: string;
  schoolLogo?: string;
}

export function Sidebar({
  role,
  activeTab,
  onTabChange,
  onLogout,
  unreadNoticesCount = 0,
  pendingActivitiesCount = 0,
  pendingCorrectionsCount = 0,
  schoolName,
  schoolLogo,
}: SidebarProps) {
  const isDirector = role === 'DIRETOR';

  // Strictly according to user specification:
  // Criar menu:
  // - Início
  // - Atividades
  // - Minhas respostas
  // - Resultados
  // - Perfil
  // - Sair
  const studentNavItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'ACTIVITIES',
      label: 'Atividades',
      icon: CheckSquare,
      badge: pendingActivitiesCount > 0 ? pendingActivitiesCount : undefined,
    },
    { id: 'MY_ANSWERS', label: 'Minhas respostas', icon: MessageSquareQuote },
    { id: 'RESULTS', label: 'Resultados', icon: BarChart3 },
    { id: 'PROFILE', label: 'Perfil', icon: UserIcon },
  ];

  // Strictly according to user specification:
  // Menu Diretor:
  // - Dashboard
  // - Alunos
  // - Atividades
  // - Respostas enviadas
  // - Correções
  // - Turmas
  // - Relatórios
  // - Configurações
  // - Sair
  const directorNavItems: NavItem[] = [
    { id: 'DIR_DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'DIR_STUDENTS', label: 'Alunos', icon: Users },
    { id: 'DIR_ACTIVITIES', label: 'Atividades', icon: CheckSquare },
    { id: 'DIR_SUBMISSIONS', label: 'Respostas enviadas', icon: Send },
    {
      id: 'DIR_CORRECTIONS',
      label: 'Correções',
      icon: ClipboardCheck,
      badge: pendingCorrectionsCount > 0 ? pendingCorrectionsCount : undefined,
    },
    { id: 'DIR_CLASSES', label: 'Turmas', icon: GraduationCap },
    { id: 'DIR_REPORTS', label: 'Relatórios', icon: BarChart3 },
    { id: 'DIR_SETTINGS', label: 'Configurações', icon: Settings },
  ];

  const navItems = isDirector ? directorNavItems : studentNavItems;

  return (
    <aside
      id="main-sidebar"
      className="hidden md:flex flex-col w-56 lg:w-64 bg-gradient-to-b from-[#7445f8] via-[#8152f7] to-[#8d5ef8] text-white p-5 rounded-3xl shadow-xl shadow-purple-950/15 select-none shrink-0"
    >
      {/* Top Cap / School Icon */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center p-2.5 shadow-inner border border-white/20 mb-2.5 overflow-hidden">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="Logo da Escola"
              className="w-full h-full object-cover rounded-xl shadow-xs"
            />
          ) : (
            <svg
              className="w-10 h-10 text-white drop-shadow-md"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          )}
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-wide text-white/95 line-clamp-1 max-w-[190px]">
          {schoolName || (isDirector ? 'Painel Direção' : 'Portal do Aluno')}
        </span>
        <span className="text-[10px] text-purple-200 uppercase tracking-widest font-semibold mt-0.5">
          {isDirector ? 'Direção Pedagógica' : 'Ano Letivo 2026'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              id={`sidebar-link-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm shadow-purple-900/10 font-semibold backdrop-blur-sm'
                  : 'text-purple-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-200'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout button at bottom: "Sair" */}
      <div className="pt-4 mt-auto border-t border-white/15">
        <button
          type="button"
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs lg:text-sm font-medium text-purple-200 hover:text-white hover:bg-white/10 rounded-2xl transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
