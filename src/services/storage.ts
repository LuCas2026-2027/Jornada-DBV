import { User, Activity, SchoolNotice, Course, Teacher, ScheduleClass, AppNotification, SystemConfig } from '../types';
import {
  DEFAULT_DIRECTOR,
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_ACTIVITIES,
  INITIAL_NOTICES,
  INITIAL_TEACHERS,
  INITIAL_SCHEDULE,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  upsertStudentToSupabase,
  upsertActivityToSupabase,
  upsertNoticeToSupabase,
} from './supabaseService';
import {
  hashPassword,
  verifyPassword,
  cleanPlainText,
  isValidEmail,
} from './security';
export { hashPassword, verifyPassword };

const SESSION_KEY = 'escola_current_session';
const STUDENTS_KEY = 'escola_registered_students';
const ACTIVITIES_KEY = 'escola_activities';
const NOTICES_KEY = 'escola_notices';
const COURSES_KEY = 'escola_courses';
const NOTIFICATIONS_KEY = 'escola_notifications';
export const SYSTEM_CONFIG_KEY = 'escola_system_config';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  isConfigured: false,
  directorEmail: 'diretor@escola.com.br',
  directorPasswordHash: 'diretor123',
  directorName: 'Prof. Roberto Guimarães',
  schoolName: 'Colégio Modelo',
  schoolLogo: '',
  platformName: 'Portal Escolar Inteligente',
  primaryColor: '#7445f8',
};

export function getSystemConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_KEY);
    if (!raw) return DEFAULT_SYSTEM_CONFIG;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

export function saveSystemConfig(config: SystemConfig): void {
  try {
    localStorage.setItem(SYSTEM_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Erro ao salvar config do sistema:', err);
  }
}

export function isFirstTimeSetupNeeded(): boolean {
  try {
    const config = getSystemConfig();
    return !config.isConfigured;
  } catch {
    return false;
  }
}

export interface StorageState {
  currentUser: User | null;
  students: (User & { passwordHash: string })[];
  activities: Activity[];
  notices: SchoolNotice[];
  courses: Course[];
  teachers: Teacher[];
  schedule: ScheduleClass[];
  notifications: AppNotification[];
}

// Inicializa dados no localStorage se vazios
export function getInitialState(): StorageState {
  try {
    const storedStudents = localStorage.getItem(STUDENTS_KEY);
    let students = storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS;
    if (!Array.isArray(students) || students.length === 0) {
      students = INITIAL_STUDENTS;
    }
    students = students.map((s: any) => ({
      ...s,
      passwordHash: s.passwordHash || s.password || 'senha123',
      grade: s.grade && s.grade !== '3º Ano - Ensino Médio' ? s.grade : 'Desbravador - Guerreiros Da Serra',
    }));

    const storedSession = localStorage.getItem(SESSION_KEY);
    let currentUser: User | null = storedSession ? JSON.parse(storedSession) : null;

    // Security check: Validate session integrity and prevent local privilege escalation
    if (currentUser) {
      if (currentUser.role === 'DIRETOR') {
        const sysCfg = getSystemConfig();
        const isLegitDirector =
          currentUser.id === DEFAULT_DIRECTOR.id ||
          currentUser.email?.toLowerCase() === DEFAULT_DIRECTOR.email.toLowerCase() ||
          (sysCfg.directorEmail && currentUser.email?.toLowerCase() === sysCfg.directorEmail.toLowerCase());
        if (!isLegitDirector) {
          console.warn('[Security] Sessão de diretor adulterada detectada. Resetando sessão.');
          currentUser = null;
          localStorage.removeItem(SESSION_KEY);
        }
      } else if (currentUser.role === 'ALUNO') {
        const studentExists = students.some(
          (s: User) => s.id === currentUser?.id || s.email?.toLowerCase() === currentUser?.email?.toLowerCase()
        );
        if (!studentExists) {
          console.warn('[Security] Sessão de aluno não encontrada no cadastro. Resetando sessão.');
          currentUser = null;
          localStorage.removeItem(SESSION_KEY);
        } else {
          const found = students.find(
            (s: User) => s.id === currentUser?.id || s.email?.toLowerCase() === currentUser?.email?.toLowerCase()
          );
          if (found) {
            currentUser = {
              ...currentUser,
              id: found.id,
              name: found.name,
              avatar: found.avatar,
              grade: found.grade || 'Desbravador - Guerreiros Da Serra',
              birthDate: found.birthDate,
            };
          }
        }
      } else {
        currentUser = null;
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const storedActivities = localStorage.getItem(ACTIVITIES_KEY);
    let activities: Activity[] = storedActivities ? JSON.parse(storedActivities) : INITIAL_ACTIVITIES;
    // ensure mock activities have initial pending submissions if freshly loaded
    if (!storedActivities) {
      activities = INITIAL_ACTIVITIES;
    }

    const storedNotices = localStorage.getItem(NOTICES_KEY);
    const notices: SchoolNotice[] = storedNotices ? JSON.parse(storedNotices) : INITIAL_NOTICES;

    const storedCourses = localStorage.getItem(COURSES_KEY);
    const courses: Course[] = storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES;

    const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    const notifications: AppNotification[] = storedNotifications ? JSON.parse(storedNotifications) : INITIAL_NOTIFICATIONS;

    return {
      currentUser,
      students,
      activities,
      notices,
      courses,
      teachers: INITIAL_TEACHERS,
      schedule: INITIAL_SCHEDULE,
      notifications,
    };
  } catch (error) {
    console.error('Falha ao ler dados locais:', error);
    return {
      currentUser: null,
      students: INITIAL_STUDENTS,
      activities: INITIAL_ACTIVITIES,
      notices: INITIAL_NOTICES,
      courses: INITIAL_COURSES,
      teachers: INITIAL_TEACHERS,
      schedule: INITIAL_SCHEDULE,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }
}

// Salva notificações
export function persistNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Erro ao salvar notificações:', e);
  }
}

// Salva sessão ativa
export function persistSession(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.error('Erro ao persistir sessão:', e);
  }
}

// Salva alunos
export function persistStudents(students: (User & { passwordHash: string })[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    // Sincronização em segundo plano com Supabase se configurado
    students.forEach((s) => {
      upsertStudentToSupabase(s).catch(() => {});
    });
  } catch (e) {
    console.error('Erro ao salvar alunos:', e);
  }
}

// Salva atividades
export function persistActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    // Sincronização em segundo plano com Supabase se configurado
    activities.forEach((act) => {
      upsertActivityToSupabase(act).catch(() => {});
    });
  } catch (e) {
    console.error('Erro ao salvar atividades:', e);
  }
}

// Salva rascunho de progresso do aluno automaticamente
export function saveActivityDraft(
  activityId: string,
  studentId: string,
  questionIndex: number,
  answers: Record<string, string>
): void {
  try {
    const storedActivities = localStorage.getItem(ACTIVITIES_KEY);
    const activities: Activity[] = storedActivities ? JSON.parse(storedActivities) : INITIAL_ACTIVITIES;
    let targetAct: Activity | null = null;
    const updated = activities.map((act) => {
      if (act.id === activityId) {
        targetAct = {
          ...act,
          drafts: {
            ...(act.drafts || {}),
            [studentId]: {
              currentQuestionIndex: questionIndex,
              answers,
              lastSavedAt: new Date().toISOString(),
            },
          },
        };
        return targetAct;
      }
      return act;
    });
    persistActivities(updated);
    if (targetAct) {
      upsertActivityToSupabase(targetAct).catch(() => {});
    }
  } catch (e) {
    console.error('Erro ao salvar rascunho da atividade:', e);
  }
}

// Salva avisos
export function persistNotices(notices: SchoolNotice[]): void {
  try {
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
    // Sincronização em segundo plano com Supabase se configurado
    notices.forEach((n) => {
      upsertNoticeToSupabase(n).catch(() => {});
    });
  } catch (e) {
    console.error('Erro ao salvar avisos:', e);
  }
}

// Salva cursos
export function persistCourses(courses: Course[]): void {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  } catch (e) {
    console.error('Erro ao salvar cursos:', e);
  }
}

// Autenticação do Diretor
export async function loginDirector(
  identifier: string,
  passwordAttempt: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanId = cleanPlainText(identifier, 100).toLowerCase().trim();
  const sysConfig = getSystemConfig();

  const isMatchDefault =
    cleanId === DEFAULT_DIRECTOR.username.toLowerCase() ||
    cleanId === DEFAULT_DIRECTOR.email.toLowerCase();

  const isMatchConfigured =
    sysConfig.directorEmail && cleanId === sysConfig.directorEmail.toLowerCase().trim();

  if (!isMatchDefault && !isMatchConfigured) {
    return { success: false, error: 'Usuário ou e-mail do diretor não encontrado no sistema.' };
  }

  let isValid = false;
  if (isMatchConfigured) {
    isValid = await verifyPassword(passwordAttempt, sysConfig.directorPasswordHash);
    if (!isValid && sysConfig.directorPasswordHash === passwordAttempt) {
      isValid = true;
    }
  }

  if (!isValid && isMatchDefault) {
    isValid = await verifyPassword(passwordAttempt, DEFAULT_DIRECTOR.passwordHash);
  }

  if (!isValid) {
    return { success: false, error: 'Senha incorreta. Verifique suas credenciais de diretor.' };
  }

  const directorName = isMatchConfigured && sysConfig.directorName ? sysConfig.directorName : DEFAULT_DIRECTOR.name;
  const directorEmail = isMatchConfigured && sysConfig.directorEmail ? sysConfig.directorEmail : DEFAULT_DIRECTOR.email;

  const user: User = {
    id: DEFAULT_DIRECTOR.id,
    role: 'DIRETOR',
    name: directorName,
    email: directorEmail,
    avatar: sysConfig.schoolLogo || DEFAULT_DIRECTOR.avatar,
    createdAt: sysConfig.configuredAt || DEFAULT_DIRECTOR.createdAt,
  };

  persistSession(user);
  return { success: true, user };
}

// Autenticação do Aluno
export async function loginStudent(
  emailAttempt: string,
  passwordAttempt: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = cleanPlainText(emailAttempt, 150).toLowerCase();
  const currentState = getInitialState();
  const students = currentState.students;

  const foundIndex = students.findIndex((s) => s.email.toLowerCase() === cleanEmail);
  if (foundIndex === -1) {
    return { success: false, error: 'Nenhum aluno cadastrado com este e-mail. Crie sua conta primeiro.' };
  }

  const found = students[foundIndex] as any;
  const hash = found.passwordHash || found.password || 'senha123';
  const isValid = await verifyPassword(passwordAttempt, hash);

  if (!isValid) {
    return { success: false, error: 'Senha incorreta para este e-mail.' };
  }

  // Se a senha estiver em texto puro legada, migra para hash criptográfico de forma transparente
  if (found.passwordHash === passwordAttempt) {
    const upgradedHash = await hashPassword(passwordAttempt);
    const updatedList = [...students];
    updatedList[foundIndex] = { ...found, passwordHash: upgradedHash };
    persistStudents(updatedList);
  }

  const user: User = {
    id: found.id,
    role: 'ALUNO',
    name: found.name,
    email: found.email,
    avatar: found.avatar,
    birthDate: found.birthDate,
    grade: found.grade || 'Desbravador - Guerreiros Da Serra',
    registrationNumber: found.registrationNumber || `2026-MED-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: found.createdAt,
  };

  persistSession(user);
  return { success: true, user };
}

// Validação e Cadastro do Aluno
export interface RegisterStudentData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
}

export async function validateAndRegisterStudent(
  data: RegisterStudentData
): Promise<{ success: boolean; user?: User; error?: string }> {
  const sanitizedName = cleanPlainText(data.name || '', 100).trim();
  const sanitizedEmail = cleanPlainText(data.email || '', 150).toLowerCase().trim();

  // 1. Campos obrigatórios
  if (!sanitizedName) return { success: false, error: 'O nome completo é obrigatório.' };
  if (!sanitizedEmail) return { success: false, error: 'O e-mail/Gmail é obrigatório.' };
  if (!data.password) return { success: false, error: 'A senha é obrigatória.' };
  if (!data.confirmPassword) return { success: false, error: 'Confirme a sua senha.' };

  // Fallback seguro de avatar caso não fornecido
  const avatarToUse = data.avatar && data.avatar.trim() ? data.avatar.trim() : INITIAL_STUDENTS[0].avatar;

  // 2. Validação de Email
  if (!isValidEmail(sanitizedEmail)) {
    return { success: false, error: 'Informe um endereço de e-mail ou Gmail válido (ex: seu.nome@gmail.com).' };
  }

  // 3. Verificação de unicidade de e-mail
  const currentState = getInitialState();
  const existingStudent = currentState.students.find((s) => s.email.toLowerCase() === sanitizedEmail);

  if (existingStudent) {
    // Se o aluno já tem conta com este e-mail e digitou a senha correta, autentica imediatamente
    const hash = (existingStudent as any).passwordHash || (existingStudent as any).password || 'senha123';
    const isPassValid = await verifyPassword(data.password, hash);
    if (isPassValid) {
      const cleanUser: User = {
        id: existingStudent.id,
        role: 'ALUNO',
        name: existingStudent.name,
        email: existingStudent.email,
        avatar: existingStudent.avatar || avatarToUse,
        birthDate: existingStudent.birthDate,
        grade: existingStudent.grade || 'Desbravador - Guerreiros Da Serra',
        registrationNumber: existingStudent.registrationNumber,
        createdAt: existingStudent.createdAt || new Date().toISOString(),
      };
      persistSession(cleanUser);
      return { success: true, user: cleanUser };
    }
    return { success: false, error: 'Este e-mail já está cadastrado no sistema. Faça login para acessar.' };
  }

  if (sanitizedEmail === DEFAULT_DIRECTOR.email.toLowerCase()) {
    return { success: false, error: 'Este e-mail pertence à Direção Escolar. Use a aba de Direção para login.' };
  }

  // 4. Validação de Senha segura
  if (data.password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres para segurança.' };
  }
  if (data.password.length > 128) {
    return { success: false, error: 'A senha excede o limite máximo permitido de 128 caracteres.' };
  }
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'As senhas não coincidem. Digite novamente a confirmação de senha.' };
  }

  // 5. Validação e normalização resiliente de data de nascimento
  const birthYear = Number(data.birthYear) || 2008;
  const birthMonth = Math.max(1, Math.min(12, Number(data.birthMonth) || 5));
  const maxDays = new Date(birthYear, birthMonth, 0).getDate();
  const birthDay = Math.max(1, Math.min(maxDays, Number(data.birthDay) || 15));

  // Criação segura com Hash Criptográfico
  const newStudentId = `stu-${Date.now()}`;
  const randomMatricula = `2026-MED-${Math.floor(100 + Math.random() * 900)}`;
  const passwordHash = await hashPassword(data.password);

  const newStudentWithPass: User & { passwordHash: string } = {
    id: newStudentId,
    role: 'ALUNO',
    name: sanitizedName,
    email: sanitizedEmail,
    passwordHash,
    avatar: avatarToUse,
    birthDate: {
      day: birthDay,
      month: birthMonth,
      year: birthYear,
    },
    grade: 'Desbravador - Guerreiros Da Serra',
    registrationNumber: randomMatricula,
    createdAt: new Date().toISOString(),
  };

  const updatedStudents = [...currentState.students, newStudentWithPass];
  persistStudents(updatedStudents);

  // Sincroniza em segundo plano com Supabase se estiver configurado
  upsertStudentToSupabase(newStudentWithPass).catch(() => {});

  const cleanUser: User = {
    id: newStudentWithPass.id,
    role: 'ALUNO',
    name: newStudentWithPass.name,
    email: newStudentWithPass.email,
    avatar: newStudentWithPass.avatar,
    birthDate: newStudentWithPass.birthDate,
    grade: newStudentWithPass.grade,
    registrationNumber: newStudentWithPass.registrationNumber,
    createdAt: newStudentWithPass.createdAt,
  };

  persistSession(cleanUser);
  return { success: true, user: cleanUser };
}

export interface UpdateStudentProfileData {
  studentId: string;
  name?: string;
  avatar?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  // Alteração de senha
  currentPasswordForPasswordChange?: string;
  newPassword?: string;
  // Alteração segura de e-mail (Gmail)
  newEmail?: string;
  currentPasswordForEmailChange?: string;
}

export async function updateStudentProfile(
  data: UpdateStudentProfileData
): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  const currentState = getInitialState();
  const studentIndex = currentState.students.findIndex((s) => s.id === data.studentId);

  if (studentIndex === -1) {
    return { success: false, error: 'Aluno não encontrado no sistema.' };
  }

  const student = currentState.students[studentIndex];
  let updatedPass = student.passwordHash;
  let updatedEmail = student.email;

  // 1. Verificação segura para troca de senha
  if (data.newPassword && data.newPassword.trim() !== '') {
    if (!data.currentPasswordForPasswordChange) {
      return { success: false, error: 'Para alterar a senha, informe sua senha atual.' };
    }
    const isPassValid = await verifyPassword(
      data.currentPasswordForPasswordChange,
      student.passwordHash
    );
    if (!isPassValid) {
      return { success: false, error: 'A senha atual informada para troca de senha está incorreta.' };
    }
    if (data.newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }
    updatedPass = await hashPassword(data.newPassword);
  }

  // 2. Verificação com controle de alteração seguro para Gmail / e-mail
  if (data.newEmail && data.newEmail.trim().toLowerCase() !== student.email.toLowerCase()) {
    const cleanNewEmail = cleanPlainText(data.newEmail, 150).toLowerCase();
    if (!isValidEmail(cleanNewEmail)) {
      return { success: false, error: 'O novo endereço de e-mail informado é inválido.' };
    }

    if (!data.currentPasswordForEmailChange) {
      return {
        success: false,
        error: 'Por motivos de segurança, informe sua senha atual para autorizar a alteração do e-mail.',
      };
    }

    const isPassValid = await verifyPassword(
      data.currentPasswordForEmailChange,
      student.passwordHash
    );
    if (!isPassValid) {
      return {
        success: false,
        error: 'Senha de segurança incorreta. Não foi possível autorizar a troca do e-mail.',
      };
    }

    const emailTaken = currentState.students.some(
      (s) => s.id !== student.id && s.email.toLowerCase() === cleanNewEmail
    );
    if (emailTaken || cleanNewEmail === DEFAULT_DIRECTOR.email.toLowerCase()) {
      return { success: false, error: 'Este endereço de e-mail já pertence a outra conta cadastrada.' };
    }

    updatedEmail = cleanNewEmail;
  }

  // 3. Monta aluno atualizado com sanitização de campos
  const updatedStudent = {
    ...student,
    name: data.name ? cleanPlainText(data.name, 100) : student.name,
    avatar: data.avatar || student.avatar,
    email: updatedEmail,
    passwordHash: updatedPass,
    birthDate: {
      day: data.birthDay ?? (student.birthDate?.day ?? 15),
      month: data.birthMonth ?? (student.birthDate?.month ?? 5),
      year: data.birthYear ?? (student.birthDate?.year ?? 2008),
    },
  };

  const updatedStudents = [...currentState.students];
  updatedStudents[studentIndex] = updatedStudent;
  persistStudents(updatedStudents);

  const cleanUser: User = {
    id: updatedStudent.id,
    role: updatedStudent.role,
    name: updatedStudent.name,
    email: updatedStudent.email,
    avatar: updatedStudent.avatar,
    birthDate: updatedStudent.birthDate,
    grade: updatedStudent.grade,
    registrationNumber: updatedStudent.registrationNumber,
    createdAt: updatedStudent.createdAt,
  };

  persistSession(cleanUser);
  return { success: true, user: cleanUser };
}

