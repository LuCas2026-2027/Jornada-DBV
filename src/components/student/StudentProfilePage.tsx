import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Calendar,
  GraduationCap,
  Clock,
  ShieldCheck,
  Edit3,
  Key,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  X,
  Upload,
} from 'lucide-react';
import { User } from '../../types';
import { PRESET_STUDENT_AVATARS } from '../../data/mockData';
import { updateStudentProfile } from '../../services/storage';

interface StudentProfilePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export function StudentProfilePage({ user, onUpdateUser }: StudentProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'DADOS' | 'SENHA' | 'EMAIL'>('DADOS');

  // Edit form states
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [birthDay, setBirthDay] = useState(user.birthDate?.day || 15);
  const [birthMonth, setBirthMonth] = useState(user.birthDate?.month || 5);
  const [birthYear, setBirthYear] = useState(user.birthDate?.year || 2008);

  // Password fields
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Email fields (Secure change)
  const [newEmail, setNewEmail] = useState(user.email);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formattedBirthDate = user.birthDate
    ? `${String(user.birthDate.day).padStart(2, '0')}/${String(user.birthDate.month).padStart(2, '0')}/${user.birthDate.year}`
    : '15/05/2008';

  const formattedCreatedAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '01 de Fevereiro de 2026';

  const handleOpenEdit = () => {
    setName(user.name);
    setAvatar(user.avatar);
    setNewEmail(user.email);
    setCurrentPasswordForPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCurrentPasswordForEmail('');
    setFeedback(null);
    setIsEditing(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    // Validação de nova senha
    if (newPassword && newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      setIsSaving(false);
      return;
    }

    const result = await updateStudentProfile({
      studentId: user.id,
      name,
      avatar,
      birthDay,
      birthMonth,
      birthYear,
      currentPasswordForPasswordChange: newPassword ? currentPasswordForPassword : undefined,
      newPassword: newPassword || undefined,
      newEmail: newEmail !== user.email ? newEmail : undefined,
      currentPasswordForEmailChange: newEmail !== user.email ? currentPasswordForEmail : undefined,
    });

    setIsSaving(false);

    if (result.success && result.user) {
      onUpdateUser(result.user);
      setFeedback({ type: 'success', message: 'Perfil acadêmico atualizado com sucesso!' });
      setTimeout(() => {
        setIsEditing(false);
        setFeedback(null);
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Erro ao atualizar dados do perfil.' });
    }
  };

  return (
    <div id="student-profile-page" className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Banner de cabeçalho do Perfil */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-purple-950/10">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Foto do Aluno */}
          <div className="relative group shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/30 shadow-2xl"
            />
            <button
              onClick={handleOpenEdit}
              title="Trocar Foto"
              className="absolute -bottom-2 -right-2 p-2 bg-white text-purple-700 rounded-xl shadow-lg hover:bg-purple-50 transition transform hover:scale-105"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide text-purple-100 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{user.grade || 'Desbravador - Guerreiros Da Serra'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-purple-100 text-sm flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4 opacity-80" />
              <span>{user.email}</span>
            </p>
          </div>

          {/* Botão Editar Perfil */}
          <div className="shrink-0 pt-2">
            <button
              id="btn-edit-student-profile"
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-bold text-sm rounded-2xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar perfil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Informações Cadastrais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cartão: Dados Pessoais */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-600" />
              Dados Pessoais
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
              Identificação
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Nome Completo</p>
              <p className="font-semibold text-slate-800 text-base">{user.name}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data de Nascimento</p>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formattedBirthDate}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Matrícula Escolar</p>
              <p className="font-mono font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-block text-xs">
                {user.registrationNumber || '2026-MED3-042'}
              </p>
            </div>
          </div>
        </div>

        {/* Cartão: E-mail & Segurança */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              E-mail & Segurança
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Proteção Ativa
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  E-mail / Gmail Cadastrado
                </p>
                <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Controle Seguro
                </span>
              </div>
              <p className="font-semibold text-slate-800 flex items-center gap-2 text-base">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Turma</p>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                {user.grade || 'Desbravador - Guerreiros Da Serra'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data de Cadastro</p>
              <p className="font-medium text-slate-700 flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-slate-400" />
                {formattedCreatedAt}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DO PERFIL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Editar Perfil do Aluno</h3>
                <p className="text-xs text-slate-500">Atualize sua foto, nome, senha ou e-mail seguro</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas de Edição */}
            <div className="flex border-b border-slate-100 px-6 pt-2 bg-white gap-2">
              <button
                type="button"
                onClick={() => setActiveEditTab('DADOS')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition ${
                  activeEditTab === 'DADOS'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Foto & Nome
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('SENHA')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
                  activeEditTab === 'SENHA'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Alterar Senha
              </button>
              <button
                type="button"
                onClick={() => setActiveEditTab('EMAIL')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
                  activeEditTab === 'EMAIL'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                E-mail Seguro
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-6 flex-1">
              {feedback && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium">{feedback.message}</p>
                </div>
              )}

              {/* ABA 1: DADOS GERAIS & FOTO */}
              {activeEditTab === 'DADOS' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Foto de Perfil
                    </label>
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={avatar}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-600 shadow-md"
                      />
                      <div className="space-y-1">
                        <label className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Carregar do dispositivo</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                        <p className="text-[11px] text-slate-400">Suporta JPG, PNG ou WebP</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-2 font-medium">Ou escolha um dos avatares rápidos:</p>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_STUDENT_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition ${
                            avatar === preset ? 'border-purple-600 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Lucas Silveira"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Dia Nasc.
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={birthDay}
                        onChange={(e) => setBirthDay(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Mês
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Ano
                      </label>
                      <input
                        type="number"
                        min={1990}
                        max={2020}
                        value={birthYear}
                        onChange={(e) => setBirthYear(parseInt(e.target.value) || 2008)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: ALTERAR SENHA */}
              {activeEditTab === 'SENHA' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-2xl text-xs text-purple-800 border border-purple-100 flex items-start gap-2">
                    <Key className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      Para redefinir sua senha, informe sua senha atual por motivos de segurança e escolha uma nova
                      com pelo menos 6 dígitos.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      value={currentPasswordForPassword}
                      onChange={(e) => setCurrentPasswordForPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* ABA 3: CONTROLE SEGURO DE EMAIL (GMAIL) */}
              {activeEditTab === 'EMAIL' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl text-xs text-amber-900 border border-amber-200 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 mb-0.5">Controle Seguro de Alteração de E-mail</p>
                      <p className="text-amber-800 leading-relaxed">
                        Seu e-mail/Gmail é a chave de acesso principal às suas atividades e notas. Para qualquer
                        modificação, é estritamente obrigatório autenticar informando sua senha atual.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Novo E-mail ou Gmail
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="exemplo@gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirmação: Senha Atual da Conta
                    </label>
                    <input
                      type="password"
                      value={currentPasswordForEmail}
                      onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                      placeholder="Digite sua senha para autorizar alteração"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Necessário somente se o novo e-mail for diferente do atual ({user.email}).
                    </p>
                  </div>
                </div>
              )}

              {/* Ações do Rodapé */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-lg shadow-purple-900/20 transition disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
