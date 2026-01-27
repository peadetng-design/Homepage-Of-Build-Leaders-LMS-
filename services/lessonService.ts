import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType, Resource, NewsItem, TargetAudience, Module, Certificate, CertificateDesign, HomepageContent, Course, AboutSegment, ImportError, LeadershipNote, ProficiencyLevel } from '../types';
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

    const storedNotes = localStorage.getItem(DB_NOTES_KEY);
    if (storedNotes) this.userNotes = JSON.parse(storedNotes);

    const storedHomepage = localStorage.getItem(DB_HOMEPAGE_KEY);
    if (storedHomepage) {
      this.homepage = { ...DEFAULT_HOMEPAGE, ...JSON.parse(storedHomepage) };
    }
  }

  private forceSync() {
    this.init();
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
  private saveNotes() { localStorage.setItem(DB_NOTES_KEY, JSON.stringify(this.userNotes)); }

  private purgeStaleLessonData(lessonId: string) {
    this.attempts = this.attempts.filter(a => a.lessonId !== lessonId);
    Object.keys(this.timers).forEach(key => {
        if (key.endsWith(`_${lessonId}`)) delete this.timers[key];
    });
    Object.keys(this.userNotes).forEach(key => {
        if (key.endsWith(`_${lessonId}`)) delete this.userNotes[key];
    });
    this.saveAttempts();
    this.saveTimers();
    this.saveNotes();
  }

  async saveUserLessonNote(userId: string, lessonId: string, text: string): Promise<void> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    this.userNotes[key] = text;
    this.saveNotes();
  }

  async getUserLessonNote(userId: string, lessonId: string): Promise<string> {
    this.forceSync();
    const key = `${userId}_${lessonId}`;
    return this.userNotes[key] || "";
  }

  async getCourses(): Promise<Course[]> { 
    this.forceSync();
    return this.courses; 
  }
  
  async getCourseById(id: string): Promise<Course | undefined> { 
    this.forceSync();
    return this.courses.find(c => c.id === id); 
  }
  
  async getModules(): Promise<Module[]> { 
    this.forceSync();
    return this.modules; 
  }
  
  async getModuleById(id: string): Promise<Module | undefined> { 
    this.forceSync();
    return this.modules.find(m => m.id === id); 
  }
  
  async getModulesByCourseId(courseId: string, customOrder?: string[]): Promise<Module[]> { 
    this.forceSync();
    const filtered = this.modules.filter(m => m.courseId === courseId);
    if (customOrder && customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, idx) => [id, idx]));
        return [...filtered].sort((a, b) => {
            const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999;
            const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999;
            return idxA - idxB;
        });
    }
    return filtered.sort((a, b) => a.order - b.order);
  }

  async getLessons(): Promise<Lesson[]> { 
    this.forceSync();
    return this.lessons; 
  }
  
  async getLessonById(id: string): Promise<Lesson | undefined> { 
    this.forceSync();
    return this.lessons.find(l => l.id === id); 
  }
  
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> { 
    this.forceSync();
    return this.lessons.filter(l => l.moduleId === moduleId).sort((a, b) => a.orderInModule - b.orderInModule); 
  }

  async getAdjacentLessons(lessonId: string): Promise<{ prev?: string; next?: string }> {
      this.forceSync();
      const currentLesson = this.lessons.find(l => l.id === lessonId);
      if (!currentLesson) return {};

      const currentModule = this.modules.find(m => m.id === currentLesson.moduleId);
      if (!currentModule) return {};

      const currentCourse = this.courses.find(c => c.id === currentModule.courseId);
      if (!currentCourse) return {};

      // Identify entire course module registry in order
      const courseModules = this.modules
        .filter(m => m.courseId === currentCourse.id)
        .sort((a, b) => a.order - b.order);

      // Identify entire module lesson registry in order
      const moduleLessons = this.lessons
        .filter(l => l.moduleId === currentModule.id)
        .sort((a, b) => a.orderInModule - b.orderInModule);

      const currentIdx = moduleLessons.findIndex(l => l.id === lessonId);
      const modIdx = courseModules.findIndex(m => m.id === currentModule.id);

      let prevId: string | undefined;
      let nextId: string | undefined;

      // PREVIOUS LESSON CALCULATION
      if (currentIdx > 0) {
          prevId = moduleLessons[currentIdx - 1].id;
      } else if (modIdx > 0) {
          const prevMod = courseModules[modIdx - 1];
          const prevModLessons = this.lessons
            .filter(l => l.moduleId === prevMod.id)
            .sort((a, b) => a.orderInModule - b.orderInModule);
          if (prevModLessons.length > 0) prevId = prevModLessons[prevModLessons.length - 1].id;
      }

      // NEXT LESSON CALCULATION
      if (currentIdx < moduleLessons.length - 1) {
          nextId = moduleLessons[currentIdx + 1].id;
      } else if (modIdx < courseModules.length - 1) {
          const nextMod = courseModules[modIdx + 1];
          const nextModLessons = this.lessons
            .filter(l => l.moduleId === nextMod.id)
            .sort((a, b) => a.orderInModule - b.orderInModule);
          if (nextModLessons.length > 0) nextId = nextModLessons[0].id;
      }

      return { prev: prevId, next: nextId };
  }

  async publishCourse(course: Course): Promise<void> {
    this.forceSync();
    const idx = this.courses.findIndex(c => c.id === course.id);
    if (idx >= 0) { this.courses[idx] = { ...course }; } else { this.courses.unshift({ ...course }); }
    this.saveCourses();
  }

  async publishModule(module: Module): Promise<void> {
    this.forceSync();
    const idx = this.modules.findIndex(m => m.id === module.id);
    if (idx >= 0) { this.modules[idx] = { ...module }; } else { this.modules.unshift({ ...module }); }
    this.saveModules();
  }

  async publishLesson(lesson: Lesson): Promise<void> {
    this.forceSync();
    const index = this.lessons.findIndex(l => l.id === lesson.id);
    if (index >= 0) { this.purgeStaleLessonData(lesson.id); this.lessons[index] = { ...lesson }; } else { this.lessons.unshift({ ...lesson }); }
    this.saveLessons();
    if (lesson.moduleId) {
        const mod = this.modules.find(m => m.id === lesson.moduleId);
        if (mod) {
            if (!mod.lessonIds) mod.lessonIds = [];
            if (!mod.lessonIds.includes(lesson.id)) { mod.lessonIds.push(lesson.id); this.saveModules(); }
        }
    }
  }

  async deleteLesson(id: string): Promise<void> {
    this.forceSync();
    this.lessons = this.lessons.filter(l => l.id !== id);
    this.purgeStaleLessonData(id);
    this.saveLessons();
    this.modules.forEach(m => { if (m.lessonIds) m.lessonIds = m.lessonIds.filter(lId => lId !== id); });
    this.saveModules();
  }

  async getHomepageContent(): Promise<HomepageContent> { return this.homepage; }
  async updateHomepageContent(content: HomepageContent): Promise<void> { this.homepage = content; this.saveHomepage(); }

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
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lessonId);
      const lesson = this.lessons.find(l => l.id === lessonId); if (!lesson) return false;
      const totalQ = (lesson.bibleQuizzes?.length || 0) + (lesson.noteQuizzes?.length || 0);
      return totalQ === 0 ? true : new Set(userAttempts.map(a => a.quizId)).size >= totalQ;
  }

  async submitAttempt(studentId: string, lessonId: string, quizId: string, selectedOptionId: string, isCorrect: boolean): Promise<void> {
    this.forceSync();
    this.attempts.push({ id: crypto.randomUUID(), studentId, lessonId, quizId, selectedOptionId, isCorrect, score: isCorrect ? 10 : 0, attempted_at: new Date().toISOString() });
    this.saveAttempts();
  }

  async getAttempts(studentId: string, lessonId: string): Promise<StudentAttempt[]> { this.forceSync(); return this.attempts.filter(a => a.studentId === studentId && a.lessonId === lessonId); }
  async saveQuizTimer(userId: string, lessonId: string, seconds: number): Promise<void> { const key = `${userId}_${lessonId}`; this.timers[key] = seconds; this.saveTimers(); }
  async getQuizTimer(userId: string, lessonId: string): Promise<number> { const key = `${userId}_${lessonId}`; return this.timers[key] || 0; }
  async getResources(): Promise<Resource[]> { this.forceSync(); return this.resources; }
  async addResource(resource: Resource, actor: User): Promise<void> { this.forceSync(); this.resources.unshift(resource); this.saveResources(); }
  async deleteResource(id: string, actor: User): Promise<void> { this.forceSync(); this.resources = this.resources.filter(r => r.id !== id); this.saveResources(); }
  async getNews(): Promise<NewsItem[]> { this.forceSync(); return this.news; }
  async addNews(news: NewsItem, actor: User): Promise<void> { this.forceSync(); this.news.unshift(news); this.saveNews(); }
  async deleteNews(id: string, actor: User): Promise<void> { this.forceSync(); this.news = this.news.filter(n => n.id !== id); this.saveNews(); }
  async getUserCertificates(userId: string): Promise<Certificate[]> { this.forceSync(); return this.certificates.filter(c => c.userId === userId); }
  async getAllCertificates(): Promise<Certificate[]> { this.forceSync(); return this.certificates; }
  async verifyCertificate(code: string): Promise<Certificate | undefined> { this.forceSync(); return this.certificates.find(c => c.uniqueCode === code.toUpperCase()); }

  async issueCertificate(userId: string, userName: string, moduleId: string, design?: CertificateDesign): Promise<Certificate> {
      this.forceSync();
      const mod = this.modules.find(m => m.id === moduleId); if (!mod) throw new Error("Module not found");
      const cert: Certificate = { id: crypto.randomUUID(), userId, userName, moduleId, moduleTitle: mod.title, issueDate: new Date().toISOString(), issuerName: mod.certificateConfig.issuedBy || 'Build Biblical Leaders', uniqueCode: Math.random().toString(36).substring(2, 10).toUpperCase(), design: design || { templateId: mod.certificateConfig.templateId as any || 'classic', primaryColor: '#1e1b4b', secondaryColor: '#d97706', titleOverride: mod.certificateConfig.title, messageOverride: mod.certificateConfig.description } };
      this.certificates.unshift(cert); this.saveCertificates(); return cert;
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
          n.trim().toLowerCase() === name.trim().toLowerCase()
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

    // Mandatory Sheet Names mapped case-insensitively
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

    // Step 1: Course
    const rawCourse = courseData[0];
    const course: Course = {
        id: (getRowValue(rawCourse, ['course_id', 'id']) || 'ID-MISSING').toString(),
        title: (getRowValue(rawCourse, ['course_title', 'title']) || 'Untitled Course').toString(),
        subtitle: (getRowValue(rawCourse, ['course_subtitle', 'subtitle']) || '').toString(),
        description: (getRowValue(rawCourse, ['course_description', 'description']) || '').toString(),
        level: mapToProficiencyLevel(getRowValue(rawCourse, ['course_level', 'level', 'category'])),
        language: (getRowValue(rawCourse, ['course_language', 'language']) || 'English').toString(),
        author: (getRowValue(rawCourse, ['course_author', 'author']) || 'BBL Institute').toString(),
        totalModulesRequired: 0,
        about: aboutCourseData
            .filter(a => (getRowValue(a, ['course_id', 'id']) || '') === (getRowValue(rawCourse, ['course_id', 'id']) || ''))
            .map(a => ({ 
                order: parseInt(getRowValue(a, ['segment_order', 'order'])) || 0, 
                title: (getRowValue(a, ['segment_title', 'title']) || '').toString(), 
                body: (getRowValue(a, ['segment_body', 'body']) || '').toString() 
            }))
            .sort((a, b) => a.order - b.order)
    };

    if (course.about.length === 0 && courseData.length > 0) errors.push({ sheet: 'About_Course (NEW)', row: 1, column: 'Segments', message: 'Registry Requirement: At least 1 segment required.', severity: 'error' });

    // Step 2: Modules
    const modules: Module[] = moduleData.map((m, idx) => {
        return {
            id: (getRowValue(m, ['module_id', 'id']) || '').toString(), 
            courseId: course.id, 
            title: (getRowValue(m, ['module_title', 'title']) || '').toString(), 
            description: (getRowValue(m, ['module_description', 'description']) || '').toString(),
            order: parseInt(getRowValue(m, ['module_order', 'order'])) || 1, 
            lessonIds: [], 
            totalLessonsRequired: 0,
            about: aboutModuleData
                .filter(a => (getRowValue(a, ['module_id', 'id']) || '') === (getRowValue(m, ['module_id', 'id']) || ''))
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

    // Step 3: Lessons
    const lessons: Lesson[] = lessonData.map((l, idx) => {
        const moduleId = (getRowValue(l, ['module_id', 'id']) || '').toString();
        const lessonId = (getRowValue(l, ['lesson_id', 'id']) || '').toString();
        
        const currentLesson: Lesson = {
            id: lessonId, 
            moduleId: moduleId, 
            orderInModule: parseInt(getRowValue(l, ['lesson_order', 'order'])) || 1, 
            title: (getRowValue(l, ['lesson_title', 'title']) || '').toString(),
            description: (getRowValue(l, ['lesson_description', 'description']) || '').toString(), 
            lesson_type: 'Mixed', 
            targetAudience: 'All', 
            book: (getRowValue(l, ['bible_book', 'book']) || '').toString(), 
            chapter: parseInt(getRowValue(l, ['bible_chapter', 'chapter'])) || 1,
            leadershipNotes: [{ 
                id: crypto.randomUUID(), 
                title: (getRowValue(l, ['leadership_note_title']) || 'Leadership Insights').toString(), 
                body: (getRowValue(l, ['leadership_note_body']) || '').toString() 
            }],
            author: course.author, 
            authorId: 'sys', 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString(), 
            status: 'published', 
            views: 0,
            about: aboutLessonData
                .filter(a => (getRowValue(a, ['lesson_id', 'id']) || '') === lessonId)
                .map(a => ({ 
                    order: parseInt(getRowValue(a, ['segment_order', 'order'])) || 0, 
                    title: (getRowValue(a, ['segment_title', 'title']) || '').toString(), 
                    body: (getRowValue(a, ['segment_body', 'body']) || '').toString() 
                })).sort((a, b) => a.order - b.order),
            bibleQuizzes: [], noteQuizzes: [], sections: []
        };

        if (currentLesson.about.length === 0) errors.push({ sheet: 'About_Lesson (NEW)', row: idx + 2, column: 'Segments', message: `Protocol Violation: Lesson ${lessonId} requires 1+ 'About' segments.`, severity: 'error' });
        
        return currentLesson;
    });

    // Step 4: Quizzes - Forced unique question IDs for independent scoring
    bibleQuizData.forEach((q, idx) => {
        const lessonId = (getRowValue(q, ['lesson_id', 'id']) || '').toString();
        const les = lessons.find(l => l.id === lessonId);
        if (les) {
            const questionId = (getRowValue(q, ['question_id', 'id']) || '').toString();
            // Use a globally unique seed to ensure questions across different lessons never conflict
            const uniqueId = questionId ? `${lessonId}_${questionId}_b${idx}` : `bq_${lessonId}_${idx}_${crypto.randomUUID().substring(0, 4)}`;
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
                    isCorrect: (getRowValue(q, ['correct_option']) || '').toString().toLowerCase() === `option_${lbl.toLowerCase()}` || (getRowValue(q, ['correct_option']) || '').toString() === lbl, 
                    explanation: (getRowValue(q, [`explanation_${lbl}`]) || '').toString() 
                }))
            });
        }
    });

    noteQuizData.forEach((q, idx) => {
        const lessonId = (getRowValue(q, ['lesson_id', 'id']) || '').toString();
        const les = lessons.find(l => l.id === lessonId);
        if (les) {
            const questionId = (getRowValue(q, ['question_id', 'id']) || '').toString();
            // Use a globally unique seed to ensure questions across different lessons never conflict
            const uniqueId = questionId ? `${lessonId}_${questionId}_n${idx}` : `nq_${lessonId}_${idx}_${crypto.randomUUID().substring(0, 4)}`;
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
                    isCorrect: (getRowValue(q, ['correct_option']) || '').toString().toLowerCase() === `option_${lbl.toLowerCase()}` || (getRowValue(q, ['correct_option']) || '').toString() === lbl, 
                    explanation: (getRowValue(q, [`explanation_${lbl}`]) || '').toString() 
                }))
            });
        }
    });

    // Final Mapping Check
    modules.forEach(m => { 
        m.lessonIds = lessons.filter(l => l.moduleId === m.id).map(l => l.id); 
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