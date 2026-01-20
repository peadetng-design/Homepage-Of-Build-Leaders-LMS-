import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module, Course, AboutSegment, Certificate, LeadershipNote } from '../types';
import { lessonService } from '../services/lessonService';
import CertificateGenerator from './CertificateGenerator';
// Fix: Added missing AlertCircle import from lucide-react
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, Clock, Trophy, BadgeCheck, Loader2, Info, LayoutGrid, Layers, Sparkles, Book, Star, ChevronRight, ArrowRight, Library, FileText, UserCircle, Globe, Fingerprint, Hash, Zap, Target, BookMarked, Quote, GraduationCap, Users, PenTool, Save, MessageSquareText, Activity, AlertCircle } from 'lucide-react';

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
  const [selectedSegment, setSelectedSegment] = useState<AboutSegment | null>(null);
  
  // Real-time telemetry state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState({ correct: 0, total: 0 });
  
  // Journaling state
  const [isNoteOpen, setIsNoteOpen] = useState(false);
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
          // Sync with storage every 5 seconds for real-time mentor visibility
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
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const renderMetadataGrid = (type: 'Course' | 'Module' | 'Lesson') => {
      let gridItems: any[] = [];
      let summary = "";

      if (type === 'Course' && parentCourse) {
          gridItems = [
              { label: "REGISTRY ID", value: parentCourse.id, icon: Hash },
              { label: "PROFICIENCY LEVEL", value: parentCourse.level, icon: Trophy },
              { label: "PRIMARY LANGUAGE", value: parentCourse.language, icon: Globe },
              { label: "AUTHOR / INSTITUTION", value: parentCourse.author, icon: UserCircle },
          ];
          summary = parentCourse.description;
      } else if (type === 'Module' && parentModule) {
          gridItems = [
              { label: "MODULE IDENTIFIER", value: parentModule.id, icon: Hash },
              { label: "PASS THRESHOLD", value: `${parentModule.completionRule.minimumCompletionPercentage}%`, icon: Target },
              { label: "CERTIFICATE TITLE", value: parentModule.certificateConfig.title, icon: BadgeCheck },
              { label: "ISSUING BODY", value: parentModule.certificateConfig.issuedBy, icon: GraduationCap },
          ];
          summary = parentModule.description;
      } else if (type === 'Lesson') {
          gridItems = [
              { label: "LESSON IDENTIFIER", value: lesson.id, icon: Hash },
              { label: "BIBLE REFERENCE", value: `${lesson.book} ${lesson.chapter}`, icon: BookMarked },
              { label: "AUDIENCE SCOPE", value: lesson.targetAudience, icon: Users },
              { label: "PEDAGOGICAL TYPE", value: lesson.lesson_type, icon: Zap },
          ];
          summary = lesson.description;
      }

      return (
          <div className="mb-16 animate-in slide-in-from-top-12 duration-700">
              <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6 mb-10">
                  <Fingerprint className="text-indigo-600" size={32} />
                  <h4 className="text-3xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">STRATEGIC METADATA</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridItems.map((item, i) => (
                      <div key={i} className="bg-white border-4 border-gray-50 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-5 group hover:border-indigo-100 transition-all">
                          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><item.icon size={28} /></div>
                          <div className="min-w-0">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">{item.label}</p>
                              <p className="text-base font-black text-gray-950 uppercase truncate tracking-tight">{item.value}</p>
                          </div>
                      </div>
                  ))}
                  <div className="md:col-span-2 bg-royal-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-white border-b-[10px] border-black">
                      <div className="relative z-10">
                          <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.4em] mb-4">EXECUTIVE FOCUS SUMMARY</p>
                          <p className="text-xl font-medium leading-relaxed italic opacity-95">"{summary}"</p>
                      </div>
                      <Sparkles className="absolute right-0 bottom-0 text-white opacity-10 -mr-8 -mb-8" size={180} />
                  </div>
              </div>
          </div>
      );
  };

  const renderOverlay = (type: 'Course' | 'Module' | 'Lesson', segments: AboutSegment[]) => (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] shadow-[0_50px_150px_-30px_rgba(0,0,0,0.8)] w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border-4 border-white/30">
              <div className="bg-royal-950 p-10 md:p-14 text-white relative shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex justify-between items-center">
                      <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl flex items-center justify-center border-b-8 border-indigo-900">
                             {type === 'Course' ? <Library size={40}/> : type === 'Module' ? <Layers size={40}/> : <BookOpen size={40}/>}
                          </div>
                          <div>
                            <h3 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tight leading-none">Knowledge Perspectives</h3>
                            <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.5em] mt-3">{type} Systematic Audit</p>
                          </div>
                      </div>
                      <button onClick={() => setActiveAboutType(null)} className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20 shadow-xl group"><X size={40} className="group-hover:rotate-90 transition-transform"/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-12 md:p-16 bg-[#fdfdfd] custom-scrollbar">
                  {renderMetadataGrid(type)}
                  <div className="flex items-center gap-4 border-b-4 border-indigo-50 pb-6 mb-10">
                      <LayoutGrid className="text-indigo-600" size={32} />
                      <h4 className="text-3xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">INSTRUCTIONAL SEGMENTS</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {segments.map((seg, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border-8 border-gray-50 p-10 rounded-[3rem] hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                            onClick={() => setSelectedSegment(seg)}
                          >
                              <div className="flex justify-between items-start mb-8 relative z-10">
                                  <span className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-3xl shadow-inner border-b-4 border-indigo-100">{seg.order}</span>
                                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md"><ChevronRight size={24}/></div>
                              </div>
                              <h4 className="text-2xl font-serif font-black text-gray-950 uppercase leading-tight mb-4 group-hover:text-indigo-600 transition-colors relative z-10">{seg.title}</h4>
                              <p className="text-gray-500 text-base font-medium line-clamp-3 leading-relaxed relative z-10">{seg.body.replace(/<[^>]*>?/gm, '')}</p>
                              <div className="mt-auto pt-8 relative z-10">
                                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">Expand Dimension <ArrowRight size={14}/></span>
                              </div>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-125 transition-transform opacity-30"></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          {selectedSegment && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-indigo-950/95 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
                  <div className="bg-white rounded-[4rem] shadow-[0_50px_200px_-50px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-white/50">
                      <div className="p-12 border-b-8 border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <div className="flex items-center gap-6">
                              <span className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl border-b-4 border-indigo-900">{selectedSegment.order}</span>
                              <h4 className="text-3xl md:text-5xl font-serif font-black text-gray-950 uppercase tracking-tighter">{selectedSegment.title}</h4>
                          </div>
                          <button onClick={() => setSelectedSegment(null)} className="p-3 text-gray-300 hover:text-gray-900 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={32}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-12 md:p-16 text-xl text-gray-700 leading-relaxed custom-scrollbar font-medium prose prose-indigo max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedSegment.body }} />
                      </div>
                      <div className="p-10 border-t-8 border-gray-50 flex justify-center bg-white shrink-0">
                          <button onClick={() => setSelectedSegment(null)} className="px-20 py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl uppercase tracking-[0.4em] text-sm hover:bg-indigo-700 transition-all border-b-8 border-indigo-950 active:scale-95">CLOSE DIMENSION</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-40 relative overflow-x-hidden">
      
      {/* PERSISTENT SIDE NOTE ICON */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-4 animate-in slide-in-from-right-12 duration-1000">
          <button 
            onClick={() => setIsNoteOpen(true)}
            className="w-20 h-20 bg-royal-900 text-white rounded-3xl shadow-[0_20px_50px_rgba(30,27,75,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-r-[8px] border-gold-500 group"
          >
             <MessageSquareText size={36} className="group-hover:rotate-12 transition-transform" />
             <div className="absolute right-full mr-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl">Personal Journal</div>
          </button>
      </div>

      {/* JOURNAL DRAWER */}
      {isNoteOpen && (
          <div className="fixed inset-0 z-[140] flex justify-end animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setIsNoteOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white h-full shadow-[-30px_0_100px_rgba(0,0,0,0.3)] border-l-[12px] border-royal-900 flex flex-col animate-in slide-in-from-right-full duration-500">
                  <div className="p-10 bg-royal-950 text-white relative">
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                      <div className="relative z-10 flex justify-between items-center mb-6">
                         <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><MessageSquareText size={32} /></div>
                         <button onClick={() => setIsNoteOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
                      </div>
                      <h3 className="text-3xl font-serif font-black uppercase tracking-tight relative z-10">Personal Insight Journal</h3>
                      <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.3em] mt-2 relative z-10">Lesson Audit Notes</p>
                  </div>
                  <div className="flex-1 p-10 bg-gray-50/50 flex flex-col gap-6">
                      <div className="flex-1 relative">
                        <textarea 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Type your strategic insights and personal reflections here..."
                            className="w-full h-full p-8 bg-white border-4 border-gray-100 rounded-[2.5rem] shadow-inner outline-none focus:border-indigo-400 transition-all font-medium text-lg leading-relaxed text-gray-700"
                        />
                        {isSavingNote && (
                            <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                                <Check size={12} strokeWidth={4} /> Persistent Registry Saved
                            </div>
                        )}
                      </div>
                      <button 
                        onClick={handleSaveNote}
                        className="w-full py-6 bg-royal-900 text-white font-black rounded-3xl shadow-2xl border-b-8 border-black hover:bg-black transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.4em] active:scale-95"
                      >
                         <Save size={24} /> Commit to Registry
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-[6px] border-indigo-100 shadow-2xl px-6 py-6">
          <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                  <button onClick={onBack} className="p-4 bg-gray-100 hover:bg-white rounded-2xl text-gray-500 hover:text-royal-950 transition-all shadow-inner border border-gray-200 group"><ArrowLeft size={32} className="group-hover:-translate-x-2 transition-transform" /></button>
                  <div>
                      <h2 className="text-2xl md:text-4xl font-serif font-black text-gray-950 leading-none uppercase tracking-tighter truncate max-w-md">{lesson.title}</h2>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-3 ml-1 flex items-center gap-2"><Sparkles size={14} className="animate-pulse" /> Persistent Registry Access Enabled</p>
                  </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 bg-indigo-50/50 p-2 rounded-[2.5rem] shadow-inner border-2 border-indigo-100/50">
                  <button onClick={() => setActiveAboutType('course')} className="px-8 py-3.5 bg-white text-royal-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-gray-200"><Library size={18} className="text-indigo-600" /> ABOUT THIS COURSE</button>
                  <button onClick={() => setActiveAboutType('module')} className="px-8 py-3.5 bg-white text-royal-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-gray-200"><Layers size={18} className="text-indigo-600" /> ABOUT THIS MODULE</button>
                  <button onClick={() => setActiveAboutType('lesson')} className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-indigo-900"><Sparkles size={18} className="text-gold-400" /> ABOUT THIS LESSON</button>
              </div>
          </div>
      </div>

      {/* REAL-TIME TELEMETRY PANEL */}
      <div className="bg-royal-950 border-b-[10px] border-black py-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 flex items-center gap-8 group">
                  <div className="p-5 bg-gold-500 text-white rounded-[1.5rem] shadow-[0_0_30px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform"><Trophy size={40} /></div>
                  <div>
                      <p className="text-gold-400 text-xs font-black uppercase tracking-[0.4em] mb-2">LESSON SCORE</p>
                      <h4 className="text-6xl font-black text-white leading-none tracking-tighter">
                        {currentScore.correct} <span className="text-2xl text-white/30 tracking-tight">/ {currentScore.total}</span>
                      </h4>
                  </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 flex items-center gap-8 group">
                  <div className="p-5 bg-indigo-500 text-white rounded-[1.5rem] shadow-[0_0_30px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform"><Clock size={40} /></div>
                  <div>
                      <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.4em] mb-2">LESSON DURATION</p>
                      <h4 className="text-6xl font-mono font-black text-white leading-none tracking-tighter">
                        {formatTime(elapsedSeconds)}
                      </h4>
                  </div>
              </div>
          </div>
          <div className="mt-8 flex justify-center items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.6em]">Registry Analytics Synchronized In Real Time</p>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        {lesson.leadershipNotes && lesson.leadershipNotes.map((note) => (
            <div key={note.id} className="bg-white p-12 md:p-20 rounded-[4rem] shadow-[0_60px_150px_-40px_rgba(0,0,0,0.15)] border-[10px] border-gray-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-4 h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
              <div className="flex flex-col gap-6 mb-14">
                  <div className="flex items-center gap-3"><div className="p-2 bg-royal-900 rounded-lg text-white"><FileText size={20}/></div><span className="text-[10px] font-black text-royal-600 uppercase tracking-[0.4em]">Integrated Leadership Article</span></div>
                  <h2 className="text-4xl md:text-6xl font-serif font-black text-gray-950 leading-tight uppercase tracking-tighter">{note.title || 'INSTRUCTIONAL ESSAY'}</h2>
                  <div className="w-24 h-1.5 bg-gold-500 rounded-full"></div>
              </div>
              <div className="font-medium leading-relaxed text-gray-800 text-2xl prose prose-2xl prose-indigo max-w-none prose-p:mb-8 prose-headings:font-black" dangerouslySetInnerHTML={{ __html: note.body }} />
            </div>
        ))}

        {lesson.bibleQuizzes && lesson.bibleQuizzes.length > 0 && (
            <div className="space-y-16">
                <div className="flex items-center gap-10">
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                    <h2 className="text-4xl font-serif font-black text-gray-950 flex items-center gap-6 uppercase tracking-tighter"><BookMarked className="text-indigo-600" size={48} /> Bible Validation</h2>
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                </div>
                {lesson.bibleQuizzes.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1} selectedOptionId={attempts[quiz.id]} onSelect={(opt: any) => handleOptionSelect(quiz, opt)} />
                ))}
            </div>
        )}

        {lesson.noteQuizzes && lesson.noteQuizzes.length > 0 && (
            <div className="space-y-16">
                <div className="flex items-center gap-10">
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                    <h2 className="text-4xl font-serif font-black text-gray-950 flex items-center gap-6 uppercase tracking-tighter"><PenTool className="text-indigo-600" size={48} /> Contextual Analysis</h2>
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                </div>
                {lesson.noteQuizzes.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1 + (lesson.bibleQuizzes?.length || 0)} selectedOptionId={attempts[quiz.id]} onSelect={(opt: any) => handleOptionSelect(quiz, opt)} />
                ))}
            </div>
        )}

      </div>

      {activeAboutType === 'course' && parentCourse && renderOverlay('Course', parentCourse.about)}
      {activeAboutType === 'module' && parentModule && renderOverlay('Module', parentModule.about)}
      {activeAboutType === 'lesson' && renderOverlay('Lesson', lesson.about)}
    </div>
  );
};

const QuizCard = ({ quiz, index, selectedOptionId, onSelect }: any) => {
    const isAnswered = !!selectedOptionId;
    const selectedOption = quiz.options.find((o: any) => o.id === selectedOptionId);
    const correctSelected = selectedOption?.isCorrect;

    return (
        <div className="bg-white rounded-[4rem] shadow-2xl border-[8px] border-gray-50 p-12 md:p-16 relative transition-all hover:border-indigo-100 group/card overflow-hidden">
            {/* Background Motion Accent */}
            {isAnswered && (
                <div className={`absolute inset-0 opacity-5 pointer-events-none transition-all duration-1000 ${correctSelected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            )}

            <div className="flex gap-10 mb-14 items-start relative z-10">
                <span className="shrink-0 w-24 h-24 rounded-[2.5rem] bg-royal-950 text-white font-black flex items-center justify-center text-5xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-8 border-black group-hover/card:scale-110 transition-transform duration-500">{index}</span>
                <div className="flex-1 space-y-6">
                    {(quiz.referenceText || quiz.sourceNoteTitle) && (
                        <div className="text-indigo-600 font-black text-sm uppercase tracking-[0.4em] bg-indigo-50 px-6 py-3 rounded-2xl w-fit border border-indigo-100 shadow-sm flex items-center gap-3">
                           <Book size={18}/> {quiz.referenceText || quiz.sourceNoteTitle}
                        </div>
                    )}
                    <h3 className="font-black text-3xl md:text-5xl text-gray-950 leading-tight tracking-tight">{quiz.text}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {quiz.options.map((opt: any) => {
                    const isCurrentSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.isCorrect;
                    
                    let cardClass = "w-full text-left p-10 rounded-[3rem] border-4 transition-all duration-700 flex flex-col gap-6 relative group/opt overflow-hidden ";
                    let badgeClass = "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-4 shrink-0 shadow-inner transition-all duration-500 ";
                    
                    if (!isAnswered) {
                        cardClass += "bg-white border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)] hover:-translate-y-2 shadow-sm";
                        badgeClass += "bg-gray-50 border-gray-100 text-gray-400 group-hover/opt:bg-indigo-600 group-hover/opt:text-white group-hover/opt:border-indigo-700";
                    } else {
                        // REVEAL SYSTEM LOGIC
                        if (correctSelected) {
                            // Logic A: Correct selected
                            if (isCorrect) {
                                cardClass += "bg-emerald-50 border-emerald-500 shadow-2xl scale-[1.08] z-20 text-emerald-950 ring-[15px] ring-emerald-500/10 animate-in zoom-in-95 duration-1000";
                                badgeClass += "bg-emerald-500 text-white border-emerald-600 rotate-[360deg]";
                            } else {
                                cardClass += "bg-red-50 border-red-200 opacity-60 scale-95 grayscale-[0.5] blur-[0.5px]";
                                badgeClass += "bg-red-500 text-white border-red-600";
                            }
                        } else {
                            // Logic B: Incorrect selected
                            if (isCurrentSelected) {
                                cardClass += "bg-red-50 border-red-500 shadow-xl text-red-950 scale-100 animate-in shake duration-500 z-10";
                                badgeClass += "bg-red-600 text-white border-red-700";
                            } else if (isCorrect) {
                                cardClass += "bg-emerald-50 border-emerald-400 shadow-2xl scale-[1.08] z-20 text-emerald-950 ring-[15px] ring-emerald-500/10 animate-in zoom-in-95 duration-1000";
                                badgeClass += "bg-emerald-500 text-white border-emerald-600 rotate-[360deg]";
                            } else {
                                cardClass += "bg-orange-50 border-orange-300 opacity-80 scale-95";
                                badgeClass += "bg-orange-500 text-white border-orange-600";
                            }
                        }
                    }

                    return (
                        <button key={opt.id} disabled={isAnswered} onClick={() => onSelect(opt)} className={cardClass}>
                            <div className="flex items-center gap-6">
                                <span className={badgeClass}>{opt.label}</span>
                                <span className="font-black text-2xl flex-1 tracking-tight leading-snug">{opt.text}</span>
                                {isAnswered && isCorrect && <CheckCircle size={48} className="text-emerald-600 shrink-0 drop-shadow-xl animate-bounce" />}
                                {isAnswered && isCurrentSelected && !isCorrect && <X size={48} className="text-red-600 shrink-0 drop-shadow-xl animate-pulse" />}
                            </div>
                            
                            {/* HYBRID BOLD MAGNIFYING REVEAL FOR EXPLANATIONS */}
                            {isAnswered && (
                                <div className={`pt-8 border-t-4 w-full animate-in slide-in-from-top-4 duration-1000 ${isCorrect ? 'border-emerald-200' : isCurrentSelected ? 'border-red-200' : 'border-orange-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-700' : isCurrentSelected ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            <Activity size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black uppercase block mb-2 tracking-[0.2em] opacity-60">System Contextual Audit:</span>
                                            <p className="text-lg font-bold italic leading-relaxed">
                                                "{opt.explanation}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Magnifying Glass Icon Accent for revealed cards */}
                            {isAnswered && (isCorrect || isCurrentSelected) && (
                                <div className="absolute -bottom-4 -right-4 opacity-10 group-hover/opt:scale-125 transition-transform duration-1000">
                                   {isCorrect ? <Sparkles size={100} /> : <AlertCircle size={100} />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonView;
