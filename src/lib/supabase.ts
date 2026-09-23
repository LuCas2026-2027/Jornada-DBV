import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_LOCAL_URL_KEY = 'escola_supabase_url';
export const SUPABASE_LOCAL_KEY_KEY = 'escola_supabase_anon_key';

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

/**
 * Retrieves Supabase credentials from localStorage first, then falls back to environment variables.
 */
export function getStoredSupabaseCredentials(): { url: string; anonKey: string; isFromStorage: boolean } {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  let localUrl = '';
  let localKey = '';
  try {
    localUrl = localStorage.getItem(SUPABASE_LOCAL_URL_KEY) || '';
    localKey = localStorage.getItem(SUPABASE_LOCAL_KEY_KEY) || '';
  } catch {
    // ignore
  }

  const effectiveUrl = localUrl.trim() || envUrl.trim();
  const effectiveKey = localKey.trim() || envKey.trim();

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    isFromStorage: Boolean(localUrl.trim() || localKey.trim()),
  };
}

let cachedClient: SupabaseClient | null = null;

export function saveStoredSupabaseCredentials(url: string, anonKey: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(SUPABASE_LOCAL_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(SUPABASE_LOCAL_URL_KEY);
    }

    if (anonKey && anonKey.trim()) {
      localStorage.setItem(SUPABASE_LOCAL_KEY_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(SUPABASE_LOCAL_KEY_KEY);
    }

    // Reset client cache so new credentials take effect immediately
    cachedClient = null;
  } catch (err) {
    console.error('Erro ao salvar credenciais do Supabase:', err);
  }
}

export function clearStoredSupabaseCredentials(): void {
  try {
    localStorage.removeItem(SUPABASE_LOCAL_URL_KEY);
    localStorage.removeItem(SUPABASE_LOCAL_KEY_KEY);
    cachedClient = null;
  } catch {
    // ignore
  }
}

// Verify if valid config is present (not placeholder)
export function isSupabaseConfigured(): boolean {
  const { url: rawUrl, anonKey: rawAnonKey } = getStoredSupabaseCredentials();
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
  const { url: rawUrl, anonKey: rawAnonKey, isFromStorage } = getStoredSupabaseCredentials();
  const url = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawAnonKey);
  return {
    isConfigured: isSupabaseConfigured(),
    isFromStorage,
    rawUrl,
    rawKey: key,
    hasUrl: Boolean(url && !url.includes('your-project-id')),
    hasAnonKey: Boolean(key && !key.includes('your-anon-key')),
    maskedUrl: url ? (url.length > 28 ? `${url.slice(0, 28)}...` : url) : 'Não configurada',
    maskedKey: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : 'Não configurada',
  };
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    const { url: rawUrl, anonKey: rawAnonKey } = getStoredSupabaseCredentials();
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
      success: false,
      status: 'not_configured',
      message: 'Supabase não configurado. Insira a URL do Projeto e a Chave Anon pública abaixo para conectar.',
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
    // Attempt a light ping by querying usuarios, students or activities
    const [userRes, actRes] = await Promise.all([
      client.from('usuarios').select('id').limit(1),
      client.from('activities').select('id').limit(1),
    ]);

    const latencyMs = Math.round(performance.now() - start);

    if (userRes.error && actRes.error) {
      // If code 42P01: relation does not exist, connection to Postgres was successful, but tables need to be created!
      if (userRes.error.code === '42P01' || actRes.error.code === '42P01') {
        return {
          success: true,
          status: 'table_missing',
          message: 'Conectado ao Supabase com sucesso! As tabelas da escola ainda não foram criadas. Execute o script SQL no SQL Editor do Supabase.',
          latencyMs,
          details: userRes.error.message,
        };
      }

      return {
        success: false,
        status: 'error',
        message: `Erro de conexão com o Supabase: ${userRes.error.message}`,
        latencyMs,
        details: `${userRes.error.code || ''} ${userRes.error.hint || ''}`,
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
-- ESTRUTURA COMPLETA DO BANCO DE DADOS ESCOLAR (SUPABASE / POSTGRESQL)
-- Conforme especificação oficial: Seção 14 (Banco de Dados) & Seção 15 (Segurança e RLS)
-- Cole este script no SQL Editor do Supabase (https://supabase.com/dashboard) e clique em "RUN"
-- ================================================================

-- 1. TABELA USUÁRIOS (Seção 14)
-- id, nome, email, senha/autenticação segura, foto, data_nascimento, tipo_usuario, turma, criado_em, ultimo_acesso, status_online
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  foto TEXT,
  data_nascimento JSONB,
  tipo_usuario TEXT NOT NULL DEFAULT 'ALUNO' CHECK (tipo_usuario IN ('ALUNO', 'DIRETOR', 'PROFESSOR')),
  turma TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  status_online TEXT DEFAULT 'ONLINE' CHECK (status_online IN ('ONLINE', 'RESPONDENDO', 'OFFLINE'))
);

-- 2. TABELA PROFESSORES (Corpo Docente - Credenciais e Dados)
-- Permite trocar senha e Gmail diretamente pelo painel do Supabase
CREATE TABLE IF NOT EXISTS professores (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  materia TEXT,
  foto TEXT,
  horarios TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA ALUNOS (Seção 14)
-- id, usuario_id, turma
CREATE TABLE IF NOT EXISTS alunos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  turma TEXT NOT NULL
);

-- 3. TABELA ATIVIDADES (Seção 14)
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

-- 4. TABELA QUESTÕES (Seção 14)
CREATE TABLE IF NOT EXISTS questoes (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  imagem TEXT,
  tipo TEXT NOT NULL,
  alternativas JSONB DEFAULT '[]'::jsonb,
  resposta_correta TEXT,
  valor NUMERIC DEFAULT 2.5
);

-- 5. TABELA RESPOSTAS (Seção 14)
CREATE TABLE IF NOT EXISTS respostas (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  questao_id TEXT NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  resposta TEXT,
  respondida_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA ENVIO_ATIVIDADE (Seção 14)
CREATE TABLE IF NOT EXISTS envio_atividade (
  id TEXT PRIMARY KEY,
  atividade_id TEXT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'AVALIADO')),
  nota NUMERIC,
  comentario TEXT
);

-- 7. TABELA NOTIFICAÇÕES (Seção 14)
CREATE TABLE IF NOT EXISTS notificacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABELAS COMPLEMENTARES DE COMPATIBILIDADE COM A APLICAÇÃO
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
  online_status TEXT DEFAULT 'ONLINE',
  last_access TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  subject TEXT,
  avatar TEXT,
  available_hours TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS DE ACESSO (SEÇÃO 15)
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

-- Políticas de Permissão Total para o Portal Escolar (SELECT, INSERT, UPDATE, DELETE):
DROP POLICY IF EXISTS "Acesso total usuarios" ON usuarios;
CREATE POLICY "Acesso total usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total alunos" ON alunos;
CREATE POLICY "Acesso total alunos" ON alunos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total atividades" ON atividades;
CREATE POLICY "Acesso total atividades" ON atividades FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total questoes" ON questoes;
CREATE POLICY "Acesso total questoes" ON questoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total respostas" ON respostas;
CREATE POLICY "Acesso total respostas" ON respostas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total envio_atividade" ON envio_atividade;
CREATE POLICY "Acesso total envio_atividade" ON envio_atividade FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total notificacoes" ON notificacoes;
CREATE POLICY "Acesso total notificacoes" ON notificacoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total students" ON students;
CREATE POLICY "Acesso total students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total activities" ON activities;
CREATE POLICY "Acesso total activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total school_notices" ON school_notices;
CREATE POLICY "Acesso total school_notices" ON school_notices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total courses" ON courses;
CREATE POLICY "Acesso total courses" ON courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total teachers" ON teachers;
CREATE POLICY "Acesso total teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total schedule" ON schedule;
CREATE POLICY "Acesso total schedule" ON schedule FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total app_notifications" ON app_notifications;
CREATE POLICY "Acesso total app_notifications" ON app_notifications FOR ALL USING (true) WITH CHECK (true);

-- Conceder permissões explícitas ao schema public
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
`;

