
export enum UserRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
  PARENT = 'PARENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  // Simulated backend fields
  passwordHash?: string; 
  isVerified?: boolean;
  verificationToken?: string;
  lastLogin?: string;
  authProvider?: 'email' | 'google' | 'apple';
  
  // Mentor/Student specific
  classCode?: string; // For Mentors (unique 6-char code)
  mentorId?: string; // For Students (id of the mentor they joined)
  
  // Parent specific
  linkedStudentId?: string;
}

export interface JoinRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  author: string;
  createdAt: string;
  status: 'draft' | 'published';
  views: number;
}

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
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}