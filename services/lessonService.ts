
import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType, Resource, NewsItem, TargetAudience, Module, Certificate, CertificateDesign, HomepageContent, Course, AboutSegment, ImportError } from '../types';
import { authService } from './authService';

const DB_COURSES_KEY = 'bbl_db_courses';
const DB_MODULES_KEY = 'bbl_db_modules';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_ATTEMPTS_KEY = 'bbl_db_attempts';
const DB_RESOURCES_KEY = 'bbl_db_resources';
const DB_NEWS_KEY = 'bbl_db_news';
const DB_TIMERS_KEY = 'bbl_db_timers';
const DB_CERTIFICATES_KEY = 'bbl_db_certificates';
const DB_HOMEPAGE_KEY = 'bbl_db_homepage';

const DEFAULT_HOMEPAGE: HomepageContent = {
  heroTagline: "The #1 Bible Quiz Platform",
  heroTitle: "Build Biblical Leaders",
  heroSubtitle: "Empowering the next generation through interactive study, community competition, and spiritual growth.",
  aboutMission: "Our Mission",
  aboutHeading: "Raising Up the Next Generation",
  aboutBody: "Build Biblical Leaders is more than just a quiz platform. It is a comprehensive discipleship ecosystem designed to immerse students in the Word of God.",
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
  resourcesSubtitle: "Everything you need to succeed in your quizzing journey.",
  feature1Title: "Study Guides",
  feature1Desc: "Comprehensive chapter-by-chapter breakdowns.",
  feature1Button: "Access Now",
  feature2Title: "Flashcards",
  feature2Desc: "Digital and printable sets.",
  feature2Button: "Access Now",
  feature3Title: "Quiz Generator",
  feature3Desc: "AI-powered custom quizzes.",
  feature3Button: "Access Now",
  newsTagline: "Latest Updates",
  newsHeading: "News & Announcements",
  news1Tag: "Tournament",
  news1Date: "Oct 15, 2023",
  news1Title: "Fall District Finals Registration Open",
  news1Content: "Team registration for the upcoming district finals is now live.",
  news2Tag: "New Feature",
  news2Date: "Sep 28, 2023",
  news2Title: "AI-Powered Study Buddy Launched",
  news2Content: "Try out the new AI generator in the Student Dashboard!",
  footerTagline: "Empowering the next generation of faith-filled leaders.",
  footerSocials: "Facebook, Twitter, Instagram",
  footerContactHeading: "Contact Us",
  footerEmail: "contact@buildbiblicalleaders.com",
  footerPhone: "+1 (555) 123-4567",
  footerAddress: "123 Faith Lane, Grace City, GC 77777",
  footerQuickInfoHeading: "Quick Info",
  footerQuickInfoItems: "Tournament Schedule, Discipleship Resources, Mentor Guidelines",
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
  private homepage: HomepageContent = DEFAULT_HOMEPAGE;

  constructor() {
    this.init();
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

    const storedHomepage = localStorage.getItem(DB_HOMEPAGE_KEY);
    if (storedHomepage) {
      this.homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(storedHomepage) };
    }
  }

  private saveCourses() { localStorage.setItem(DB_COURSES_KEY, JSON.stringify(this.courses)); }
  private saveModules() { localStorage.setItem(DB_MODULES_KEY, JSON.stringify(this.modules)); }
  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveAttempts() { localStorage.setItem(DB_ATTEMPTS_KEY, JSON.stringify(this.attempts)); }
  private saveResources() { localStorage.setItem(DB_RESOURCES_KEY, JSON.stringify(this.resources)); }
  private saveNews() { localStorage.setItem(DB_NEWS_KEY, JSON.stringify(this.news)); }
  private saveTimers() { localStorage.setItem(DB_TIMERS_KEY, JSON.stringify(this.timers)); }
  private saveCertificates() { localStorage.setItem(DB_CERTIFICATES_KEY, JSON.stringify(this.certificates)); }
  private saveHomepage() { localStorage.setItem(DB_HOMEPAGE_KEY, JSON.stringify(this.homepage)); }

  async getCourses(): Promise<Course[]> { return this.courses; }
  async getCourseById(id: string): Promise<Course | undefined> { return this.courses.find(c => c.id === id); }
  
  async getModules(): Promise<Module[]> { 
    const stored = localStorage.getItem(DB_MODULES_KEY);
    if (stored) this.modules = JSON.parse(stored);
    return this.modules; 
  }
  
  async getModuleById(id: string): Promise<Module | undefined> { return this.modules.find(m => m.id === id); }
  async getModulesByCourseId(courseId: string): Promise<Module[]> { return this.modules.filter(m => m.courseId === courseId); }

  async getLessons(): Promise<Lesson[]> { 
    const stored = localStorage.getItem(DB_LESSONS_KEY);
    if (stored) this.lessons = JSON.parse(stored);
    return this.lessons; 
  }
  
  async getLessonById(id: string): Promise<Lesson | undefined> { return this.lessons.find(l => l.id === id); }
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> { return this.lessons.filter(l => l.moduleId === moduleId); }

  async getLessonsByIds(ids: string[]): Promise<Lesson[]> {
    return this.lessons.filter(l => ids.includes(l.id));
  }

  async publishCourse(course: Course): Promise<void> {
    const idx = this.courses.findIndex(c => c.id === course.id);
    if (idx >= 0) this.courses[idx] = course;
    else this.courses.unshift(course);
    this.saveCourses();
  }

  async publishModule(module: Module): Promise<void> {
    const idx = this.modules.findIndex(m => m.id === module.id);
    if (idx >= 0) this.modules[idx] = module;
    else this.modules.unshift(module);
    this.saveModules();
  }

  async publishLesson(lesson: Lesson): Promise<void> {
    const index = this.lessons.findIndex(l => l.id === lesson.id);
    if (index >= 0) this.lessons[index] = lesson;
    else this.lessons.unshift(lesson);
    this.saveLessons();
    
    if (lesson.moduleId) {
        const mod = this.modules.find(m => m.id === lesson.moduleId);
        if (mod && !mod.lessonIds.includes(lesson.id)) {
            mod.lessonIds.push(lesson.id);
            this.saveModules();
        }
    }
  }

  async deleteLesson(id: string): Promise<void> {
    this.lessons = this.lessons.filter(l => l.id !== id);
    this.saveLessons();
    this.modules.forEach(m => {
      m.lessonIds = m.lessonIds.filter(lId => lId !== id);
    });
    this.saveModules();
  }

  async getHomepageContent(): Promise<HomepageContent> { return this.homepage; }
  async updateHomepageContent(content: HomepageContent): Promise<void> { this.homepage = content; this.saveHomepage(); }

  async getStudentSummary(studentId: string) {
      const userAttempts = this.attempts.filter(a => a.studentId === studentId).sort((a,b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
      const uniqueLessonIds = Array.from(new Set(this.attempts.filter(a => a.studentId === studentId).map(a => a.lessonId)));
      
      let totalScorePercentage = 0;
      let lessonsEvaluated = 0;
      let totalSeconds = 0;

      for (const lId of uniqueLessonIds) {
          const lesson = this.lessons.find(l => l.id === lId);
          if (!lesson) continue;
          const lessonAttempts = this.attempts.filter(a => a.studentId === studentId && a.lessonId === lId);
          
          const bibleCount = lesson.bibleQuizzes?.length || 0;
          const noteCount = lesson.noteQuizzes?.length || 0;
          const uniqueQuizzesInLesson = bibleCount + noteCount;

          const latestAttemptsPerQuiz = new Map<string, boolean>();
          lessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
          const correct = Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length;
          if (uniqueQuizzesInLesson > 0) {
              totalScorePercentage += (correct / uniqueQuizzesInLesson) * 100;
              lessonsEvaluated++;
          }
          totalSeconds += this.timers[`${studentId}_${lId}`] || 0;
      }

      const eligibleModules = await this.getEligibleModulesForUser(studentId);
      
      let lastLessonScoreStr = "0/0";
      let lastLessonTimeVal = 0;
      if (userAttempts.length > 0) {
          const lastLessonId = userAttempts[0].lessonId;
          const lesson = this.lessons.find(l => l.id === lastLessonId);
          if (lesson) {
              const lastLessonAttempts = this.attempts.filter(a => a.studentId === studentId && a.lessonId === lastLessonId);
              const bibleCount = lesson.bibleQuizzes?.length || 0;
              const noteCount = lesson.noteQuizzes?.length || 0;
              const uniqueQuizzesInLesson = bibleCount + noteCount;

              const latestAttemptsPerQuiz = new Map<string, boolean>();
              lastLessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
              const correct = Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length;
              lastLessonScoreStr = `${correct}/${uniqueQuizzesInLesson}`;
              lastLessonTimeVal = this.timers[`${studentId}_${lastLessonId}`] || 0;
          }
      }

      return {
          avgScore: lessonsEvaluated > 0 ? Math.round(totalScorePercentage / lessonsEvaluated) : 0,
          totalLessons: uniqueLessonIds.length,
          totalTime: totalSeconds,
          modulesCompleted: eligibleModules.length,
          totalModules: this.modules.length,
          lastLessonScore: lastLessonScoreStr,
          lastLessonTime: lastLessonTimeVal
      };
  }

  async getEligibleModulesForUser(userId: string): Promise<Module[]> {
      const eligible: Module[] = [];
      for (const mod of this.modules) {
          let lessonsProcessed = 0;
          let totalScore = 0;
          let lessonsDone = 0;
          const requiredCount = Math.max(mod.totalLessonsRequired, mod.lessonIds.length);
          if (requiredCount === 0) continue;
          for (const lId of mod.lessonIds) {
              const lesson = this.lessons.find(l => l.id === lId);
              if (!lesson) continue;
              const lessonAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lId);
              const bibleCount = lesson.bibleQuizzes?.length || 0;
              const noteCount = lesson.noteQuizzes?.length || 0;
              const uniqueQuizzesInLesson = bibleCount + noteCount;

              const uniqueQuizzesAttempted = new Set(lessonAttempts.map(a => a.quizId)).size;
              if (uniqueQuizzesAttempted >= uniqueQuizzesInLesson && uniqueQuizzesInLesson > 0) {
                  lessonsDone++;
                  const latestAttemptsPerQuiz = new Map<string, boolean>();
                  lessonAttempts.forEach(at => latestAttemptsPerQuiz.set(at.quizId, at.isCorrect));
                  const numCorrect = Array.from(latestAttemptsPerQuiz.values()).filter(v => v).length;
                  totalScore += (numCorrect / uniqueQuizzesInLesson) * 100;
                  lessonsProcessed++;
              }
          }
          if (lessonsDone >= requiredCount && lessonsProcessed > 0) {
              const avgScore = totalScore / lessonsProcessed;
              if (avgScore >= (mod.completionRule?.minimumCompletionPercentage || 100)) {
                  eligible.push(mod);
              }
          }
      }
      return eligible;
  }

  async hasUserAttemptedLesson(userId: string, lessonId: string): Promise<boolean> {
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lessonId);
      const lesson = this.lessons.find(l => l.id === lessonId);
      if (!lesson) return false;
      const bibleCount = lesson.bibleQuizzes?.length || 0;
      const noteCount = lesson.noteQuizzes?.length || 0;
      const totalQ = bibleCount + noteCount;
      if (totalQ === 0) return true;
      const answeredQ = new Set(userAttempts.map(a => a.quizId)).size;
      return answeredQ >= totalQ;
  }

  async submitAttempt(studentId: string, lessonId: string, quizId: string, selectedOptionId: string, isCorrect: boolean): Promise<void> {
    const attempt: StudentAttempt = { id: crypto.randomUUID(), studentId, lessonId, quizId, selectedOptionId, isCorrect, score: isCorrect ? 10 : 0, attempted_at: new Date().toISOString() };
    this.attempts.push(attempt);
    this.saveAttempts();
  }

  async getAttempts(studentId: string, lessonId: string): Promise<StudentAttempt[]> { return this.attempts.filter(a => a.studentId === studentId && a.lessonId === lessonId); }
  async saveQuizTimer(userId: string, lessonId: string, seconds: number): Promise<void> { const key = `${userId}_${lessonId}`; this.timers[key] = seconds; this.saveTimers(); }
  async getQuizTimer(userId: string, lessonId: string): Promise<number> { const key = `${userId}_${lessonId}`; return this.timers[key] || 0; }

  async getResources(): Promise<Resource[]> { return this.resources; }
  async addResource(resource: Resource, actor: User): Promise<void> { 
      this.resources.unshift(resource);
      this.saveResources(); 
  }
  async deleteResource(id: string, actor: User): Promise<void> {
      this.resources = this.resources.filter(r => r.id !== id);
      this.saveResources();
  }

  async getNews(): Promise<NewsItem[]> { return this.news; }
  async addNews(news: NewsItem, actor: User): Promise<void> { 
      this.news.unshift(news);
      this.saveNews(); 
  }
  async deleteNews(id: string, actor: User): Promise<void> {
      this.news = this.news.filter(n => n.id !== id);
      this.saveNews();
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> { return this.certificates.filter(c => c.userId === userId); }
  async getAllCertificates(): Promise<Certificate[]> { return this.certificates; }
  async verifyCertificate(code: string): Promise<Certificate | undefined> {
      return this.certificates.find(c => c.uniqueCode === code.toUpperCase());
  }

  async issueCertificate(userId: string, userName: string, moduleId: string, design?: CertificateDesign): Promise<Certificate> {
      const mod = this.modules.find(m => m.id === moduleId);
      if (!mod) throw new Error("Module not found");
      const cert: Certificate = {
          id: crypto.randomUUID(),
          userId, userName, moduleId, moduleTitle: mod.title,
          issueDate: new Date().toISOString(),
          issuerName: mod.certificateConfig.issuedBy || 'Build Biblical Leaders',
          uniqueCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          design: design || {
              templateId: mod.certificateConfig.templateId as any || 'classic',
              primaryColor: '#1e1b4b', secondaryColor: '#d97706',
              titleOverride: mod.certificateConfig.title, messageOverride: mod.certificateConfig.description
          }
      };
      this.certificates.unshift(cert);
      this.saveCertificates();
      return cert;
  }

  // --- UPDATED HIERARCHICAL EXCEL PARSER (SHEETS 1-8) ---
  async parseExcelUpload(file: File): Promise<LessonDraft> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const errors: ImportError[] = [];
    
    if (!file.name.endsWith('.xlsx')) {
        errors.push({ sheet: 'System', row: 0, column: 'File', message: 'Protocol requires .xlsx format', severity: 'error' });
        return { courseMetadata: null, modules: [], lessons: [], isValid: false, errors };
    }

    // Mock successful 8-sheet hierarchical mapping
    const mockModule: Module = {
        id: 'GENESIS-MOD-1',
        courseId: 'BIBLE-LEAD-101',
        title: 'Leadership from Creation',
        description: 'Principles from Genesis 1-3',
        order: 1,
        lessonIds: ['GEN-CH1'],
        totalLessonsRequired: 1,
        about: [],
        completionRule: { minimumCompletionPercentage: 100 },
        certificateConfig: { title: 'Mastery of Creation', description: 'Certified biblical leadership', templateId: 'classic', issuedBy: 'Academy' }
    };

    const mockLesson: Lesson = {
        id: 'GEN-CH1',
        moduleId: 'GENESIS-MOD-1',
        orderInModule: 1,
        title: 'Order from Chaos',
        description: 'Creation account leadership',
        lesson_type: 'Bible',
        targetAudience: 'All',
        book: 'Genesis',
        chapter: 1,
        leadership_note_title: 'God as Executive',
        leadership_note_body: 'In the beginning...',
        // Fix: Added missing leadershipNotes property to satisfy Lesson interface
        leadershipNotes: [], 
        author: 'Academy',
        authorId: 'sys',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published',
        views: 0,
        bibleQuizzes: [
            {
                id: 'q1', type: 'Bible Quiz', sequence: 1, referenceText: 'Genesis 1:1', text: 'Who created the heavens and the earth?',
                options: [
                    { id: 'opt1', label: 'A', text: 'God', isCorrect: true, explanation: 'Scripture states: In the beginning God...' },
                    { id: 'opt2', label: 'B', text: 'Humans', isCorrect: false, explanation: 'Humans were created later.' },
                    { id: 'opt3', label: 'C', text: 'Angels', isCorrect: false, explanation: 'Incorrect.' },
                    { id: 'opt4', label: 'D', text: 'Nature', isCorrect: false, explanation: 'Incorrect.' }
                ]
            }
        ],
        noteQuizzes: [],
        sections: [],
        about: [{ order: 1, title: 'Context', body: 'The historical backdrop' }]
    };

    const draft: LessonDraft = {
        // Fix: Added missing totalModulesRequired property to courseMetadata mock
        courseMetadata: {
            id: 'BIBLE-LEAD-101',
            title: 'Foundations',
            description: 'Core course',
            level: 'student (Beginner)',
            language: 'English',
            author: 'Academy',
            totalModulesRequired: 1,
            about: []
        },
        modules: [mockModule],
        lessons: [mockLesson],
        isValid: errors.length === 0,
        errors: errors
    };

    return draft;
  }

  async commitDraft(draft: LessonDraft, author: User): Promise<void> {
    if (!draft.isValid) return;
    if (draft.courseMetadata) await this.publishCourse(draft.courseMetadata);
    for (const mod of draft.modules) await this.publishModule(mod);
    for (const les of draft.lessons) await this.publishLesson(les);
  }
}

export const lessonService = new LessonService();
