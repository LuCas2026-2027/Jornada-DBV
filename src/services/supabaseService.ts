import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Activity, SchoolNotice, Course, AppNotification } from '../types';

// Convert student record between DB and app
export async function fetchStudentsFromSupabase(): Promise<(User & { passwordHash: string })[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error || !data) {
      console.warn('Erro ao carregar alunos do Supabase:', error);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      role: row.role as 'ALUNO' | 'DIRETOR',
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
  } catch (e) {
    console.warn('Exceção ao buscar alunos no Supabase:', e);
    return null;
  }
}

export async function upsertStudentToSupabase(student: User & { passwordHash: string }): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('students').upsert({
      id: student.id,
      role: student.role,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      grade: student.grade,
      registration_number: student.registrationNumber,
      password_hash: student.passwordHash,
      birth_date: student.birthDate,
      online_status: student.onlineStatus,
      last_access: student.lastAccess || new Date().toISOString(),
      created_at: student.createdAt,
    });
    return !error;
  } catch {
    return false;
  }
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

// Batch migration: upload current local mock state to Supabase
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

    // 1. Students
    if (state.students && state.students.length > 0) {
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
      if (!studentErr) studentCount = studentPayload.length;
    }

    // 2. Activities
    if (state.activities && state.activities.length > 0) {
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
      if (!actErr) activityCount = activityPayload.length;
    }

    // 3. Notices
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

    return {
      success: true,
      counts: {
        alunos: studentCount,
        atividades: activityCount,
        avisos: noticeCount,
      },
      message: 'Dados locais sincronizados com o Supabase com sucesso!',
    };
  } catch (err: any) {
    return {
      success: false,
      counts: {},
      message: `Erro durante a sincronização: ${err?.message || 'Falha ao sincronizar'}`,
    };
  }
}
