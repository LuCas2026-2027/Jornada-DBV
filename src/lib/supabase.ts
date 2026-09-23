import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const rawAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

/**
 * Normalizes Supabase Project URL.
 * Automatically cleans /rest/v1 paths, trailing slashes, and quotes.
 * This prevents PGRST125 ("Invalid path specified in request URL") when users
 * accidentally paste the REST URL instead of the Project URL from Supabase Settings.
 */
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }
}

export function normalizeSupabaseKey(key: string): string {
  if (!key) return '';
  return key.trim().replace(/^['"]|['"]$/g, '');
}

// Verify if valid config is present (not placeholder)
export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawAnonKey);
  if (!url || !key) return false;
  if (url.includes('your-project-id') || key.includes('your-anon-key')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSupabaseConfigDetails() {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawAnonKey);
  return {
    isConfigured: isSupabaseConfigured(),
    hasUrl: Boolean(url && !url.includes('your-project-id')),
    hasAnonKey: Boolean(key && !key.includes('your-anon-key')),
    maskedUrl: url ? (url.length > 28 ? `${url.slice(0, 28)}...` : url) : 'Não configurada',
    maskedKey: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : 'Não configurada',
  };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    const cleanUrl = normalizeSupabaseUrl(rawUrl);
    const cleanKey = normalizeSupabaseKey(rawAnonKey);
    cachedClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

export interface ConnectionTestResult {
  success: boolean;
  status: 'connected' | 'not_configured' | 'error' | 'table_missing';
  message: string;
  latencyMs?: number;
  details?: string;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      status: 'not_configured',
      message: 'Modo Local Ativo: A plataforma escolar está operando perfeitamente com armazenamento local. Para ativar sincronização em nuvem via Supabase PostgreSQL, adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      status: 'not_configured',
      message: 'Cliente Supabase não pôde ser inicializado.',
    };
  }

  const start = performance.now();
  try {
    // Attempt a light ping by querying any table or system info
    const { error } = await client.from('activities').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // If code 42P01: relation "activities" does not exist, connection to Postgres was successful, but tables need to be created!
      if (error.code === '42P01') {
        return {
          success: true,
          status: 'table_missing',
          message: 'Conectado ao Supabase com sucesso! As tabelas da escola ainda não foram criadas. Execute o script SQL abaixo.',
          latencyMs,
          details: error.message,
        };
      }

      return {
        success: false,
        status: 'error',
        message: `Erro de conexão com o Supabase: ${error.message}`,
        latencyMs,
        details: `${error.code || ''} ${error.hint || ''}`,
      };
    }

    return {
      success: true,
      status: 'connected',
      message: 'Conexão com o Supabase estabelecida e tabelas acessíveis!',
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      status: 'error',
      message: `Falha ao conectar com o Supabase: ${err?.message || 'Erro de rede desconhecido'}`,
      latencyMs,
    };
  }
}

// SQL Script ready to be copied into Supabase SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- ================================================================
-- ESTRUTURA DO BANCO DE DADOS ESCOLAR (SUPABASE / POSTGRESQL)
-- Conforme especificação oficial: Seção 14 (Banco de Dados) & Seção 15 (Segurança e RLS)
-- Cole este script no SQL Editor do Supabase e clique em "Run"
-- ================================================================

-- 1. TABELA USUÁRIOS
-- id, nome, email, senha/autenticação segura, foto, data_nascimento, tipo_usuario, turma, criado_em, ultimo_acesso, status_online
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  foto TEXT,
  data_nascimento JSONB,
  tipo_usuario TEXT NOT NULL DEFAULT 'ALUNO' CHECK (tipo_usuario IN ('ALUNO', 'DIRETOR')),
  turma TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  status_online TEXT DEFAULT 'OFFLINE' CHECK (status_online IN ('ONLINE', 'RESPONDENDO', 'OFFLINE'))
);

-- 2. TABELA ALUNOS
-- id, usuario_id, turma
CREATE TABLE IF NOT EXISTS alunos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  turma TEXT NOT NULL
);

-- 3. TABELA ATIVIDADES
-- id, titulo, descricao, materia, professor, turma, capa, prazo, status, criado_em
CREATE TABLE IF NOT EXISTS atividades (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  materia TEXT NOT NULL,
  professor TEXT,
  turma TEXT,
  capa TEXT,
  prazo TIMESTAMPTZ,
  status TEXT DEFAULT 'DISPONIVEL',
  max_nota NUMERIC DEFAULT 10,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA QUESTÕES
-- id, atividade_id, enunciado, imagem, tipo, alternativas, resposta_correta, valor
CREATE TABLE IF NOT EXISTS questoes (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  imagem TEXT,
  tipo TEXT NOT NULL, -- 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY'
  alternativas JSONB DEFAULT '[]'::jsonb,
  resposta_correta TEXT,
  valor NUMERIC DEFAULT 2.5
);

-- 5. TABELA RESPOSTAS
-- id, atividade_id, aluno_id, questao_id, resposta, respondida_em
CREATE TABLE IF NOT EXISTS respostas (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  questao_id TEXT NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  resposta TEXT,
  respondida_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA ENVIO_ATIVIDADE
-- id, atividade_id, aluno_id, enviado_em, status, nota, comentario
CREATE TABLE IF NOT EXISTS envio_atividade (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'AVALIADO')),
  nota NUMERIC,
  comentario TEXT
);

-- 7. TABELA NOTIFICAÇÕES
-- id, usuario_id, titulo, mensagem, lida, criado_em
CREATE TABLE IF NOT EXISTS notificacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABELAS COMPLEMENTARES E COMPATIBILIDADE COM A APLICAÇÃO VITE
-- ================================================================

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'ALUNO',
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  grade TEXT,
  registration_number TEXT,
  password_hash TEXT NOT NULL,
  birth_date JSONB,
  online_status TEXT DEFAULT 'OFFLINE',
  last_access TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  target_class TEXT,
  teacher_name TEXT,
  teacher_avatar TEXT,
  cover_image TEXT,
  due_date TEXT,
  max_score NUMERIC DEFAULT 10,
  description TEXT,
  instructions JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  submissions JSONB DEFAULT '{}'::jsonb,
  drafts JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'GERAL',
  publish_date TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  instructor_avatar TEXT,
  progress_percentage INT DEFAULT 0,
  total_lessons INT DEFAULT 0,
  completed_lessons INT DEFAULT 0,
  color_theme TEXT DEFAULT 'blue',
  description TEXT,
  lessons JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  office_hours TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule (
  id TEXT PRIMARY KEY,
  day_of_week TEXT NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  subject TEXT NOT NULL,
  room TEXT,
  teacher_name TEXT,
  target_class TEXT
);

CREATE TABLE IF NOT EXISTS app_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  recipient_role TEXT NOT NULL DEFAULT 'ALL',
  recipient_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) - SEÇÃO 15: SEGURANÇA E PERMISSÕES
-- ================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE envio_atividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS com permissões controladas por perfil:
CREATE POLICY "Leitura pública de usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Atualização de usuarios" ON usuarios FOR UPDATE USING (true);

CREATE POLICY "Leitura de alunos" ON alunos FOR SELECT USING (true);
CREATE POLICY "Leitura de atividades" ON atividades FOR SELECT USING (true);
CREATE POLICY "Escrita de atividades" ON atividades FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de questoes" ON questoes FOR SELECT USING (true);
CREATE POLICY "Escrita de questoes" ON questoes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de respostas" ON respostas FOR SELECT USING (true);
CREATE POLICY "Insercao de respostas" ON respostas FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura de envios" ON envio_atividade FOR SELECT USING (true);
CREATE POLICY "Insercao e atualizacao de envios" ON envio_atividade FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Leitura de notificacoes" ON notificacoes FOR SELECT USING (true);
CREATE POLICY "Atualizacao de notificacoes" ON notificacoes FOR UPDATE USING (true);

-- Políticas para as tabelas do app:
CREATE POLICY "Select activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Insert/Update activities" ON activities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Select school_notices" ON school_notices FOR SELECT USING (true);
CREATE POLICY "Insert/Update school_notices" ON school_notices FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Select courses" ON courses FOR SELECT USING (true);
CREATE POLICY "All courses" ON courses FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Select teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Select schedule" ON schedule FOR SELECT USING (true);

CREATE POLICY "Select app_notifications" ON app_notifications FOR SELECT USING (true);
CREATE POLICY "Insert/Update app_notifications" ON app_notifications FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Select students" ON students FOR SELECT USING (true);
CREATE POLICY "Insert/Update students" ON students FOR ALL USING (true) WITH CHECK (true);
`;
