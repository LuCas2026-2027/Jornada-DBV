import { useState } from 'react';
import { StudentLogin } from './StudentLogin';
import { StudentRegister } from './StudentRegister';
import { DirectorLogin } from './DirectorLogin';
import { User, SystemConfig } from '../../types';
import { GraduationCap, Shield, Database, Settings } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthPortalProps {
  onLoginSuccess: (user: User) => void;
  onOpenSupabaseModal?: () => void;
  onOpenSetupModal?: () => void;
  systemConfig?: SystemConfig;
}

export type AuthMode = 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'DIRECTOR_LOGIN';

export function AuthPortal({
  onLoginSuccess,
  onOpenSupabaseModal,
  onOpenSetupModal,
  systemConfig,
}: AuthPortalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('STUDENT_LOGIN');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  const handleSwitchToLoginWithEmail = (email?: string) => {
    if (email) setPrefilledEmail(email);
    setAuthMode('STUDENT_LOGIN');
  };

  const platformTitle = systemConfig?.platformName || 'Portal Escolar Inteligente';
  const schoolTitle = systemConfig?.schoolName || 'Colégio Modelo';

  return (
    <div id="auth-portal-page" className="min-h-screen bg-[#f4f2fb] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Decorative Blur circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Banner */}
      <div className="max-w-md w-full mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-purple-100 shadow-sm mb-2">
          {systemConfig?.schoolLogo ? (
            <img
              src={systemConfig.schoolLogo}
              alt="Logo da Escola"
              className="w-8 h-8 rounded-full object-cover border border-purple-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <span className="font-extrabold tracking-tight text-slate-800 text-sm sm:text-base">
            {platformTitle}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {schoolTitle}
        </p>
      </div>

      {/* Main Mode Switcher: "Entrar como aluno" / "Entrar como diretor" */}
      <div className="max-w-md w-full mx-auto mb-6">
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center shadow-inner gap-1">
          <button
            type="button"
            id="tab-student-mode"
            onClick={() => setAuthMode('STUDENT_LOGIN')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'STUDENT_LOGIN' || authMode === 'STUDENT_REGISTER'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Entrar como aluno</span>
          </button>

          <button
            type="button"
            id="tab-director-mode"
            onClick={() => setAuthMode('DIRECTOR_LOGIN')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'DIRECTOR_LOGIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Entrar como diretor</span>
          </button>
        </div>
      </div>

      {/* Dynamic View rendering */}
      <div className="w-full max-w-lg mx-auto transition-all duration-300">
        {authMode === 'STUDENT_LOGIN' && (
          <StudentLogin
            onSuccess={onLoginSuccess}
            onSwitchToRegister={() => setAuthMode('STUDENT_REGISTER')}
            onSwitchToDirector={() => setAuthMode('DIRECTOR_LOGIN')}
            initialEmail={prefilledEmail}
          />
        )}

        {authMode === 'STUDENT_REGISTER' && (
          <StudentRegister
            onSuccess={onLoginSuccess}
            onSwitchToLogin={handleSwitchToLoginWithEmail}
          />
        )}

        {authMode === 'DIRECTOR_LOGIN' && (
          <DirectorLogin
            onSuccess={onLoginSuccess}
            onSwitchToStudent={() => setAuthMode('STUDENT_LOGIN')}
          />
        )}
      </div>

      {/* Footer reassurance & Setup triggers */}
      <div className="mt-8 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>Plataforma Escolar Segura &bull; Todos os direitos reservados</span>
          {onOpenSetupModal && (
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="text-purple-600 hover:text-purple-800 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Escola</span>
            </button>
          )}
        </div>

        {onOpenSupabaseModal && (
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer border ${
              isSupabaseConfigured()
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span>{isSupabaseConfigured() ? 'Supabase Conectado' : 'Conectar ao Supabase (PostgreSQL)'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

