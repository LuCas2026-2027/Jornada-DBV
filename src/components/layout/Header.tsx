import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, Check, Calendar, LogOut, User as UserIcon, Award, ChevronDown } from 'lucide-react';
import { User, SchoolNotice } from '../../types';

interface HeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notices: SchoolNotice[];
  onOpenProfile?: () => void;
  onSelectNotice?: (notice: SchoolNotice) => void;
  onLogout?: () => void;
}

export function Header({
  user,
  searchQuery,
  onSearchChange,
  notices,
  onOpenProfile,
  onSelectNotice,
  onLogout,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDirector = user.role === 'DIRETOR';
  const subtitle = isDirector ? 'Direção Pedagógica' : user.grade || 'Desbravador - Guerreiros Da Serra';

  return (
    <header id="app-header" className="w-full flex items-center justify-between gap-4 mb-6 relative">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            id="global-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-6 pr-10 py-2.5 bg-white rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Right Side: Profile, Notifications & User Menu */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* User Card Pill with Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            id="header-user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 sm:gap-3 bg-white hover:bg-slate-50 p-1.5 sm:py-1.5 sm:px-3 rounded-full border border-slate-100 shadow-sm transition text-left cursor-pointer"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-purple-200"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>{user.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                {subtitle}
              </div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              id="header-user-dropdown-menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-purple-100 p-2 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-xs font-bold text-slate-900 block truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {subtitle}
                </span>
              </div>

              <button
                type="button"
                id="header-menu-profile-btn"
                onClick={() => {
                  setShowUserMenu(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-2xl transition cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-purple-600" />
                <span>Meu Perfil</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  id="header-menu-logout-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notification Bell with red unread dot */}
        <div className="relative">
          <button
            type="button"
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-purple-600 transition relative cursor-pointer"
            title="Notificações e Avisos"
          >
            <Bell className="w-4 h-4" />
            {notices.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              id="notifications-dropdown-menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-purple-100 p-4 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Avisos e Comunicados</span>
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notices.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {notices.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Nenhum aviso novo no momento.
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      onClick={() => {
                        if (onSelectNotice) onSelectNotice(notice);
                        setShowNotifications(false);
                      }}
                      className="p-3 bg-slate-50 hover:bg-purple-50/70 rounded-2xl border border-slate-100 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-purple-700">{notice.category}</span>
                        <span className="text-slate-400">{notice.publishDate}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{notice.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{notice.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
