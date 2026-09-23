import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      id="toast-notification-region"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const duration = toast.duration ?? 4500;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'SUCCESS':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          bg: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
          accent: 'bg-emerald-500',
        };
      case 'ERROR':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          bg: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
          accent: 'bg-rose-500',
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          bg: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
          accent: 'bg-amber-500',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-purple-600 shrink-0" />,
          bg: 'bg-white border-purple-200 text-slate-800 shadow-purple-500/10',
          accent: 'bg-purple-600',
        };
    }
  };

  const style = getStyle();

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden ${style.bg}`}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 transition p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress line */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${style.accent} animate-[progress_linear_forwards]`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
