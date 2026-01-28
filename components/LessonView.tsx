import React, { useState, useEffect, useRef } from 'react';
import { Lesson, QuizQuestion, QuizOption, User, Module, Course, AboutSegment, LeadershipNote, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import { exportService } from '../services/exportService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, X, CheckCircle, Target, Sparkles, Globe, Layers, PenTool, Save, Activity, Loader2, CloudUpload, ChevronLeft, ChevronRight, Home, BadgeCheck, Trophy, Clock, Highlighter, MessageSquare, Download, RefreshCcw, LogOut, Bell, FileText, File as FileIcon } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

type ToolTab = 'insight' | 'reminder' | 'highlights' | 'annotations' | 'download' | 'autosave';

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); 
  const [parentModule, setParentModule] = useState<Module | null>(null);
  const [parentCourse, setParentCourse] = useState<Course | null>(null);
  const [activeAboutType, setActiveAboutType] = useState<'course' | 'module' | 'lesson' | null>(null);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState({ correct: 0, total: 0 });
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isLastInModule, setIsLastInModule] = useState(false);
  const [adjacentLessons, setAdjacentLessons] = useState<{ prev?: string; next?: string }>({});
  
  // Tools Matrix State
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('insight');
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('#fef08a'); // Yellow
  const [reminderTime, setReminderTime] = useState('');

  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [hasReceivedCert, setHasReceivedCert] = useState(false);
  const [issuedCertForPreview, setIssuedCertForPreview] = useState<Certificate | null>(null);

  const [burstingQuizId, setBurstingQuizId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeLesson = async () => {
        setAttempts({});
        setCurrentScore({ correct: 0, total: 0 });
        setIsLessonCompleted(false);
        setHasReceivedCert(false);
        setIssuedCertForPreview(null);
        
        const isAlreadyDone = await loadData();
        
        if (!isAlreadyDone) {
            startTelemetry();
        } else {
            // Just load existing time without starting ticker
            const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
            setElapsedSeconds(initialTime);
        }
    };

    initializeLesson();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => stopTelemetry();
  }, [lesson.id]);

  const startTelemetry = async () => {
    const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedSeconds(initialTime);
    
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next % 5 === 0) {
              lessonService.saveQuizTimer(currentUser.id, lesson.id, next);
          }
          // Auto-save logic
          if (isAutoSaveEnabled && next % 30 === 0) {
              handleSaveNote();
          }
          return next;
      });
    }, 1000);
  };

  const stopTelemetry = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    // Final save of duration
    lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedSeconds);
  };

  const loadData = async (): Promise<boolean> => {
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
    
    let completed = false;
    if (totalQ > 0 && Object.keys(attemptMap).length >= totalQ) {
        setIsLessonCompleted(true);
        completed = true;
    } else if (totalQ === 0) {
        setIsLessonCompleted(true);
        completed = true;
    }

    const adj = await lessonService.getAdjacentLessons(lesson.id);
    setAdjacentLessons(adj);

    if (mod && adj.next) {
        const nextLesson = await lessonService.getLessonById(adj.next);
        setIsLastInModule(nextLesson?.moduleId !== mod.id);
    } else if (mod && !adj.next) {
        setIsLastInModule(true);
    }

    const savedNote = await lessonService.getUserLessonNote(currentUser.id, lesson.id);
    setNoteText(savedNote);

    const certs = await lessonService.getUserCertificates(currentUser.id);
    const existingCert = certs.find(c => c.moduleId === lesson.moduleId);
    if (existingCert) {
        setHasReceivedCert(true);
    }
    
    return completed;
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption, e: React.MouseEvent<HTMLButtonElement>) => {
    if (attempts[quiz.id]) return;
    const clickedElement = e.currentTarget;
    setBurstingQuizId(quiz.id);
    setTimeout(() => setBurstingQuizId(null), 600);
    const nextAttempts = { ...attempts, [quiz.id]: option.id };
    setAttempts(nextAttempts);
    if (option.isCorrect) {
        setCurrentScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
    const bibleCount = lesson.bibleQuizzes?.length || 0;
    const noteCount = lesson.noteQuizzes?.length || 0;
    const totalQ = bibleCount + noteCount;
    setTimeout(() => {
        clickedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    
    if (Object.keys(nextAttempts).length >= totalQ) {
        setIsLessonCompleted(true);
        stopTelemetry(); // CRITICAL FIX: STOP THE TIMER IMMEDIATELY
        setTimeout(() => {
            footerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
  };

  const handleIssueCertificate = async () => {
      if (!parentModule) return;
      const certs = await lessonService.getUserCertificates(currentUser.id);
      const existingCert = certs.find(c => c.moduleId === lesson.moduleId);
      if (existingCert) {
          setIssuedCertForPreview(existingCert);
          return;
      }
      setIsIssuingCert(true);
      try {
          const newCert = await lessonService.issueCertificate(currentUser.id, currentUser.name, parentModule.id);
          setHasReceivedCert(true);
          setIssuedCertForPreview(newCert);
      } catch (e) {
          alert("Registry Error: Certificate could not be issued at this time.");
      } finally {
          setIsIssuingCert(false);
      }
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await lessonService.saveUserLessonNote(currentUser.id, lesson.id, noteText);
      setTimeout(() => setIsSavingNote(false), 800);
  };

  const handleDownloadLesson = (type: 'unattempted' | 'attempted', format: 'pdf' | 'doc') => {
      if (type === 'unattempted') {
          exportService.exportSingleLesson(lesson, format === 'pdf' ? 'print' : 'txt');
      } else {
          alert(`Generating Verified Pathway Export (${format.toUpperCase()})...`);
          exportService.exportSingleLesson(lesson, format === 'pdf' ? 'print' : 'txt');
      }
  };

  const handlePauseReminder = () => {
      if (!reminderTime) { alert("Please select a valid future interval."); return; }
      alert(`Lesson Paused. Reminder scheduled for ${reminderTime}. Progress archived.`);
      onBack();
  };

  const navigateAdjacent = async (targetId: string) => {
      window.dispatchEvent(new CustomEvent('bbl_lesson_navigate', { detail: { lessonId: targetId } }));
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
              <span className="text-[14.5px] font-bold text-indigo-600 leading-none w-full capitalize">{quiz.referenceText}</span>
            </div>
          )}
          <h3 className="text-base md:text-lg font-sans font-black text-gray-900 leading-[1.2] mb-0 px-4 w-full">{quiz.text}</h3>
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
                  onClick={(e) => handleOptionSelect(quiz, opt, e)} 
                  className={`relative p-5 md:p-8 rounded-[2rem] border-4 transition-all duration-700 text-left group/opt overflow-visible w-full ${containerClass}`}
                >
                  <div className="flex items-start gap-1 h-full">
                    <div className="flex flex-col items-center justify-start gap-4 shrink-0 pt-0.5 w-16">
                      <div className={`text-4xl font-black font-serif transition-all duration-500 drop-shadow-sm ${isAnswered ? 'text-current opacity-100' : isSelected ? 'text-royal-900' : 'text-gray-300'}`}>
                        {opt.label}
                      </div>
                      {isAnswered && isCorrect && (
                         <div className="animate-checkmark-bounce">
                            <CheckCircle size={48} className="text-emerald-600 drop-shadow-xl" fill="rgba(16, 185, 129, 0.1)" />
                         </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center pr-1">
                      <p className={`font-black text-sm md:text-base leading-tight w-full mb-[2.5px] ${isAnswered ? 'text-gray-950' : isSelected ? 'text-royal-900' : 'text-gray-800'}`}>
                        {opt.text}
                      </p>
                      {isAnswered && (
                        <div className="mt-0 animate-in slide-in-from-left-6 duration-1000">
                           <div className={`h-[5px] w-full bg-gradient-to-r from-transparent via-current to-transparent mb-[5px] animate-dazzle-line shadow-[0_0_20px_currentColor] scale-x-110 ${separatorColor}`} style={{ transformOrigin: 'center' }}></div>
                          <div className={`p-4 rounded-2xl border border-black/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)] transition-colors duration-700 mt-[5px] ${explanationContainerClass}`}>
                            <p className={`text-[13px] leading-tight font-black w-full ${explanationTextClass}`}>{opt.explanation}</p>
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
    <div className="max-w-6xl mx-auto pb-48 animate-in fade-in duration-700 relative min-h-screen flex flex-col">
      
      {/* BREADCRUMB NAVIGATION */}
      <nav className="flex items-center flex-wrap gap-3 mb-10 px-6 py-4 bg-white border-4 border-gray-100 shadow-xl rounded-[2rem] animate-in slide-in-from-top-4 w-fit">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-royal-900 transition-all uppercase tracking-[0.2em] group">
              <Home size={14} className="group-hover:scale-110 transition-transform" /> HOME
          </button>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2">
             <Layers size={14} className="text-indigo-400" />
             <span className="text-[12px] font-serif font-black text-royal-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">
                {parentModule?.title || 'CURRICULUM'}
             </span>
          </div>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2">
             <Sparkles size={14} className="text-gold-500" />
             <span className="text-[12px] font-serif font-black text-royal-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">
                {lesson.title}
             </span>
          </div>
      </nav>

      {/* TOP TOOLS MATRIX PANEL - SLIDES FROM TOP */}
      {isToolsOpen && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[130] w-[95%] max-w-5xl bg-white/95 backdrop-blur-2xl border-4 border-royal-900 rounded-[3rem] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-top-20 duration-500 overflow-hidden border-b-[12px]">
              {/* Tool Matrix Header Tabs */}
              <div className="bg-royal-900 p-2 md:p-4 flex flex-wrap justify-center items-center gap-2 md:gap-4 shrink-0 border-b-4 border-black">
                  {[
                      { id: 'insight', label: 'INSIGHT', icon: PenTool },
                      { id: 'reminder', label: 'PAUSE & REMINDER', icon: Bell },
                      { id: 'highlights', label: 'HIGHLIGHTS', icon: Highlighter },
                      { id: 'annotations', label: 'ANNOTATIONS', icon: MessageSquare },
                      { id: 'download', label: 'DOWNLOAD', icon: Download },
                      { id: 'autosave', label: 'AUTO-SAVE & RESUME', icon: RefreshCcw }
                  ].map(tool => (
                      <button 
                        key={tool.id} 
                        onClick={() => setActiveToolTab(tool.id as ToolTab)}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-widest ${activeToolTab === tool.id ? 'bg-gold-500 text-royal-950 shadow-xl scale-105' : 'bg-white/10 text-royal-100 hover:bg-white/20'}`}
                      >
                          <tool.icon size={18} /> <span className="hidden sm:inline">{tool.label}</span>
                      </button>
                  ))}
                  <button onClick={onBack} className="px-6 py-3 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-3 shadow-xl ml-auto">
                      <LogOut size={18}/> EXIT LESSON
                  </button>
                  <button onClick={() => setIsToolsOpen(false)} className="p-2 text-white/50 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              {/* Tool Detail Panel */}
              <div className="flex-1 p-8 md:p-12 bg-[#fdfdfd] min-h-[400px]">
                  {activeToolTab === 'insight' && (
                      <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4 mb-2"><PenTool size={32} className="text-indigo-600"/><h3 className="text-3xl font-serif font-black text-gray-900">PERSONAL INSIGHT PORTAL</h3></div>
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Capture spiritual revelations and reflections here..." className="flex-1 w-full bg-white border-4 border-gray-100 rounded-[2rem] p-8 outline-none font-bold text-gray-800 text-lg resize-none shadow-inner custom-scrollbar focus:border-indigo-500"/>
                          <button onClick={handleSaveNote} disabled={isSavingNote} className="py-6 bg-royal-900 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.3em] shadow-2xl border-b-8 border-black">
                              {isSavingNote ? <Loader2 className="animate-spin" size={24} /> : <CloudUpload size={24} className="text-gold-400" />} <span>{isSavingNote ? 'SYNCHRONIZING...' : 'SAVE & UPLOAD TO REGISTRY'}</span>
                          </button>
                      </div>
                  )}

                  {activeToolTab === 'reminder' && (
                      <div className="h-full flex flex-col items-center justify-center gap-10 animate-in slide-in-from-right-4 max-w-2xl mx-auto text-center">
                          <div className="p-8 bg-indigo-50 rounded-[3rem] border-4 border-indigo-100 text-indigo-600"><Bell size={80} /></div>
                          <div><h3 className="text-4xl font-serif font-black text-gray-900 mb-4">PAUSE & SCHEDULE RESUMPTION</h3><p className="text-gray-500 font-medium">Archive your current telemetry and set a spiritual reminder to return.</p></div>
                          <div className="w-full space-y-4">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] block">Return Interval</label>
                              <input type="datetime-local" className="w-full p-6 border-4 border-gray-200 rounded-[2rem] font-black text-xl text-center focus:border-indigo-600 outline-none" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                          </div>
                          <button onClick={handlePauseReminder} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm border-b-8 border-indigo-900">EXECUTE PAUSE PROTOCOL</button>
                      </div>
                  )}

                  {activeToolTab === 'highlights' && (
                      <div className="h-full space-y-10 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4 border-b-4 border-gray-50 pb-6"><Highlighter size={32} className="text-gold-500"/><h3 className="text-3xl font-serif font-black text-gray-900">HIGHLIGHTING TOOLS</h3></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                              <div className="space-y-6">
                                  <p className="font-bold text-gray-600 uppercase text-xs tracking-widest">Select preferred Registry Color:</p>
                                  <div className="flex gap-4">
                                      {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#e9d5ff'].map(color => (
                                          <button key={color} onClick={() => setSelectedHighlightColor(color)} className={`w-16 h-16 rounded-2xl shadow-lg border-4 transition-all transform hover:scale-110 ${selectedHighlightColor === color ? 'border-royal-900 rotate-12 scale-110 ring-4 ring-royal-100' : 'border-white'}`} style={{ backgroundColor: color }} />
                                      ))}
                                  </div>
                              </div>
                              <div className="p-8 bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 space-y-4">
                                  <h4 className="font-black text-gray-900 uppercase text-xs">Registry Instructions</h4>
                                  <p className="text-sm text-gray-500 font-medium leading-relaxed italic">"Select text segments directly on the lesson page. The chosen registry color will be applied instantly. Highlights are persisted across authenticated sessions."</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'download' && (
                      <div className="h-full space-y-12 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4 border-b-4 border-gray-50 pb-6"><Download size={32} className="text-emerald-600"/><h3 className="text-3xl font-serif font-black text-gray-900">STUDY DOWNLOAD CENTER</h3></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="p-10 bg-white border-4 border-gray-100 rounded-[3rem] shadow-xl hover:border-royal-100 transition-all group">
                                  <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-royal-50 text-royal-800 rounded-2xl group-hover:bg-royal-900 group-hover:text-white transition-all"><BookOpen size={28}/></div><h4 className="text-xl font-black text-gray-900 uppercase">Registry Original</h4></div>
                                  <p className="text-sm text-gray-500 mb-8 font-medium italic">Unattempted version for independent study and testing preparation.</p>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => handleDownloadLesson('unattempted', 'pdf')} className="py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"><FileIcon size={16}/> PDF Version</button>
                                      <button onClick={() => handleDownloadLesson('unattempted', 'doc')} className="py-4 bg-white text-royal-900 border-4 border-royal-50 rounded-2xl hover:bg-royal-50 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"><FileText size={16}/> Word DOC</button>
                                  </div>
                              </div>
                              <div className="p-10 bg-white border-4 border-gold-100 rounded-[3rem] shadow-xl hover:border-gold-300 transition-all group">
                                  <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-gold-50 text-gold-600 rounded-2xl group-hover:bg-gold-500 group-hover:text-white transition-all"><BadgeCheck size={28}/></div><h4 className="text-xl font-black text-gray-900 uppercase">Verified Pathway</h4></div>
                                  <p className="text-sm text-gray-500 mb-8 font-medium italic">Full version revealing all correct answers, explanations, and registry notes.</p>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => handleDownloadLesson('attempted', 'pdf')} className="py-4 bg-gold-500 text-white font-black rounded-2xl hover:bg-gold-600 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-gold-500/20"><FileIcon size={16}/> PDF Version</button>
                                      <button onClick={() => handleDownloadLesson('attempted', 'doc')} className="py-4 bg-white text-gold-600 border-4 border-gold-50 rounded-2xl hover:bg-gold-50 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"><FileText size={16}/> Word DOC</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'autosave' && (
                      <div className="h-full flex flex-col items-center justify-center gap-10 animate-in slide-in-from-right-4 max-w-2xl mx-auto text-center">
                          <div className={`p-8 rounded-[3rem] border-4 transition-all duration-700 ${isAutoSaveEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}><RefreshCcw size={80} className={isAutoSaveEnabled ? 'animate-spin-slow' : ''}/></div>
                          <div><h3 className="text-4xl font-serif font-black text-gray-900 mb-4">AUTO-SYNCHRONIZATION</h3><p className="text-gray-500 font-medium">Toggle persistent matrix synchronization to ensure progress is never lost.</p></div>
                          <button onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)} className={`w-full py-8 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl border-b-8 uppercase tracking-[0.3em] flex items-center justify-center gap-6 ${isAutoSaveEnabled ? 'bg-emerald-600 text-white border-emerald-950 hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 border-gray-400 hover:bg-gray-300'}`}>
                              {isAutoSaveEnabled ? <><CheckCircle size={32}/> SYNCHRONIZATION ACTIVE</> : <><X size={32}/> PROTOCOL DISABLED</>}
                          </button>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Global Telemetry is currently capturing activity every 30 seconds.</p>
                      </div>
                  )}

                  {activeToolTab === 'annotations' && (
                      <div className="h-full space-y-8 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4 border-b-4 border-gray-50 pb-6"><MessageSquare size={32} className="text-blue-600"/><h3 className="text-3xl font-serif font-black text-gray-900">CONTENT ANNOTATIONS</h3></div>
                          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-200">
                              <PenTool size={48} className="mx-auto mb-4 text-gray-200" />
                              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Right-click lesson text to append specific annotations.</p>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden mb-12 shrink-0">
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
                        <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight leading-tight">{lesson.title}</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        <div className="lg:col-span-2 space-y-16">
          <div className="grid grid-cols-3 gap-4">
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

          {/* SCRIPTURAL EVALUATION SECTION */}
          {lesson.bibleQuizzes && lesson.bibleQuizzes.length > 0 && (
             <section className="space-y-8">
                <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                    <BookOpen className="text-royal-800" size={32} /> SCRIPTURAL EVALUATION
                </h2>
                {lesson.bibleQuizzes.map((q) => renderQuizCard(q))}
             </section>
          )}

          {/* LEADERSHIP PERSPECTIVE SECTION */}
          {lesson.leadershipNotes && lesson.leadershipNotes.length > 0 && (
            <section className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <PenTool className="text-royal-800" size={32} />
                    <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter">LEADERSHIP PERSPECTIVE</h2>
                </div>
                <div className="space-y-12">
                    {lesson.leadershipNotes.map((note) => (
                        <div key={note.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><PenTool size={120} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8 border-b-2 border-indigo-50 pb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><PenTool size={24} /></div>
                                    <h3 className="text-xl font-serif font-black text-gray-900 uppercase tracking-tighter">{note.title}</h3>
                                </div>
                                <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: note.body }} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          )}

          {/* CONTEXTUAL EVALUATION SECTION */}
          {lesson.noteQuizzes && lesson.noteQuizzes.length > 0 && (
              <section className="space-y-8">
                <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                    <Target className="text-royal-800" size={32} /> CONTEXTUAL EVALUATION
                </h2>
                {lesson.noteQuizzes.map((q) => renderQuizCard(q))}
              </section>
          )}
        </div>

        {/* Floating Sidebar Content: TOOLS - REPOSITIONED & RESIZED */}
        <div className="fixed bottom-24 right-14 z-[140] flex flex-col items-end gap-4 pointer-events-none">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="w-20 h-20 bg-royal-900 text-white rounded-full shadow-[0_20px_50px_rgba(30,27,75,0.6)] flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group border-4 border-white relative overflow-hidden">
                {isToolsOpen ? <X size={28} /> : <Activity size={28} className="group-hover:rotate-12 transition-transform mb-1" />}
                <span className="font-black text-[10px] uppercase tracking-widest">{isToolsOpen ? 'CLOSE' : 'TOOLS'}</span>
                <div className="absolute inset-0 bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
        </div>
      </div>

      {/* SEQUENTIAL NAVIGATION FOOTER - REDUCED BY 50% */}
      <div ref={footerRef} className="mt-24 pt-24 border-t-8 border-indigo-50 flex flex-col items-center gap-12 pb-40">
          {isLessonCompleted && (
              <div className="w-full max-w-4xl bg-indigo-600 p-10 rounded-[3rem] shadow-2xl border-b-[12px] border-indigo-900 animate-pop-in relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Trophy size={140} /></div>
                  <div className="relative z-10 text-center">
                    <h4 className="text-3xl md:text-4xl font-serif font-black text-white uppercase tracking-tighter leading-tight">
                        CONGRATULATIONS! <span className="text-gold-400">Well done!!</span>
                    </h4>
                    <p className="text-indigo-50 text-lg md:text-xl font-bold mt-4 leading-relaxed max-w-2xl mx-auto">
                        {isLastInModule 
                           ? "You have successfully completed this module. Please navigate the “Next” button below to proceed to the next module and attempt its (first) lesson."
                           : "You have successfully completed this lesson. Please navigate the “Next” button below to proceed to the next lesson."}
                    </p>
                    {isLastInModule && (
                        <button 
                            onClick={handleIssueCertificate}
                            disabled={isIssuingCert}
                            className={`mt-10 px-10 py-5 font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 mx-auto uppercase text-sm tracking-[0.3em] border-b-8 active:scale-95 transform hover:-translate-y-1 ${hasReceivedCert ? 'bg-emerald-500 text-white border-emerald-800 hover:bg-emerald-600' : 'bg-gold-500 text-royal-950 border-gold-800 hover:bg-gold-400'}`}
                        >
                            {isIssuingCert ? <Loader2 className="animate-spin" size={24}/> : hasReceivedCert ? <BadgeCheck size={28}/> : <Sparkles size={28}/>}
                            {hasReceivedCert ? "PREVIEW CERTIFICATE" : "RECEIVE CERTIFICATE"}
                        </button>
                    )}
                  </div>
              </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-4xl">
              <div className="flex-1">
                {adjacentLessons.prev ? (
                    <button onClick={() => navigateAdjacent(adjacentLessons.prev!)} className="w-full h-full flex items-center justify-between p-5 bg-white border-2 border-royal-100 rounded-[1.25rem] hover:border-gold-500 hover:shadow-[0_12px_30px_-8px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1 group active:scale-95 border-b-[6px] border-royal-200">
                        <div className="p-2 bg-royal-50 text-royal-400 group-hover:bg-gold-500 group-hover:text-white rounded-[0.75rem] transition-all"><ChevronLeft size={20} strokeWidth={3} /></div>
                        <div className="text-right flex-1 pr-3"><p className="text-[6px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1 group-hover:text-gold-600 transition-colors">Registry History</p><h4 className="font-serif font-black text-royal-900 uppercase text-xs md:text-sm leading-tight">Previous Lesson</h4></div>
                    </button>
                ) : <div className="w-full h-full p-5 border-2 border-dashed border-gray-100 rounded-[1.25rem] flex flex-col items-center justify-center opacity-30"><Layers size={24} className="text-gray-200 mb-2" /><span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">Origin Reached</span></div>}
              </div>
              <div className="flex-1">
                {adjacentLessons.next ? (
                    <div className="relative h-full">
                        {!isLessonCompleted ? <div className="h-full w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-[1.25rem] flex flex-col items-center justify-center text-center gap-2 opacity-70 border-b-[6px]"><Target size={20} className="text-gray-300" /><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Evaluation Required</p></div> : <button onClick={() => navigateAdjacent(adjacentLessons.next!)} className="w-full h-full flex items-center justify-between p-5 bg-royal-900 text-white border-2 border-black rounded-[1.25rem] shadow-[0_15px_35px_-8px_rgba(30,27,75,0.6)] hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] transition-all transform hover:-translate-y-1 group active:scale-95 border-b-[6px] border-black animate-pop-in overflow-hidden relative"><div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={40} /></div><div className="text-left flex-1 pl-3 z-10"><p className="text-[6px] md:text-[8px] font-black text-gold-400 uppercase tracking-[0.3em] mb-1 group-hover:animate-pulse">Verified Pathway</p><h4 className="font-serif font-black uppercase text-xs md:text-sm leading-tight">Proceed Next</h4></div><div className="p-2 bg-white/10 text-white group-hover:bg-gold-500 rounded-[0.75rem] transition-all z-10 ring-2 ring-white/5"><ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" /></div></button>}
                    </div>
                ) : <div className="w-full h-full p-5 bg-gold-50 border-2 border-gold-200 rounded-[1.25rem] flex flex-col items-center justify-center text-center gap-2 border-b-[6px] border-gold-300"><BadgeCheck size={24} className="text-gold-500" /><p className="text-[8px] font-black text-gold-700 uppercase tracking-[0.4em]">Matrix Mastered</p></div>}
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
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 custom-scrollbar"><AboutSection segments={activeAboutType === 'course' ? (parentCourse?.about || []) : activeAboutType === 'module' ? (parentModule?.about || []) : (lesson.about || [])} /></div>
           </div>
        </div>
      )}

      {issuedCertForPreview && <CertificateGenerator certificate={issuedCertForPreview} onClose={() => setIssuedCertForPreview(null)} />}
    </div>
  );
};

export default LessonView;