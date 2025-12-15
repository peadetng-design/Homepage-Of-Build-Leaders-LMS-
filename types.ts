
export enum UserRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
  ORGANIZATION = 'ORGANIZATION'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  originalRole?: UserRole; // Tracks the true role when using "View As"
  allowedRoles?: UserRole[]; // List of roles the user is authorized to switch between
  avatarUrl?: string;
  passwordHash?: string; 
  isVerified?: boolean;
  verificationToken?: string;
  lastLogin?: string;
  authProvider?: 'email' | 'google' | 'apple';
  classCode?: string; // For Mentors
  groupName?: string; // Name of the group created by the mentor
  organizationCode?: string; // For Organizations
  mentorId?: string; // For Students
  organizationId?: string; // For Mentors and Students
  linkedStudentId?: string; // For Parents
  createdBy?: string; // ID of the user who invited/created this user
}

export interface JoinRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

// --- LMS DATA MODEL ---

export type LessonType = 'Bible' | 'Leadership' | 'Mixed';
export type SectionType = 'note' | 'quiz_group';

// Exact options requested
export type TargetAudience = 
  'Student' | 
  'Mentor' | 
  'Parent' | 
  'Organization' | 
  'Mentors_Org_Parents' | 
  'All';

export interface QuizOption {
  id: string;
  label: string; // A, B, C, D
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  type: 'Bible Quiz' | 'Note Quiz';
  reference?: string; // e.g., "Genesis 1:1"
  text: string;
  options: QuizOption[];
  sequence: number;
}

export interface LessonSection {
  id: string;
  type: SectionType;
  title: string; // Heading
  body?: string; // For notes
  quizzes?: QuizQuestion[]; // For quiz groups
  sequence: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category?: string;
  lesson_type: LessonType;
  targetAudience: TargetAudience;
  book?: string;
  chapter?: number;
  author: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
  views: number;
  sections: LessonSection[];
}

export interface StudentAttempt {
  id: string;
  studentId: string;
  lessonId: string;
  quizId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  score: number;
  attempted_at: string;
}

export interface LessonDraft {
  metadata: Partial<Lesson>;
  bibleQuizzes: any[]; // Raw import data
  noteQuizzes: any[];  // Raw import data
  leadershipNote: { title: string; body: string };
  isValid: boolean;
  errors: string[];
}

// --- END LMS DATA MODEL ---

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  isLoading: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
  roles?: UserRole[];
}

export interface DashboardCardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId?: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Invite {
  id: string;
  token: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  inviterId?: string; // ID of the user who created the invite
  organizationId?: string; // If invited by Org Admin
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}
