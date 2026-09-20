import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { loginDirector } from '../../services/storage';
import { User } from '../../types';

interface DirectorLoginProps {
  onSuccess: (user: User) => void;
  onSwitchToStudent: () => void;
}

export function DirectorLogin({ onSuccess, onSwitchToStudent }: DirectorLoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Por favor, informe o e-mail ou nome de usuário da direção.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, informe a senha de acesso da direção.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginDirector(identifier, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Credenciais de diretor inválidas.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao autenticar. Tente novamente.');
    }
  };

  const handleFillDemoCredentials = () => {
    setIdentifier('diretor@escola.com.br');
    setPassword('diretor123');
    setErrorMessage('');
  };

  return (
    <div id="director-login-container" className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-purple-900/5 border border-purple-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-purple-500/25 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Acesso da Direção</h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Área administrativa restrita da equipe pedagógica e gestora.
          </p>
        </div>

        {/* Notice of no public registration */}
        <div className="mb-6 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Atenção:</strong> O acesso do diretor é estritamente confidencial e não permite cadastro público. Utilize os dados fornecidos pela administração.
          </p>
        </div>

        {errorMessage && (
          <div
            id="director-login-error"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3 animate-shake"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              E-mail ou Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                id="director-identifier-input"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="ex: diretor@escola.com.br ou diretor"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="director-password-input"
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
                id="toggle-director-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-600 transition"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="director-login-submit-btn"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar no Painel Administrativo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Box */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center">
          <button
            type="button"
            id="director-demo-fill-btn"
            onClick={handleFillDemoCredentials}
            className="text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 px-4 py-2 rounded-xl border border-purple-200/80 font-medium flex items-center gap-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Preencher dados de teste da Direção</span>
          </button>
          <span className="text-[11px] text-slate-400 mt-1">
            (Usuário: <code className="text-purple-700 font-mono">diretor</code> / Senha: <code className="text-purple-700 font-mono">diretor123</code>)
          </span>
        </div>

        {/* Back to Student Portal link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onSwitchToStudent}
            className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition underline underline-offset-4"
          >
            ← Voltar para a Área do Aluno
          </button>
        </div>
      </div>
    </div>
  );
}
