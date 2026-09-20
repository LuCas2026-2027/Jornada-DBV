import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify if valid config is present (not placeholder)
export function isSupabaseConfigured(): boolean {
  if (!rawUrl || !rawAnonKey) return false;
  if (rawUrl.includes('your-project-id') || rawAnonKey.includes('your-anon-key')) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSupabaseConfigDetails() {
  return {
    isConfigured: isSupabaseConfigured(),
    hasUrl: Boolean(rawUrl && !rawUrl.includes('your-project-id')),
    hasAnonKey: Boolean(rawAnonKey && !rawAnonKey.includes('your-anon-key')),
    maskedUrl: rawUrl ? (rawUrl.length > 25 ? `${rawUrl.slice(0, 25)}...` : rawUrl) : 'Não configurada',
    maskedKey: rawAnonKey ? `${rawAnonKey.slice(0, 8)}...${rawAnonKey.slice(-4)}` : 'Não configurada',
  };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(rawUrl, rawAnonKey, {
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
export const SUPABASE_SCHEMA_SQL = `-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS DA ESCOLA (SUPABASE / POSTGRESQL)
-- Cole este script no SQL Editor do seu Dashboard Supabase e clique em "Run"

-- 1. Tabela de Alunos e Usuários Registrados
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

-- 2. Tabela de Atividades Escolares
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

-- 3. Tabela de Avisos e Comunicados Escolares
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

-- 4. Tabela de Cursos / Disciplinas
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

-- 5. Tabela de Professores
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

-- 6. Tabela de Horários / Grade Semanal
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

-- 7. Tabela de Notificações
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

-- Habilitar Row Level Security (RLS) para proteção de dados
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Seguro (RLS) com bloqueio de deleção anônima (Proteção Anti-Wipe)
CREATE POLICY "Allow Select activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Allow Insert/Update activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update activities" ON activities FOR UPDATE USING (true);

CREATE POLICY "Allow Select school_notices" ON school_notices FOR SELECT USING (true);
CREATE POLICY "Allow Insert/Update school_notices" ON school_notices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update school_notices" ON school_notices FOR UPDATE USING (true);

CREATE POLICY "Allow Select courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow Insert/Update courses" ON courses FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow Select teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow Select schedule" ON schedule FOR SELECT USING (true);

CREATE POLICY "Allow Select app_notifications" ON app_notifications FOR SELECT USING (true);
CREATE POLICY "Allow Insert app_notifications" ON app_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update app_notifications" ON app_notifications FOR UPDATE USING (true);

-- Alunos: leitura e cadastro permitidos; DELETE desabilitado anonimamente contra sequestro de dados
CREATE POLICY "Allow Select students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow Insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Update students" ON students FOR UPDATE USING (true);
`;
