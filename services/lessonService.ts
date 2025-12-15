
import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType, Resource, NewsItem } from '../types';

const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_ATTEMPTS_KEY = 'bbl_db_attempts';
const DB_RESOURCES_KEY = 'bbl_db_resources';
const DB_NEWS_KEY = 'bbl_db_news';

class LessonService {
  private lessons: Lesson[] = [];
  private attempts: StudentAttempt[] = [];
  private resources: Resource[] = [];
  private news: NewsItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const storedLessons = localStorage.getItem(DB_LESSONS_KEY);
    if (storedLessons) {
      this.lessons = JSON.parse(storedLessons);
    } else {
      // Seed with some dummy data if empty
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

    // Init Resources
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

    // Init News
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
  }

  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveAttempts() { localStorage.setItem(DB_ATTEMPTS_KEY, JSON.stringify(this.attempts)); }
  private saveResources() { localStorage.setItem(DB_RESOURCES_KEY, JSON.stringify(this.resources)); }
  private saveNews() { localStorage.setItem(DB_NEWS_KEY, JSON.stringify(this.news)); }

  async getLessons(): Promise<Lesson[]> { return this.lessons; }
  async getLessonById(id: string): Promise<Lesson | undefined> { return this.lessons.find(l => l.id === id); }
  
  async publishLesson(lesson: Lesson): Promise<void> {
    const index = this.lessons.findIndex(l => l.id === lesson.id);
    if (index >= 0) {
      this.lessons[index] = lesson;
    } else {
      this.lessons.unshift(lesson);
    }
    this.saveLessons();
  }

  // --- RESOURCES & NEWS ---
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
    // SIMULATED PARSED DATA
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
        body: `<h3>1. Order from Chaos</h3><p>In the beginning...</p>`
      },
      bibleQuizzes: [
        {
          question_id: "GEN1-Q1",
          bible_reference: "Genesis 1:1",
          question_text: "According to Genesis 1:1, what did God create in the beginning?",
          options: [
            { key: "A", text: "Heaven and Earth", is_correct: true, explanation: "Correct." },
            { key: "B", text: "Light", is_correct: false, explanation: "Incorrect." },
            { key: "C", text: "Plants", is_correct: false, explanation: "Incorrect." },
            { key: "D", text: "Animals", is_correct: false, explanation: "Incorrect." }
          ]
        }
      ],
      noteQuizzes: []
    };
    return mockDraft;
  }

  convertDraftToLesson(draft: LessonDraft, author: User): Lesson {
    const sections: LessonSection[] = [];
    if (draft.leadershipNote && draft.leadershipNote.body) {
      sections.push({
        id: crypto.randomUUID(),
        type: 'note',
        title: draft.leadershipNote.title,
        body: draft.leadershipNote.body,
        sequence: 1
      });
    }
    if (draft.bibleQuizzes && draft.bibleQuizzes.length > 0) {
      sections.push({
        id: crypto.randomUUID(),
        type: 'quiz_group',
        title: "Bible Knowledge Check",
        sequence: 2,
        quizzes: draft.bibleQuizzes.map((q, idx) => ({
          id: crypto.randomUUID(),
          type: 'Bible Quiz',
          reference: q.bible_reference,
          text: q.question_text,
          sequence: idx,
          options: q.options.map((o: any) => ({
            id: crypto.randomUUID(),
            label: o.key,
            text: o.text,
            isCorrect: o.is_correct,
            explanation: o.explanation
          }))
        }))
      });
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
    const attempt: StudentAttempt = {
      id: crypto.randomUUID(),
      studentId,
      lessonId,
      quizId,
      selectedOptionId,
      isCorrect,
      score: isCorrect ? 10 : 0,
      attempted_at: new Date().toISOString()
    };
    this.attempts.push(attempt);
    this.saveAttempts();
  }

  async getAttempts(studentId: string, lessonId: string): Promise<StudentAttempt[]> {
    return this.attempts.filter(a => a.studentId === studentId && a.lessonId === lessonId);
  }

  async hasUserAttemptedLesson(userId: string, lessonId: string): Promise<boolean> {
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lessonId);
      return userAttempts.length > 0;
  }
}

export const lessonService = new LessonService();
