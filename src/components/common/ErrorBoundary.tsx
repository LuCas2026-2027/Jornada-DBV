import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Portal Escolar] Erro não capturado interceptado pelo ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      // Clear localStorage cache in case corrupted data caused the blank screen
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Falha ao limpar armazenamento:', e);
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  private handleCopyError = () => {
    const details = `Erro: ${this.state.error?.message || 'Desconhecido'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard?.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Ocorreu um erro ao carregar o Portal
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Não se preocupe! Seus dados estão seguros. Esse problema pode ocorrer por cache antigo ou falha momentânea de inicialização.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 font-mono text-xs text-rose-300 break-words max-h-40 overflow-y-auto">
              <p className="font-semibold text-rose-400 mb-1">Mensagem do erro:</p>
              {this.state.error?.message || 'Erro de execução desconhecido'}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-rose-600/80 hover:border-rose-500 active:bg-rose-700 text-white font-medium rounded-xl transition border border-slate-600"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache e Reiniciar
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
              <span>Código de suporte técnico</span>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Detalhes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
