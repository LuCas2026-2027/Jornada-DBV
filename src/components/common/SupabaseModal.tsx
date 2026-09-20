import { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfigDetails,
  testSupabaseConnection,
  ConnectionTestResult,
  SUPABASE_SCHEMA_SQL,
} from '../../lib/supabase';
import { migrateAllLocalDataToSupabase } from '../../services/supabaseService';
import { StorageState } from '../../services/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: StorageState;
  onDataRefreshed?: () => void;
}

export function SupabaseModal({ isOpen, onClose, appState, onDataRefreshed }: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'SQL' | 'GUIDE'>('STATUS');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  const config = getSupabaseConfigDetails();

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'error',
        message: err?.message || 'Erro inesperado ao testar conexão.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await migrateAllLocalDataToSupabase(appState);
      if (res.success) {
        setMigrateResult(`Sucesso! Sincronizados: ${res.counts.alunos || 0} alunos, ${res.counts.atividades || 0} atividades, ${res.counts.avisos || 0} comunicados.`);
        if (onDataRefreshed) onDataRefreshed();
      } else {
        setMigrateResult(`Falha: ${res.message}`);
      }
    } catch (err: any) {
      setMigrateResult(`Erro ao sincronizar: ${err?.message || 'Falha na requisição'}`);
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Conexão Supabase</h2>
                {config.isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Configurado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Aguardando Chaves
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Integração com PostgreSQL e autenticação na nuvem Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'STATUS'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Status da Conexão
          </button>
          <button
            onClick={() => setActiveTab('SQL')}
            className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'SQL'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Script SQL (Tabelas)
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'GUIDE'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Como Configurar
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'STATUS' && (
            <div className="space-y-5">
              {/* Credentials overview */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Variáveis de Ambiente Detectadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block mb-1 font-mono">VITE_SUPABASE_URL</span>
                    <div className="flex items-center gap-1.5 font-mono font-medium text-slate-700 truncate">
                      {config.hasUrl ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{config.maskedUrl}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block mb-1 font-mono">VITE_SUPABASE_ANON_KEY</span>
                    <div className="flex items-center gap-1.5 font-mono font-medium text-slate-700 truncate">
                      {config.hasAnonKey ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{config.maskedKey}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Diagnostics Card */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-800">Diagnóstico em Tempo Real</span>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                {testResult ? (
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      testResult.status === 'connected'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : testResult.status === 'table_missing'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : testResult.status === 'not_configured'
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {testResult.status === 'not_configured' ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      ) : testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-1">
                        <p className="font-semibold">{testResult.message}</p>
                        {testResult.latencyMs !== undefined && (
                          <p className="text-[11px] opacity-80 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Latência da resposta: {testResult.latencyMs}ms
                          </p>
                        )}
                        {testResult.details && (
                          <p className="text-[11px] font-mono opacity-80 mt-1">{testResult.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Clique em &quot;Testar Conexão&quot; para verificar o status com o cluster Supabase.
                  </p>
                )}
              </div>

              {/* Data Sync Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Sincronização de Dados</h4>
                    <p className="text-xs text-slate-500">
                      Envie os alunos, atividades e comunicados existentes para o banco Supabase.
                    </p>
                  </div>
                  <button
                    onClick={handleMigrate}
                    disabled={migrating || !config.isConfigured}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                    {migrating ? 'Enviando...' : 'Sincronizar Agora'}
                  </button>
                </div>

                {migrateResult && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg text-xs">
                    {migrateResult}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'SQL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Estrutura de Tabelas (PostgreSQL)</h4>
                  <p className="text-xs text-slate-500">
                    Execute este script no <strong>SQL Editor</strong> do seu painel Supabase.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                <pre>{SUPABASE_SCHEMA_SQL}</pre>
              </div>
            </div>
          )}

          {activeTab === 'GUIDE' && (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  1
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Criar Projeto no Supabase</h5>
                  <p>
                    Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> e crie um novo projeto gratuito.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  2
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Copiar URL e Chave Anon</h5>
                  <p>
                    No Dashboard do Supabase, clique em <strong>Project Settings</strong> &gt; <strong>API</strong>. Copie a <strong>Project URL</strong> e a chave <strong>anon public</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  3
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Configurar no Painel / .env</h5>
                  <p>
                    Defina as variáveis no menu de Secrets/Ambiente ou no arquivo <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">.env</code>:
                  </p>
                  <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg mt-2 font-mono text-[11px]">
                    VITE_SUPABASE_URL=https://seu-projeto.supabase.co{'\n'}
                    VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
                  </pre>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  4
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Executar o Script SQL</h5>
                  <p>
                    Vá na aba &quot;Script SQL&quot; desta janela, copie o código e cole no <strong>SQL Editor</strong> do Supabase para criar as tabelas com suporte a Row Level Security.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>PostgreSQL na nuvem com Supabase</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
