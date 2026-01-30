import React, { useState, useEffect, useRef } from 'react';
import { Lesson, QuizQuestion, QuizOption, User, Module, Course, AboutSegment, LeadershipNote, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import { exportService } from '../services/exportService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, X, CheckCircle, Target, Sparkles, Globe, Layers, PenTool, Save, Activity, Loader2, CloudUpload, ChevronLeft, ChevronRight, Home, BadgeCheck, Trophy, Clock, Highlighter, MessageSquare, Download, RefreshCcw, LogOut, Bell, FileText, File as FileIcon, Move, Trash2, Plus } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

type ToolTab = 'insight' | 'reminder' | 'highlights' | 'annotations' | 'download' | 'autosave';

interface LessonHighlight {
    id: string;
    text: string;
    color: string;
    timestamp: string;
}

interface LessonAnnotation {
    id: string;
    text: string;
    note: string;
    timestamp: string;
}

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
  
  // Module Progress Data
  const [moduleProgressData, setModuleProgressData] = useState<{ completed: number; total: number } | null>(null);

  // Tools Matrix State
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('insight');
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('');
  
  // New Matrix Features State
  const [highlights, setHighlights] = useState<LessonHighlight[]>([]);
  const [annotations, setAnnotations] = useState<LessonAnnotation[]>([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState('#fbbf24'); // Gold default
  const [currentAnnotationInput, setCurrentAnnotationInput] = useState('');
  const [isCapturingSelection, setIsCapturingSelection] = useState(false);
  
  // Drag Positioning State
  const [toolsPosition, setToolsPosition] = useState({ x: 0, y: 80 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [hasReceivedCert, setHasReceivedCert] = useState(false);
  const [issuedCertForPreview, setIssuedCertForPreview] = useState<Certificate | null>(null);

  const [burstingQuizId, setBurstingQuizId] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<number>(0); 
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeLesson = async () => {
        setAttempts({});
        setCurrentScore({ correct: 0, total: 0 });
        setIsLessonCompleted(false);
        setHasReceivedCert(false);
        setIssuedCertForPreview(null);
        
        if (window.innerWidth > 1200) {
            setToolsPosition({ x: window.innerWidth - 550, y: 100 });
        } else {
            setToolsPosition({ x: 20, y: 100 });
        }
        
        const isAlreadyDone = await loadData();
        
        if (!isAlreadyDone) {
            startTelemetry();
        } else {
            const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
            setElapsedSeconds(initialTime);
            elapsedRef.current = initialTime;
        }

        // Fetch Highlights and Annotations
        const hls = await lessonService.getHighlights(currentUser.id, lesson.id);
        setHighlights(hls);
        const anns = await lessonService.getAnnotations(currentUser.id, lesson.id);
        setAnnotations(anns);
    };

    initializeLesson();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => stopTelemetry();
  }, [lesson.id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setToolsPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleStartDrag = (e: React.MouseEvent) => {
    dragOffset.current = {
      x: e.clientX - toolsPosition.x,
      y: e.clientY - toolsPosition.y
    };
    setIsDragging(true);
  };

  const startTelemetry = async () => {
    const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedSeconds(initialTime);
    elapsedRef.current = initialTime;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
      if (elapsedRef.current % 5 === 0) {
          lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedRef.current);
      }
      if (isAutoSaveEnabled && elapsedRef.current % 30 === 0) {
          handleSaveNote();
      }
    }, 1000);
  };

  const stopTelemetry = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedRef.current);
    }
  };

  const loadData = async (): Promise<boolean> => {
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    const mod = await lessonService.getModuleById(lesson.moduleId);
    if (mod) {
        setParentModule(mod);
        const course = await lessonService.getCourseById(mod.courseId);
        if (course) setParentCourse(course);
        const moduleLessons = await lessonService.getLessonsByModuleId(lesson.moduleId);
        let completedCount = 0;
        for (const ml of moduleLessons) {
            if (await lessonService.hasUserAttemptedLesson(currentUser.id, ml.id)) completedCount++;
        }
        setModuleProgressData({ completed: completedCount, total: moduleLessons.length });
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
    if (totalQ === 0 || Object.keys(attemptMap).length >= totalQ) {
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
    setNoteText(await lessonService.getUserLessonNote(currentUser.id, lesson.id));
    const certs = await lessonService.getUserCertificates(currentUser.id);
    if (certs.find(c => c.moduleId === lesson.moduleId)) setHasReceivedCert(true);
    return completed;
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption, e: React.MouseEvent<HTMLButtonElement>) => {
    if (attempts[quiz.id]) return;
    const clickedElement = e.currentTarget;
    setBurstingQuizId(quiz.id);
    setTimeout(() => setBurstingQuizId(null), 600);
    const nextAttempts = { ...attempts, [quiz.id]: option.id };
    setAttempts(nextAttempts);
    if (option.isCorrect) setCurrentScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    const totalQ = (lesson.bibleQuizzes?.length || 0) + (lesson.noteQuizzes?.length || 0);
    if (Object.keys(nextAttempts).length >= totalQ) {
        const wasAlreadyCompleted = isLessonCompleted;
        setIsLessonCompleted(true);
        stopTelemetry(); 
        if (!wasAlreadyCompleted) {
           setModuleProgressData(prev => prev ? { ...prev, completed: Math.min(prev.total, prev.completed + 1) } : null);
        }
        setTimeout(() => footerRef.current?.scrollIntoView({ behavior: 'smooth' }), 2000);
    }
    setTimeout(() => clickedElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
  };

  const handleIssueCertificate = async () => {
      if (!parentModule) return;
      const certs = await lessonService.getUserCertificates(currentUser.id);
      const existingCert = certs.find(c => c.moduleId === lesson.moduleId);
      if (existingCert) { setIssuedCertForPreview(existingCert); return; }
      setIsIssuingCert(true);
      try {
          const newCert = await lessonService.issueCertificate(currentUser.id, currentUser.name, parentModule.id);
          setHasReceivedCert(true);
          setIssuedCertForPreview(newCert);
      } catch (e) { alert("Registry Error: Certificate failure."); } finally { setIsIssuingCert(false); }
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await lessonService.saveUserLessonNote(currentUser.id, lesson.id, noteText);
      setTimeout(() => setIsSavingNote(false), 800);
  };

  const handleApplyHighlight = () => {
      const selection = window.getSelection()?.toString();
      if (!selection || selection.length < 2) { alert("Matrix Protocol: Select lesson text to apply highlight."); return; }
      const newHighlight: LessonHighlight = { id: crypto.randomUUID(), text: selection, color: activeHighlightColor, timestamp: new Date().toISOString() };
      const next = [newHighlight, ...highlights];
      setHighlights(next);
      lessonService.saveHighlights(currentUser.id, lesson.id, next);
  };

  const handleApplyAnnotation = () => {
      const selection = window.getSelection()?.toString();
      if (!selection || selection.length < 2) { alert("Matrix Protocol: Select lesson text to annotate."); return; }
      if (!currentAnnotationInput.trim()) { alert("Matrix Protocol: Annotation note required."); return; }
      const newAnn: LessonAnnotation = { id: crypto.randomUUID(), text: selection, note: currentAnnotationInput, timestamp: new Date().toISOString() };
      const next = [newAnn, ...annotations];
      setAnnotations(next);
      setCurrentAnnotationInput('');
      lessonService.saveAnnotations(currentUser.id, lesson.id, next);
  };

  const handleRemoveHighlight = (id: string) => {
      const next = highlights.filter(h => h.id !== id);
      setHighlights(next);
      lessonService.saveHighlights(currentUser.id, lesson.id, next);
  };

  const handleRemoveAnnotation = (id: string) => {
      const next = annotations.filter(a => a.id !== id);
      setAnnotations(next);
      lessonService.saveAnnotations(currentUser.id, lesson.id, next);
  };

  // Fix: Added missing handlePauseReminder function
  const handlePauseReminder = () => {
    if (!reminderTime) { alert("Matrix Protocol: Select return interval."); return; }
    handleSaveNote();
    alert(`Progress archived. Reminder set for ${new Date(reminderTime).toLocaleString()}`);
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

  const renderQuizCard = (quiz: QuizQuestion) => {
    const selectedOptionId = attempts[quiz.id];
    const isAnswered = !!selectedOptionId;
    const selectedOption = quiz.options.find(o => o.id === selectedOptionId);
    const userIsCorrect = selectedOption?.isCorrect;
    return (
      <div key={quiz.id} className={`bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden mb-12 relative group/card ${isAnswered ? 'animate-flash-zoom' : 'animate-in fade-in slide-in-from-bottom-6'}`}>
        {isAnswered && <div className="absolute inset-0 bg-[#fdf5e6] opacity-30 animate-parchment-unroll z-0 pointer-events-none"></div>}
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
                <button key={opt.id} disabled={isAnswered} onClick={(e) => handleOptionSelect(quiz, opt, e)} className={`relative p-5 md:p-8 rounded-[2rem] border-4 transition-all duration-700 text-left group/opt overflow-visible w-full ${containerClass}`}>
                  <div className="flex items-start gap-1 h-full">
                    <div className="flex flex-col items-center justify-start gap-4 shrink-0 pt-0.5 w-16">
                      <div className={`text-4xl font-black font-serif transition-all duration-500 drop-shadow-sm ${isAnswered ? 'text-current opacity-100' : isSelected ? 'text-royal-900' : 'text-gray-300'}`}>{opt.label}</div>
                      {isAnswered && isCorrect && <div className="animate-checkmark-bounce"><CheckCircle size={48} className="text-emerald-600 drop-shadow-xl" fill="rgba(16, 185, 129, 0.1)" /></div>}
                    </div>
                    <div className="flex-1 flex flex-col justify-center pr-1">
                      <p className={`font-black text-sm md:text-base leading-tight w-full mb-[2.5px] ${isAnswered ? 'text-gray-950' : isSelected ? 'text-royal-900' : 'text-gray-800'}`}>{opt.text}</p>
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
      <nav className="flex items-center flex-wrap gap-3 mb-10 px-6 py-4 bg-white border-4 border-gray-100 shadow-xl rounded-[2rem] animate-in slide-in-from-top-4 w-fit">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-royal-900 transition-all uppercase tracking-[0.2em] group"><Home size={14} className="group-hover:scale-110 transition-transform" /> HOME</button>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2"><Layers size={14} className="text-indigo-400" /><span className="text-[12px] font-serif font-black text-royal-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">{parentModule?.title || 'CURRICULUM'}</span></div>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2"><Sparkles size={14} className="text-gold-500" /><span className="text-[12px] font-serif font-black text-royal-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">{lesson.title}</span></div>
      </nav>

      {isToolsOpen && (
          <div style={{ left: `${toolsPosition.x}px`, top: `${toolsPosition.y}px` }} className={`fixed z-[200] w-[480px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-royal-900 rounded-[2rem] flex flex-col overflow-hidden border-b-[8px] transition-shadow ${isDragging ? 'shadow-[0_60px_150px_-30px_rgba(0,0,0,0.8)] opacity-95 scale-[1.02]' : ''}`}>
              <div onMouseDown={handleStartDrag} className="bg-royal-900 p-3 flex justify-between items-center cursor-grab active:cursor-grabbing border-b-2 border-black shrink-0">
                  <div className="flex items-center gap-2"><Move size={14} className="text-gold-400" /><span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Study Intelligence Portal</span></div>
                  <button onClick={() => setIsToolsOpen(false)} className="p-1 text-white/50 hover:text-white transition-colors"><X size={18}/></button>
              </div>
              <div className="bg-royal-800 p-2 flex flex-wrap justify-center items-center gap-1.5 shrink-0 border-b-2 border-black">
                  {[
                      { id: 'insight', icon: PenTool, color: 'text-indigo-400' },
                      { id: 'highlights', icon: Highlighter, color: 'text-gold-400' },
                      { id: 'annotations', icon: MessageSquare, color: 'text-sky-400' },
                      { id: 'reminder', icon: Bell, color: 'text-rose-400' },
                      { id: 'download', icon: Download, color: 'text-emerald-400' },
                      { id: 'autosave', icon: RefreshCcw, color: 'text-blue-400' }
                  ].map(tool => (
                      <button key={tool.id} onClick={() => setActiveToolTab(tool.id as ToolTab)} className={`p-2 rounded-xl flex items-center justify-center transition-all ${activeToolTab === tool.id ? 'bg-gold-500 text-royal-950 shadow-md scale-105' : 'bg-white/10 text-royal-100 hover:bg-white/20'}`}><tool.icon size={14} /></button>
                  ))}
                  <button onClick={onBack} className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center justify-center shadow-md ml-auto"><LogOut size={14}/></button>
              </div>

              <div className="p-6 bg-[#fdfdfd] min-h-[350px]">
                  {activeToolTab === 'insight' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-3"><PenTool size={20} className="text-indigo-600"/><h3 className="text-lg font-serif font-black text-gray-900 uppercase">Insights Notebook</h3></div>
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Capture scholarly revelations..." className="flex-1 w-full bg-white border-2 border-gray-100 rounded-xl p-4 outline-none font-bold text-gray-800 text-sm resize-none shadow-inner custom-scrollbar focus:border-indigo-500 min-h-[180px]" />
                          <button onClick={handleSaveNote} disabled={isSavingNote} className="py-3 bg-royal-900 text-white font-black rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-[9px] tracking-widest shadow-lg border-b-4 border-black">
                              {isSavingNote ? <Loader2 className="animate-spin" size={14} /> : <CloudUpload size={14} className="text-gold-400" />} <span>{isSavingNote ? 'SYNCING...' : 'COMMIT TO REGISTRY'}</span>
                          </button>
                      </div>
                  )}

                  {activeToolTab === 'highlights' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-3"><Highlighter size={20} className="text-gold-600"/><h3 className="text-lg font-serif font-black text-gray-900 uppercase">Text Highlighter</h3></div>
                          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-700 leading-snug">Choose a color and then select text in the lesson content to apply a highlight clip.</div>
                          <div className="flex gap-2 justify-center py-2">
                              {['#fbbf24', '#10b981', '#f43f5e', '#38bdf8', '#8b5cf6'].map(c => (
                                  <button key={c} onClick={() => setActiveHighlightColor(c)} className={`w-8 h-8 rounded-full border-4 transition-all ${activeHighlightColor === c ? 'border-royal-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                              ))}
                              <button onClick={handleApplyHighlight} className="ml-4 px-4 py-2 bg-royal-900 text-white font-black rounded-lg text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-md">Apply Clip</button>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[180px] space-y-3">
                              {highlights.map(h => (
                                  <div key={h.id} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm group/hl">
                                      <div className="flex justify-between items-start gap-2">
                                          <div className="flex-1"><div className="h-1 w-12 rounded-full mb-2" style={{ backgroundColor: h.color }}></div><p className="text-xs font-serif italic text-gray-700 leading-snug">"{h.text}"</p></div>
                                          <button onClick={() => handleRemoveHighlight(h.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/hl:opacity-100"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                              {highlights.length === 0 && <div className="text-center py-10 text-gray-300 font-bold uppercase text-[9px] tracking-widest">No active highlights.</div>}
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'annotations' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-3"><MessageSquare size={20} className="text-sky-600"/><h3 className="text-lg font-serif font-black text-gray-900 uppercase">Contextual Annotations</h3></div>
                          <div className="space-y-2">
                              <textarea value={currentAnnotationInput} onChange={e => setCurrentAnnotationInput(e.target.value)} placeholder="Type your annotation here..." className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 outline-none font-bold text-gray-800 text-xs min-h-[60px]" />
                              <button onClick={handleApplyAnnotation} className="w-full py-3 bg-sky-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-sky-700 transition-all flex items-center justify-center gap-2"><Plus size={14}/> Annotate Selection</button>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[180px] space-y-4">
                              {annotations.map(a => (
                                  <div key={a.id} className="p-4 rounded-xl border-l-4 border-sky-500 bg-white shadow-sm space-y-2 group/ann">
                                      <div className="flex justify-between">
                                          <span className="text-[8px] font-black text-sky-600 uppercase tracking-widest">Contextual Note</span>
                                          <button onClick={() => handleRemoveAnnotation(a.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/ann:opacity-100 transition-all"><X size={14}/></button>
                                      </div>
                                      <p className="text-[10px] font-black text-gray-400 italic bg-gray-50 p-2 rounded">"{a.text}"</p>
                                      <p className="text-xs font-bold text-gray-800 leading-relaxed">{a.note}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'reminder' && (
                      <div className="h-full flex flex-col items-center justify-center gap-6 animate-in slide-in-from-right-4 text-center">
                          <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100 text-indigo-600"><Bell size={40} /></div>
                          <div><h3 className="text-xl font-serif font-black text-gray-900 mb-2 uppercase">Pause Matrix</h3><p className="text-gray-400 text-xs font-medium">Archive current progress and set a spiritual reminder.</p></div>
                          <div className="w-full space-y-2">
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Return Interval</label>
                              <input type="datetime-local" className="w-full p-3 border-2 border-gray-100 rounded-xl font-black text-sm text-center focus:border-indigo-600 outline-none" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                          </div>
                          <button onClick={handlePauseReminder} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest text-[9px] border-b-4 border-indigo-900">EXECUTE PAUSE</button>
                      </div>
                  )}

                  {activeToolTab === 'autosave' && (
                      <div className="h-full flex flex-col items-center justify-center gap-6 animate-in slide-in-from-right-4 text-center">
                          <div className={`p-4 rounded-2xl border-2 transition-all duration-700 ${isAutoSaveEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}><RefreshCcw size={48} className={isAutoSaveEnabled ? 'animate-spin-slow' : ''}/></div>
                          <div><h3 className="text-xl font-serif font-black text-gray-900 mb-2 uppercase">Background Sync</h3><p className="text-gray-400 text-xs font-medium">Persistent background registry synchronization.</p></div>
                          <button onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)} className={`w-full py-4 rounded-xl font-black text-sm transition-all shadow-md border-b-4 uppercase tracking-widest flex items-center justify-center gap-3 ${isAutoSaveEnabled ? 'bg-emerald-600 text-white border-emerald-950 hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 border-gray-400 hover:bg-gray-300'}`}>
                              {isAutoSaveEnabled ? <><CheckCircle size={18}/> ACTIVE</> : <><X size={18}/> DISABLED</>}
                          </button>
                      </div>
                  )}
                  
                  {activeToolTab === 'download' && (
                      <div className="h-full flex flex-col items-center justify-center gap-6 animate-in slide-in-from-right-4 text-center">
                          <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-100 text-purple-600"><Download size={40} /></div>
                          <div><h3 className="text-xl font-serif font-black text-gray-900 mb-2 uppercase">Registry Export</h3><p className="text-gray-400 text-xs font-medium">Capture lesson contents for offline study.</p></div>
                          <div className="grid grid-cols-2 gap-3 w-full">
                              <button onClick={() => exportService.exportSingleLesson(lesson, 'txt')} className="p-3 bg-royal-900 text-white font-black rounded-xl text-[9px] uppercase hover:bg-black transition-all shadow-md">TEXT FILE</button>
                              <button onClick={() => exportService.exportSingleLesson(lesson, 'print')} className="p-3 bg-indigo-600 text-white font-black rounded-xl text-[9px] uppercase hover:bg-indigo-700 transition-all shadow-md">PRINT/PDF</button>
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
                    <button onClick={onBack} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 shadow-lg group"><ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" /></button>
                    <div>
                        <div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-gold-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{lesson.lesson_type} Registry</span><span className="h-1 w-1 bg-white/30 rounded-full"></span><span className="text-[9px] font-bold text-royal-200 uppercase tracking-widest">{lesson.book} {lesson.chapter}</span></div>
                        <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight leading-tight">{lesson.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-royal-950/50 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="text-center px-4 border-r border-white/10"><p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">SCORE</p><p className="text-2xl font-black text-gold-400">{currentScore.correct}/{currentScore.total}</p></div>
                    <div className="text-center px-4"><p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">DURATION</p><p className="text-2xl font-mono font-black text-white">{formatTime(elapsedSeconds)}</p></div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        <div className="lg:col-span-2 space-y-16">
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setActiveAboutType('course')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Globe size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Course</span></button>
            <button onClick={() => setActiveAboutType('module')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Layers size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Module</span></button>
            <button onClick={() => setActiveAboutType('lesson')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Sparkles size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Lesson</span></button>
          </div>

          {lesson.bibleQuizzes && lesson.bibleQuizzes.length > 0 && (
             <section className="space-y-8">
                <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4"><BookOpen className="text-royal-800" size={32} /> SCRIPTURAL EVALUATION</h2>
                {lesson.bibleQuizzes.map((q) => renderQuizCard(q))}
                {isLessonCompleted && (!lesson.noteQuizzes || lesson.noteQuizzes.length === 0) && moduleProgressData && (
                    <div className="mt-12 p-5 bg-indigo-50/40 border-4 border-indigo-100 rounded-[3.5rem] shadow-lg animate-in slide-in-from-bottom-6 overflow-hidden w-fit mx-auto"><ModuleProgressPie completed={moduleProgressData.completed} total={moduleProgressData.total} /></div>
                )}
             </section>
          )}

          {lesson.leadershipNotes && lesson.leadershipNotes.length > 0 && (
            <section className="space-y-8">
                <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><PenTool size={24} /></div><h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter">LEADERSHIP PERSPECTIVE</h2></div>
                <div className="space-y-12">
                    {lesson.leadershipNotes.map((note) => (
                        <div key={note.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><PenTool size={120} /></div>
                            <div className="relative z-10"><div className="flex items-center gap-3 mb-8 border-b-2 border-indigo-50 pb-4"><h3 className="text-xl font-serif font-black text-gray-900 uppercase tracking-tighter">{note.title}</h3></div><div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: note.body }} /></div>
                        </div>
                    ))}
                </div>
            </section>
          )}

          {lesson.noteQuizzes && lesson.noteQuizzes.length > 0 && (
              <section className="space-y-8">
                <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4"><Target className="text-royal-800" size={32} /> CONTEXTUAL EVALUATION</h2>
                {lesson.noteQuizzes.map((q) => renderQuizCard(q))}
                {isLessonCompleted && moduleProgressData && (
                    <div className="mt-12 p-5 bg-indigo-50/40 border-4 border-indigo-100 rounded-[3.5rem] shadow-lg animate-in slide-in-from-bottom-6 overflow-hidden w-fit mx-auto"><ModuleProgressPie completed={moduleProgressData.completed} total={moduleProgressData.total} /></div>
                )}
              </section>
          )}
        </div>

        <div className="fixed bottom-24 right-14 z-[140] flex flex-col items-end gap-4 pointer-events-none">
            <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="w-20 h-20 bg-royal-900 text-white rounded-full shadow-[0_20px_50px_rgba(30,27,75,0.6)] flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group border-4 border-white relative overflow-hidden">
                {isToolsOpen ? <X size={28} /> : <Activity size={28} className="group-hover:rotate-12 transition-transform mb-1" />}
                <span className="font-black text-[10px] uppercase tracking-widest">{isToolsOpen ? 'CLOSE' : 'TOOLS'}</span>
                <div className="absolute inset-0 bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
        </div>
      </div>

      <div ref={footerRef} className="mt-24 pt-24 border-t-8 border-indigo-50 flex flex-col items-center gap-12 pb-40">
          {isLessonCompleted && (
              <div className="w-full max-w-4xl bg-indigo-600 p-10 rounded-[3rem] shadow-2xl border-b-[12px] border-indigo-900 animate-pop-in relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Trophy size={140} /></div>
                  <div className="relative z-10 text-center"><h4 className="text-3xl md:text-4xl font-serif font-black text-white uppercase tracking-tighter leading-tight">CONGRATULATIONS! <span className="text-gold-400">Well done!!</span></h4><p className="text-indigo-50 text-lg md:text-xl font-bold mt-4 leading-relaxed max-w-2xl mx-auto">{isLastInModule ? "You have successfully completed this module. Please navigate the “Next” button below to proceed to the next module and attempt its (first) lesson." : "You have successfully completed this lesson. Please navigate the “Next” button below to proceed to the next lesson."}</p>
                    {isLastInModule && <button onClick={handleIssueCertificate} disabled={isIssuingCert} className={`mt-10 px-10 py-5 font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 mx-auto uppercase text-sm tracking-[0.3em] border-b-8 active:scale-95 transform hover:-translate-y-1 ${hasReceivedCert ? 'bg-emerald-500 text-white border-emerald-800 hover:bg-emerald-600' : 'bg-gold-500 text-royal-950 border-gold-800 hover:bg-gold-400'}`}>{isIssuingCert ? <Loader2 className="animate-spin" size={24}/> : hasReceivedCert ? <BadgeCheck size={28}/> : <Sparkles size={28}/>}{hasReceivedCert ? "PREVIEW CERTIFICATE" : "RECEIVE CERTIFICATE"}</button>}
                  </div>
              </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-4xl">
              <div className="flex-1">
                {adjacentLessons.prev ? <button onClick={() => navigateAdjacent(adjacentLessons.prev!)} className="w-full h-full flex items-center justify-between p-5 bg-white border-2 border-royal-100 rounded-[1.25rem] hover:border-gold-500 hover:shadow-[0_12px_30px_-8px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1 group active:scale-95 border-b-[6px] border-royal-200"><div className="p-2 bg-royal-50 text-royal-400 group-hover:bg-gold-500 group-hover:text-white rounded-[0.75rem] transition-all"><ChevronLeft size={20} strokeWidth={3} /></div><div className="text-right flex-1 pr-3"><p className="text-[6px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1 group-hover:text-gold-600 transition-colors">Registry History</p><h4 className="font-serif font-black text-royal-900 uppercase text-xs md:text-sm leading-tight">Previous Lesson</h4></div></button> : <div className="w-full h-full p-5 border-2 border-dashed border-gray-100 rounded-[1.25rem] flex flex-col items-center justify-center opacity-30"><Layers size={24} className="text-gray-200 mb-2" /><span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">Origin Reached</span></div>}
              </div>
              <div className="flex-1">
                {adjacentLessons.next ? <div className="relative h-full">{!isLessonCompleted ? <div className="h-full w-full p-5 bg-gray-50 border-2 border-gray-200 rounded-[1.25rem] flex flex-col items-center justify-center text-center gap-2 opacity-70 border-b-[6px]"><Target size={20} className="text-gray-300" /><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Evaluation Required</p></div> : <button onClick={() => navigateAdjacent(adjacentLessons.next!)} className="w-full h-full flex items-center justify-between p-5 bg-royal-900 text-white border-2 border-black rounded-[1.25rem] shadow-[0_15px_35px_-8px_rgba(30,27,75,0.6)] hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] transition-all transform hover:-translate-y-1 group active:scale-95 border-b-[6px] border-black animate-pop-in overflow-hidden relative"><div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={40} /></div><div className="text-left flex-1 pl-3 z-10"><p className="text-[6px] md:text-[8px] font-black text-gold-400 uppercase tracking-[0.3em] mb-1 group-hover:animate-pulse">Verified Pathway</p><h4 className="font-serif font-black uppercase text-xs md:text-sm leading-tight">Proceed Next</h4></div><div className="p-2 bg-white/10 text-white group-hover:bg-gold-500 rounded-[0.75rem] transition-all z-10 ring-2 ring-white/5"><ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" /></div></button>}</div> : <div className="w-full h-full p-5 bg-gold border-2 border-gold-200 rounded-[1.25rem] flex flex-col items-center justify-center text-center gap-2 border-b-[6px] border-gold-300"><BadgeCheck size={24} className="text-gold-500" /><p className="text-[8px] font-black text-gold-700 uppercase tracking-[0.4em]">Matrix Mastered</p></div>}
              </div>
          </div>
      </div>

      {activeAboutType && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border-8 border-royal-900">
              <div className="bg-royal-900 p-8 text-white flex justify-between items-center shrink-0"><h3 className="text-2xl font-serif font-black uppercase tracking-tight">Contextual Identity: {activeAboutType}</h3><button onClick={() => setActiveAboutType(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div>
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 custom-scrollbar"><AboutSection segments={activeAboutType === 'course' ? (parentCourse?.about || []) : activeAboutType === 'module' ? (parentModule?.about || []) : (lesson.about || [])} /></div>
           </div>
        </div>
      )}

      {issuedCertForPreview && <CertificateGenerator certificate={issuedCertForPreview} onClose={() => setIssuedCertForPreview(null)} />}
    </div>
  );
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

const ModuleProgressPie = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const radius = 9; 
    const strokeWidth = radius * 2; 
    const circumference = 2 * Math.PI * radius;
    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
    const midAngle = (percentage / 100) * 180 - 90; 
    const radian = (midAngle * Math.PI) / 180;
    const tx = 18 + radius * Math.cos(radian); 
    const ty = 18 + radius * Math.sin(radian);
    return (
        <div className="flex flex-col items-center gap-6 py-6 animate-in fade-in duration-1000">
            <div className="relative w-64 h-64 group">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-xl overflow-visible">
                    <circle cx="18" cy="18" r={radius} fill="transparent" stroke="#F1EFEA" strokeWidth={strokeWidth} className="animate-in fade-in duration-[1500ms]" />
                    <circle cx="18" cy="18" r={radius} fill="transparent" stroke="#1e1b4b" strokeWidth={strokeWidth} strokeDasharray={dashArray} strokeDashoffset="0" className="transition-all duration-[900ms] ease-out" style={{ strokeDashoffset: 0 }} />
                    {percentage > 12 && <text x={tx} y={ty} fill="white" fontSize="2.5" fontWeight="800" textAnchor="middle" dominantBaseline="central" className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transform rotate-90" style={{ transformOrigin: `${tx}px ${ty}px` }}>{percentage}%</text>}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><div className="text-center"><p className="text-4xl font-sans font-semibold text-gray-950 tracking-tight leading-none">{completed} <span className="text-gray-300 mx-0.5">/</span> {total}</p><div className="mt-3 space-y-0.5"><p className="text-[10px] font-sans font-medium uppercase tracking-[0.3em] text-gray-400">Lessons</p><p className="text-[10px] font-sans font-medium uppercase tracking-[0.3em] text-gray-400">Completed</p></div></div></div>
            </div>
            <div className="text-center space-y-1"><h4 className="text-xs font-sans font-medium text-gray-400 uppercase tracking-[0.2em] mb-1">Module Progress Analysis</h4><p className="text-2xl font-sans font-bold text-royal-900">{percentage}% completed</p></div>
        </div>
    );
};

export default LessonView;