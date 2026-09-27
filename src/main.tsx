import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err) {
    console.error('[Portal Escolar] Falha crítica ao inicializar React:', err);
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; text-align: center;">
        <div style="max-width: 480px; background: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <h2 style="color: #e11d48; margin: 0 0 10px 0; font-size: 1.25rem; font-weight: 700;">Falha de Inicialização</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">Ocorreu um erro ao carregar os componentes do sistema.</p>
          <pre style="text-align: left; background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; color: #ef4444;">${String(err)}</pre>
          <button onclick="window.location.reload();" style="margin-top: 16px; padding: 10px 20px; background: #7445f8; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
}
