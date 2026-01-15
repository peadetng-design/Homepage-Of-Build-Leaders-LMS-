
export enum UserRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
  CO_ADMIN = 'CO_ADMIN',
  PARENT = 'PARENT',
  ORGANIZATION = 'ORGANIZATION'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  originalRole?: UserRole;
  allowedRoles?: UserRole[];
  avatarUrl?: string;
  passwordHash?: string; 
  isVerified?: boolean;
  verificationToken?: string;
  lastLogin?: string;
  authProvider?: 'email' | 'google' | 'apple';
  classCode?: string;
  groupName?: string;
  organizationCode?: string;
  mentorId?: string;
  organizationId?: string;
  linkedStudentId?: string;
  createdBy?: string;
  curatedLessonIds?: string[];
  earnedCertificates?: string[];
}

export interface AboutSegment {
  order: number;
  title: string;
  body: string;
}

export interface LeadershipNote {
  id: string;
  title: string;
  body: string;
}

export type ProficiencyLevel = 'student (Beginner)' | 'Mentor, Organization & Parent (Intermediate)' | 'Mentor, Organization & Parent (Advanced)';

export interface Course {
  id: string; // course_id from Sheet 1
  title: string;
  subtitle?: string;
  description: string;
  level: ProficiencyLevel;
  language: string;
  author: string;
  totalModulesRequired: number; 
  about: AboutSegment[]; // From Sheet 2
}

export interface Module {
  id: string; // module_id from Sheet 3
  courseId: string; // must match course_id
  title: string;
  subtitle?: string;
  description: string;
  order: number;
  level?: ProficiencyLevel;
  language?: string;
  lessonIds: string[]; 
  totalLessonsRequired: number; 
  about: AboutSegment[]; // From Sheet 4
  completionRule: {
    minimumCompletionPercentage: number;
  };
  certificateConfig: {
    title: string;
    description: string;
    templateId: string;
    issuedBy: string;
  };
}

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
  referenceText?: string; // bible_reference for Sheet 7
  sourceNoteTitle?: string; // source_note_title for Sheet 8
  text: string;
  options: QuizOption[];
  sequence: number;
}

export interface Lesson {
  id: string; // lesson_id from Sheet 5
  moduleId: string; // Parent module_id
  orderInModule: number;
  title: string;
  subtitle?: string;
  description: string;
  lesson_type: LessonType;
  targetAudience: TargetAudience;
  book?: string; // bible_book
  chapter?: number; // bible_chapter
  leadership_note_title?: string; // Deprecated but kept for compatibility
  leadership_note_body?: string;  // Deprecated but kept for compatibility
  leadershipNotes: LeadershipNote[]; // Updated to support multiple notes
  author: string;
  authorId: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
  views: number;
  about: AboutSegment[]; // From Sheet 6
  bibleQuizzes: QuizQuestion[]; // From Sheet 7
  noteQuizzes: QuizQuestion[]; // From Sheet 8
  sections: LessonSection[]; // Derived for UI rendering
}

export type LessonType = 'Bible' | 'Leadership' | 'Mixed';
export type SectionType = 'note' | 'quiz_group';
export type TargetAudience = 'Student' | 'Mentor' | 'Parent' | 'Organization' | 'Mentors_Org_Parents' | 'All';

export interface LessonSection {
  id: string;
  type: SectionType;
  title: string;
  body?: string;
  quizzes?: QuizQuestion[];
  sequence: number;
}

export interface ImportError {
  sheet: string;
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LessonDraft {
  courseMetadata: Course | null;
  modules: Module[];
  lessons: Lesson[];
  isValid: boolean;
  errors: ImportError[];
}

export interface HomepageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutMission: string;
  aboutHeading: string;
  aboutBody: string;
  knowledgeTitle: string;
  knowledgeDesc: string;
  communityTitle: string;
  communityDesc: string;
  whyBblHeading: string;
  whyBblItem1: string;
  whyBblItem2: string;
  whyBblItem3: string;
  whyBblItem4: string;
  resourcesHeading: string;
  resourcesTitle: string;
  resourcesSubtitle: string;
  feature1Title: string;
  feature1Desc: string;
  feature1Button: string;
  feature2Title: string;
  feature2Desc: string;
  feature2Button: string;
  feature3Title: string;
  feature3Desc: string;
  // Fixed: Removed duplicate feature3Button identifiers
  feature3Button: string;
  newsTagline: string;
  newsHeading: string;
  news1Tag: string;
  news1Date: string;
  news1Title: string;
  news1Content: string;
  news2Tag: string;
  news2Date: string;
  news2Title: string;
  news2Content: string;
  footerTagline: string;
  footerSocials: string;
  footerContactHeading: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  footerQuickInfoHeading: string;
  footerQuickInfoItems: string;
  footerCopyright: string;
  footerPrivacyText: string;
  footerTermsText: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Invite {
  id: string;
  token: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  inviterId: string;
  organizationId?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface JoinRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  scope: 'global' | 'org' | 'class';
  orgId?: string;
  mentorId?: string;
  includeRoles: UserRole[];
  includeStudentsOfMentors?: boolean;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'doc' | 'image' | 'other';
  url: string;
  size: string;
  uploadedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Announcement' | 'Event' | 'Update';
  author: string;
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

export interface CertificateDesign {
  templateId: 'classic' | 'modern' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  titleOverride?: string;
  messageOverride?: string;
  signatureName?: string;
  signatureUrl?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  moduleId: string;
  moduleTitle: string;
  issueDate: string;
  issuerName: string;
  uniqueCode: string;
  design: CertificateDesign;
}