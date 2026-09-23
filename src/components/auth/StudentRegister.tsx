import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Camera,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { validateAndRegisterStudent, RegisterStudentData } from '../../services/storage';
import { PRESET_STUDENT_AVATARS } from '../../data/mockData';
import { User } from '../../types';

interface StudentRegisterProps {
  onSuccess: (user: User) => void;
  onSwitchToLogin: (email?: string) => void;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function StudentRegister({ onSuccess, onSwitchToLogin }: StudentRegisterProps) {
  const [formData, setFormData] = useState<RegisterStudentData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: PRESET_STUDENT_AVATARS[0],
    birthDay: 15,
    birthMonth: 5,
    birthYear: 2008,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // File Upload handling with canvas compression (prevents localStorage quota overflow)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setCustomAvatarPreview(compressed);
        setFormData((prev) => ({ ...prev, avatar: compressed }));
        setErrorMessage('');
      };
      img.onerror = () => {
        setCustomAvatarPreview(dataUrl);
        setFormData((prev) => ({ ...prev, avatar: dataUrl }));
        setErrorMessage('');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url: string) => {
    setCustomAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: url }));
    if (errorMessage.includes('foto')) setErrorMessage('');
  };

  // Quick fill sample data for fast testing
  const handleFillDemoStudent = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: `Aluno Novo ${randomSuffix}`,
      email: `aluno.${randomSuffix}@gmail.com`,
      password: 'senha123',
      confirmPassword: 'senha123',
      avatar: PRESET_STUDENT_AVATARS[0],
      birthDay: 15,
      birthMonth: 5,
      birthYear: 2008,
    });
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-validation with clear feedback
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe seu Gmail ou e-mail escolar.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido (ex: seu.nome@gmail.com).');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Por favor, digite uma senha para sua conta.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('A senha precisa ter no mínimo 6 caracteres para segurança.');
      return;
    }

    if (!formData.confirmPassword) {
      setErrorMessage('Por favor, repita a senha no campo de confirmação.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('As senhas não coincidem. Digite novamente a confirmação de senha.');
      return;
    }

    setIsLoading(true);

    try {
      const dataToSubmit: RegisterStudentData = {
        ...formData,
        name: trimmedName,
        email: trimmedEmail,
        avatar: formData.avatar || PRESET_STUDENT_AVATARS[0],
      };

      const result = await validateAndRegisterStudent(dataToSubmit);
      setIsLoading(false);

      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Não foi possível cadastrar a conta. Verifique os dados informados.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Erro ao realizar cadastro. Tente novamente.');
    }
  };

  // Generate days array (1 to 31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generate realistic student birth years (2000 to 2018)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - 5 - i);

  // Password strength indicators
  const hasMinLen = formData.password.length >= 6;
  const passwordsMatch = Boolean(formData.password && formData.password === formData.confirmPassword);
  const isEmailAlreadyRegistered = errorMessage.toLowerCase().includes('já está cadastrado') || errorMessage.toLowerCase().includes('faça login');

  return (
    <div id="student-register-container" className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-purple-900/5 border border-purple-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl shadow-inner mb-3">
            🎓
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Cadastro de Aluno</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Crie sua conta para acessar atividades escolares, materiais e boletim
          </p>
        </div>

        {/* Top Error Banner */}
        {errorMessage && (
          <div
            id="register-error-banner"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm flex flex-col gap-2 animate-shake"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            {isEmailAlreadyRegistered && (
              <div className="pl-6.5 pt-1">
                <button
                  type="button"
                  id="go-to-login-from-error-btn"
                  onClick={() => onSwitchToLogin(formData.email)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  <span>Fazer login agora com este e-mail</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Demo Fill Helper */}
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            id="student-register-quick-fill-btn"
            onClick={handleFillDemoStudent}
            className="text-[11px] text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Preencher dados de exemplo para teste</span>
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {/* Foto de Perfil */}
          <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
            <label className="block text-xs font-semibold text-purple-900 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Foto de Perfil</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Selected Avatar Preview */}
              <div className="relative group">
                <img
                  src={formData.avatar || PRESET_STUDENT_AVATARS[0]}
                  alt="Pré-visualização do perfil"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-600 shadow-md shadow-purple-500/20"
                />
                <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-full text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Upload file or pick preset */}
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <label
                    htmlFor="avatar-file-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-medium cursor-pointer shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar foto do dispositivo</span>
                  </label>
                  <input
                    id="avatar-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="text-[11px] text-slate-500 mb-1.5">Ou escolha um avatar rápido:</div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  {PRESET_STUDENT_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(url)}
                      className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        formData.avatar === url && !customAvatarPreview
                          ? 'border-purple-600 ring-2 ring-purple-200 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="student-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ex: Pedro Henrique Alcantara"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
              />
            </div>
          </div>

          {/* Gmail / E-mail */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Gmail ou E-mail Escolar *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="student-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="aluno@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
              />
            </div>
          </div>

          {/* Data de Nascimento (Dia, Mês, Ano) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Data de Nascimento</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Dia */}
              <div>
                <select
                  id="student-birth-day"
                  value={formData.birthDay}
                  onChange={(e) => setFormData({ ...formData, birthDay: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      Dia {d < 10 ? `0${d}` : d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mês */}
              <div>
                <select
                  id="student-birth-month"
                  value={formData.birthMonth}
                  onChange={(e) => setFormData({ ...formData, birthMonth: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ano */}
              <div>
                <select
                  id="student-birth-year"
                  value={formData.birthYear}
                  onChange={(e) => setFormData({ ...formData, birthYear: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Senha e Confirmar Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="student-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-purple-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                Confirmar Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="student-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Repita a senha"
                  className={`w-full pl-10 pr-9 py-2.5 bg-slate-50 border rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-4 transition ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                      : 'border-slate-200 focus:border-purple-600 focus:ring-purple-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-purple-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Validation Hints */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 px-1">
            <span className={`flex items-center gap-1 ${hasMinLen ? 'text-emerald-600 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Mínimo 6 caracteres
            </span>
            <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 font-medium' : ''}`}>
              <CheckCircle2 className="w-3 h-3" /> Senhas iguais
            </span>
          </div>

          {/* Bottom Error Banner (directly above submit button so user always sees it) */}
          {errorMessage && (
            <div
              id="register-error-banner-bottom"
              className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              {isEmailAlreadyRegistered && (
                <button
                  type="button"
                  onClick={() => onSwitchToLogin(formData.email)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 underline text-left cursor-pointer"
                >
                  Clique aqui para entrar com esta conta
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="student-register-submit-btn"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] disabled:opacity-70 cursor-pointer text-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Criar Conta e Acessar Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          Já possui conta cadastrada?{' '}
          <button
            type="button"
            id="go-to-student-login-btn"
            onClick={() => onSwitchToLogin(formData.email)}
            className="font-bold text-purple-600 hover:text-purple-800 transition underline underline-offset-4 cursor-pointer"
          >
            Entrar com Gmail e Senha
          </button>
        </div>
      </div>
    </div>
  );
}
