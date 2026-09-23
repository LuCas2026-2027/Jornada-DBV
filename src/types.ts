export type UserRole = 'DIRETOR' | 'ALUNO';

export type StudentOnlineStatus = 'ONLINE' | 'RESPONDENDO' | 'OFFLINE';

export interface StudentActivityProgress {
  activityId: string;
  activityTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  isPrivateWhileAnswering?: boolean;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar: string;
  // Campos específicos do Aluno:
  birthDate?: {
    day: number;
    month: number;
    year: number;
  };
  grade?: string; // ex: "3º Ano - Ensino Médio"
  registrationNumber?: string; // Matrícula escolar
  createdAt: string;
  onlineStatus?: StudentOnlineStatus;
  activeActivityProgress?: StudentActivityProgress;
  lastAccess?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  email: string;
  availableHours: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  instructorName: string;
  instructorAvatar: string;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  colorTheme: string;
  description: string;
  lessons: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    videoUrl?: string;
    summary?: string;
  }[];
  materials: {
    id: string;
    title: string;
    type: 'pdf' | 'link' | 'exercise';
    size?: string;
  }[];
}

export type ActivityStatus = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'ENVIADA' | 'CORRIGIDA';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';

export interface Question {
  id: string;
  statement: string;
  type: QuestionType;
  options?: string[]; // Para Múltipla Escolha
  imageUrl?: string; // Questões com imagem
  correctAnswer?: string; // Para auto-avaliação / gabarito se aplicável
  points?: number; // Valor da questão (ex: 2.5 pts)
}

export interface ActivitySubmission {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  content?: string;
  answers?: Record<string, string>; // questionId -> resposta
  status: 'PENDENTE' | 'AVALIADO';
  grade?: number;
  feedback?: string;
  questionScores?: Record<string, number>;
}

export interface StudentDraft {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  lastSavedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  subject: string;
  targetClass?: string; // Turma à qual a atividade se destina
  teacherName?: string;
  teacherAvatar?: string;
  coverImage?: string;
  dueDate?: string;
  maxScore: number;
  description: string;
  instructions: string[];
  questions?: Question[];
  submissions: Record<string, ActivitySubmission>; // studentId -> submission
  drafts?: Record<string, StudentDraft>; // studentId -> rascunho salvo automaticamente
  isArchived?: boolean; // Permite arquivar atividade
}

export type NotificationType =
  | 'ACTIVITY_NEW'
  | 'ACTIVITY_DUE_SOON'
  | 'ACTIVITY_GRADED'
  | 'TEACHER_COMMENT'
  | 'STUDENT_SUBMITTED'
  | 'SUBMISSION_PENDING'
  | 'STUDENT_COMPLETED'
  | 'NOTICE_NEW';

export interface AppNotification {
  id: string;
  recipientRole: 'DIRETOR' | 'ALUNO' | 'ALL';
  recipientId?: string; // id do aluno ou vazio para todos daquela função
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  activityId?: string;
  noticeId?: string;
  studentId?: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  category: 'URGENTE' | 'EVENTO' | 'ACADEMICO' | 'GERAL';
  publishDate: string;
  content: string;
  author: string;
  pinned?: boolean;
}

export interface ScheduleClass {
  id: string;
  dayOfWeek: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';
  time: string;
  subject: string;
  room: string;
  teacher: string;
}

export interface SystemConfig {
  isConfigured: boolean;
  directorEmail: string;
  directorPasswordHash: string;
  directorName: string;
  schoolName: string;
  schoolLogo: string;
  platformName: string;
  primaryColor: string; // Ex: '#7445f8'
  configuredAt?: string;
}

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}
