import React, { useState, useEffect, useRef } from 'react';
import { Lesson, QuizQuestion, QuizOption, User, Module, Course, AboutSegment, LeadershipNote } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, BookOpen, X, CheckCircle, Target, Sparkles, Globe, Layers, PenTool, Save, Activity, Loader2, CloudUpload, ChevronLeft, ChevronRight, Home, BadgeCheck } from 'lucide-react';

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
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [adjacentLessons, setAdjacentLessons] = useState<{ prev?: string; next?: string }>({});
  
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Sparkle tracking for visual burst
  const [burstingQuizId, setBurstingQuizId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset local state to ensure fresh lesson attempt rendering
    setAttempts({});
    setCurrentScore({ correct: 0, total: 0 });
    setIsLessonCompleted(false);
    loadData();
    startTelemetry();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const bibleCount = lesson.bibleQuizzes?.length || 0;
    const noteCount = lesson.noteQuizzes?.length || 0;
    const totalQ = bibleCount + noteCount;

    setCurrentScore({ correct: scoreCount, total: totalQ });
    
    // Check completion strictly - must have an entry for EVERY question in the lesson
    if (totalQ > 0 && Object.keys(attemptMap).length >= totalQ) {
        setIsLessonCompleted(true);
    } else if (totalQ === 0) {
        setIsLessonCompleted(true);
    }

    const adj = await lessonService.getAdjacentLessons(lesson.id);
    setAdjacentLessons(adj);

    const savedNote = await lessonService.getUserLessonNote(currentUser.id, lesson.id);
    setNoteText(savedNote);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    
    // Trigger sparkle burst
    setBurstingQuizId(quiz.id);
    setTimeout(() => setBurstingQuizId(null), 600);

    const nextAttempts = { ...attempts, [quiz.id]: option.id };
    setAttempts(nextAttempts);
    
    if (option.isCorrect) {
        setCurrentScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }

    // Check for strict completion immediately
    const bibleCount = lesson.bibleQuizzes?.length || 0;
    const noteCount = lesson.noteQuizzes?.length || 0;
    const totalQ = bibleCount + noteCount;

    if (Object.keys(nextAttempts).length >= totalQ) {
        setIsLessonCompleted(true);
        // Automatically scroll to navigation footer on completion
        setTimeout(() => {
            contentBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 800);
    }

    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await lessonService.saveUserLessonNote(currentUser.id, lesson.id, noteText);
      setTimeout(() => setIsSavingNote(false), 800);
  };

  const navigateAdjacent = async (targetId: string) => {
      const nextLesson = await lessonService.getLessonById(targetId);
      if (nextLesson) {
          // Dispatch a custom event to tell the parent (Dashboard) to update the selected lesson ID
          window.dispatchEvent(new CustomEvent('bbl_lesson_navigate', { detail: { lessonId: targetId } }));
      }
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
                <div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs border border-indigo-100">P{seg.order}</span><h5 className="text-[12px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5></div>
                <div className="text-[13px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: seg.body }} />
            </div>
        )) : <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Empty Perspectives</p></div>}
    </div>
  );

  const renderQuizCard = (quiz: QuizQuestion) => {
    const selectedOptionId = attempts[quiz.id];
    const isAnswered = !!selectedOptionId;
    const selectedOption = quiz.options.find(o => o.id === selectedOptionId);
    const userIsCorrect = selectedOption?.isCorrect;

    return (
      <div key={quiz.id} className={`bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden mb-12 relative group/card ${isAnswered ? 'animate-flash-zoom' : 'animate-in fade-in slide-in-from-bottom-6'}`}>
        {isAnswered && (
          <div className="absolute inset-0 bg-[#fdf5e6] opacity-30 animate-parchment-unroll z-0 pointer-events-none"></div>
        )}

        <div className="p-4 md:p-6 relative z-10"> 
          {quiz.referenceText && (
            <div className="flex items-center gap-2 mb-1 px-4">
              <BookOpen size={14} className="text-indigo-500 shrink-0" />
              <span className="text-[14.5px] font-bold text-indigo-600 leading-none w-full capitalize">
                {quiz.referenceText}
              </span>
            </div>
          )}

          <h3 className="text-base md:text-lg font-sans font-black text-gray-900 leading-[1.2] mb-0 px-4 w-full">
            {quiz.text}
          </h3>

          <div className="grid grid-cols-1 gap-2 px-2 pt-2">
            {quiz.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.isCorrect;
              
              let containerClass = "bg-white border-gray-100 hover:border-indigo-300";
              let separatorColor = "text-gray-200";
              let explanationContainerClass = "bg-gray-300/90"; 
              let explanationTextClass = "text-gray-900";
              
              if (isAnswered) {
                if (userIsCorrect) {
                  if (isCorrect) {
                    containerClass = "bg-white border-emerald-500 scale-[1.01] z-30 ring-4 ring-emerald-100 shadow-[0_0_50px_rgba(16,185,129,0.4)]";
                    separatorColor = "text-emerald-500";
                    explanationContainerClass = "bg-emerald-300/95 shadow-lg border-2 border-emerald-500/20"; 
                    explanationTextClass = "text-emerald-950";
                  } else {
                    containerClass = "bg-white border-red-500 opacity-90";
                    separatorColor = "text-red-500";
                    explanationContainerClass = "bg-red-300/90 shadow-inner";
                    explanationTextClass = "text-red-950 font-bold";
                  }
                } else {
                  if (isSelected) {
                    containerClass = "bg-white border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.5)] animate-shake z-30 ring-4 ring-red-100 scale-[1.01]";
                    separatorColor = "text-red-500";
                    explanationContainerClass = "bg-red-300/95 shadow-xl border-2 border-red-600/20";
                    explanationTextClass = "text-red-950 font-black";
                  } else if (isCorrect) {
                    containerClass = "bg-white border-emerald-500 scale-[1.02] z-20 shadow-[0_0_40px_rgba(16,185,129,0.3)]";
                    separatorColor = "text-emerald-500";
                    explanationContainerClass = "bg-emerald-300/90 shadow-md border border-emerald-400/20";
                    explanationTextClass = "text-emerald-950 font-bold";
                  } else {
                    containerClass = "bg-white border-orange-400 opacity-80 shadow-inner";
                    separatorColor = "text-orange-400";
                    explanationContainerClass = "bg-orange-300/90"; 
                    explanationTextClass = "text-orange-950";
                  }
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(quiz, opt)}
                  className={`relative p-5 md:p-8 rounded-[2rem] border-4 transition-all duration-700 text-left group/opt overflow-visible w-full ${containerClass}`}
                >
                  {burstingQuizId === quiz.id && isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-1 h-1 bg-gold-400 rounded-full animate-sparkle-burst"></div>
                    </div>
                  )}

                  <div className="flex items-start gap-1 h-full">
                    <div className="flex flex-col items-center justify-start gap-4 shrink-0 pt-0.5 w-16">
                      <div className={`text-4xl font-black font-serif transition-all duration-500 drop-shadow-sm ${
                        isAnswered ? 'text-current opacity-100' : isSelected ? 'text-royal-900' : 'text-gray-300'
                      }`}>
                        {opt.label}
                      </div>

                      {isAnswered && isCorrect && (
                         <div className="animate-checkmark-bounce">
                            <CheckCircle size={48} className="text-emerald-600 drop-shadow-xl" fill="rgba(16, 185, 129, 0.1)" />
                         </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center pr-1">
                      <p className={`font-black text-sm md:text-base leading-tight w-full mb-[2.5px] ${
                        isAnswered ? 'text-gray-950' : isSelected ? 'text-royal-900' : 'text-gray-800'
                      }`}>
                        {opt.text}
                      </p>

                      {isAnswered && (
                        <div className="mt-0 animate-in slide-in-from-left-6 duration-1000">
                           <div 
                              className={`h-[5px] w-full bg-gradient-to-r from-transparent via-current to-transparent mb-[5px] animate-dazzle-line shadow-[0_0_20px_currentColor] scale-x-110 ${separatorColor}`}
                              style={{ transformOrigin: 'center' }}
                            ></div>
                          <div className={`p-4 rounded-2xl border border-black/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)] transition-colors duration-700 mt-[5px] ${explanationContainerClass}`}>
                            <p className={`text-[13px] leading-tight font-black w-full ${explanationTextClass}`}>
                              {opt.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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
    <div className="max-w-6xl mx-auto pb-64 animate-in fade-in duration-700 relative">
      
      {/* BREADCRUMB NAVIGATION - REFINED TYPOGRAPHY (30% REDUCTION) */}
      <nav className="flex items-center flex-wrap gap-3 mb-8 px-6 py-4 bg-white border-4 border-gray-100 shadow-lg rounded-[2rem] animate-in slide-in-from-top-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-black text-gray-400 hover:text-royal-900 transition-all uppercase tracking-[0.2em] group"
          >
              <Home size={16} className="group-hover:scale-110 transition-transform" /> HOME
          </button>
          <ChevronRight size={14} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-1.5">
             <Layers size={16} className="text-indigo-400" />
             <span className="text-[10px] md:text-[13px] font-serif font-black text-royal-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">
                {parentModule?.title || 'CURRICULUM'}
             </span>
          </div>
          <ChevronRight size={14} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-1.5">
             <Sparkles size={16} className="text-gold-500" />
             <span className="text-[10px] md:text-[13px] font-serif font-black text-royal-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">
                {lesson.title}
             </span>
          </div>
      </nav>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-12">
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

          <div className="space-y-8">
            <h2 className="text-3xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                <Target className="text-royal-800" size={32} /> PROFICIENCY EVALUATION
            </h2>
            {lesson.bibleQuizzes.map((q) => renderQuizCard(q))}
            {lesson.noteQuizzes.map((q) => renderQuizCard(q))}
          </div>
        </div>

        {/* Floating Side Action - INSIGHT BOX */}
        <div className="fixed bottom-24 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            {isInsightOpen && (
                <div className="w-[300px] md:w-[420px] max-h-[85vh] bg-white/95 backdrop-blur-2xl border-4 border-indigo-600 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
                    <div className="bg-indigo-600 p-5 text-white flex justify-between items-center shrink-0 border-b-4 border-indigo-700 shadow-md relative z-10">
                        <div className="flex items-center gap-3">
                            <PenTool size={24} className="text-white animate-pulse" />
                            <h3 className="font-serif font-black text-sm uppercase tracking-widest leading-none">PERSONAL INSIGHT PORTAL</h3>
                        </div>
                        <button 
                            onClick={() => setIsInsightOpen(false)} 
                            className="p-2 bg-white/20 hover:bg-white/40 rounded-xl transition-all shadow-inner hover:scale-110 active:scale-95"
                        >
                            <X size={20} strokeWidth={3}/>
                        </button>
                    </div>
                    
                    <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden bg-white">
                        <div className="relative flex-1 flex flex-col">
                             <button 
                                onClick={() => setNoteText("")}
                                className="absolute top-3 right-3 p-2 bg-red-100 text-red-600 rounded-xl opacity-60 hover:opacity-100 transition-opacity z-20 shadow-sm font-black text-[10px] uppercase tracking-widest"
                                title="Purge Reflection"
                             >
                                 Clear
                             </button>
                            <textarea 
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Capture spiritual revelations and reflections here..."
                                className="flex-1 w-full bg-indigo-50/20 border-4 border-indigo-50 rounded-[2rem] p-6 pt-10 outline-none font-bold text-gray-800 text-lg resize-none custom-scrollbar placeholder:text-indigo-200 focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                        
                        <button 
                            onClick={handleSaveNote} 
                            disabled={isSavingNote}
                            className="w-full py-6 bg-royal-900 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.3em] shadow-[0_15px_30px_rgba(30,27,75,0.4)] border-b-8 border-black active:scale-95 transform hover:-translate-y-1 shrink-0"
                        >
                            {isSavingNote ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>SYNCHRONIZING...</span>
                                </>
                            ) : (
                                <>
                                    <CloudUpload size={24} className="text-gold-400" />
                                    <span>SAVE & UPLOAD TO REGISTRY</span>
                                </>
                            )} 
                        </button>
                    </div>
                </div>
            )}
            <button 
                onClick={() => setIsInsightOpen(!isInsightOpen)}
                className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group border-4 border-white relative"
            >
                {isInsightOpen ? <X size={28} /> : <PenTool size={32} className="group-hover:rotate-12 transition-transform" />}
                <span className="absolute -top-4 -left-4 bg-royal-950 text-gold-400 text-[14px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.25em] shadow-2xl border-2 border-gold-500 ring-4 ring-royal-900/50">Insight</span>
            </button>
        </div>
      </div>

      {/* SEQUENTIAL NAVIGATION CONTROLS - GLOBAL FOOTER SECTION */}
      <div ref={contentBottomRef} className="mt-20 pt-20 border-t-8 border-gray-50 flex flex-col items-center gap-16 animate-in slide-in-from-bottom-8 duration-1000">
          <div className="flex flex-col sm:flex-row items-stretch gap-10 w-full max-w-6xl">
              {/* PREVIOUS BUTTON - ALWAYS ACCESSIBLE */}
              <div className="flex-1">
                {adjacentLessons.prev ? (
                    <button 
                        onClick={() => navigateAdjacent(adjacentLessons.prev!)}
                        className="w-full h-full flex items-center justify-between p-12 bg-white border-4 border-royal-100 rounded-[3rem] hover:border-gold-500 hover:shadow-[0_40px_80px_-20px_rgba(245,158,11,0.25)] transition-all transform hover:-translate-y-2 group active:scale-95 border-b-[12px] border-royal-200"
                    >
                        <div className="p-5 bg-royal-50 text-royal-400 group-hover:bg-gold-500 group-hover:text-white rounded-[1.8rem] transition-all">
                            <ChevronLeft size={48} strokeWidth={4} />
                        </div>
                        <div className="text-right flex-1 pr-8">
                            <p className="text-[14px] font-black text-gray-300 uppercase tracking-[0.4em] mb-3 group-hover:text-gold-600 transition-colors">Sequential History</p>
                            <h4 className="font-serif font-black text-royal-900 uppercase text-2xl md:text-3xl leading-tight">Return Previous</h4>
                        </div>
                    </button>
                ) : (
                    <div className="w-full h-full p-12 border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
                        <Layers size={64} className="text-gray-200 mb-4" />
                        <span className="text-[14px] font-black text-gray-400 uppercase tracking-[0.4em]">Registry Origin</span>
                    </div>
                )}
              </div>

              {/* NEXT BUTTON - STRICTLY GUARDED PROTOCOL */}
              <div className="flex-1">
                {adjacentLessons.next ? (
                    <div className="relative h-full">
                        {!isLessonCompleted ? (
                            <div className="h-full w-full p-12 bg-gray-50 border-4 border-gray-200 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 opacity-80 border-b-[12px]">
                                <div className="p-4 bg-white rounded-full shadow-inner"><Target size={48} className="text-gray-300" /></div>
                                <p className="text-[14px] font-black text-gray-400 uppercase tracking-[0.3em] leading-relaxed">
                                    Evaluation Completion <br/> Required to Advance
                                </p>
                            </div>
                        ) : (
                            <button 
                                onClick={() => navigateAdjacent(adjacentLessons.next!)}
                                className="w-full h-full flex items-center justify-between p-12 bg-royal-900 text-white border-4 border-black rounded-[3rem] shadow-[0_50px_100px_-30px_rgba(30,27,75,0.7)] hover:bg-black hover:shadow-[0_60px_120px_-40px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-2 group active:scale-95 border-b-[12px] border-black animate-pop-in overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles size={120} />
                                </div>
                                <div className="text-left flex-1 pl-8 z-10">
                                    <p className="text-[14px] font-black text-gold-400 uppercase tracking-[0.4em] mb-3 group-hover:animate-pulse">Registry Path Open</p>
                                    <h4 className="font-serif font-black uppercase text-2xl md:text-3xl leading-tight">Proceed Next</h4>
                                </div>
                                <div className="p-5 bg-white/10 text-white group-hover:bg-gold-500 rounded-[1.8rem] transition-all z-10 ring-8 ring-white/5">
                                    <ChevronRight size={48} strokeWidth={4} className="group-hover:translate-x-2 transition-transform" />
                                </div>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full p-12 bg-gold-50 border-4 border-gold-200 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 border-b-[12px] border-gold-300">
                        <BadgeCheck size={64} className="text-gold-500 animate-checkmark-bounce" />
                        <p className="text-[14px] font-black text-gold-700 uppercase tracking-[0.5em]">Curriculum Mastered</p>
                    </div>
                )}
              </div>
          </div>
      </div>

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