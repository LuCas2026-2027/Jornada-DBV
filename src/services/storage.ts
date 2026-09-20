import { User, Activity, SchoolNotice, Course, Teacher, ScheduleClass, AppNotification } from '../types';
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

const SESSION_KEY = 'escola_current_session';
const STUDENTS_KEY = 'escola_registered_students';
const ACTIVITIES_KEY = 'escola_activities';
const NOTICES_KEY = 'escola_notices';
const COURSES_KEY = 'escola_courses';
const NOTIFICATIONS_KEY = 'escola_notifications';

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
    const storedSession = localStorage.getItem(SESSION_KEY);
    let currentUser: User | null = storedSession ? JSON.parse(storedSession) : null;
    if (currentUser && currentUser.role === 'ALUNO') {
      if (!currentUser.grade || currentUser.grade === '3º Ano - Ensino Médio') {
        currentUser.grade = 'Desbravador - Guerreiros Da Serra';
      }
    }

    const storedStudents = localStorage.getItem(STUDENTS_KEY);
    let students = storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS;
    students = students.map((s: User & { passwordHash?: string }) => ({
      ...s,
      grade: s.grade && s.grade !== '3º Ano - Ensino Médio' ? s.grade : 'Desbravador - Guerreiros Da Serra',
    }));

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
  } catch (e) {
    console.error('Erro ao salvar alunos:', e);
  }
}

// Salva atividades
export function persistActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
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
    const updated = activities.map((act) => {
      if (act.id === activityId) {
        return {
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
      }
      return act;
    });
    persistActivities(updated);
  } catch (e) {
    console.error('Erro ao salvar rascunho da atividade:', e);
  }
}

// Salva avisos
export function persistNotices(notices: SchoolNotice[]): void {
  try {
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
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
export function loginDirector(identifier: string, passwordAttempt: string): { success: boolean; user?: User; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const isMatchUser = cleanId === DEFAULT_DIRECTOR.username.toLowerCase() || cleanId === DEFAULT_DIRECTOR.email.toLowerCase();

  if (!isMatchUser) {
    return { success: false, error: 'Usuário ou e-mail do diretor não encontrado no sistema.' };
  }

  if (passwordAttempt !== DEFAULT_DIRECTOR.passwordHash) {
    return { success: false, error: 'Senha incorreta. Verifique suas credenciais de diretor.' };
  }

  const user: User = {
    id: DEFAULT_DIRECTOR.id,
    role: 'DIRETOR',
    name: DEFAULT_DIRECTOR.name,
    email: DEFAULT_DIRECTOR.email,
    avatar: DEFAULT_DIRECTOR.avatar,
    createdAt: DEFAULT_DIRECTOR.createdAt,
  };

  persistSession(user);
  return { success: true, user };
}

// Autenticação do Aluno
export function loginStudent(emailAttempt: string, passwordAttempt: string): { success: boolean; user?: User; error?: string } {
  const cleanEmail = emailAttempt.trim().toLowerCase();
  const students = getInitialState().students;

  const found = students.find((s) => s.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { success: false, error: 'Nenhum aluno cadastrado com este e-mail. Crie sua conta primeiro.' };
  }

  if (found.passwordHash !== passwordAttempt) {
    return { success: false, error: 'Senha incorreta para este e-mail.' };
  }

  const user: User = {
    id: found.id,
    role: 'ALUNO',
    name: found.name,
    email: found.email,
    avatar: found.avatar,
    birthDate: found.birthDate,
    grade: found.grade || '3º Ano - Ensino Médio',
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

export function validateAndRegisterStudent(data: RegisterStudentData): { success: boolean; user?: User; error?: string } {
  // 1. Campos obrigatórios
  if (!data.name.trim()) return { success: false, error: 'O nome completo é obrigatório.' };
  if (!data.email.trim()) return { success: false, error: 'O e-mail/Gmail é obrigatório.' };
  if (!data.password) return { success: false, error: 'A senha é obrigatória.' };
  if (!data.confirmPassword) return { success: false, error: 'Confirme a sua senha.' };
  if (!data.avatar) return { success: false, error: 'Selecione ou envie uma foto de perfil.' };

  // 2. Validação de Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    return { success: false, error: 'Informe um endereço de e-mail ou Gmail válido.' };
  }

  // 3. Verificação de unicidade de e-mail
  const currentState = getInitialState();
  const alreadyExists = currentState.students.some((s) => s.email.toLowerCase() === data.email.trim().toLowerCase());
  if (alreadyExists || data.email.trim().toLowerCase() === DEFAULT_DIRECTOR.email.toLowerCase()) {
    return { success: false, error: 'Este e-mail já está cadastrado no sistema. Faça login.' };
  }

  // 4. Validação de Senha segura
  if (data.password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres para segurança.' };
  }
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'As senhas não coincidem. Digite novamente.' };
  }

  // 5. Validação de data de nascimento
  const { birthDay, birthMonth, birthYear } = data;
  if (!birthDay || !birthMonth || !birthYear) {
    return { success: false, error: 'Preencha dia, mês e ano de nascimento válidos.' };
  }
  if (birthMonth < 1 || birthMonth > 12) {
    return { success: false, error: 'Mês de nascimento inválido.' };
  }
  const daysInMonth = new Date(birthYear, birthMonth, 0).getDate();
  if (birthDay < 1 || birthDay > daysInMonth) {
    return { success: false, error: `Dia inválido para o mês selecionado (máximo ${daysInMonth} dias).` };
  }
  const currentYear = new Date().getFullYear();
  if (birthYear > currentYear - 4 || birthYear < currentYear - 90) {
    return { success: false, error: 'Ano de nascimento inválido para idade escolar.' };
  }

  // Criação do aluno
  const newStudentId = `stu-${Date.now()}`;
  const randomMatricula = `2026-MED-${Math.floor(100 + Math.random() * 900)}`;

  const newStudentWithPass: User & { passwordHash: string } = {
    id: newStudentId,
    role: 'ALUNO',
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash: data.password,
    avatar: data.avatar,
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

export function updateStudentProfile(data: UpdateStudentProfileData): {
  success: boolean;
  user?: User;
  error?: string;
} {
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
    if (data.currentPasswordForPasswordChange !== student.passwordHash) {
      return { success: false, error: 'A senha atual informada para troca de senha está incorreta.' };
    }
    if (data.newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }
    updatedPass = data.newPassword;
  }

  // 2. Verificação com controle de alteração seguro para Gmail / e-mail
  if (data.newEmail && data.newEmail.trim().toLowerCase() !== student.email.toLowerCase()) {
    const cleanNewEmail = data.newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNewEmail)) {
      return { success: false, error: 'O novo endereço de e-mail informado é inválido.' };
    }

    if (!data.currentPasswordForEmailChange) {
      return {
        success: false,
        error: 'Por motivos de segurança, informe sua senha atual para autorizar a alteração do e-mail.',
      };
    }

    if (data.currentPasswordForEmailChange !== student.passwordHash) {
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

  // 3. Monta aluno atualizado
  const updatedStudent = {
    ...student,
    name: data.name?.trim() || student.name,
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
    role: 'ALUNO',
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
