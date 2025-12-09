
import { Lesson, User, StudentAttempt, LessonDraft, QuizQuestion, LessonSection, QuizOption, SectionType, LessonType } from '../types';

const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_ATTEMPTS_KEY = 'bbl_db_attempts';

class LessonService {
  private lessons: Lesson[] = [];
  private attempts: StudentAttempt[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const storedLessons = localStorage.getItem(DB_LESSONS_KEY);
    if (storedLessons) {
      this.lessons = JSON.parse(storedLessons);
    } else {
      this.lessons = [];
    }

    const storedAttempts = localStorage.getItem(DB_ATTEMPTS_KEY);
    if (storedAttempts) {
      this.attempts = JSON.parse(storedAttempts);
    }
  }

  private saveLessons() {
    localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons));
  }

  private saveAttempts() {
    localStorage.setItem(DB_ATTEMPTS_KEY, JSON.stringify(this.attempts));
  }

  async getLessons(): Promise<Lesson[]> {
    return this.lessons;
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    return this.lessons.find(l => l.id === id);
  }

  async publishLesson(lesson: Lesson): Promise<void> {
    const index = this.lessons.findIndex(l => l.id === lesson.id);
    if (index >= 0) {
      this.lessons[index] = lesson;
    } else {
      this.lessons.unshift(lesson);
    }
    this.saveLessons();
  }

  async parseExcelUpload(file: File): Promise<LessonDraft> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // SIMULATED PARSED DATA based on prompt specification
    // In a real implementation, this would use a library like SheetJS to parse the actual 3 sheets
    const mockDraft: LessonDraft = {
      isValid: true,
      errors: [],
      metadata: {
        id: "GENESIS-CH1",
        title: "Bible Study – Genesis 1",
        description: "A study of Genesis chapter 1 with leadership insights",
        book: "Genesis",
        chapter: 1,
        lesson_type: "Mixed"
      },
      leadershipNote: {
        title: "The Leadership Mindset in Creation",
        body: `<h3>1. Order from Chaos</h3>
        <p>In the beginning, the earth was formless and empty. Darkness was over the surface of the deep. This state of chaos is where leadership begins. A leader does not fear chaos but sees it as an opportunity to establish order.</p>
        <p>God did not create everything at once. He used a sequential, logical process: Light first, then structure (sky/water), then land, then life. This teaches us the importance of <strong>strategic sequencing</strong> in leadership.</p>
        <h3>2. Delegation of Authority</h3>
        <p>Upon creating humanity, God immediately delegated authority: "Rule over the fish in the sea and the birds in the sky." Leadership is not about hoarding power but empowering others to steward resources effectively.</p>`
      },
      bibleQuizzes: [
        {
          question_id: "GEN1-Q1",
          bible_reference: "Genesis 1:1",
          question_text: "According to Genesis 1:1, what did God create in the beginning?",
          options: [
            { key: "A", text: "Heaven and Earth", is_correct: true, explanation: "Correct — the verse states “God created the heaven and the earth.”" },
            { key: "B", text: "Light", is_correct: false, explanation: "Light was created later in verse 3." },
            { key: "C", text: "Plants", is_correct: false, explanation: "Plants were created later in the chapter." },
            { key: "D", text: "Animals", is_correct: false, explanation: "Animals were created later in the chapter." }
          ]
        },
        {
          question_id: "GEN1-Q2",
          bible_reference: "Genesis 1:3",
          question_text: "What was the first thing God spoke into existence?",
          options: [
            { key: "A", text: "Man", is_correct: false, explanation: "Man was created on the 6th day." },
            { key: "B", text: "Light", is_correct: true, explanation: "Correct - God said 'Let there be light'." },
            { key: "C", text: "The Sun", is_correct: false, explanation: "The sun was created on the 4th day." },
            { key: "D", text: "Water", is_correct: false, explanation: "Water was already present." }
          ]
        }
      ],
      noteQuizzes: [
        {
          question_id: "NOTE-Q1",
          source_note_title: "The Leadership Mindset in Creation",
          question_text: "What leadership quality is demonstrated by God’s orderly creation process?",
          options: [
            { key: "A", text: "Strategic planning", is_correct: true, explanation: "Correct — the note emphasizes God’s deliberate sequencing." },
            { key: "B", text: "Impulsiveness", is_correct: false, explanation: "Not supported by the note." },
            { key: "C", text: "Indecision", is_correct: false, explanation: "Contrary to the note." },
            { key: "D", text: "Fearfulness", is_correct: false, explanation: "Not mentioned in the note." }
          ]
        }
      ]
    };

    return mockDraft;
  }

  convertDraftToLesson(draft: LessonDraft, author: User): Lesson {
    const sections: LessonSection[] = [];

    // 1. Leadership Note
    if (draft.leadershipNote && draft.leadershipNote.body) {
      sections.push({
        id: crypto.randomUUID(),
        type: 'note',
        title: draft.leadershipNote.title,
        body: draft.leadershipNote.body,
        sequence: 1
      });
    }

    // 2. Bible Quizzes
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

    // 3. Note Quizzes
    if (draft.noteQuizzes && draft.noteQuizzes.length > 0) {
      sections.push({
        id: crypto.randomUUID(),
        type: 'quiz_group',
        title: "Leadership Application",
        sequence: 3,
        quizzes: draft.noteQuizzes.map((q, idx) => ({
          id: crypto.randomUUID(),
          type: 'Note Quiz',
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

  // Check if a user has attempted ANY quiz in a specific lesson
  async hasUserAttemptedLesson(userId: string, lessonId: string): Promise<boolean> {
      const userAttempts = this.attempts.filter(a => a.studentId === userId && a.lessonId === lessonId);
      return userAttempts.length > 0;
  }
}

export const lessonService = new LessonService();
