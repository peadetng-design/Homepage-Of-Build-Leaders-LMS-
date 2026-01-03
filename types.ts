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

export interface HomepageContent {
  // Hero
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  
  // Mission / About
  aboutMission: string;
  aboutHeading: string;
  aboutBody: string;
  knowledgeTitle: string;
  knowledgeDesc: string;
  communityTitle: string;
  communityDesc: string;

  // Why BBL
  whyBblHeading: string;
  whyBblItem1: string;
  whyBblItem2: string;
  whyBblItem3: string;
  whyBblItem4: string;

  // Resources / Features
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
  feature3Button: string;

  // News
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

  // Footer
  footerTagline: string;
  footerSocials: string;
  footerContactHeading: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  footerQuickInfoHeading: string;
  footerQuickInfoItems: string; // Comma separated
  footerCopyright: string;
  footerPrivacyText: string;
  footerTermsText: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessonIds: string[]; 
  totalLessonsRequired: number; 
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

export interface CertificateDesign {
  templateId: 'classic' | 'modern' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  titleOverride?: string;
  messageOverride?: string;
  signatureUrl?: string;
  signatureName?: string;
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
  design?: CertificateDesign;
}

export type LessonType = 'Bible' | 'Leadership' | 'Mixed';
export type SectionType = 'note' | 'quiz_group';
export type TargetAudience = 'Student' | 'Mentor' | 'Parent' | 'Organization' | 'Mentors_Org_Parents' | 'All';

export interface QuizOption {
  id: string;
  label: string; 
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  type: 'Bible Quiz' | 'Note Quiz';
  reference?: string;
  text: string;
  options: QuizOption[];
  sequence: number;
}

export interface LessonSection {
  id: string;
  type: SectionType;
  title: string;
  body?: string;
  quizzes?: QuizQuestion[];
  sequence: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  orderInModule: number;
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
  moduleMetadata: Module | null;
  lessons: {
    metadata: {
      lesson_id: string;
      module_id: string;
      title: string;
      description: string;
      book: string;
      chapter: number;
      lesson_order: number;
      lesson_type: LessonType;
      targetAudience: TargetAudience;
    };
    leadershipNote: { 
      title: string; 
      body: string; 
    };
    bibleQuizzes: any[]; 
    noteQuizzes: any[]; 
  }[];
  isValid: boolean;
  errors: string[];
}

export interface JoinRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  scope: 'global' | 'org' | 'class';
  orgId?: string;
  mentorId?: string;
  includeRoles: UserRole[];
  includeStudentsOfMentors?: boolean;
  createdAt: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  data: string;
  size: number;
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

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'doc' | 'image' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Announcement' | 'Event' | 'Update';
  author: string;
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
  inviterId?: string;
  organizationId?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}