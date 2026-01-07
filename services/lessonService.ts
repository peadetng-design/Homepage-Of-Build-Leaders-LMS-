import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType, Resource, NewsItem, TargetAudience, Module, Certificate, CertificateDesign, HomepageContent } from '../types';

const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_ATTEMPTS_KEY = 'bbl_db_attempts';
const DB_RESOURCES_KEY = 'bbl_db_resources';
const DB_NEWS_KEY = 'bbl_db_news';
const DB_TIMERS_KEY = 'bbl_db_timers';
const DB_MODULES_KEY = 'bbl_db_modules';
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
  private lessons: Lesson[] = [];
  private attempts: StudentAttempt[] = [];
  private resources: Resource[] = [];
  private news: NewsItem[] = [];
  private timers: Record<string, number> = {}; 
  private modules: Module[] = [];
  private certificates: Certificate[] = [];
  private homepage: HomepageContent = DEFAULT_HOMEPAGE;

  constructor() {
    this.init();
  }

  private init() {
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

    const storedModules = localStorage.getItem(DB_MODULES_KEY);
    if (storedModules) {
        this.modules = JSON.parse(storedModules);
    } else {
        this.modules = [
            {
                id: 'mod-foundations',
                title: 'Foundations of Biblical Leadership',
                description: 'Essential principles for starting your journey.',
                lessonIds: [],
                totalLessonsRequired: 1,
                completionRule: { minimumCompletionPercentage: 100 },
                certificateConfig: {
                    title: 'Leadership Foundation Certificate',
                    description: 'This certifies completion of introductory leadership models.',
                    templateId: 'classic',
                    issuedBy: 'Build Biblical Leaders'
                }
            }
        ];
        this.saveModules();
    }

    const storedCerts = localStorage.getItem(DB_CERTIFICATES_KEY);
    if (storedCerts) this.certificates = JSON.parse(storedCerts);

    const storedHomepage = localStorage.getItem(DB_HOMEPAGE_KEY);
    if (storedHomepage) {
      // Merge keys to avoid issues with older versions
      this.homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(storedHomepage) };
    } else {
      this.homepage = DEFAULT_HOMEPAGE;
    }
  }

  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveAttempts() { localStorage.setItem(DB_ATTEMPTS_KEY, JSON.stringify(this.attempts)); }
  private saveResources() { localStorage.setItem(DB_RESOURCES_KEY, JSON.stringify(this.resources)); }
  private saveNews() { localStorage.setItem(DB_NEWS_KEY, JSON.stringify(this.news)); }
  private saveTimers() { localStorage.setItem(DB_TIMERS_KEY, JSON.stringify(this.timers)); }
  private saveModules() { localStorage.setItem(DB_MODULES_KEY, JSON.stringify(this.modules)); }
  private saveCertificates() { localStorage.setItem(DB_CERTIFICATES_KEY, JSON.stringify(this.certificates)); }
  private saveHomepage() { localStorage.setItem(DB_HOMEPAGE_KEY, JSON.stringify(this.homepage)); }

  async getLessons(): Promise<Lesson[]> { return this.lessons; }
  async getLessonById(id: string): Promise<Lesson | undefined> { return this.lessons.find(l => l.id === id); }
  async getLessonsByIds(ids: string[]): Promise<Lesson[]> { return this.lessons.filter(l => ids.includes(l.id)); }
  
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
    
    // Also remove from modules
    this.modules.forEach(m => {
      m.lessonIds = m.lessonIds.filter(lId => lId !== id);
    });
    this.saveModules();
  }

  async getHomepageContent(): Promise<HomepageContent> { return this.homepage; }
  async updateHomepageContent(content: HomepageContent): Promise<void> { this.homepage = content; this.saveHomepage(); }

  async getModules(): Promise<Module[]> { return this.modules; }
  
  async createModule(module: Module): Promise<void> {
      const exists = this.modules.findIndex(m => m.id === module.id);
      if (exists >= 0) this.modules[exists] = module;
      else this.modules.push(module);
      this.saveModules();
  }

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

      return {
          completed: completedCount,
          total: Math.max(mod.totalLessonsRequired, mod.lessonIds.length),
          lessons: details
      };
  }

  async checkModuleCompletion(userId: string, lessonId: string): Promise<Module | null> {
      const relevantModules = this.modules.filter(m => m.lessonIds.includes(lessonId));
      for (const mod of relevantModules) {
          let lessonsProcessed = 0;
          let totalScore = 0;
          let lessonsDone = 0;

          const requiredCount = Math.max(mod.totalLessonsRequired, mod.lessonIds.length);

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

          if (lessonsDone < requiredCount || lessonsProcessed === 0) continue;

          const avgScore = totalScore / lessonsProcessed;
          if (avgScore >= (mod.completionRule?.minimumCompletionPercentage || 100)) {
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
          userId,
          userName,
          moduleId,
          moduleTitle: mod.title,
          issueDate: new Date().toISOString(),
          issuerName: mod.certificateConfig.issuedBy || 'Build Biblical Leaders',
          uniqueCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          design: design || {
              templateId: mod.certificateConfig.templateId as any || 'classic',
              primaryColor: '#1e1b4b',
              secondaryColor: '#d97706',
              titleOverride: mod.certificateConfig.title,
              messageOverride: mod.certificateConfig.description
          }
      };
      this.certificates.unshift(cert);
      this.saveCertificates();
      return cert;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> { return this.certificates.filter(c => c.userId === userId); }
  async getAllCertificates(): Promise<Certificate[]> { return this.certificates; }
  async getResources(): Promise<Resource[]> { return this.resources; }
  async addResource(resource: Resource): Promise<void> { this.resources.unshift(resource); this.saveResources(); }
  async getNews(): Promise<NewsItem[]> { return this.news; }
  async addNews(news: NewsItem): Promise<void> { this.news.unshift(news); this.saveNews(); }

  async parseExcelUpload(file: File): Promise<LessonDraft> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockDraft: LessonDraft = {
      isValid: true,
      errors: [],
      moduleMetadata: {
        id: "GENESIS-MOD-1",
        title: "Foundations of Creation",
        description: "A deep dive into Genesis 1-3",
        lessonIds: [],
        totalLessonsRequired: 1,
        completionRule: { minimumCompletionPercentage: 100 },
        certificateConfig: {
          title: "Certificate of Creation Mastery",
          description: "This certifies expertise in early Genesis leadership principles.",
          templateId: "classic",
          issuedBy: "Kingdom Academy"
        }
      },
      lessons: [
        {
          metadata: {
            lesson_id: "GEN-CH1",
            module_id: "GENESIS-MOD-1",
            title: "Genesis 1: Divine Order",
            description: "God’s creative order and leadership",
            book: "Genesis",
            chapter: 1,
            lesson_order: 1,
            lesson_type: "Bible",
            targetAudience: "All"
          },
          leadershipNote: {
            title: "Leadership Lessons from Creation",
            body: `<p>Leadership often starts in chaos (void and formless). It requires speaking light into darkness.</p>`
          },
          bibleQuizzes: [
            {
              question_id: "Q1",
              reference: "Genesis 1:1",
              text: "What did God create in the beginning?",
              options: [
                { label: "A", text: "Heaven and Earth", isCorrect: true, explanation: "Explicitly stated in the first verse." },
                { label: "B", text: "Animals", isCorrect: false, explanation: "These were created later in the chapter." },
                { label: "C", text: "The Sun", isCorrect: false, explanation: "Created on Day 4." },
                { label: "D", text: "Plants", isCorrect: false, explanation: "Created on Day 3." }
              ]
            }
          ],
          noteQuizzes: []
        }
      ]
    };

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
        mockDraft.isValid = false;
        mockDraft.errors.push("Invalid file format. Please upload .xlsx or .csv.");
    }
    return mockDraft;
  }

  async commitDraft(draft: LessonDraft, author: User): Promise<void> {
    if (!draft.isValid || !draft.moduleMetadata) return;

    const moduleObj = { ...draft.moduleMetadata, lessonIds: draft.lessons.map(l => l.metadata.lesson_id) };
    await this.createModule(moduleObj);

    for (const dLesson of draft.lessons) {
        const sections: LessonSection[] = [];
        if (dLesson.leadershipNote?.body) {
            sections.push({ 
                id: crypto.randomUUID(), type: 'note', 
                title: dLesson.leadershipNote.title, 
                body: dLesson.leadershipNote.body, sequence: 1 
            });
        }
        if (dLesson.bibleQuizzes.length > 0) {
            sections.push({
                id: crypto.randomUUID(), type: 'quiz_group', title: "Bible Knowledge Check", sequence: 2,
                quizzes: dLesson.bibleQuizzes.map((q, idx) => ({
                    id: q.question_id || crypto.randomUUID(), type: 'Bible Quiz', reference: q.reference, text: q.text, sequence: idx,
                    options: q.options.map((o: any) => ({ ...o, id: crypto.randomUUID() }))
                }))
            });
        }
        const lesson: Lesson = { id: dLesson.metadata.lesson_id, moduleId: dLesson.metadata.module_id, orderInModule: dLesson.metadata.lesson_order, title: dLesson.metadata.title, description: dLesson.metadata.description, lesson_type: dLesson.metadata.lesson_type, targetAudience: dLesson.metadata.targetAudience, book: dLesson.metadata.book, chapter: dLesson.metadata.chapter, author: author.name, authorId: author.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: 'published', views: 0, sections };
        await this.publishLesson(lesson);
    }
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
}

export const lessonService = new LessonService();