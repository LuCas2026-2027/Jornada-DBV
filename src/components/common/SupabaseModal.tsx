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
  Key,
  Globe,
  Trash2,
  Users,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfigDetails,
  testSupabaseConnection,
  ConnectionTestResult,
  SUPABASE_SCHEMA_SQL,
  getStoredSupabaseCredentials,
  saveStoredSupabaseCredentials,
  clearStoredSupabaseCredentials,
} from '../../lib/supabase';
import { migrateAllLocalDataToSupabase, upsertStudentToSupabase } from '../../services/supabaseService';
import { StorageState } from '../../services/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: StorageState;
  onDataRefreshed?: () => void;
}

export function SupabaseModal({ isOpen, onClose, appState, onDataRefreshed }: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'STATUS' | 'ACCOUNTS' | 'SQL' | 'GUIDE'>('CONFIG');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form inputs for credentials
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  const config = getSupabaseConfigDetails();

  useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setUrlInput(creds.url);
      setKeyInput(creds.anonKey);
      handleTestConnection();
    }
  }, [isOpen]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback('');
    saveStoredSupabaseCredentials(urlInput.trim(), keyInput.trim());
    setSaveFeedback('Credenciais salvas com sucesso! Testando conexão...');
    await handleTestConnection();
    setTimeout(() => setSaveFeedback(''), 3500);
  };

  const handleClearCredentials = () => {
    if (window.confirm('Deseja realmente remover as credenciais salvas no navegador?')) {
      clearStoredSupabaseCredentials();
      setUrlInput('');
      setKeyInput('');
      setTestResult(null);
      setSaveFeedback('Credenciais removidas. O sistema voltará a utilizar o armazenamento local.');
      setTimeout(() => setSaveFeedback(''), 3000);
    }
  };

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
      setMigrateResult({
        success: res.success,
        message: res.success
          ? `Sucesso! Sincronizados: ${res.counts.alunos || 0} alunos, ${res.counts.atividades || 0} atividades, ${res.counts.avisos || 0} comunicados.`
          : `Falha: ${res.message}`,
      });
      if (res.success && onDataRefreshed) {
        onDataRefreshed();
      }
    } catch (err: any) {
      setMigrateResult({
        success: false,
        message: `Erro ao sincronizar: ${err?.message || 'Falha na requisição'}`,
      });
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Conexão & Sincronização Supabase</h2>
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
                Sincronize contas de alunos, notas e atividades com o PostgreSQL na nuvem
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
        <div className="flex border-b border-slate-100 px-6 gap-2 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'CONFIG'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key className="w-4 h-4" />
            Configurar Chaves
          </button>
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'STATUS'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Status & Sincronização
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'ACCOUNTS'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Contas Cadastradas ({appState.students?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('SQL')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
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
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'GUIDE'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Instruções
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: CONFIG */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
                <p className="font-semibold text-sm text-emerald-950 mb-1">
                  💡 Como conectar com seu banco de dados Supabase:
                </p>
                <p>
                  Insira abaixo a <strong>URL do Projeto</strong> e a <strong>Chave Anon pública</strong> do seu painel Supabase (em <em>Project Settings &gt; API</em>). Ao salvar, todas as novas contas criadas serão sincronizadas automaticamente com as tabelas <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">usuarios</code> e <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">alunos</code>.
                </p>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://seu-projeto-id.supabase.co"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Encontrado no Supabase Dashboard em <strong>Project Settings &gt; API &gt; Project URL</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Chave pública anon (<strong>Project API keys &gt; anon public</strong>). Não use a chave secret/service_role no navegador.
                  </p>
                </div>

                {saveFeedback && (
                  <div className="p-3 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveFeedback}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar e Conectar
                  </button>

                  {config.isFromStorage && (
                    <button
                      type="button"
                      onClick={handleClearCredentials}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpar Credenciais
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: STATUS */}
          {activeTab === 'STATUS' && (
            <div className="space-y-5">
              {/* Credentials overview */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Configuração Vigente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block mb-1 font-mono">URL DO PROJETO</span>
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
                    <span className="text-slate-400 block mb-1 font-mono">CHAVE ANON</span>
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
                    <span className="text-sm font-semibold text-slate-800">Diagnóstico da Conexão</span>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Testando...' : 'Testar Novamente'}
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
                        <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      ) : testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-1">
                        <p className="font-semibold">{testResult.message}</p>
                        {testResult.latencyMs !== undefined && (
                          <p className="text-[11px] opacity-80 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Latência: {testResult.latencyMs}ms
                          </p>
                        )}
                        {testResult.status === 'table_missing' && (
                          <div className="pt-2">
                            <button
                              onClick={() => setActiveTab('SQL')}
                              className="inline-flex items-center gap-1 font-bold text-blue-700 underline text-xs cursor-pointer"
                            >
                              Copiar Script SQL para criar as tabelas agora <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Clique em &quot;Testar Novamente&quot; para verificar o status com o cluster Supabase.
                  </p>
                )}
              </div>

              {/* Data Sync Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Sincronização Completa de Dados</h4>
                    <p className="text-xs text-slate-500">
                      Envia todas as contas de alunos e atividades cadastradas para o Supabase agora.
                    </p>
                  </div>
                  <button
                    onClick={handleMigrate}
                    disabled={migrating || !config.isConfigured}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                    {migrating ? 'Sincronizando...' : 'Sincronizar Todas as Contas Agora'}
                  </button>
                </div>

                {migrateResult && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      migrateResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {migrateResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS */}
          {activeTab === 'ACCOUNTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Contas Registradas no Sistema</h4>
                  <p className="text-xs text-slate-500">
                    Todas as contas criadas pelos alunos aparecem aqui e podem ser sincronizadas com 1 clique.
                  </p>
                </div>
                <button
                  onClick={handleMigrate}
                  disabled={migrating || !config.isConfigured}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                  {migrating ? 'Sincronizando...' : 'Sincronizar Todas'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Aluno</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Turma</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appState.students && appState.students.length > 0 ? (
                      appState.students.map((stu) => (
                        <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={stu.avatar}
                                alt={stu.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                              <span className="font-semibold text-slate-800">{stu.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-mono">{stu.email}</td>
                          <td className="p-3 text-slate-600">{stu.grade || 'Guerreiros Da Serra'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={async () => {
                                const res = await upsertStudentToSupabase(stu);
                                if (res.success) {
                                  alert(`Aluno ${stu.name} sincronizado com sucesso no Supabase!`);
                                } else {
                                  alert(`Falha ao sincronizar: ${res.error || 'Verifique as credenciais e tabelas'}`);
                                }
                              }}
                              disabled={!config.isConfigured}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Enviar ao Supabase
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          Nenhum aluno cadastrado no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SQL */}
          {activeTab === 'SQL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Script SQL das Tabelas da Escola</h4>
                  <p className="text-xs text-slate-500">
                    Cria as tabelas oficiais <code className="font-bold font-mono">usuarios</code>, <code className="font-bold font-mono">alunos</code> e <code className="font-bold font-mono">atividades</code> no Supabase.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado com Sucesso!' : 'Copiar Script SQL'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                <pre>{SUPABASE_SCHEMA_SQL}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: GUIDE */}
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
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Executar o Script SQL</h5>
                  <p>
                    No Dashboard do Supabase, clique em <strong>SQL Editor</strong> no menu lateral esquerdo, clique em <strong>New Query</strong>, cole o conteúdo da aba <strong>Script SQL</strong> deste modal e clique no botão verde <strong>RUN</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  3
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Copiar URL e Chave Anon</h5>
                  <p>
                    No menu <strong>Project Settings &gt; API</strong>, copie a <strong>Project URL</strong> e a <strong>anon public key</strong>, e cole-as na aba <strong>Configurar Chaves</strong> desta janela.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold shrink-0 text-xs">
                  4
                </span>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm mb-0.5">Sincronizar Contas Existentes</h5>
                  <p>
                    Após conectar, clique em <strong>&quot;Sincronizar Todas as Contas Agora&quot;</strong> na aba Status ou Contas. Todas as contas criadas anteriormente serão migradas para a nuvem em instantes!
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
            <span>Banco de Dados PostgreSQL em Nuvem</span>
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

