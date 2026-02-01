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
  customModuleOrder?: Record<string, string[]>; // Map of courseId to ordered moduleId array
}

export interface SyncLogEntry {
    id: string;
    timestamp: string;
    action: string;
    status: 'SUCCESS' | 'QUEUED' | 'FAILED';
    payloadType: string;
}

export interface LessonSessionState {
    lastScrollPosition: number;
    activeToolTab: string;
    isPaused: boolean;
    timestamp: string;
    deviceType: string;
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
  authorId?: string; 
  organizationId?: string; 
  totalModulesRequired: number; 
  about: AboutSegment[]; 
}

export interface Module {
  id: string; 
  courseId: string; 
  title: string;
  subtitle?: string;
  description: string;
  order: number;
  level?: ProficiencyLevel;
  language?: string;
  lessonIds: string[]; 
  totalLessonsRequired: number; 
  about: AboutSegment[]; 
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
  label: string; 
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  type: 'Bible Quiz' | 'Note Quiz';
  referenceText?: string; 
  sourceNoteTitle?: string; 
  text: string;
  options: QuizOption[];
  sequence: number;
}

export interface LessonHighlight {
  id: string;
  lessonId: string;
  moduleId?: string;
  courseId?: string;
  text: string;
  note?: string;
  color: string;
  category: 'Critical' | 'Exam Tip' | 'Unclear' | 'Theology' | 'General';
  isPublic: boolean;
  isInstructorCurated?: boolean;
  timestamp: string;
  authorId: string;
  authorName: string;
}

export interface LessonAnnotation {
  id: string;
  lessonId: string;
  moduleId?: string;
  courseId?: string;
  anchoredText?: string; // If empty, it's a free-floating annotation
  body: string; // Rich text / markdown supported
  type: 'Comment' | 'Question' | 'Reflection';
  tags: string[];
  color: string;
  status: 'Needs Response' | 'Resolved' | 'General';
  isPublic: boolean;
  timestamp: string;
  authorId: string;
  authorName: string;
}

export interface LessonBookmark {
  id: string;
  userId: string;
  lessonId: string;
  moduleId?: string;
  courseId?: string;
  title: string;
  textSnippet?: string;
  scrollPosition: number;
  tags: string[];
  color: string;
  note: string;
  timestamp: string;
  type: 'Text' | 'Position';
  annotationId?: string;
  highlightId?: string;
}

export interface Lesson {
  id: string; 
  moduleId: string; 
  orderInModule: number;
  title: string;
  subtitle?: string;
  description: string;
  lesson_type: LessonType;
  targetAudience: TargetAudience;
  book?: string; 
  chapter?: number; 
  leadershipNotes: LeadershipNote[]; 
  author: string;
  authorId: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
  views: number;
  about: AboutSegment[]; 
  bibleQuizzes: QuizQuestion[]; 
  noteQuizzes: QuizQuestion[]; 
  sections: LessonSection[]; 
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
  fileType: 'pdf' | 'doc' | 'image' | 'video' | 'link' | 'other';
  url: string;
  size: string;
  uploadedAt: string;
  targetLessonId?: string; // Link resource specifically to a lesson
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

export interface HomepageContent {
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  stats1Val: string;
  stats1Label: string;
  stats2Val: string;
  stats2Label: string;
  stats3Val: string;
  stats3Label: string;
  ctaHeading: string;
  ctaSubheading: string;
  ctaButton: string;
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
