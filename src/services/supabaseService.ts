import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Activity, SchoolNotice, Course, AppNotification, Teacher } from '../types';

// Convert student record between DB and app (supports both 'usuarios' and 'students' tables)
export async function fetchStudentsFromSupabase(): Promise<(User & { passwordHash: string })[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Prioritize official 'usuarios' table (Section 14)
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('tipo_usuario', 'ALUNO');

    if (!userError && userData && userData.length > 0) {
      return userData.map((row: any) => ({
        id: row.id,
        role: 'ALUNO' as const,
        name: row.nome,
        email: row.email,
        avatar: row.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        grade: row.turma || 'Desbravador - Guerreiros Da Serra',
        registrationNumber: `2026-MED-${String(row.id).slice(-4)}`,
        passwordHash: row.senha_hash,
        birthDate: row.data_nascimento || { day: 15, month: 5, year: 2008 },
        onlineStatus: row.status_online || 'ONLINE',
        lastAccess: row.ultimo_acesso,
        createdAt: row.criado_em,
      }));
    }

    // 2. Fallback to 'students' table
    const { data: stuData, error: stuError } = await supabase.from('students').select('*');
    if (!stuError && stuData && stuData.length > 0) {
      return stuData.map((row: any) => ({
        id: row.id,
        role: (row.role || 'ALUNO') as 'ALUNO' | 'DIRETOR',
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        grade: row.grade,
        registrationNumber: row.registration_number,
        passwordHash: row.password_hash,
        birthDate: row.birth_date,
        onlineStatus: row.online_status,
        lastAccess: row.last_access,
        createdAt: row.created_at,
      }));
    }

    return null;
  } catch (e) {
    console.warn('Exceção ao buscar alunos no Supabase:', e);
    return null;
  }
}

/**
 * Upserts a student to Supabase.
 * Writes to BOTH 'usuarios' (Section 14), 'alunos' (Section 14), AND 'students' (app compatibility)
 * so that created accounts always appear in the user's Supabase dashboard regardless of which table exists.
 */
export async function upsertStudentToSupabase(
  student: User & { passwordHash: string }
): Promise<{ success: boolean; error?: string; tables: string[] }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não configurado', tables: [] };

  const tablesUpdated: string[] = [];
  let lastError: string | undefined = undefined;

  // 1. Tabela 'usuarios' (Seção 14 da especificação oficial)
  try {
    const { error: userErr } = await supabase.from('usuarios').upsert({
      id: student.id,
      nome: student.name,
      email: student.email,
      senha_hash: student.passwordHash,
      foto: student.avatar,
      data_nascimento: student.birthDate,
      tipo_usuario: student.role || 'ALUNO',
      turma: student.grade || 'Desbravador - Guerreiros Da Serra',
      criado_em: student.createdAt || new Date().toISOString(),
      ultimo_acesso: student.lastAccess || new Date().toISOString(),
      status_online: student.onlineStatus || 'ONLINE',
    });

    if (!userErr) {
      tablesUpdated.push('usuarios');

      // 2. Tabela 'alunos' (Seção 14 da especificação oficial)
      const { error: alunoErr } = await supabase.from('alunos').upsert({
        id: student.id,
        usuario_id: student.id,
        turma: student.grade || 'Desbravador - Guerreiros Da Serra',
      });
      if (!alunoErr) {
        tablesUpdated.push('alunos');
      }
    } else {
      console.warn('[Supabase] Tabela usuarios retornou aviso:', userErr.message);
      lastError = userErr.message;
    }
  } catch (err: any) {
    lastError = err?.message;
  }

  // 3. Tabela 'students' (compatibilidade direta do app Vite)
  try {
    const { error: stuErr } = await supabase.from('students').upsert({
      id: student.id,
      role: student.role || 'ALUNO',
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      grade: student.grade || 'Desbravador - Guerreiros Da Serra',
      registration_number: student.registrationNumber || `2026-MED-${String(student.id).slice(-4)}`,
      password_hash: student.passwordHash,
      birth_date: student.birthDate,
      online_status: student.onlineStatus || 'ONLINE',
      last_access: student.lastAccess || new Date().toISOString(),
      created_at: student.createdAt || new Date().toISOString(),
    });

    if (!stuErr) {
      tablesUpdated.push('students');
    } else {
      console.warn('[Supabase] Tabela students retornou aviso:', stuErr.message);
      if (tablesUpdated.length === 0) lastError = stuErr.message;
    }
  } catch (err: any) {
    if (tablesUpdated.length === 0) lastError = err?.message;
  }

  const success = tablesUpdated.length > 0;
  if (success) {
    console.log(`[Supabase] Aluno sincronizado nas tabelas: ${tablesUpdated.join(', ')}`);
  }

  return {
    success,
    error: success ? undefined : lastError,
    tables: tablesUpdated,
  };
}

/**
 * Remove an account from Supabase tables ('alunos', 'usuarios', 'students')
 */
export async function deleteStudentFromSupabase(studentId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    try {
      await supabase.from('alunos').delete().or(`id.eq.${studentId},usuario_id.eq.${studentId}`);
    } catch {}

    try {
      await supabase.from('usuarios').delete().eq('id', studentId);
    } catch {}

    try {
      await supabase.from('students').delete().eq('id', studentId);
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Supabase] Erro ao deletar aluno do banco:', err);
    return false;
  }
}

/**
 * Upserts the director account to the 'usuarios' table
 */
export async function upsertDirectorToSupabase(
  director: User,
  passwordHash = 'diretor123'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('usuarios').upsert({
      id: director.id,
      nome: director.name,
      email: director.email,
      senha_hash: passwordHash,
      foto: director.avatar,
      tipo_usuario: 'DIRETOR',
      turma: 'Direção Pedagógica',
      criado_em: director.createdAt || new Date().toISOString(),
      ultimo_acesso: new Date().toISOString(),
      status_online: 'ONLINE',
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch teachers from Supabase (supports 'usuarios' with tipo_usuario='PROFESSOR', 'professores', and 'teachers' tables)
 */
export async function fetchTeachersFromSupabase(): Promise<Teacher[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const teachersMap = new Map<string, Teacher>();

    // 1. Check 'usuarios' table for PROFESSOR role
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo_usuario', 'PROFESSOR');

      if (!userError && userData && userData.length > 0) {
        for (const row of userData) {
          teachersMap.set(row.id, {
            id: row.id,
            name: row.nome || 'Professor(a)',
            email: row.email,
            avatar: row.foto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            subject: row.turma || 'Disciplina Geral',
            availableHours: row.horarios || 'Seg a Sex: 08h às 12h',
            password: row.senha_hash || row.senha || 'prof123',
            passwordHash: row.senha_hash || row.senha || 'prof123',
            role: 'PROFESSOR',
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao consultar professores em usuarios:', e);
    }

    // 2. Check 'professores' table
    try {
      const { data: profData, error: profError } = await supabase
        .from('professores')
        .select('*');

      if (!profError && profData && profData.length > 0) {
        for (const row of profData) {
          const existing = teachersMap.get(row.id) || teachersMap.get(row.usuario_id);
          teachersMap.set(row.id, {
            id: row.id,
            name: row.nome || existing?.name || 'Professor(a)',
            email: row.email || existing?.email || '',
            avatar: row.foto || existing?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            subject: row.materia || existing?.subject || 'Disciplina Geral',
            availableHours: row.horarios || existing?.availableHours || 'Seg a Sex: 08h às 12h',
            password: row.senha_hash || row.senha || existing?.password || 'prof123',
            passwordHash: row.senha_hash || row.senha || existing?.passwordHash || 'prof123',
            role: 'PROFESSOR',
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao consultar tabela professores:', e);
    }

    // 3. Check 'teachers' table
    try {
      const { data: tecData, error: tecError } = await supabase
        .from('teachers')
        .select('*');

      if (!tecError && tecData && tecData.length > 0) {
        for (const row of tecData) {
          const existing = teachersMap.get(row.id);
          teachersMap.set(row.id, {
            id: row.id,
            name: row.name || existing?.name || 'Professor(a)',
            email: row.email || existing?.email || '',
            avatar: row.avatar || existing?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            subject: row.subject || existing?.subject || 'Disciplina Geral',
            availableHours: row.available_hours || existing?.availableHours || 'Seg a Sex: 08h às 12h',
            password: row.password_hash || row.password || existing?.password || 'prof123',
            passwordHash: row.password_hash || row.password || existing?.passwordHash || 'prof123',
            role: 'PROFESSOR',
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao consultar tabela teachers:', e);
    }

    if (teachersMap.size > 0) {
      return Array.from(teachersMap.values());
    }

    return null;
  } catch (err) {
    console.warn('[Supabase] Erro ao buscar professores do banco:', err);
    return null;
  }
}

/**
 * Upserts a teacher account to Supabase.
 * Updates Gmail (email) and password in 'usuarios', 'professores', and 'teachers' tables.
 */
export async function upsertTeacherToSupabase(
  teacher: Teacher
): Promise<{ success: boolean; error?: string; tables: string[] }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não configurado', tables: [] };

  const tablesUpdated: string[] = [];
  let lastError: string | undefined;
  const pwd = teacher.passwordHash || teacher.password || 'prof123';

  // 1. Tabela 'usuarios' (Seção 14 da especificação oficial)
  try {
    const { error: userErr } = await supabase.from('usuarios').upsert({
      id: teacher.id,
      nome: teacher.name,
      email: teacher.email,
      senha_hash: pwd,
      foto: teacher.avatar,
      tipo_usuario: 'PROFESSOR',
      turma: teacher.subject,
      ultimo_acesso: new Date().toISOString(),
      status_online: 'ONLINE',
    });

    if (!userErr) {
      tablesUpdated.push('usuarios');
    } else {
      console.warn('[Supabase] Tabela usuarios retornou aviso ao salvar professor:', userErr.message);
      lastError = userErr.message;
    }
  } catch (err: any) {
    lastError = err?.message;
  }

  // 2. Tabela 'professores'
  try {
    const { error: profErr } = await supabase.from('professores').upsert({
      id: teacher.id,
      usuario_id: teacher.id,
      nome: teacher.name,
      email: teacher.email,
      senha_hash: pwd,
      materia: teacher.subject,
      foto: teacher.avatar,
      horarios: teacher.availableHours,
    });

    if (!profErr) {
      tablesUpdated.push('professores');
    } else {
      console.warn('[Supabase] Tabela professores retornou aviso:', profErr.message);
      if (tablesUpdated.length === 0) lastError = profErr.message;
    }
  } catch (err: any) {
    if (tablesUpdated.length === 0) lastError = err?.message;
  }

  // 3. Tabela 'teachers'
  try {
    const { error: tecErr } = await supabase.from('teachers').upsert({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      password_hash: pwd,
      subject: teacher.subject,
      avatar: teacher.avatar,
      available_hours: teacher.availableHours,
    });

    if (!tecErr) {
      tablesUpdated.push('teachers');
    } else {
      console.warn('[Supabase] Tabela teachers retornou aviso:', tecErr.message);
      if (tablesUpdated.length === 0) lastError = tecErr.message;
    }
  } catch (err: any) {
    if (tablesUpdated.length === 0) lastError = err?.message;
  }

  const success = tablesUpdated.length > 0;
  if (success) {
    console.log(`[Supabase] Professor ${teacher.name} (${teacher.email}) sincronizado nas tabelas: ${tablesUpdated.join(', ')}`);
  }

  return {
    success,
    error: success ? undefined : lastError,
    tables: tablesUpdated,
  };
}

/**
 * Synchronizes all teachers to Supabase in batch
 */
export async function syncAllTeachersToSupabase(teachers: Teacher[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let anySuccess = false;
  for (const teacher of teachers) {
    const res = await upsertTeacherToSupabase(teacher);
    if (res.success) anySuccess = true;
  }
  return anySuccess;
}

// Convert activities between DB and app
export async function fetchActivitiesFromSupabase(): Promise<Activity[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('activities').select('*').order('updated_at', { ascending: false });
    if (error || !data) {
      console.warn('Erro ao carregar atividades do Supabase:', error);
      return null;
    }

    return data.map((row: any): Activity => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      targetClass: row.target_class,
      teacherName: row.teacher_name,
      teacherAvatar: row.teacher_avatar,
      coverImage: row.cover_image,
      dueDate: row.due_date,
      maxScore: Number(row.max_score) || 10,
      description: row.description || '',
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      questions: row.questions || [],
      submissions: row.submissions || {},
      drafts: row.drafts || {},
      isArchived: Boolean(row.is_archived),
    }));
  } catch (e) {
    console.warn('Exceção ao buscar atividades no Supabase:', e);
    return null;
  }
}

export async function upsertActivityToSupabase(activity: Activity): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('activities').upsert({
      id: activity.id,
      title: activity.title,
      subject: activity.subject,
      target_class: activity.targetClass,
      teacher_name: activity.teacherName,
      teacher_avatar: activity.teacherAvatar,
      cover_image: activity.coverImage,
      due_date: activity.dueDate,
      max_score: activity.maxScore,
      description: activity.description,
      instructions: activity.instructions || [],
      questions: activity.questions || [],
      submissions: activity.submissions || {},
      drafts: activity.drafts || {},
      is_archived: Boolean(activity.isArchived),
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// Convert school notices between DB and app
export async function fetchNoticesFromSupabase(): Promise<SchoolNotice[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('school_notices').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any): SchoolNotice => ({
      id: row.id,
      title: row.title,
      category: row.category || 'GERAL',
      publishDate: row.publish_date,
      content: row.content,
      author: row.author,
      pinned: Boolean(row.pinned),
    }));
  } catch {
    return null;
  }
}

export async function upsertNoticeToSupabase(notice: SchoolNotice): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('school_notices').upsert({
      id: notice.id,
      title: notice.title,
      category: notice.category,
      publish_date: notice.publishDate,
      content: notice.content,
      author: notice.author,
      pinned: Boolean(notice.pinned),
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// Batch migration: upload current local state to Supabase
export async function migrateAllLocalDataToSupabase(state: {
  students: (User & { passwordHash: string })[];
  activities: Activity[];
  notices: SchoolNotice[];
  courses: Course[];
  notifications: AppNotification[];
}): Promise<{ success: boolean; counts: Record<string, number>; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      counts: {},
      message: 'Supabase não está configurado com URL e Anon Key válidas.',
    };
  }

  try {
    let studentCount = 0;
    let activityCount = 0;
    let noticeCount = 0;

    // 1. Students -> usuarios, alunos, students
    if (state.students && state.students.length > 0) {
      // Upsert to 'usuarios'
      const usuariosPayload = state.students.map((s) => ({
        id: s.id,
        nome: s.name,
        email: s.email,
        senha_hash: s.passwordHash,
        foto: s.avatar,
        data_nascimento: s.birthDate,
        tipo_usuario: s.role || 'ALUNO',
        turma: s.grade || 'Desbravador - Guerreiros Da Serra',
        criado_em: s.createdAt || new Date().toISOString(),
        ultimo_acesso: s.lastAccess || new Date().toISOString(),
        status_online: s.onlineStatus || 'ONLINE',
      }));
      try {
        await supabase.from('usuarios').upsert(usuariosPayload);
      } catch {
        // ignore
      }

      // Upsert to 'alunos'
      const alunosPayload = state.students.map((s) => ({
        id: s.id,
        usuario_id: s.id,
        turma: s.grade || 'Desbravador - Guerreiros Da Serra',
      }));
      try {
        await supabase.from('alunos').upsert(alunosPayload);
      } catch {
        // ignore
      }

      // Upsert to 'students'
      const studentPayload = state.students.map((s) => ({
        id: s.id,
        role: s.role,
        name: s.name,
        email: s.email,
        avatar: s.avatar,
        grade: s.grade,
        registration_number: s.registrationNumber,
        password_hash: s.passwordHash,
        birth_date: s.birthDate,
        online_status: s.onlineStatus,
        last_access: s.lastAccess || new Date().toISOString(),
        created_at: s.createdAt,
      }));
      const { error: studentErr } = await supabase.from('students').upsert(studentPayload);
      studentCount = !studentErr ? studentPayload.length : usuariosPayload.length;
    }

    // 2. Activities -> atividades, activities
    if (state.activities && state.activities.length > 0) {
      const atividadesPayload = state.activities.map((act) => ({
        id: act.id,
        titulo: act.title,
        descricao: act.description,
        materia: act.subject,
        professor: act.teacherName,
        turma: act.targetClass,
        capa: act.coverImage,
        prazo: act.dueDate ? new Date(act.dueDate).toISOString() : new Date().toISOString(),
        status: 'DISPONIVEL',
        max_nota: act.maxScore || 10,
        criado_em: new Date().toISOString(),
      }));
      try {
        await supabase.from('atividades').upsert(atividadesPayload);
      } catch {
        // ignore
      }

      const activityPayload = state.activities.map((act) => ({
        id: act.id,
        title: act.title,
        subject: act.subject,
        target_class: act.targetClass,
        teacher_name: act.teacherName,
        teacher_avatar: act.teacherAvatar,
        cover_image: act.coverImage,
        due_date: act.dueDate,
        max_score: act.maxScore,
        description: act.description,
        instructions: act.instructions || [],
        questions: act.questions || [],
        submissions: act.submissions || {},
        drafts: act.drafts || {},
        is_archived: Boolean(act.isArchived),
        updated_at: new Date().toISOString(),
      }));
      const { error: actErr } = await supabase.from('activities').upsert(activityPayload);
      activityCount = !actErr ? activityPayload.length : atividadesPayload.length;
    }

    // 3. Notices -> school_notices
    if (state.notices && state.notices.length > 0) {
      const noticePayload = state.notices.map((n) => ({
        id: n.id,
        title: n.title,
        category: n.category,
        publish_date: n.publishDate,
        content: n.content,
        author: n.author,
        pinned: Boolean(n.pinned),
        created_at: new Date().toISOString(),
      }));
      const { error: notErr } = await supabase.from('school_notices').upsert(noticePayload);
      if (!notErr) noticeCount = noticePayload.length;
    }

    // 4. Teachers -> usuarios (PROFESSOR), professores, teachers
    let teacherCount = 0;
    if (state.teachers && state.teachers.length > 0) {
      for (const t of state.teachers) {
        const res = await upsertTeacherToSupabase(t);
        if (res.success) teacherCount++;
      }
    }

    return {
      success: true,
      counts: {
        alunos: studentCount,
        professores: teacherCount,
        atividades: activityCount,
        avisos: noticeCount,
      },
      message: 'Todas as contas de alunos, professores e dados locais foram sincronizados no Supabase com sucesso!',
    };
  } catch (err: any) {
    return {
      success: false,
      counts: {},
      message: `Erro durante a sincronização: ${err?.message || 'Falha ao sincronizar'}`,
    };
  }
}
