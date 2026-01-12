
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, Clock, Trophy, BadgeCheck, Loader2, History, ListChecks, Printer, Sparkles, Book, Star } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); 
  const [attemptHistory, setAttemptHistory] = useState<StudentAttempt[]>([]);
  const [score, setScore] = useState({ total: 0, correct: 0 });
  const [completedModule, setCompletedModule] = useState<Module | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [issuedCert, setIssuedCert] = useState<Certificate | null>(null);
  
  const [showTracker, setShowTracker] = useState(false);
  const [moduleProgress, setModuleProgress] = useState<{ completed: number, total: number, lessons: { title: string, done: boolean }[] } | null>(null);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  const totalQuestions = lesson.sections.reduce((acc, sec) => acc + (sec.quizzes?.length || 0), 0);
  const questionsAnswered = Object.keys(attempts).length;
  const progressPercent = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;
  const isCompleted = totalQuestions > 0 && questionsAnswered === totalQuestions;

  useEffect(() => {
    loadData();
    if (!isCompleted) {
        timerRef.current = setInterval(() => {
           setElapsedTime(prev => {
               const newTime = prev + 1;
               if (newTime % 2 === 0) lessonService.saveQuizTimer(currentUser.id, lesson.id, newTime);
               return newTime;
           });
        }, 1000);
    }
    return () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedTime); 
    };
  }, [lesson.id]);

  useEffect(() => {
      if (isCompleted && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedTime);
          checkModuleStatus();
      }
  }, [isCompleted]);

  const checkModuleStatus = async () => {
      const module = await lessonService.checkModuleCompletion(currentUser.id, lesson.id);
      if (module) setCompletedModule(module);
      const progress = await lessonService.getModuleProgress(currentUser.id, lesson.moduleId);
      setModuleProgress(progress);
  };

  const handleClaimCertificate = async () => {
      if (!completedModule) return;
      setIsIssuingCert(true);
      try {
          const cert = await lessonService.issueCertificate(currentUser.id, currentUser.name, completedModule.id);
          setIssuedCert(cert);
      } finally { setIsIssuingCert(false); }
  };

  const loadData = async () => {
    const savedTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedTime(savedTime);
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    setAttemptHistory(history);
    const attemptMap: Record<string, string> = {};
    let correctCount = 0;
    const uniqueQuizzes = new Set(history.map(h => h.quizId));
    uniqueQuizzes.forEach(qId => {
        const lastAttempt = history.filter(h => h.quizId === qId).pop();
        if (lastAttempt) {
            attemptMap[qId] = lastAttempt.selectedOptionId;
            if (lastAttempt.isCorrect) correctCount++;
        }
    });
    setAttempts(attemptMap);
    setScore({ total: Object.keys(attemptMap).length, correct: correctCount });
    const progress = await lessonService.getModuleProgress(currentUser.id, lesson.moduleId);
    setModuleProgress(progress);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    const isCorrect = option.isCorrect;
    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));
    setScore(prev => ({ total: prev.total + 1, correct: isCorrect ? prev.correct + 1 : prev.correct }));
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, isCorrect);
    setAttemptHistory(prev => [...prev, { id: crypto.randomUUID(), studentId: currentUser.id, lessonId: lesson.id, quizId: quiz.id, selectedOptionId: option.id, isCorrect: isCorrect, score: isCorrect ? 10 : 0, attempted_at: new Date().toISOString() }]);
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      <div className="sticky top-0 z-30 bg-royal-900 shadow-2xl rounded-b-[2rem] md:rounded-b-[3.5rem] overflow-hidden border-b border-royal-700/50 animate-in slide-in-from-top-4 duration-500">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-10 text-white">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full lg:w-auto">
                    <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 shadow-lg active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-serif font-black text-white leading-tight truncate max-w-xs md:max-w-md">{lesson.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-0.5 bg-gold-400 text-royal-900 text-[10px] font-black uppercase tracking-widest rounded">{lesson.lesson_type}</span>
                            <span className="text-royal-100 text-[11px] font-bold flex items-center gap-1 opacity-80"><BookOpen size={12}/> {lesson.book} {lesson.chapter}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center w-full lg:w-auto">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-md">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                                <circle cx="24" cy="24" r="20" stroke="#fbbf24" strokeWidth="4" fill="none" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * (totalQuestions > 0 ? score.correct / totalQuestions : 0))} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <span className="relative z-10 text-base font-black text-gold-400">{score.correct}</span>
                        </div>
                        <div className="text-left">
                            <span className="block text-[9px] font-black text-royal-200 uppercase tracking-widest mb-0.5">SCORE</span>
                            <span className="text-[11px] font-bold text-white/90">Validated</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-md">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <Clock size={16} className="text-indigo-300" />
                        </div>
                        <div className="text-left">
                            <span className="block text-[9px] font-black text-royal-200 uppercase tracking-widest mb-0.5">DURATION</span>
                            <span className="text-sm font-mono font-black text-white">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col gap-1.5 w-40 md:w-56">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black text-royal-200 uppercase tracking-widest">PROGRESS</span>
                            <div className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-black text-gold-400">{Math.round(progressPercent)}%</div>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div className="h-full bg-gradient-to-r from-gold-500 to-amber-300 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {lesson.sections.map((section) => (
          <div key={section.id}>
            {section.type === 'note' ? (
              <div className="prose prose-lg max-w-none text-gray-800 bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                <h2 className="text-3xl font-serif font-black text-gray-950 border-b-4 border-blue-50 mb-8 pb-4 flex items-center gap-3"><BookOpen className="text-blue-500"/> {section.title}</h2>
                <div className="font-medium leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: section.body || '' }} />
              </div>
            ) : (
              <div className="space-y-10 mt-12">
                <div className="flex items-center gap-4">
                    <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-purple-100"></div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter"><HelpCircle className="text-purple-500" /> {section.title}</h2>
                    <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-purple-100"></div>
                </div>
                {section.quizzes?.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1} selectedOptionId={attempts[quiz.id]} onSelect={(opt) => handleOptionSelect(quiz, opt)} attemptHistory={attemptHistory} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="text-center pt-16 border-t-4 border-dashed border-gray-200">
           {isCompleted && (
               <div className="space-y-8 animate-in pop-in duration-700">
                   <div className="relative inline-block">
                        <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                        <div className="bg-white border-4 border-green-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10"><CheckCircle className="text-green-500" size={64} /></div>
                   </div>
                   <h2 className="text-5xl font-serif font-black text-gray-950 leading-tight">Excellent Standing!</h2>
                   <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
                        {moduleProgress && (
                             <button onClick={() => setShowTracker(true)} className="px-10 py-4 bg-white text-royal-800 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 border-4 border-royal-100 shadow-xl"><ListChecks size={24} /> VIEW PROGRESS ({moduleProgress.completed}/{moduleProgress.total})</button>
                        )}
                        <button onClick={onBack} className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl border-b-4 border-black">EXIT TO LIBRARY</button>
                   </div>
               </div>
           )}

           {completedModule && (
               <div className="mt-24 p-1 rounded-[4rem] bg-gradient-to-br from-gold-500 via-amber-400 to-gold-600 shadow-[0_50px_100px_-20px_rgba(217,119,6,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-1000">
                   
                   {/* LAYER 1: ROTATING RAYS (Atmosphere) */}
                   <div className="absolute inset-0 rays-container overflow-hidden pointer-events-none opacity-40">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0deg,white_20deg,transparent_40deg)] animate-rays"></div>
                   </div>

                   {/* LAYER 2: GRACE PARTICLES (Particles) */}
                   <div className="absolute inset-0 pointer-events-none">
                       {[...Array(12)].map((_, i) => (
                           <div key={i} className="particle animate-particle-up" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, width: `${Math.random() * 6 + 2}px`, height: `${Math.random() * 6 + 2}px` }}></div>
                       ))}
                   </div>

                   {/* LAYER 3: THE CREDENTIAL (The big pulsing center) */}
                   <div className="bg-royal-950 p-12 md:p-16 rounded-[3.8rem] relative z-10 text-center overflow-hidden border-2 border-white/10">
                       <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -translate-y-20 scale-150"><Trophy size={400} /></div>
                       
                       <div className="relative z-10">
                           <div className="mb-10 relative inline-block">
                                <div className="absolute inset-0 bg-gold-400 blur-[60px] opacity-40 animate-pulse"></div>
                                <div className="w-28 h-28 bg-gradient-to-br from-gold-300 to-gold-600 rounded-[2rem] flex items-center justify-center shadow-[0_20px_60px_-10px_rgba(217,119,6,0.6)] transform rotate-6 mx-auto ring-8 ring-white/20 animate-pop-in">
                                    <BadgeCheck size={64} className="text-white drop-shadow-2xl" strokeWidth={3} />
                                </div>
                                <div className="absolute -top-4 -right-4 bg-white text-royal-900 p-2 rounded-full shadow-lg animate-bounce duration-1000"><Star fill="currentColor" size={24} /></div>
                           </div>

                           <h3 className="text-gold-400 text-base font-black tracking-[0.6em] uppercase mb-4 animate-in slide-in-from-bottom-2 duration-500">Milestone Unlocked</h3>
                           <h2 className="text-4xl md:text-6xl font-serif font-black mb-8 leading-tight text-white tracking-tighter">Module Mastered: <br/> <span className="text-gold-400 drop-shadow-md">{completedModule.title}</span></h2>
                           
                           <div className="h-1.5 w-32 bg-gold-500 mx-auto rounded-full mb-10 shadow-[0_0_15px_rgba(217,119,6,0.8)]"></div>
                           
                           <p className="text-indigo-100 mb-12 max-w-xl mx-auto font-bold text-xl leading-relaxed opacity-90">
                              Well done, good and faithful leader! Your spiritual foundations have been verified. Your digital credential is ready for collection.
                           </p>

                           {/* LAYER 4: INTERACTIVE (High-impact button) */}
                           <div className="flex flex-col gap-6 items-center">
                               {issuedCert ? (
                                   <button 
                                     onClick={() => setViewingCert(issuedCert)} 
                                     className="group relative px-16 py-6 bg-gold-500 text-white font-black rounded-3xl shadow-[0_30px_60px_-15px_rgba(217,119,6,0.5)] hover:bg-gold-400 transition-all flex items-center gap-4 text-2xl border-b-8 border-gold-700 transform hover:-translate-y-1 active:scale-95"
                                   >
                                       <Printer size={32} /> PRINT OFFICIAL COPY
                                   </button>
                               ) : (
                                   <button 
                                     onClick={handleClaimCertificate} 
                                     disabled={isIssuingCert} 
                                     className="group relative px-20 py-8 bg-gradient-to-r from-gold-400 via-amber-300 to-gold-600 text-royal-950 font-black rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(217,119,6,0.6)] hover:shadow-[0_50px_100px_-25px_rgba(217,119,6,0.8)] transform transition-all hover:scale-105 flex items-center gap-6 mx-auto text-3xl border-b-[10px] border-gold-800 animate-bounce-pulse"
                                   >
                                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 ease-in-out -skew-x-12 -translate-x-full"></div>
                                        {isIssuingCert ? <Loader2 className="animate-spin" size={40} /> : <Trophy size={40} className="group-hover:rotate-12 transition-transform" />} 
                                        RECEIVE CERTIFICATE
                                   </button>
                               )}
                               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-4">Verified by Build Biblical Leaders LMS Authority</p>
                           </div>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>

      {showTracker && moduleProgress && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xl animate-in fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                  <div className="bg-royal-950 p-10 text-white relative">
                      <div className="relative z-10 flex justify-between items-center">
                          <div className="flex items-center gap-4"><div className="p-3 bg-royal-800 rounded-2xl"><ListChecks className="text-gold-500" size={28} /></div><h3 className="text-3xl font-serif font-black uppercase tracking-tighter">Progress</h3></div>
                          <button onClick={() => setShowTracker(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                      </div>
                  </div>
                  <div className="p-10">
                      <div className="flex justify-between items-end mb-8">
                          <div><p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Module Standing</p><p className="text-3xl font-black text-gray-900">{moduleProgress.completed} / {moduleProgress.total}</p></div>
                          <p className="text-5xl font-black text-royal-600 leading-none">{Math.round((moduleProgress.completed/moduleProgress.total)*100)}%</p>
                      </div>
                      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-10 p-1 border border-gray-200"><div className="h-full bg-royal-600 rounded-full transition-all duration-1000" style={{ width: `${(moduleProgress.completed/moduleProgress.total)*100}%` }}></div></div>
                      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                          {moduleProgress.lessons.map((l, i) => (
                              <div key={i} className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all ${l.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                  {l.done ? <div className="bg-green-500 text-white p-1 rounded-full"><Check size={18} strokeWidth={4}/></div> : <div className="w-6 h-6 border-4 border-gray-300 rounded-full"></div>}
                                  <span className={`text-lg font-black flex-1 truncate ${l.done ? 'text-green-950' : 'text-gray-500'}`}>{l.title}</span>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setShowTracker(false)} className="w-full mt-10 py-5 bg-royal-950 text-white font-black rounded-3xl text-xl shadow-2xl border-b-4 border-black">CLOSE DASHBOARD</button>
                  </div>
              </div>
          </div>
      )}
      {viewingCert && <CertificateGenerator certificate={viewingCert} onClose={() => setViewingCert(null)} />}
    </div>
  );
};

const QuizCard: React.FC<{ quiz: QuizQuestion, index: number, selectedOptionId?: string, attemptHistory: StudentAttempt[], onSelect: (opt: QuizOption) => void }> = ({ quiz, index, selectedOptionId, attemptHistory, onSelect }) => {
  const isAnswered = !!selectedOptionId;
  const selectedOption = quiz.options.find(o => o.id === selectedOptionId);
  const isSelectedCorrect = selectedOption?.isCorrect;

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-gray-50 p-10 relative transition-all hover:shadow-royal-900/5">
      <div className="flex flex-col md:flex-row gap-8 mb-10 items-start">
        <span className="shrink-0 w-14 h-14 rounded-2xl bg-royal-950 text-white font-black flex items-center justify-center text-2xl shadow-xl">{index}</span>
        <div className="flex-1 w-full space-y-6">
            {quiz.reference && (
                <div className="p-8 bg-royal-50/50 border-2 border-royal-100 border-l-8 border-l-royal-500 rounded-3xl text-slate-800 font-sans font-semibold italic relative text-xl leading-relaxed shadow-inner">
                    <div className="absolute -top-3 -left-3 p-2 bg-royal-500 rounded-xl shadow-lg"><Book size={18} className="text-white" /></div>
                    {quiz.reference}
                </div>
            )}
            <h3 className="font-black text-2xl text-gray-900 leading-snug tracking-tight">{quiz.text}</h3>
        </div>
      </div>

      <div className="space-y-4 pl-0 md:pl-20">
        {quiz.options.map((option) => {
            const isOptionSelected = selectedOptionId === option.id;
            const isOptionCorrect = option.isCorrect;
            
            let btnClass = "w-full text-left p-6 rounded-[2rem] border-4 transition-all duration-300 flex flex-col group overflow-hidden ";
            let textClass = "flex-1 font-black text-lg transition-all duration-500 ";

            if (!isAnswered) {
                btnClass += "bg-white border-gray-100 hover:border-royal-400 hover:bg-royal-50 cursor-pointer";
                textClass += "text-gray-800";
            } else {
                if (isSelectedCorrect) {
                    if (isOptionCorrect) {
                        btnClass += "bg-green-50 border-green-500 shadow-xl scale-[1.03] z-10";
                        textClass += "text-green-600 animate-bounce-pulse font-black";
                    } else {
                        btnClass += "bg-white border-gray-100 opacity-50";
                        textClass += "text-red-600 animate-red-pulse font-bold";
                    }
                } else {
                    if (isOptionSelected) {
                        btnClass += "bg-red-50 border-red-500 shadow-xl scale-[1.03] z-10";
                        textClass += "text-red-600 animate-bounce-pulse font-black";
                    } else if (isOptionCorrect) {
                        btnClass += "bg-green-50 border-green-500";
                        textClass += "text-green-600 animate-green-pulse delay-200 font-bold";
                    } else {
                        btnClass += "bg-orange-50 border-orange-200 opacity-80";
                        textClass += "text-orange-500 animate-orange-pulse delay-100 font-bold";
                    }
                }
            }

            return (
                <button key={option.id} disabled={isAnswered} onClick={() => onSelect(option)} className={btnClass}>
                    <div className="flex items-center gap-5 w-full">
                        <span className={`w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-lg shrink-0 ${isAnswered && isOptionCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-gray-400 bg-white'}`}>{option.label}</span>
                        <span className={textClass}>{option.text}</span>
                        {isAnswered && isOptionCorrect && <div className="p-2 bg-green-500 text-white rounded-full shadow-lg"><Check size={20} strokeWidth={4}/></div>}
                        {isAnswered && isOptionSelected && !isOptionCorrect && <div className="p-2 bg-red-500 text-white rounded-full shadow-lg"><X size={20} strokeWidth={4}/></div>}
                    </div>
                    {isAnswered && option.explanation && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-xl font-semibold text-slate-600 animate-in slide-in-from-top-2">
                           {option.explanation}
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
