import React, { useState } from 'react';
import { User } from '../../types';
import { PRESET_STUDENT_AVATARS } from '../../data/mockData';
import { X, User as UserIcon, Mail, Calendar, Camera, LogOut, CheckCircle2, Shield } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateAvatar: (newAvatarUrl: string) => void;
  onLogout: () => void;
}

export function ProfileModal({
  user,
  onClose,
  onUpdateAvatar,
  onLogout,
}: ProfileModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isDirector = user.role === 'DIRETOR';

  const birthDateStr = user.birthDate
    ? `${user.birthDate.day < 10 ? '0' : ''}${user.birthDate.day}/${
        user.birthDate.month < 10 ? '0' : ''
      }${user.birthDate.month}/${user.birthDate.year}`
    : '15/05/2008';

  const handleSaveAvatar = () => {
    onUpdateAvatar(selectedAvatar);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {isDirector ? 'Perfil da Direção' : 'Perfil do Aluno'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt={user.name}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-purple-100 shadow-md shadow-purple-600/15"
            />
            <label
              htmlFor="profile-avatar-upload"
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer transition"
              title="Trocar foto"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              className="hidden"
            />
          </div>

          <h4 className="text-base font-extrabold text-slate-900 mt-3">{user.name}</h4>
          <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-3 py-1 rounded-full mt-1">
            {isDirector ? 'Diretor Geral' : (user.grade || 'Desbravador - Guerreiros Da Serra')}
          </span>
          {user.registrationNumber && (
            <span className="text-[11px] font-mono text-slate-400 mt-0.5">
              Matrícula: {user.registrationNumber}
            </span>
          )}
        </div>

        {/* Info list */}
        <div className="mt-5 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail:</span>
            </span>
            <span className="font-semibold text-slate-800">{user.email}</span>
          </div>

          {!isDirector && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Nascimento:</span>
              </span>
              <span className="font-semibold text-slate-800">{birthDateStr}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Nível de Acesso:</span>
            </span>
            <span className="font-bold text-purple-700">{user.role}</span>
          </div>
        </div>

        {/* Quick avatar selection */}
        {!isDirector && (
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Ou escolha outro avatar:
            </span>
            <div className="flex items-center justify-center gap-2">
              {PRESET_STUDENT_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition ${
                    selectedAvatar === url ? 'border-purple-600 scale-110' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAvatar}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvo!</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
