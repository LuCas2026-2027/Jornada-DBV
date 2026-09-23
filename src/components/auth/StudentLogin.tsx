import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { loginStudent } from '../../services/storage';
import { User } from '../../types';

interface StudentLoginProps {
  onSuccess: (user: User) => void;
  onSwitchToRegister: () => void;
  onSwitchToDirector: () => void;
  initialEmail?: string;
}

export function StudentLogin({
  onSuccess,
  onSwitchToRegister,
  onSwitchToDirector,
  initialEmail = '',
}: StudentLoginProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu Gmail ou e-mail escolar.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginStudent(email, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'E-mail ou senha incorretos.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao autenticar. Tente novamente.');
    }
  };

  const handleFillDemoStudent = () => {
    setEmail('lucas.silveira@gmail.com');
    setPassword('senha123');
    setErrorMessage('');
  };

  return (
    <div id="student-login-container" className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-purple-900/5 border border-purple-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl mx-auto flex items-center justify-center text-purple-600 shadow-inner mb-4">
            <svg
              className="w-9 h-9"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portal do Aluno</h2>
          <p className="text-sm text-slate-500 mt-1">
            Entre com seu Gmail e senha para acompanhar seus estudos
          </p>
        </div>

        {errorMessage && (
          <div
            id="student-login-error"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3 animate-shake"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Gmail / E-mail Escolar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="login-student-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="ex: seu.email@gmail.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="login-student-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-600"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="student-login-submit-btn"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar no Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Action to create account */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-3">Ainda não possui uma conta de aluno?</p>
          <button
            type="button"
            id="open-register-btn"
            onClick={onSwitchToRegister}
            className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Criar Nova Conta de Aluno</span>
          </button>
        </div>

        {/* Demo button */}
        <div className="mt-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleFillDemoStudent}
            className="text-[11px] text-slate-400 hover:text-purple-700 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Usar conta de demonstração (Lucas Silveira)</span>
          </button>
        </div>

        {/* Link to Director Login */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSwitchToDirector}
            className="text-xs text-slate-400 hover:text-purple-700 transition"
          >
            É membro da direção escolar? <span className="font-semibold text-slate-700 underline">Acesso Restrito</span>
          </button>
        </div>
      </div>
    </div>
  );
}
