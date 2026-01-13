

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
  
  async getModules(): Promise<Module[]> { return this.modules; }
  async getModuleById(id: string): Promise<Module | undefined> { return this.modules.find(m => m.id === id); }
  async getModulesByCourseId(courseId: string): Promise<Module[]> { return this.modules.filter(m => m.courseId === courseId); }

  async getLessons(): Promise<Lesson[]> { return this.lessons; }
  async getLessonById(id: string): Promise<Lesson | undefined> { return this.lessons.find(l => l.id === id); }
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> { return this.lessons.filter(l => l.moduleId === moduleId); }

  // Added getLessonsByIds method fix
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

  async getModuleProgress(userId: string, moduleId: string): Promise<{ completed: number, total: number, lessons: { title: string, done: boolean }[] }> {
      const mod = this.modules.find(m => m.id === moduleId);
      if (!mod) return { completed: 0, total: 0, lessons: [] };
      const details = [];
      let completedCount = 0;
      for (const lId of mod.lessonIds) {
          const lesson = this.lessons.find(l => l.id === lId);
          if (!lesson) continue;
          const isDone = await this.hasUserAttemptedLesson(userId, lId);
          if (isDone) completedCount++;
          details.push({ title: lesson.title, done: isDone });
      }
      return { completed: completedCount, total: Math.max(mod.totalLessonsRequired, mod.lessonIds.length), lessons: details };
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
              const uniqueQuizzesInLesson = lesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
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

  async checkModuleCompletion(userId: string, lessonId: string): Promise<Module | null> {
      const relevantModules = this.modules.filter(m => m.lessonIds.includes(lessonId));
      for (const mod of relevantModules) {
          const eligible = await this.getEligibleModulesForUser(userId);
          if (eligible.find(e => e.id === mod.id)) {
              const alreadyIssued = this.certificates.find(c => c.userId === userId && c.moduleId === mod.id);
              if (!alreadyIssued) return mod;
          }
      }
      return null;
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

  async getUserCertificates(userId: string): Promise<Certificate[]> { return this.certificates.filter(c => c.userId === userId); }
  async getAllCertificates(): Promise<Certificate[]> { return this.certificates; }
  async verifyCertificate(code: string): Promise<Certificate | undefined> {
      return this.certificates.find(c => c.uniqueCode === code.toUpperCase());
  }

  async getResources(): Promise<Resource[]> { return this.resources; }
  async addResource(resource: Resource, actor: User): Promise<void> { 
      const existing = this.resources.findIndex(r => r.id === resource.id);
      if (existing >= 0) this.resources[existing] = resource;
      else this.resources.unshift(resource);
      this.saveResources(); 
  }
  async deleteResource(id: string, actor: User): Promise<void> {
      this.resources = this.resources.filter(r => r.id !== id);
      this.saveResources();
  }

  async getNews(): Promise<NewsItem[]> { return this.news; }
  async addNews(news: NewsItem, actor: User): Promise<void> { 
      const existing = this.news.findIndex(n => n.id === news.id);
      if (existing >= 0) this.news[existing] = news;
      else this.news.unshift(news);
      this.saveNews(); 
  }
  async deleteNews(id: string, actor: User): Promise<void> {
      this.news = this.news.filter(n => n.id !== id);
      this.saveNews();
  }

  async parseExcelUpload(file: File): Promise<LessonDraft> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // MOCK PARSER logic for 8 sheets
    const errors: ImportError[] = [];
    
    // Simulating sheet validation
    if (!file.name.endsWith('.xlsx')) {
        errors.push({ sheet: 'System', row: 0, column: 'File', message: 'Protocol requires .xlsx format' });
    }

    const draft: LessonDraft = {
        courseMetadata: {
            id: 'BIBLE-LEAD-101',
            title: 'Biblical Leadership Foundations',
            subtitle: 'Mastering the Art of Discipleship',
            description: 'A 12-week intensive on the life of David.',
            level: 'Intermediate',
            language: 'English',
            author: 'Kingdom Academy',
            about: [
                { order: 1, title: "Overview", body: "Comprehensive look at leadership." },
                { order: 2, title: "Mission", body: "Preparing the next generation." },
                { order: 3, title: "Curriculum", body: "8 Modules of intense study." },
                { order: 4, title: "Expectations", body: "Consistent engagement required." },
                { order: 5, title: "Certification", body: "Verification upon completion." }
            ]
        },
        modules: [{
            id: 'MOD-1',
            courseId: 'BIBLE-LEAD-101',
            title: 'Heart of a Leader',
            description: 'Focusing on internal character.',
            order: 1,
            lessonIds: ['LES-1'],
            totalLessonsRequired: 1,
            about: [
                { order: 1, title: "Context", body: "Character vs Competence." },
                { order: 2, title: "Biblical Basis", body: "Samuels search for a King." },
                { order: 3, title: "Learning Objectives", body: "Identify core heart values." },
                { order: 4, title: "Reading List", body: "1 Samuel 16." },
                { order: 5, title: "Key Principles", body: "God looks at the heart." }
            ],
            completionRule: { minimumCompletionPercentage: 100 },
            certificateConfig: { title: "Heart Mastery", description: "Leader with a pure heart.", templateId: 'classic', issuedBy: 'Academy' }
        }],
        lessons: [{
            id: 'LES-1',
            moduleId: 'MOD-1',
            orderInModule: 1,
            title: 'Anointing of David',
            description: 'How God selects unlikely leaders.',
            lesson_type: 'Bible',
            targetAudience: 'All',
            book: '1 Samuel',
            chapter: 16,
            author: 'System',
            authorId: 'sys',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            views: 0,
            sections: [
                { id: 'sec-1', type: 'note', title: 'The Anointing', body: 'David was chosen while others were rejected.', sequence: 1 },
                { id: 'sec-2', type: 'quiz_group', title: 'Knowledge Check', sequence: 2, quizzes: [
                    { id: 'q-1', type: 'Bible Quiz', text: "Who was David's father?", sequence: 1, options: [
                        { id: 'o1', label: 'A', text: 'Jesse', isCorrect: true, explanation: 'Correct' },
                        { id: 'o2', label: 'B', text: 'Saul', isCorrect: false, explanation: 'Incorrect' },
                        { id: 'o3', label: 'C', text: 'Samuel', isCorrect: false, explanation: 'Incorrect' },
                        { id: 'o4', label: 'D', text: 'Eli', isCorrect: false, explanation: 'Incorrect' },
                    ]}
                ]}
            ],
            about: [
                { order: 1, title: "Introduction", body: "Introduction to 1 Samuel 16." },
                { order: 2, title: "Historical Context", body: "The state of Israel under Saul." },
                { order: 3, title: "The Prophet", body: "Samuel's role in the transition." },
                { order: 4, title: "The Family", body: "The house of Jesse." },
                { order: 5, title: "The Rejection", body: "Why Eliab was not chosen." },
                { order: 6, title: "The Selection", body: "The youngest comes from the field." },
                { order: 7, title: "Spiritual Impact", body: "The Spirit of the Lord came upon him." }
            ]
        }],
        isValid: errors.length === 0,
        errors
    };

    return draft;
  }

  async commitDraft(draft: LessonDraft, author: User): Promise<void> {
    if (!draft.isValid) return;
    if (draft.courseMetadata) await this.publishCourse(draft.courseMetadata);
    for (const mod of draft.modules) await this.publishModule(mod);
    for (const les of draft.lessons) await this.publishLesson(les);
  }

  async submitAttempt(studentId: string, lessonId: string, quizId: string, selectedOptionId: string, isCorrect: boolean): Promise<void> {
    const attempt: StudentAttempt = { id: crypto.randomUUID(), studentId, lessonId, quizId, selectedOptionId, isCorrect, score: isCorrect ? 10 : 0, attempted_at: new Date().toISOString() };
    this.attempts.push(attempt);
    this.saveAttempts();
  }

  async getAttempts(studentId: string, lessonId: string): Promise<StudentAttempt[]> { return this.attempts.filter(a => a.studentId === studentId && a.lessonId === lessonId); }
  
  async hasUserAttemptedLesson(userId: string, lessonId: string): Promise<boolean> {
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lessonId);
      const lesson = this.lessons.find(l => l.id === lessonId);
      if (!lesson) return false;
      const totalQ = lesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
      const answeredQ = new Set(userAttempts.map(a => a.quizId)).size;
      return answeredQ >= totalQ && totalQ > 0;
  }

  async saveQuizTimer(userId: string, lessonId: string, seconds: number): Promise<void> { const key = `${userId}_${lessonId}`; this.timers[key] = seconds; this.saveTimers(); }
  async getQuizTimer(userId: string, lessonId: string): Promise<number> { const key = `${userId}_${lessonId}`; return this.timers[key] || 0; }
  
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
          const uniqueQuizzesInLesson = lesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
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
              const uniqueQuizzesInLesson = lesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
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
}

export const lessonService = new LessonService();
