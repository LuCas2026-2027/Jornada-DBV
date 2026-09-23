import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  School,
  Sparkles,
  Palette,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { SystemConfig } from '../../types';
import { saveSystemConfig, hashPassword } from '../../services/storage';

interface FirstTimeSetupModalProps {
  isOpen: boolean;
  onComplete: (config: SystemConfig) => void;
  onClose?: () => void;
  initialConfig?: SystemConfig;
}

const PRESET_COLORS = [
  { name: 'Roxo Educacional (Padrão)', hex: '#7445f8' },
  { name: 'Índigo Real', hex: '#4f46e5' },
  { name: 'Violeta Profundo', hex: '#581c87' },
  { name: 'Esmeralda Acadêmica', hex: '#059669' },
  { name: 'Azul Safira', hex: '#0284c7' },
];

const PRESET_LOGOS = [
  {
    name: 'Brasão Clássico',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Moderno Tech',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Saber & Ciência',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150&auto=format&fit=crop&q=80',
  },
];

export function FirstTimeSetupModal({
  isOpen,
  onComplete,
  onClose,
  initialConfig,
}: FirstTimeSetupModalProps) {
  const [directorEmail, setDirectorEmail] = useState(
    initialConfig?.directorEmail || 'diretor@escola.com.br'
  );
  const [directorName, setDirectorName] = useState(
    initialConfig?.directorName || 'Prof. Roberto Guimarães'
  );
  const [directorPassword, setDirectorPassword] = useState('diretor123');
  const [confirmPassword, setConfirmPassword] = useState('diretor123');
  const [schoolName, setSchoolName] = useState(
    initialConfig?.schoolName || 'Colégio Modelo Guerreiros da Serra'
  );
  const [schoolLogo, setSchoolLogo] = useState(
    initialConfig?.schoolLogo || PRESET_LOGOS[0].url
  );
  const [platformName, setPlatformName] = useState(
    initialConfig?.platformName || 'Portal Escolar Inteligente'
  );
  const [primaryColor, setPrimaryColor] = useState(
    initialConfig?.primaryColor || '#7445f8'
  );

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validações
    if (!directorEmail.trim()) {
      setErrorMessage('Por favor, informe o e-mail oficial do diretor.');
      return;
    }
    if (!directorEmail.includes('@') || !directorEmail.includes('.')) {
      setErrorMessage('Informe um e-mail válido para o diretor.');
      return;
    }
    if (!directorPassword || directorPassword.length < 6) {
      setErrorMessage('A senha do diretor deve ter no mínimo 6 caracteres.');
      return;
    }
    if (directorPassword !== confirmPassword) {
      setErrorMessage('A confirmação da senha não confere.');
      return;
    }
    if (!schoolName.trim()) {
      setErrorMessage('Informe o nome da escola ou instituição.');
      return;
    }
    if (!platformName.trim()) {
      setErrorMessage('Informe o nome da plataforma.');
      return;
    }

    setIsSubmitting(true);
    try {
      const passHash = await hashPassword(directorPassword);
      const newConfig: SystemConfig = {
        isConfigured: true,
        directorEmail: directorEmail.trim(),
        directorPasswordHash: passHash,
        directorName: directorName.trim() || 'Diretor Pedagógico',
        schoolName: schoolName.trim(),
        schoolLogo: schoolLogo.trim() || PRESET_LOGOS[0].url,
        platformName: platformName.trim(),
        primaryColor,
        configuredAt: new Date().toISOString(),
      };

      saveSystemConfig(newConfig);
      setIsSubmitting(false);
      onComplete(newConfig);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Erro ao salvar as configurações. Tente novamente.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-purple-100 space-y-6 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                Seção 20: Primeira Configuração
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Configuração Inicial do Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina a identidade da sua escola e as credenciais mestras do diretor.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. CREDENCIAIS DO DIRETOR */}
          <div className="p-4 sm:p-5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-800">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>1. Acesso Confidencial do Diretor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Diretor / Gestor
                </label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="ex: Prof. Roberto Guimarães"
                  className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail do Diretor (Login)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={directorEmail}
                    onChange={(e) => setDirectorEmail(e.target.value)}
                    placeholder="diretor@escola.com.br"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                  <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha do Diretor
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={directorPassword}
                    onChange={(e) => setDirectorPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
          </div>

          {/* 2. IDENTIDADE DA ESCOLA & PLATAFORMA */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <School className="w-4 h-4 text-purple-600" />
              <span>2. Identidade da Escola & Marca</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Escola / Instituição
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="ex: Colégio Modelo Guerreiros da Serra"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Plataforma
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="ex: Portal Escolar Inteligente"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Logo Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Logo da Escola (Selecione ou insira URL)
              </label>
              <div className="flex items-center gap-3 mb-2">
                {PRESET_LOGOS.map((logo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSchoolLogo(logo.url)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                      schoolLogo === logo.url
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">
                      {logo.name}
                    </span>
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={schoolLogo}
                onChange={(e) => setSchoolLogo(e.target.value)}
                placeholder="URL da imagem do logo da escola"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* 3. COR PRINCIPAL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Cor Principal da Plataforma</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPrimaryColor(col.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      primaryColor === col.hex
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/25 transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar & Inicializar Sistema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
