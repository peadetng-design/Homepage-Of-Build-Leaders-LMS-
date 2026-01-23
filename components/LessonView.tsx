
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, QuizQuestion, QuizOption, User, Module, Course, AboutSegment, LeadershipNote } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, BookOpen, X, CheckCircle, Target, Sparkles, Globe, Layers, PenTool, Save, Activity, Loader2 } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); 
  const [parentModule, setParentModule] = useState<Module | null>(null);
  const [parentCourse, setParentCourse] = useState<Course | null>(null);
  const [activeAboutType, setActiveAboutType] = useState<'course' | 'module' | 'lesson' | null>(null);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState({ correct: 0, total: 0 });
  
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    startTelemetry();
    return () => stopTelemetry();
  }, [lesson.id]);

  const startTelemetry = async () => {
    const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedSeconds(initialTime);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next % 5 === 0) {
              lessonService.saveQuizTimer(currentUser.id, lesson.id, next);
          }
          return next;
      });
    }, 1000);
  };

  const stopTelemetry = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedSeconds);
  };

  const loadData = async () => {
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    const mod = await lessonService.getModuleById(lesson.moduleId);
    if (mod) {
        setParentModule(mod);
        const course = await lessonService.getCourseById(mod.courseId);
        if (course) setParentCourse(course);
    }
    const attemptMap: Record<string, string> = {};
    let scoreCount = 0;
    history.forEach(h => { 
        attemptMap[h.quizId] = h.selectedOptionId;
        if (h.isCorrect) scoreCount++;
    });
    setAttempts(attemptMap);

    const totalQ = (lesson.bibleQuizzes?.length || 0) + (lesson.noteQuizzes?.length || 0);
    setCurrentScore({ correct: scoreCount, total: totalQ });

    const savedNote = await lessonService.getUserLessonNote(currentUser.id, lesson.id);
    setNoteText(savedNote);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));
    if (option.isCorrect) {
        setCurrentScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await lessonService.saveUserLessonNote(currentUser.id, lesson.id, noteText);
      setTimeout(() => setIsSavingNote(false), 800);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? [h, m, s].map(v => v.toString().padStart(2, '0')).join(':') : [m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const AboutSection = ({ segments }: { segments: AboutSegment[] }) => (
    <div className="space-y-6 mt-4 h-full overflow-y-auto custom-scrollbar pr-3 pb-8">
        {segments.length > 0 ? segments.map((seg, idx) => (
            <div key={idx} className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group/seg">
                <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs border border-indigo-100">P{seg.order}</span>
                    <h5 className="text-[12px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5>
                </div>
                <div className="text-[13px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: seg.body }} />
            </div>
        )) : (
            <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Empty Perspectives</p>
            </div>
        )}
    </div>
  );

  const renderQuizCard = (quiz: QuizQuestion) => {
    const selectedOptionId = attempts[quiz.id];
    const isAnswered = !!selectedOptionId;

    return (
      <div key={quiz.id} className="bg-slate-50/50 rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-6 group/card">
        <div className="p-1 md:p-3"> 
          {quiz.referenceText && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <BookOpen size={14} className="text-indigo-500 shrink-0" />
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-[1.1] w-full">
                {quiz.referenceText}
              </span>
            </div>
          )}

          {/* QUESTION TEXT: Changed font-serif to font-sans for mixed-case support */}
          <h3 className="text-[1.3rem] font-sans font-black text-gray-900 leading-[1.2] mb-6 px-1 w-full">
            {quiz.text}
          </h3>

          {/* OPTIONS GRID: Increased gap from gap-1 to gap-12 to prevent overlap during magnification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-4 py-4">
            {quiz.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.isCorrect;
              const userCorrect = quiz.options.find(o => o.id === selectedOptionId)?.isCorrect;
              
              let statusClass = "border-gray-100 bg-white hover:border-indigo-300";
              
              if (isAnswered) {
                if (userCorrect) {
                    // Logic A: Correct Selected
                    if (isCorrect) statusClass = "border-emerald-500 bg-emerald-50 shadow-[0_20px_40px_rgba(16,185,129,0.2)] scale-[1.25] z-20 rotate-1";
                    else statusClass = "border-red-600 bg-red-100 opacity-90 grayscale-[0.2]";
                } else {
                    // Logic B: Incorrect Selected
                    if (isSelected) statusClass = "border-red-600 bg-red-100 shake scale-[1.25] z-20";
                    else if (isCorrect) statusClass = "border-emerald-500 bg-emerald-100 shadow-[0_20px_40px_rgba(16,185,129,0.2)] scale-[1.25] z-10 rotate-1";
                    else statusClass = "border-orange-500 bg-orange-50 opacity-90";
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(quiz, opt)}
                  className={`relative p-2 rounded-2xl border-4 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) text-left group overflow-hidden ${statusClass}`}
                >
                  <div className="flex items-start gap-1">
                    <div className={`absolute top-1 left-1 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] shadow-sm transition-all shrink-0 ${
                      isSelected ? 'bg-royal-900 text-white' : 'bg-white text-gray-400'
                    }`}>
                      {opt.label}
                    </div>

                    <div className="flex-1 min-w-0 pl-10 pt-1 pb-1">
                      <p className={`font-black text-[1.1rem] leading-[1.2] w-full ${
                        isSelected ? 'text-royal-900' : 'text-gray-700'
                      }`}>
                        {opt.text}
                      </p>

                      {isAnswered && (
                        <div className="mt-1 pt-2 border-t border-black/5 animate-in zoom-in-95 duration-700 delay-150">
                          <p className={`text-[12px] leading-relaxed font-bold py-0.5 w-full ${isCorrect ? 'text-emerald-800' : isSelected ? 'text-red-800' : 'text-orange-800'}`}>
                            {opt.explanation}
                          </p>
                        </div>
                      )}
                    </div>

                    {isAnswered && isCorrect && (
                      <div className="absolute right-3 top-3 text-emerald-600 animate-bounce-pulse scale-150 z-30">
                        <CheckCircle size={28} fill="white" className="drop-shadow-md" />
                      </div>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <div className="absolute right-3 top-3 text-red-600 animate-bounce scale-150 z-30">
                        <X size={28} strokeWidth={4} className="drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in duration-700 relative">
      {/* Header Panel */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden mb-12">
        <div className="bg-royal-900 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 shadow-lg group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="px-3 py-1 bg-gold-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{lesson.lesson_type} Registry</span>
                           <span className="h-1 w-1 bg-white/30 rounded-full"></span>
                           <span className="text-[9px] font-bold text-royal-200 uppercase tracking-widest">{lesson.book} {lesson.chapter}</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black uppercase tracking-tight leading-tight">{lesson.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-royal-950/50 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="text-center px-4 border-r border-white/10">
                        <p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">SCORE</p>
                        <p className="text-2xl font-black text-gold-400">{currentScore.correct}/{currentScore.total}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">DURATION</p>
                        <p className="text-2xl font-mono font-black text-white">{formatTime(elapsedSeconds)}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button onClick={() => setActiveAboutType('course')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Globe size={20}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Course</span>
            </button>
            <button onClick={() => setActiveAboutType('module')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Layers size={20}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Module</span>
            </button>
            <button onClick={() => setActiveAboutType('lesson')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Sparkles size={20}/></div>
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Lesson</span>
            </button>
          </div>

          {/* Instructional Notes */}
          {lesson.leadershipNotes && lesson.leadershipNotes.length > 0 && (
            <div className="space-y-6">
                {lesson.leadershipNotes.map((note) => (
                    <div key={note.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><PenTool size={120} /></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8 border-b-2 border-indigo-50 pb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><PenTool size={24} /></div>
                                <h3 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter">{note.title}</h3>
                            </div>
                            <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: note.body }} />
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* Quizzes */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                <Target className="text-royal-800" size={32} /> PROFICIENCY EVALUATION
            </h2>
            {lesson.bibleQuizzes.map((q) => renderQuizCard(q))}
            {lesson.noteQuizzes.map((q) => renderQuizCard(q))}
          </div>
        </div>

        {/* Floating Side Action */}
        <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {isInsightOpen && (
                <div className="w-[350px] md:w-[450px] h-[500px] bg-white/80 backdrop-blur-xl border-4 border-indigo-200 rounded-[3rem] shadow-2xl p-8 flex flex-col pointer-events-auto animate-in slide-in-from-right-12 duration-500">
                    <div className="flex items-center justify-between mb-6 border-b-2 border-indigo-50 pb-4">
                        <h3 className="font-serif font-black text-royal-900 uppercase tracking-widest flex items-center gap-2">
                            <PenTool size={20} className="text-indigo-600" /> PERSONAL INSIGHT
                        </h3>
                        <div className="flex items-center gap-3">
                            {isSavingNote && <Loader2 size={16} className="animate-spin text-indigo-600" />}
                            <button 
                              onClick={() => setIsInsightOpen(false)} 
                              className="p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all shadow-sm"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>
                    <textarea 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onBlur={handleSaveNote}
                        placeholder="Type spiritual reflections or study notes here..."
                        className="flex-1 w-full bg-transparent border-none outline-none font-bold text-gray-800 text-lg resize-none custom-scrollbar placeholder:text-gray-300"
                    />
                    <div className="pt-4 border-t border-indigo-50 flex gap-2">
                        <button onClick={handleSaveNote} className="flex-1 py-4 bg-royal-800 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-xl border-b-4 border-royal-950">
                            <Save size={18}/> Archive Insight
                        </button>
                    </div>
                </div>
            )}
            <button 
                onClick={() => setIsInsightOpen(!isInsightOpen)}
                className="w-20 h-20 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group border-4 border-white"
            >
                <PenTool size={32} className="group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-2 -left-2 bg-royal-900 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-xl">Insight</span>
            </button>
        </div>
      </div>

      {/* Overlay Modal for About Content */}
      {activeAboutType && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border-8 border-royal-900">
              <div className="bg-royal-900 p-8 text-white flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-serif font-black uppercase tracking-tight">Contextual Identity: {activeAboutType}</h3>
                  <button onClick={() => setActiveAboutType(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 custom-scrollbar">
                  <AboutSection segments={
                      activeAboutType === 'course' ? (parentCourse?.about || []) :
                      activeAboutType === 'module' ? (parentModule?.about || []) :
                      (lesson.about || [])
                  } />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LessonView;
