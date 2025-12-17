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
  resourcesHeading: "Study Materials",
  resourcesTitle: "Equipping the Saints",
  resourcesSubtitle: "Everything you need to succeed in your quizzing journey, from printable flashcards to AI-generated practice tests.",
  // Why BBL Section
  whyBblHeading: "Why BBL?",
  whyBblItem1: "Structured memorization plans",
  whyBblItem2: "Real-time competition & leaderboards",
  whyBblItem3: "Role-based tools for Mentors & Parents",
  whyBblItem4: "District & Regional tournament support",
  // Feature Cards (Legacy naming)
  feature1Title: "Study Guides",
  feature1Desc: "Comprehensive chapter-by-chapter breakdowns and commentaries.",
  feature2Title: "Flashcards",
  feature2Desc: "Digital and printable sets optimized for spaced repetition.",
  feature3Title: "Quiz Generator",
  feature3Desc: "AI-powered custom quizzes to target your weak areas.",
  // News
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
  // Footer
  footerYear: "2024",
  footerSocials: "Facebook, Twitter, Instagram",
  footerPhone: "+1 (555) 123-4567",
  footerEmail: "contact@buildbiblicalleaders.com",
  footerAddress: "123 Faith Lane, Grace City, GC 77777",
  footerCopyright: "© 2024 Build Biblical Leaders. All rights reserved."
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
    if (storedLessons) {
      this.lessons = JSON.parse(storedLessons);
    } else {
      this.lessons = [
        {
            id: 'demo-lesson-1',
            title: 'Advanced Leadership: Shepherd Leadership',
            description: 'A deep dive into 1 Peter 5 for Mentors and Pastors.',
            category: 'Leadership',
            lesson_type: 'Leadership',
            targetAudience: 'Mentor',
            author: 'Main Admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            views: 12,
            sections: [
                {
                    id: 'sec-1', type: 'note', title: 'The Shepherd Model', sequence: 1, 
                    body: '<p>Shepherding is not just about leading; it is about caring. 1 Peter 5 exhorts elders to be shepherds of God\'s flock...</p>'
                },
                {
                    id: 'sec-2', type: 'quiz_group', title: 'Reflection', sequence: 2,
                    quizzes: [
                        {
                            id: 'q1', type: 'Note Quiz', text: 'According to 1 Peter 5, what is the motivation for serving?', sequence: 1,
                            options: [
                                { id: 'o1', label: 'A', text: 'Greed', isCorrect: false, explanation: 'Incorrect.' },
                                { id: 'o2', label: 'B', text: 'Willingness to serve', isCorrect: true, explanation: 'Correct. "Not because you must, but because you are willing."' },
                                { id: 'o3', label: 'C', text: 'Power', isCorrect: false, explanation: 'Incorrect.' },
                                { id: 'o4', label: 'D', text: 'Obligation', isCorrect: false, explanation: 'Incorrect.' }
                            ]
                        }
                    ]
                }
            ]
        }
      ]; 
      this.saveLessons();
    }

    const storedAttempts = localStorage.getItem(DB_ATTEMPTS_KEY);
    if (storedAttempts) {
      this.attempts = JSON.parse(storedAttempts);
    }

    const storedResources = localStorage.getItem(DB_RESOURCES_KEY);
    if (storedResources) {
      this.resources = JSON.parse(storedResources);
    } else {
      this.resources = [
        {
          id: 'res-1', title: '2024 Tournament Rulebook', description: 'Official rules for district and regional quizzing.',
          fileType: 'pdf', url: '#', uploadedBy: 'System Admin', uploadedAt: new Date().toISOString(), size: '2.4 MB'
        }
      ];
      this.saveResources();
    }

    const storedNews = localStorage.getItem(DB_NEWS_KEY);
    if (storedNews) {
      this.news = JSON.parse(storedNews);
    } else {
      this.news = [
        {
          id: 'news-1', title: 'National Finals Registration Open', 
          content: 'Registration is now open for the 2024 National Finals in St. Louis. Please ensure all teams are registered by May 15th.',
          date: new Date().toISOString(), category: 'Announcement', author: 'System Admin'
        }
      ];
      this.saveNews();
    }

    const storedTimers = localStorage.getItem(DB_TIMERS_KEY);
    if (storedTimers) {
        this.timers = JSON.parse(storedTimers);
    }

    const storedModules = localStorage.getItem(DB_MODULES_KEY);
    if (storedModules) {
        this.modules = JSON.parse(storedModules);
    } else {
        this.modules = [
            {
                id: 'mod-foundations',
                title: 'Leadership Foundations',
                description: 'Essential principles for new mentors.',
                lessonIds: ['demo-lesson-1']
            }
        ];
        this.saveModules();
    }

    const storedCerts = localStorage.getItem(DB_CERTIFICATES_KEY);
    if (storedCerts) {
        this.certificates = JSON.parse(storedCerts);
    }

    const storedHomepage = localStorage.getItem(DB_HOMEPAGE_KEY);
    if (storedHomepage) {
        this.homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(storedHomepage) };
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
    if (index >= 0) {
      this.lessons[index] = lesson;
    } else {
      this.lessons.unshift(lesson);
    }
    this.saveLessons();
    
    if (lesson.category === 'Leadership' && !this.modules[0].lessonIds.includes(lesson.id)) {
        this.modules[0].lessonIds.push(lesson.id);
        this.saveModules();
    }
  }

  // --- HOMEPAGE CONTENT ---
  async getHomepageContent(): Promise<HomepageContent> {
      return this.homepage;
  }

  async updateHomepageContent(content: HomepageContent): Promise<void> {
      this.homepage = content;
      this.saveHomepage();
  }

  // --- MODULES & CERTIFICATES ---
  async getModules(): Promise<Module[]> { return this.modules; }
  
  async createModule(title: string, description: string, lessonIds: string[]): Promise<void> {
      const newModule: Module = {
          id: crypto.randomUUID(),
          title, description, lessonIds
      };
      this.modules.push(newModule);
      this.saveModules();
  }

  async checkModuleCompletion(userId: string, lessonId: string): Promise<Module | null> {
      const relevantModules = this.modules.filter(m => m.lessonIds.includes(lessonId));
      for (const mod of relevantModules) {
          let allComplete = true;
          for (const lId of mod.lessonIds) {
              const attempted = await this.hasUserAttemptedLesson(userId, lId);
              if (!attempted) {
                  allComplete = false;
                  break;
              }
          }
          if (allComplete) return mod;
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
          issuerName: 'Build Biblical Leaders',
          uniqueCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          design: design
      };
      this.certificates.unshift(cert);
      this.saveCertificates();
      return cert;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
      return this.certificates.filter(c => c.userId === userId);
  }

  async getAllCertificates(): Promise<Certificate[]> { return this.certificates; }

  async getResources(): Promise<Resource[]> { return this.resources; }
  async addResource(resource: Resource): Promise<void> {
    this.resources.unshift(resource);
    this.saveResources();
  }

  async getNews(): Promise<NewsItem[]> { return this.news; }
  async addNews(news: NewsItem): Promise<void> {
    this.news.unshift(news);
    this.saveNews();
  }

  async parseExcelUpload(file: File): Promise<LessonDraft> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockDraft: LessonDraft = {
      isValid: true,
      errors: [],
      metadata: {
        id: "GENESIS-CH1",
        title: "Bible Study – Genesis 1",
        description: "A study of Genesis chapter 1 with leadership insights",
        book: "Genesis",
        chapter: 1,
        lesson_type: "Mixed",
        targetAudience: "All"
      },
      leadershipNote: {
        title: "The Leadership Mindset in Creation",
        body: `<h3>1. Order from Chaos</h3><p>In the beginning, God created the heavens and the earth. The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.</p><p>This passage teaches us about <strong>Initiative</strong>. Leadership often begins in chaos. It is the leader's role to speak light into darkness and bring order where there is none.</p>`
      },
      bibleQuizzes: [
        {
          question_id: "GEN1-Q1",
          reference: "Genesis 1:1",
          text: "According to Genesis 1:1, what did God create in the beginning?",
          options: [
            { label: "A", text: "Heaven and Earth", isCorrect: true, explanation: "Correct — the verse states “God created the heaven and the earth.”" },
            { label: "B", text: "Light", isCorrect: false, explanation: "Light was created later in verse 3." },
            { label: "C", text: "Plants", isCorrect: false, explanation: "Plants were created later in the chapter." },
            { label: "D", text: "Animals", isCorrect: false, explanation: "Animals were created later in the chapter." }
          ]
        },
        {
          question_id: "GEN1-Q2",
          reference: "Genesis 1:3",
          text: "What was the first thing God said?",
          options: [
            { label: "A", text: "Let there be light", isCorrect: true, explanation: "Correct. Verse 3: 'And God said, Let there be light'" },
            { label: "B", text: "Let us make man", isCorrect: false, explanation: "This happens in verse 26." },
            { label: "C", text: "It is good", isCorrect: false, explanation: "This is God's assessment, not his first command." },
            { label: "D", text: "Where art thou?", isCorrect: false, explanation: "God asks this in Genesis 3." }
          ]
        }
      ],
      noteQuizzes: [
        {
          question_id: "NOTE-Q1",
          reference: "Leadership Note",
          text: "What leadership quality is demonstrated by God’s orderly creation process?",
          options: [
            { label: "A", text: "Strategic planning", isCorrect: true, explanation: "Correct — the note emphasizes God’s deliberate sequencing." },
            { label: "B", text: "Impulsiveness", isCorrect: false, explanation: "Not supported by the note." },
            { label: "C", text: "Indecision", isCorrect: false, explanation: "Contrary to the note." },
            { label: "D", text: "Fearfulness", isCorrect: false, explanation: "Not mentioned in the note." }
          ]
        }
      ]
    };
    if (!mockDraft.metadata.title) {
        mockDraft.isValid = false;
        mockDraft.errors.push("Missing Lesson Title in Metadata.");
    }
    const allQuizzes = [...mockDraft.bibleQuizzes, ...mockDraft.noteQuizzes];
    allQuizzes.forEach((q, idx) => {
        if (q.options.length !== 4) {
            mockDraft.isValid = false;
            mockDraft.errors.push(`Question ${q.question_id || idx} must have exactly 4 options.`);
        }
        if (!q.options.some((o: any) => o.isCorrect)) {
            mockDraft.isValid = false;
            mockDraft.errors.push(`Question ${q.question_id || idx} has no correct answer marked.`);
        }
    });
    return mockDraft;
  }

  convertDraftToLesson(draft: LessonDraft, author: User): Lesson {
    const sections: LessonSection[] = [];
    if (draft.leadershipNote && draft.leadershipNote.body) {
      sections.push({ id: crypto.randomUUID(), type: 'note', title: draft.leadershipNote.title, body: draft.leadershipNote.body, sequence: 1 });
    }
    if (draft.bibleQuizzes && draft.bibleQuizzes.length > 0) {
      sections.push({ id: crypto.randomUUID(), type: 'quiz_group', title: "Bible Knowledge Check", sequence: 2, quizzes: draft.bibleQuizzes.map((q, idx) => ({ id: crypto.randomUUID(), type: 'Bible Quiz', reference: q.reference, text: q.text, sequence: idx, options: q.options.map((o: any) => ({ id: crypto.randomUUID(), label: o.label, text: o.text, isCorrect: o.isCorrect, explanation: o.explanation })) })) });
    }
    if (draft.noteQuizzes && draft.noteQuizzes.length > 0) {
      sections.push({ id: crypto.randomUUID(), type: 'quiz_group', title: "Leadership Application", sequence: 3, quizzes: draft.noteQuizzes.map((q, idx) => ({ id: crypto.randomUUID(), type: 'Note Quiz', reference: 'From Note', text: q.text, sequence: idx, options: q.options.map((o: any) => ({ id: crypto.randomUUID(), label: o.label, text: o.text, isCorrect: o.isCorrect, explanation: o.explanation })) })) });
    }
    const lesson: Lesson = {
      id: draft.metadata.id || crypto.randomUUID(),
      title: draft.metadata.title || "Untitled Lesson",
      description: draft.metadata.description || "",
      lesson_type: draft.metadata.lesson_type || "Mixed",
      targetAudience: draft.metadata.targetAudience || 'All',
      book: draft.metadata.book,
      chapter: draft.metadata.chapter,
      author: author.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published',
      views: 0,
      sections: sections
    };
    return lesson;
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

  async saveQuizTimer(userId: string, lessonId: string, seconds: number): Promise<void> {
      const key = `${userId}_${lessonId}`;
      this.timers[key] = seconds;
      this.saveTimers();
  }

  async getQuizTimer(userId: string, lessonId: string): Promise<number> {
      const key = `${userId}_${lessonId}`;
      return this.timers[key] || 0;
  }
}

export const lessonService = new LessonService();