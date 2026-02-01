import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType, Resource, NewsItem, TargetAudience, Module, Certificate, CertificateDesign, HomepageContent, Course, AboutSegment, ImportError, LeadershipNote, ProficiencyLevel, LessonHighlight, LessonAnnotation, LessonSessionState, LessonBookmark, SyncLogEntry } from '../types';
import { authService } from './authService';
import * as XLSX from 'xlsx';

const DB_COURSES_KEY = 'bbl_db_courses';
const DB_MODULES_KEY = 'bbl_db_modules';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_ATTEMPTS_KEY = 'bbl_db_attempts';
const DB_RESOURCES_KEY = 'bbl_db_resources';
const DB_NEWS_KEY = 'bbl_db_news';
const DB_TIMERS_KEY = 'bbl_db_timers';
const DB_CERTIFICATES_KEY = 'bbl_db_certificates';
const DB_HOMEPAGE_KEY = 'bbl_db_homepage';
const DB_NOTES_KEY = 'bbl_db_user_notes';
const DB_HIGHLIGHTS_KEY = 'bbl_db_user_highlights';
const DB_ANNOTATIONS_KEY = 'bbl_db_user_annotations';
const DB_BOOKMARKS_KEY = 'bbl_db_user_bookmarks';
const DB_SESSION_STATE_KEY = 'bbl_db_lesson_session_states';
const DB_DOWNLOADS_LOG_KEY = 'bbl_db_downloads_log';
const DB_SYNC_LOG_KEY = 'bbl_db_sync_log';
const DB_DEFERRED_SYNC_QUEUE_KEY = 'bbl_db_deferred_sync_queue';

const DEFAULT_HOMEPAGE: HomepageContent = {
  heroTagline: "The #1 Bible Quiz Platform",
  heroTitle: "Build Biblical Leaders",
  heroSubtitle: "Empowering the next generation through interactive study, community competition, and spiritual growth.",
  
  stats1Val: "24",
  stats1Label: "Active Groups",
  stats2Val: "24",
  stats2Label: "Dedicated Mentors",
  stats3Val: "210",
  stats3Label: "Engaged Students",

  ctaHeading: "Start your Leadership Group",
  ctaSubheading: "Join the movement of discipleship today.",
  ctaButton: "Register Group Now",

  aboutMission: "Our Mission",
  aboutHeading: "Raising Up the Next Generation",
  aboutBody: "Build Biblical Leaders is more than just a quiz platform. It is a comprehensive discipleship ecosystem designed to immerse students in the Word of God. We believe that hiding God's word in young hearts creates a foundation for lifelong leadership.",
  
  knowledgeTitle: "Knowledge",
  knowledgeDesc: "Deep biblical literacy & understanding",
  communityTitle: "Community",
  communityDesc: "Faith-based connection & growth",
  
  whyBblHeading: "Why BBL?",
  whyBblItem1: "Structured memorization plans",
  whyBblItem2: "Real-time competition & leaderboards",
  whyBblItem3: "Role-based tools for Mentors & Parents",
  whyBblItem4: "District & Regional tournament support",
  
  resourcesHeading: "Study Materials",
  resourcesTitle: "Equipping the Saints",
  resourcesSubtitle: "Everything you need to succeed in your quizzing journey, from printable flashcards to AI-generated practice tests.",
  
  feature1Title: "Study Guides",
  feature1Desc: "Comprehensive chapter-by-chapter breakdowns and commentaries.",
  feature1Button: "Access Now",
  feature2Title: "Flashcards",
  feature2Desc: "Digital and printable sets optimized for spaced repetition.",
  feature2Button: "Access Now",
  feature3Title: "Quiz Generator",
  feature3Desc: "AI-powered custom quizzes to target your weak areas.",
  feature3Button: "Access Now",
  
  newsTagline: "Latest Updates",
  newsHeading: "News & Announcements",
  news1Tag: "Tournament",
  news1Date: "Oct 15, 2023",
  news1Title: "Fall District Finals Registration Open",
  news1Content: "Team registration for the upcoming district finals at First Baptist Church is now live. Ensure all student rosters are updated by Sept 30th.",
  news2Tag: "New Feature",
  news2Date: "Sep 28, 2023",
  news2Title: "AI-Powered Study Buddy Launched",
  news2Content: "We've integrated Gemini AI to generate infinite practice questions tailored to your specific study material. Try it out in the Student Dashboard!",
  
  footerTagline: "Empowering the next generation of faith-filled leaders through the rigorous study of the Word of God.",
  footerSocials: "Facebook, Twitter, Instagram",
  footerContactHeading: "Contact Us",
  footerEmail: "contact@buildbiblicalleaders.com",
  footerPhone: "+1 (555) 123-4567",
  footerAddress: "123 Faith Lane, Grace City, GC 77777",
  footerQuickInfoHeading: "Quick Info",
  footerQuickInfoItems: "Tournament Schedule, Discipleship Resources, Mentor Guidelines, Safety Policy",
  footerCopyright: "© 2024 Build Biblical Leaders. All rights reserved.",
  footerPrivacyText: "Privacy Policy",
  footerTermsText: "Terms of Service"
};

class LessonService {
  private courses: Course[] = [];
  private modules: Module[] = [];
  private lessons: Lesson[] = [];
  private attempts: StudentAttempt[] = [];
  private resources: Resource[] = [];
  private news: NewsItem[] = [];
  private timers: Record<string, number> = {}; 
  private certificates: Certificate[] = [];
  private userNotes: Record<string, string> = {}; 
  private highlights: Record<string, LessonHighlight[]> = {};
  private annotations: Record<string, LessonAnnotation[]> = {};
  private bookmarks: Record<string, LessonBookmark[]> = {};
  private sessionStates: Record<string, LessonSessionState> = {};
  private downloadsLog: any[] = [];
  private syncLog: SyncLogEntry[] = [];
  private deferredSyncQueue: any[] = [];
  private homepage: HomepageContent = DEFAULT_HOMEPAGE;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.processDeferredSyncQueue());
    }
  }

  private init() {
    const storedCourses = localStorage.getItem(DB_COURSES_KEY);
    if (storedCourses) this.courses = JSON.parse(storedCourses);

    const storedModules = localStorage.getItem(DB_MODULES_KEY);
    if (storedModules) this.modules = JSON.parse(storedModules);

    const storedLessons = localStorage.getItem(DB_LESSONS_KEY);
    if (storedLessons) this.lessons = JSON.parse(storedLessons);

    const storedAttempts = localStorage.getItem(DB_ATTEMPTS_KEY);
    if (storedAttempts) this.attempts = JSON.parse(storedAttempts);

    const storedResources = localStorage.getItem(DB_RESOURCES_KEY);
    if (storedResources) this.resources = JSON.parse(storedResources);

    const storedNews = localStorage.getItem(DB_NEWS_KEY);
    if (storedNews) this.news = JSON.parse(storedNews);

    const storedTimers = localStorage.getItem(DB_TIMERS_KEY);
    if (storedTimers) this.timers = JSON.parse(storedTimers);

    const storedCerts = localStorage.getItem(DB_CERTIFICATES_KEY);
    if (storedCerts) this.certificates = JSON.parse(storedCerts);

    const storedNotes = localStorage.getItem(DB_NOTES_KEY);
    if (storedNotes) this.userNotes = JSON.parse(storedNotes);

    const storedHighlights = localStorage.getItem(DB_HIGHLIGHTS_KEY);
    if (storedHighlights) this.highlights = JSON.parse(storedHighlights);

    const storedAnnotations = localStorage.getItem(DB_ANNOTATIONS_KEY);
    if (storedAnnotations) this.annotations = JSON.parse(storedAnnotations);

    const storedBookmarks = localStorage.getItem(DB_BOOKMARKS_KEY);
    if (storedBookmarks) this.bookmarks = JSON.parse(storedBookmarks);

    const storedSessions = localStorage.getItem(DB_SESSION_STATE_KEY);
    if (storedSessions) this.sessionStates = JSON.parse(storedSessions);

    const storedDownloads = localStorage.getItem(DB_DOWNLOADS_LOG_KEY);
    if (storedDownloads) this.downloadsLog = JSON.parse(storedDownloads);

    const storedSyncLog = localStorage.getItem(DB_SYNC_LOG_KEY);
    if (storedSyncLog) this.syncLog = JSON.parse(storedSyncLog);

    const storedDeferred = localStorage.getItem(DB_DEFERRED_SYNC_QUEUE_KEY);
    if (storedDeferred) this.deferredSyncQueue = JSON.parse(storedDeferred);

    const storedHomepage = localStorage.getItem(DB_HOMEPAGE_KEY);
    if (storedHomepage) {
      this.homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(storedHomepage) };
    }
  }

  private forceSync() {
    this.init();
  }

  private persistCourses() { localStorage.setItem(DB_COURSES_KEY, JSON.stringify(this.courses)); }
  private persistModules() { localStorage.setItem(DB_MODULES_KEY, JSON.stringify(this.modules)); }
  private persistLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private persistAttempts() { localStorage.setItem(DB_ATTEMPTS_KEY, JSON.stringify(this.attempts)); }
  private persistResources() { localStorage.setItem(DB_RESOURCES_KEY, JSON.stringify(this.resources)); }
  private persistNews() { localStorage.setItem(DB_NEWS_KEY, JSON.stringify(this.news)); }
  private persistTimers() { localStorage.setItem(DB_TIMERS_KEY, JSON.stringify(this.timers)); }
  private persistCertificates() { localStorage.setItem(DB_CERTIFICATES_KEY, JSON.stringify(this.certificates)); }
  private persistHomepage() { localStorage.setItem(DB_HOMEPAGE_KEY, JSON.stringify(this.homepage)); }
  private persistNotes() { localStorage.setItem(DB_NOTES_KEY, JSON.stringify(this.userNotes)); }
  private persistHighlights() { localStorage.setItem(DB_HIGHLIGHTS_KEY, JSON.stringify(this.highlights)); }
  private persistAnnotations() { localStorage.setItem(DB_ANNOTATIONS_KEY, JSON.stringify(this.annotations)); }
  private persistBookmarks() { localStorage.setItem(DB_BOOKMARKS_KEY, JSON.stringify(this.bookmarks)); }
  private persistSessions() { localStorage.setItem(DB_SESSION_STATE_KEY, JSON.stringify(this.sessionStates)); }
  private persistDownloads() { localStorage.setItem(DB_DOWNLOADS_LOG_KEY, JSON.stringify(this.downloadsLog)); }
  private persistSyncLog() { localStorage.setItem(DB_SYNC_LOG_KEY, JSON.stringify(this.syncLog)); }
  private persistDeferredQueue() { localStorage.setItem(DB_DEFERRED_SYNC_QUEUE_KEY, JSON.stringify(this.deferredSyncQueue)); }

  private async addToSyncLog(action: string, payloadType: string, status: 'SUCCESS' | 'QUEUED' | 'FAILED') {
      const entry: SyncLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action,
          status,
          payloadType
      };
      this.syncLog.unshift(entry);
      if (this.syncLog.length > 20) this.syncLog = this.syncLog.slice(0, 20);
      this.persistSyncLog();
  }

  async getSyncLog(): Promise<SyncLogEntry[]> {
      this.forceSync();
      return this.syncLog;
  }

  async forceRegistrySync() {
      if (!navigator.onLine) {
          throw new Error("Registry Error: Matrix Offline. Deferred queue active.");
      }
      await this.addToSyncLog('MANUAL_SYNC', 'FULL_REGISTRY', 'SUCCESS');
      this.processDeferredSyncQueue();
  }

  private async processDeferredSyncQueue() {
      if (!navigator.onLine || this.deferredSyncQueue.length === 0) return;
      
      const count = this.deferredSyncQueue.length;
      // Simulate registry synchronization delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.deferredSyncQueue = [];
      this.persistDeferredQueue();
      await this.addToSyncLog('QUEUE_FLUSH', `BATCH_DELTA (${count})`, 'SUCCESS');
  }

  private async queueSync(payload: any, type: string) {
      if (!navigator.onLine) {
          this.deferredSyncQueue.push({ ...payload, type, timestamp: new Date().toISOString() });
          this.persistDeferredQueue();
          await this.addToSyncLog('AUTO_SYNC', type, 'QUEUED');
      } else {
          await this.addToSyncLog('AUTO_SYNC', type, 'SUCCESS');
      }
  }

  private purgeStaleLessonData(lessonId: string) {
    // Normalizing ID matching to prevent whitespace or structure contaminants
    const normalizedId = lessonId.trim();
    this.attempts = this.attempts.filter(a => a.lessonId.trim() !== normalizedId);
    
    Object.keys(this.timers).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.timers[key];
    });
    Object.keys(this.userNotes).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.userNotes[key];
    });
    
    // Clear legacy state data for bookmarks and highlights to ensure fresh ingest integrity
    Object.keys(this.highlights).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.highlights[key];
    });
    Object.keys(this.annotations).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.annotations[key];
    });
    Object.keys(this.bookmarks).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.bookmarks[key];
    });
    Object.keys(this.sessionStates).forEach(key => {
        if (key.endsWith(`_${normalizedId}`)) delete this.sessionStates[key];
    });

    this.persistAttempts();
    this.persistTimers();
    this.persistNotes();
    this.persistHighlights();
    this.persistAnnotations();
    this.persistBookmarks();
    this.persistSessions();
  }

  async trackDownload(userId: string, lessonId: string, format: string) {
      this.downloadsLog.push({
          userId, lessonId, format,
          timestamp: new Date().toISOString()
      });
      this.persistDownloads();
  }

  async saveUserLessonNote(userId: string, lessonId: string, text: string): Promise<void> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    this.userNotes[key] = text;
    this.persistNotes();
    await this.queueSync({ userId, lessonId, text }, 'NOTE_DELTA');
  }

  async getUserLessonNote(userId: string, lessonId: string): Promise<string> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    return this.userNotes[key] || "";
  }

  async saveHighlights(userId: string, lessonId: string, highlights: LessonHighlight[]): Promise<void> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    this.highlights[key] = highlights;
    this.persistHighlights();
    await this.queueSync({ userId, lessonId, highlights }, 'HIGHLIGHT_DELTA');
  }

  async getHighlights(userId: string, lessonId: string): Promise<LessonHighlight[]> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    return this.highlights[key] || [];
  }

  async getAllHighlightsAcrossRegistry(userId: string): Promise<LessonHighlight[]> {
      this.forceSync();
      const all: LessonHighlight[] = [];
      Object.keys(this.highlights).forEach(key => {
          if (key.startsWith(`${userId}_`)) {
              all.push(...(this.highlights[key] || []));
          }
      });
      return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveAnnotations(userId: string, lessonId: string, annotations: LessonAnnotation[]): Promise<void> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    this.annotations[key] = annotations;
    this.persistAnnotations();
    await this.queueSync({ userId, lessonId, annotations }, 'ANNOTATION_DELTA');
  }

  async getAnnotations(userId: string, lessonId: string): Promise<LessonAnnotation[]> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    return this.annotations[key] || [];
  }

  async getAllAnnotationsAcrossRegistry(userId: string): Promise<LessonAnnotation[]> {
      this.forceSync();
      const all: LessonAnnotation[] = [];
      Object.keys(this.annotations).forEach(key => {
          if (key.startsWith(`${userId}_`)) {
              all.push(...(this.annotations[key] || []));
          }
      });
      return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveBookmarks(userId: string, lessonId: string, bookmarks: LessonBookmark[]): Promise<void> {
      this.forceSync();
      const key = `${userId}_${lessonId}`;
      this.bookmarks[key] = bookmarks;
      this.persistBookmarks();
      await this.queueSync({ userId, lessonId, bookmarks }, 'BOOKMARK_DELTA');
  }

  async getBookmarks(userId: string, lessonId: string): Promise<LessonBookmark[]> {
      this.forceSync();
      const key = `${userId}_${lessonId}`;
      return this.bookmarks[key] || [];
  }

  async getAllBookmarksAcrossRegistry(userId: string): Promise<LessonBookmark[]> {
      this.forceSync();
      const all: LessonBookmark[] = [];
      Object.keys(this.bookmarks).forEach(key => {
          if (key.startsWith(`${userId}_`)) {
              all.push(...(this.bookmarks[key] || []));
          }
      });
      return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveSessionState(userId: string, lessonId: string, state: LessonSessionState): Promise<void> {
      this.forceSync();
      const key = `${userId}_${lessonId}`;
      this.sessionStates[key] = state;
      this.persistSessions();
      await this.queueSync({ userId, lessonId, state }, 'SESSION_DELTA');
  }

  async getSessionState(userId: string, lessonId: string): Promise<LessonSessionState | null> {
      this.forceSync();
      const key = `${userId}_${lessonId}`;
      return this.sessionStates[key] || null;
  }

  async getCourses(): Promise<Course[]> { 
    this.forceSync();
    return this.courses; 
  }
  
  async getCourseById(id: string): Promise<Course | undefined> { 
    this.forceSync();
    return this.courses.find(c => c.id.trim() === id.trim()); 
  }
  
  async getModules(): Promise<Module[]> { 
    this.forceSync();
    return this.modules; 
  }
  
  async getModuleById(id: string): Promise<Module | undefined> { 
    this.forceSync();
    return this.modules.find(m => m.id.trim() === id.trim()); 
  }
  
  async getModulesByCourseId(courseId: string, customOrder?: string[]): Promise<Module[]> { 
    this.forceSync();
    const filtered = this.modules.filter(m => m.courseId.trim() === courseId.trim());
    if (customOrder && customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, idx) => [id.trim(), idx]));
        return [...filtered].sort((a, b) => {
            const idxA = orderMap.has(a.id.trim()) ? orderMap.get(a.id.trim())! : 9999;
            const idxB = orderMap.has(b.id.trim()) ? orderMap.get(b.id.trim())! : 9999;
            return idxA - idxB;
        });
    }
    return filtered.sort((a, b) => Number(a.order) - Number(b.order));
  }

  async getLessons(): Promise<Lesson[]> { 
    this.forceSync();
    return this.lessons; 
  }
  
  async getLessonById(id: string): Promise<Lesson | undefined> { 
    this.forceSync();
    return this.lessons.find(l => l.id.trim() === id.trim()); 
  }
  
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> { 
    this.forceSync();
    return this.lessons.filter(l => l.moduleId.trim() === moduleId.trim()).sort((a, b) => Number(a.orderInModule) - Number(b.orderInModule)); 
  }

  /**
   * REPAIR: Respects custom module ordering from the hierarchy provider (Mentor/Org).
   * Ensures parity between Table 3 reordering and Prev/Next button behavior.
   */
  async getAdjacentLessons(lessonId: string, currentUser?: User): Promise<{ prev?: string; next?: string }> {
      this.forceSync();
      const currentLesson = this.lessons.find(l => l.id.trim() === lessonId.trim());
      if (!currentLesson) return {};

      const currentModule = this.modules.find(m => m.id.trim() === currentLesson.moduleId.trim());
      if (!currentModule) return {};

      const currentCourse = this.courses.find(c => c.id.trim() === currentModule.courseId.trim());
      if (!currentCourse) return {};

      // REPAIR LOGIC: Identify the correct curriculum orchestration provider (Mentor or Org overrides)
      let customOrder: string[] = [];
      if (currentUser) {
          const providerId = currentUser.mentorId || currentUser.organizationId || currentUser.id;
          const provider = await authService.getUserById(providerId);
          if (provider?.customModuleOrder?.[currentCourse.id]) {
              customOrder = provider.customModuleOrder[currentCourse.id];
          }
      }

      // Fetch modules using the specific custom sorting protocol derived from Table 3 edits
      const courseModules = await this.getModulesByCourseId(currentCourse.id, customOrder);

      const moduleLessons = this.lessons
        .filter(l => l.moduleId.trim() === currentModule.id.trim())
        .sort((a, b) => Number(a.orderInModule) - Number(b.orderInModule));

      const currentIdx = moduleLessons.findIndex(l => l.id.trim() === lessonId.trim());
      const modIdx = courseModules.findIndex(m => m.id.trim() === currentModule.id.trim());

      let prevId: string | undefined;
      let nextId: string | undefined;

      // Next Unit Calculation: Crossing module boundaries according to custom reordering
      if (currentIdx < moduleLessons.length - 1) {
          nextId = moduleLessons[currentIdx + 1].id;
      } else {
          // If we are at the end of the module, find the next non-empty module in the sorted curriculum sequence
          for (let i = modIdx + 1; i < courseModules.length; i++) {
              const nextMod = courseModules[i];
              const nextModLessons = this.lessons
                .filter(l => l.moduleId.trim() === nextMod.id.trim())
                .sort((a, b) => Number(a.orderInModule) - Number(b.orderInModule));
              if (nextModLessons.length > 0) {
                  nextId = nextModLessons[0].id;
                  break;
              }
          }
      }

      // Previous Unit Calculation: Respecting custom sequence
      if (currentIdx > 0) {
          prevId = moduleLessons[currentIdx - 1].id;
      } else {
          // Find the previous non-empty module in the reordered list
          for (let i = modIdx - 1; i >= 0; i--) {
              const prevMod = courseModules[i];
              const prevModLessons = this.lessons
                .filter(l => l.moduleId.trim() === prevMod.id.trim())
                .sort((a, b) => Number(a.orderInModule) - Number(b.orderInModule));
              if (prevModLessons.length > 0) {
                  prevId = prevModLessons[prevModLessons.length - 1].id;
                  break;
              }
          }
      }

      return { prev: prevId, next: nextId };
  }

  async publishCourse(course: Course): Promise<void> {
    this.forceSync();
    const idx = this.courses.findIndex(c => c.id.trim() === course.id.trim());
    if (idx >= 0) { this.courses[idx] = { ...course }; } else { this.courses.unshift({ ...course }); }
    this.persistCourses();
  }

  async publishModule(module: Module): Promise<void> {
    this.forceSync();
    const idx = this.modules.findIndex(m => m.id.trim() === module.id.trim());
    if (idx >= 0) { this.modules[idx] = { ...module }; } else { this.modules.unshift({ ...module }); }
    this.persistModules();
  }

  async publishLesson(lesson: Lesson): Promise<void> {
    this.forceSync();
    const normalizedId = lesson.id.trim();
    
    // DEEP REPAIR: Always execute a state reset protocol for the incoming Lesson ID.
    // This prevents contaminating new uploads with orphaned attempt records from previous sessions.
    this.purgeStaleLessonData(normalizedId);
    
    const index = this.lessons.findIndex(l => l.id.trim() === normalizedId);
    if (index >= 0) { 
        this.lessons[index] = { ...lesson }; 
    } else { 
        this.lessons.unshift({ ...lesson }); 
    }
    
    this.persistLessons();
    
    if (lesson.moduleId) {
        const mod = this.modules.find(m => m.id.trim() === lesson.moduleId.trim());
        if (mod) {
            if (!mod.lessonIds) mod.lessonIds = [];
            if (!mod.lessonIds.includes(lesson.id)) { 
                mod.lessonIds.push(lesson.id); 
                this.persistModules(); 
            }
        }
    }
  }

  async deleteLesson(id: string): Promise<void> {
    this.forceSync();
    this.lessons = this.lessons.filter(l => l.id.trim() !== id.trim());
    this.purgeStaleLessonData(id);
    this.persistLessons();
    this.modules.forEach(m => { if (m.lessonIds) m.lessonIds = m.lessonIds.filter(lId => lId.trim() !== id.trim()); });
    this.persistModules();
  }

  async getHomepageContent(): Promise<HomepageContent> { return this.homepage; }
  async updateHomepageContent(content: HomepageContent): Promise<void> { this.homepage = content; this.persistHomepage(); }

  async getStudentSummary(studentId: string) {
      this.forceSync();
      const userAttempts = this.attempts.filter(a => a.studentId === studentId).sort((a,b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
      const uniqueLessonIds = Array.from(new Set(this.attempts.filter(a => a.studentId === studentId).map(a => a.lessonId)));
      let totalScorePercentage = 0, lessonsEvaluated = 0, totalSeconds = 0;
      for (const lId of uniqueLessonIds) {
          const lesson = this.lessons.find(l => l.id === lId); if (!lesson) continue;
          const lessonAttempts = this.attempts.filter(a => a.studentId === studentId && a.lessonId === lId);
          const bibleCount = lesson.bibleQuizzes?.length || 0;
          const noteCount = lesson.noteQuizzes?.length || 0;
          const uniqueQuizzesInLesson = bibleCount + noteCount;
          const latestAttemptsPerQuiz = new Map<string, boolean>();
          lessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
          const correct = Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length;
          if (uniqueQuizzesInLesson > 0) { totalScorePercentage += (correct / uniqueQuizzesInLesson) * 100; lessonsEvaluated++; }
          totalSeconds += this.timers[`${studentId}_${lId}`] || 0;
      }
      const eligibleModules = await this.getEligibleModulesForUser(studentId);
      let lastLessonScoreStr = "0/0", lastLessonTimeVal = 0;
      if (userAttempts.length > 0) {
          const lastLessonId = userAttempts[0].lessonId;
          const lesson = this.lessons.find(l => l.id === lastLessonId);
          if (lesson) {
              const lastLessonAttempts = this.attempts.filter(a => a.studentId === studentId && a.lessonId === lastLessonId);
              const bibleCount = lesson.bibleQuizzes?.length || 0, noteCount = lesson.noteQuizzes?.length || 0, uniqueQuizzesInLesson = bibleCount + noteCount;
              const latestAttemptsPerQuiz = new Map<string, boolean>();
              lastLessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
              lastLessonScoreStr = `${Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length}/${uniqueQuizzesInLesson}`;
              lastLessonTimeVal = this.timers[`${studentId}_${lastLessonId}`] || 0;
          }
      }
      return { avgScore: lessonsEvaluated > 0 ? Math.round(totalScorePercentage / lessonsEvaluated) : 0, totalLessons: uniqueLessonIds.length, totalTime: totalSeconds, modulesCompleted: eligibleModules.length, totalModules: this.modules.length, lastLessonScore: lastLessonScoreStr, lastLessonTime: lastLessonTimeVal };
  }

  async getEligibleModulesForUser(userId: string): Promise<Module[]> {
      this.forceSync();
      const eligible: Module[] = [];
      for (const mod of this.modules) {
          let lessonsProcessed = 0, totalScore = 0, lessonsDone = 0;
          const lessonIds = mod.lessonIds || [];
          const requiredCount = Math.max(mod.totalLessonsRequired, lessonIds.length);
          if (requiredCount === 0) continue;
          for (const lId of lessonIds) {
              const lesson = this.lessons.find(l => l.id === lId); if (!lesson) continue;
              const lessonAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lId);
              const bibleCount = lesson.bibleQuizzes?.length || 0, noteCount = lesson.noteQuizzes?.length || 0, totalQ = bibleCount + noteCount;
              const uniqueQuizzesAttempted = new Set(lessonAttempts.map(a => a.quizId)).size;
              if (uniqueQuizzesAttempted >= totalQ && totalQ > 0) {
                  lessonsDone++;
                  const latestAttemptsPerQuiz = new Map<string, boolean>();
                  lessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
                  totalScore += (Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length / totalQ) * 100;
                  lessonsProcessed++;
              }
          }
          if (lessonsDone >= requiredCount && lessonsProcessed > 0) {
              if ((totalScore / lessonsProcessed) >= (mod.completionRule?.minimumCompletionPercentage || 100)) { eligible.push(mod); }
          }
      }
      return eligible;
  }

  async hasUserAttemptedLesson(userId: string, lessonId: string): Promise<boolean> {
      this.forceSync();
      const normalizedLessonId = lessonId.trim();
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId.trim() === normalizedLessonId);
      const lesson = this.lessons.find(l => l.id.trim() === normalizedLessonId); 
      if (!lesson) return false;
      const totalQ = (lesson.bibleQuizzes?.length || 0) + (lesson.noteQuizzes?.length || 0);
      return totalQ === 0 ? true : new Set(userAttempts.map(a => a.quizId)).size >= totalQ;
  }

  async submitAttempt(studentId: string, lessonId: string, quizId: string, selectedOptionId: string, isCorrect: boolean): Promise<void> {
    this.forceSync();
    this.attempts.push({ id: crypto.randomUUID(), studentId, lessonId, quizId, selectedOptionId, isCorrect, score: isCorrect ? 10 : 0, attempted_at: new Date().toISOString() });
    this.persistAttempts();
    await this.queueSync({ studentId, lessonId, quizId, selectedOptionId, isCorrect }, 'ATTEMPT_DELTA');
  }

  async getAttempts(studentId: string, lessonId: string): Promise<StudentAttempt[]> { 
      this.forceSync(); 
      const normalizedId = lessonId.trim();
      return this.attempts.filter(a => a.studentId === studentId && a.lessonId.trim() === normalizedId); 
  }
  async saveQuizTimer(userId: string, lessonId: string, seconds: number): Promise<void> { const key = `${userId}_${lessonId.trim()}`; this.timers[key] = seconds; this.persistTimers(); }
  async getQuizTimer(userId: string, lessonId: string): Promise<number> { const key = `${userId}_${lessonId.trim()}`; return this.timers[key] || 0; }
  async getResources(): Promise<Resource[]> { this.forceSync(); return this.resources; }
  async addResource(resource: Resource, actor: User): Promise<void> { this.forceSync(); this.resources.unshift(resource); this.persistResources(); }
  async deleteResource(id: string, actor: User): Promise<void> { this.forceSync(); this.resources = this.resources.filter(r => r.id !== id); this.persistResources(); }
  async getNews(): Promise<NewsItem[]> { this.forceSync(); return this.news; }
  async addNews(news: NewsItem, actor: User): Promise<void> { this.forceSync(); this.news.unshift(news); this.persistNews(); }
  async deleteNews(id: string, actor: User): Promise<void> { this.forceSync(); this.news = this.news.filter(n => n.id !== id); this.persistNews(); }
  async getUserCertificates(userId: string): Promise<Certificate[]> { this.forceSync(); return this.certificates.filter(c => c.userId === userId); }
  async getAllCertificates(): Promise<Certificate[]> { this.forceSync(); return this.certificates; }
  async verifyCertificate(code: string): Promise<Certificate | undefined> { this.forceSync(); return this.certificates.find(c => c.uniqueCode === code.toUpperCase()); }

  async issueCertificate(userId: string, userName: string, moduleId: string, design?: CertificateDesign): Promise<Certificate> {
      this.forceSync();
      const mod = this.modules.find(m => m.id === moduleId); if (!mod) throw new Error("Module not found");
      const cert: Certificate = { id: crypto.randomUUID(), userId, userName, moduleId, moduleTitle: mod.title, issueDate: new Date().toISOString(), issuerName: mod.certificateConfig.issuedBy || 'Build Biblical Leaders', uniqueCode: Math.random().toString(36).substring(2, 10).toUpperCase(), design: design || { templateId: mod.certificateConfig.templateId as any || 'classic', primaryColor: '#1e1b4b', secondaryColor: '#d97706', titleOverride: mod.certificateConfig.title, messageOverride: mod.certificateConfig.description } };
      this.certificates.unshift(cert); this.persistCertificates(); return cert;
  }

  async commitDraft(draft: LessonDraft, actor: User): Promise<void> {
    this.forceSync();
    if (draft.courseMetadata) {
      await this.publishCourse(draft.courseMetadata);
    }
    for (const mod of draft.modules) {
      await this.publishModule(mod);
    }
    for (const les of draft.lessons) {
      await this.publishLesson(les);
    }
  }

  async parseExcelUpload(file: File): Promise<LessonDraft> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const errors: ImportError[] = [];

    const getSheet = (name: string) => {
        const actualName = workbook.SheetNames.find(n => 
          n.trim().toLowerCase() === name.trim().toLowerCase() ||
          n.trim().toLowerCase().replace(/\s|_/g, '') === name.trim().toLowerCase().replace(/\s|_/g, '')
        );

        if (!actualName) {
            errors.push({ sheet: 'Registry', row: 0, column: 'Sheets', message: `Protocol Violation: Missing Sheet "${name}"`, severity: 'error' });
            return [];
        }
        const s = workbook.Sheets[actualName];
        return XLSX.utils.sheet_to_json(s);
    };

    const getRowValue = (row: any, searchKeys: string[]) => {
        if (!row) return undefined;
        const key = Object.keys(row).find(k => 
            searchKeys.some(sk => k.toLowerCase().replace(/\s|_/g, '') === sk.toLowerCase().replace(/\s|_/g, ''))
        );
        return key ? row[key] : undefined;
    };

    const mapToProficiencyLevel = (val: any): ProficiencyLevel => {
        const s = (val || '').toString().toLowerCase();
        if (s.includes('advanced')) return 'Mentor, Organization & Parent (Advanced)';
        if (s.includes('intermediate') || s.includes('mentor') || s.includes('parent') || s.includes('organization')) {
            return 'Mentor, Organization & Parent (Intermediate)';
        }
        return 'student (Beginner)';
    };

    const courseData = getSheet('Course_Metadata') as any[];
    const aboutCourseData = getSheet('About_Course (NEW)') as any[];
    const moduleData = getSheet('Module_Metadata (UPDATED)') as any[];
    const aboutModuleData = getSheet('About_Module (NEW)') as any[];
    const lessonData = getSheet('Lesson_Metadata (UPDATED)') as any[];
    const aboutLessonData = getSheet('About_Lesson (NEW)') as any[];
    const bibleQuizData = getSheet('Bible_Quiz') as any[];
    const noteQuizData = getSheet('Note_Quiz') as any[];

    if (courseData.length === 0 && errors.filter(e => e.sheet === 'Course_Metadata').length === 0) {
        errors.push({ sheet: 'Course_Metadata', row: 1, column: 'All', message: 'Registry Error: Course record required.', severity: 'error' });
    }

    const rawCourse = courseData[0];
    const extractedCourseId = (getRowValue(rawCourse, ['course_id', 'id']) || 'ID-MISSING').toString();
    const course: Course = {
        id: extractedCourseId,
        title: (getRowValue(rawCourse, ['course_title', 'title']) || 'Untitled Course').toString(),
        subtitle: (getRowValue(rawCourse, ['course_subtitle', 'subtitle']) || '').toString(),
        description: (getRowValue(rawCourse, ['course_description', 'description']) || '').toString(),
        level: mapToProficiencyLevel(getRowValue(rawCourse, ['course_level', 'level', 'category'])),
        language: (getRowValue(rawCourse, ['course_language', 'language']) || 'English').toString(),
        author: (getRowValue(rawCourse, ['course_author', 'author']) || 'BBL Institute').toString(),
        totalModulesRequired: 0,
        about: aboutCourseData
            .filter(a => (getRowValue(a, ['course_id', 'id']) || extractedCourseId) === extractedCourseId)
            .map(a => ({ 
                order: parseInt(getRowValue(a, ['segment_order', 'order'])) || 0, 
                title: (getRowValue(a, ['segment_title', 'title']) || '').toString(), 
                body: (getRowValue(a, ['segment_body', 'body']) || '').toString() 
            }))
            .sort((a, b) => a.order - b.order)
    };

    let currentSheetModuleId = '';
    const modules: Module[] = moduleData.map((m, idx) => {
        const mid = (getRowValue(m, ['module_id', 'id']) || '').toString();
        if (mid) currentSheetModuleId = mid;
        const targetMid = currentSheetModuleId;
        return {
            id: targetMid, 
            courseId: course.id, 
            title: (getRowValue(m, ['module_title', 'title']) || '').toString(), 
            description: (getRowValue(m, ['module_description', 'description']) || '').toString(),
            order: parseInt(getRowValue(m, ['module_order', 'order'])) || 1, 
            lessonIds: [], 
            totalLessonsRequired: 0,
            about: aboutModuleData
                .filter(a => (getRowValue(a, ['module_id', 'id']) || targetMid) === targetMid)
                .map(a => ({ 
                    order: parseInt(getRowValue(a, ['segment_order', 'order'])) || 0, 
                    title: (getRowValue(a, ['segment_title', 'title']) || '').toString(), 
                    body: (getRowValue(a, ['segment_body', 'body']) || '').toString() 
                })).sort((a, b) => a.order - b.order),
            completionRule: { minimumCompletionPercentage: parseInt(getRowValue(m, ['minimum_completion_percentage', 'completion'])) || 100 },
            certificateConfig: { 
                title: (getRowValue(m, ['certificate_title']) || '').toString(), 
                description: (getRowValue(m, ['module_description']) || '').toString(), 
                templateId: (getRowValue(m, ['certificate_template_id']) || 'classic').toString(), 
                issuedBy: (getRowValue(m, ['issued_by']) || '').toString() 
            }
        };
    });
    course.totalModulesRequired = modules.length;

    let currentSheetLessonId = '';
    let currentSheetTargetModuleId = '';
    const lessonsMap: Map<string, Lesson> = new Map();
    
    lessonData.forEach((l, idx) => {
        const mid = (getRowValue(l, ['module_id', 'id']) || '').toString();
        if (mid) currentSheetTargetModuleId = mid;
        
        const lid = (getRowValue(l, ['lesson_id', 'id']) || '').toString();
        if (lid) currentSheetLessonId = lid;
        
        const targetLid = currentSheetLessonId;
        const targetMid = currentSheetTargetModuleId || currentSheetModuleId; 
        
        if (!lessonsMap.has(targetLid)) {
            lessonsMap.set(targetLid, {
                id: targetLid, 
                moduleId: targetMid, 
                orderInModule: parseInt(getRowValue(l, ['lesson_order', 'order'])) || 1, 
                title: (getRowValue(l, ['lesson_title', 'title']) || '').toString(),
                description: (getRowValue(l, ['lesson_description', 'description']) || '').toString(), 
                lesson_type: 'Mixed', 
                targetAudience: 'All', 
                book: (getRowValue(l, ['bible_book', 'book']) || '').toString(), 
                chapter: parseInt(getRowValue(l, ['bible_chapter', 'chapter'])) || 1,
                leadershipNotes: [],
                author: course.author, 
                authorId: 'sys', 
                created_at: new Date().toISOString(), 
                updated_at: new Date().toISOString(), 
                status: 'published', 
                views: 0,
                about: aboutLessonData
                    .filter(a => (getRowValue(a, ['lesson_id', 'id']) || targetLid) === targetLid)
                    .map(a => ({ 
                        order: parseInt(getRowValue(a, ['segment_order', 'order'])) || 0, 
                        title: (getRowValue(a, ['segment_title', 'title']) || '').toString(), 
                        body: (getRowValue(a, ['segment_body', 'body']) || '').toString() 
                    })).sort((a, b) => a.order - b.order),
                bibleQuizzes: [], noteQuizzes: [], sections: []
            });
        }

        const currentLes = lessonsMap.get(targetLid)!;
        const noteTitle = (getRowValue(l, ['leadership_note_title']) || '').toString();
        if (noteTitle) {
            currentLes.leadershipNotes.push({ 
                id: crypto.randomUUID(), 
                title: noteTitle, 
                body: (getRowValue(l, ['leadership_note_body']) || '').toString() 
            });
        }
    });

    const lessons = Array.from(lessonsMap.values());

    let currentBibleLessonId = '';
    bibleQuizData.forEach((q, idx) => {
        const lessonId = (getRowValue(q, ['lesson_id', 'id']) || currentBibleLessonId).toString();
        if (lessonId) currentBibleLessonId = lessonId;
        const les = lessons.find(l => l.id === currentBibleLessonId);
        if (les) {
            const questionId = (getRowValue(q, ['question_id', 'id']) || '').toString();
            const uniqueId = questionId ? `${currentBibleLessonId}_${questionId}_b${idx}` : `bq_${currentBibleLessonId}_${idx}`;
            les.bibleQuizzes.push({
                id: uniqueId, 
                type: 'Bible Quiz', 
                referenceText: (getRowValue(q, ['bible_reference', 'reference']) || '').toString(), 
                text: (getRowValue(q, ['question_text', 'question']) || '').toString(), 
                sequence: idx + 1,
                options: ['A', 'B', 'C', 'D'].map(lbl => ({ 
                    id: lbl.toLowerCase(), 
                    label: lbl, 
                    text: (getRowValue(q, [`option_${lbl}`]) || '').toString(), 
                    isCorrect: (getRowValue(q, ['correct_option']) || '').toString() === lbl || (getRowValue(q, ['correct_option']) || '').toString().toLowerCase() === `option_${lbl.toLowerCase()}`, 
                    explanation: (getRowValue(q, [`explanation_${lbl}`]) || '').toString() 
                }))
            });
        }
    });

    let currentNoteLessonId = '';
    noteQuizData.forEach((q, idx) => {
        const lessonId = (getRowValue(q, ['lesson_id', 'id']) || currentNoteLessonId).toString();
        if (lessonId) currentNoteLessonId = lessonId;
        const les = lessons.find(l => l.id === currentNoteLessonId);
        if (les) {
            const questionId = (getRowValue(q, ['question_id', 'id']) || '').toString();
            const uniqueId = questionId ? `${currentNoteLessonId}_${questionId}_n${idx}` : `nq_${currentNoteLessonId}_${idx}`;
            les.noteQuizzes.push({
                id: uniqueId, 
                type: 'Note Quiz', 
                sourceNoteTitle: (getRowValue(q, ['source_note_title', 'source']) || '').toString(), 
                text: (getRowValue(q, ['question_text', 'question']) || '').toString(), 
                sequence: idx + 1,
                options: ['A', 'B', 'C', 'D'].map(lbl => ({ 
                    id: lbl.toLowerCase(), 
                    label: lbl, 
                    text: (getRowValue(q, [`option_${lbl}`]) || '').toString(), 
                    isCorrect: (getRowValue(q, ['correct_option']) || '').toString() === lbl || (getRowValue(q, ['correct_option']) || '').toString().toLowerCase() === `option_${lbl.toLowerCase()}`, 
                    explanation: (getRowValue(q, [`explanation_${lbl}`]) || '').toString() 
                }))
            });
        }
    });

    modules.forEach(m => { 
        m.lessonIds = lessons.filter(l => l.moduleId.trim() === m.id.trim()).map(l => l.id); 
        m.totalLessonsRequired = m.lessonIds.length; 
    });

    return { 
        courseMetadata: course, 
        modules, 
        lessons, 
        isValid: errors.filter(e => e.severity === 'error').length === 0, 
        errors 
    };
  }
}

export const lessonService = new LessonService();