import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, AlertCircle, Clock, Trophy, BadgeCheck, Loader2, History, ListChecks, ChevronRight, Printer } from 'lucide-react';

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
               if (newTime % 5 === 0) lessonService.saveQuizTimer(currentUser.id, lesson.id, newTime);
               return newTime;
           });
        }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedTime); };
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
    history.forEach(h => { attemptMap[h.quizId] = h.selectedOptionId; });
    Object.keys(attemptMap).forEach(qId => {
        const attempt = history.filter(h => h.quizId === qId).pop();
        if (attempt && attempt.isCorrect) correctCount++;
    });
    setAttempts(attemptMap);
    setScore({ total: Object.keys(attemptMap).length, correct: correctCount });
    
    const progress = await lessonService.getModuleProgress(currentUser.id, lesson.moduleId);
    setModuleProgress(progress);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));
    if (option.isCorrect) setScore(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
    else setScore(prev => ({ ...prev, total: prev.total + 1 }));
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
    setAttemptHistory(prev => [...prev, { id: crypto.randomUUID(), studentId: currentUser.id, lessonId: lesson.id, quizId: quiz.id, selectedOptionId: option.id, isCorrect: option.isCorrect, score: option.isCorrect ? 10 : 0, attempted_at: new Date().toISOString() }]);
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 border border-gray-100"><ArrowLeft size={24} /></button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none truncate max-w-[200px] md:max-w-xs">{lesson.title}</h1>
                        <p className="text-xs text-indigo-500 mt-1 uppercase tracking-wide font-bold">{lesson.lesson_type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 p-1">
                                <circle cx="24" cy="24" r="20" stroke="#f0f0f0" strokeWidth="4" fill="none" />
                                <circle cx="24" cy="24" r="20" stroke="#f59e0b" strokeWidth="4" fill="none" strokeDasharray={126} strokeDashoffset={126 - (126 * (totalQuestions > 0 ? score.correct / totalQuestions : 0))} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <span className="absolute text-[10px] font-bold">{Math.round((score.correct / (totalQuestions || 1)) * 100)}%</span>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
                            <p className="text-sm font-bold text-gray-800">{score.correct} / {totalQuestions}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="relative w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
                            <Clock size={18} className={isCompleted ? 'text-green-500' : 'text-indigo-500'} />
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                            <p className="text-sm font-bold font-mono">{formatTime(elapsedTime)}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
        {lesson.sections.map((section) => (
          <div key={section.id}>
            {section.type === 'note' ? (
              <div className="prose prose-lg max-w-none text-gray-800 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-serif font-bold text-gray-900 border-b pb-4 mb-6">{section.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: section.body || '' }} />
              </div>
            ) : (
              <div className="space-y-8 mt-12">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><HelpCircle className="text-royal-500" /> {section.title}</h2>
                {section.quizzes?.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1} selectedOptionId={attempts[quiz.id]} onSelect={(opt) => handleOptionSelect(quiz, opt)} attemptHistory={attemptHistory} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* --- CONGRATULATORY SECTION --- */}
        <div className="text-center pt-12 border-t border-gray-100">
           {isCompleted && (
               <div className="space-y-6 animate-in pop-in duration-700">
                   <div className="inline-block p-6 bg-green-50 rounded-full text-green-600 mb-2 animate-bounce shadow-xl border border-green-100">
                        <CheckCircle size={64} />
                   </div>
                   <h2 className="text-4xl font-serif font-bold text-gray-900 leading-tight">Excellent Work! <br/> Lesson Completed</h2>
                   <p className="text-gray-500 max-w-md mx-auto text-lg italic">"I have hidden your word in my heart that I might not sin against you." — Psalm 119:11</p>
                   
                   <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        {moduleProgress && (
                             <button 
                                onClick={() => setShowTracker(true)}
                                className="px-8 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-full hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-200"
                             >
                                <ListChecks size={20} /> MODULE TRACKER ({moduleProgress.completed}/{moduleProgress.total})
                             </button>
                        )}
                        <button onClick={onBack} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-black transition-colors">Return to Library</button>
                   </div>
               </div>
           )}

           {/* --- MODULE MASTERY BANNER --- */}
           {completedModule && (
               <div className="mt-16 p-10 bg-gradient-to-br from-gold-500 via-orange-500 to-gold-600 text-white rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-1000">
                   <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Trophy size={200} /></div>
                   <div className="relative z-10">
                       <BadgeCheck size={80} className="mx-auto mb-6 text-white drop-shadow-lg" />
                       <h3 className="text-sm font-bold tracking-[0.3em] uppercase mb-2">Milestone Unlocked</h3>
                       <h2 className="text-4xl font-serif font-bold mb-4 leading-tight">Module Mastery: <br/> {completedModule.title}</h2>
                       <p className="text-gold-50 mb-8 max-w-sm mx-auto font-medium opacity-90">You have successfully met all completion requirements for this Biblical Leadership module.</p>
                       
                       {issuedCert ? (
                           <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white/20 rounded-2xl border border-white/30 text-white font-bold flex items-center gap-3">
                                    <CheckCircle size={24} /> Certification Issued!
                                </div>
                                <button 
                                    onClick={() => setViewingCert(issuedCert)}
                                    className="px-10 py-4 bg-white text-orange-600 font-bold rounded-full shadow-2xl hover:scale-105 transform transition-all flex items-center gap-3"
                                >
                                    <Printer size={20} /> PRINT CERTIFICATE
                                </button>
                           </div>
                       ) : (
                           <button 
                                onClick={handleClaimCertificate} 
                                disabled={isIssuingCert} 
                                className="px-10 py-4 bg-white text-orange-600 font-bold rounded-full shadow-2xl hover:scale-105 transform transition-all flex items-center gap-3 mx-auto"
                           >
                                {isIssuingCert ? <Loader2 className="animate-spin" /> : <Trophy />} CLAIM YOUR CERTIFICATION
                           </button>
                       )}
                   </div>
               </div>
           )}
        </div>
      </div>

      {/* --- MODULE TRACKER MODAL --- */}
      {showTracker && moduleProgress && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                  <div className="bg-royal-900 p-8 text-white relative">
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                      <div className="relative z-10 flex justify-between items-center">
                          <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                             <ListChecks className="text-gold-500" /> Module Progress
                          </h3>
                          <button onClick={() => setShowTracker(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                      </div>
                  </div>
                  <div className="p-8">
                      <div className="flex justify-between items-end mb-6">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                              <p className="text-2xl font-bold text-gray-900">{moduleProgress.completed} of {moduleProgress.total} Lessons Done</p>
                          </div>
                          <div className="text-right">
                              <p className="text-3xl font-bold text-royal-600">{Math.round((moduleProgress.completed/moduleProgress.total)*100)}%</p>
                          </div>
                      </div>
                      
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-8">
                          <div className="h-full bg-royal-500 transition-all duration-1000" style={{ width: `${(moduleProgress.completed/moduleProgress.total)*100}%` }}></div>
                      </div>

                      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                          {moduleProgress.lessons.map((l, i) => (
                              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${l.done ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                  {l.done ? <CheckCircle size={20} className="text-green-500 shrink-0" /> : <Circle size={20} className="text-gray-300 shrink-0" />}
                                  <span className={`font-bold flex-1 truncate ${l.done ? 'text-green-900' : 'text-gray-600'}`}>{l.title}</span>
                                  {!l.done && <ChevronRight size={16} className="text-gray-400" />}
                              </div>
                          ))}
                      </div>

                      <button onClick={() => setShowTracker(false)} className="w-full mt-8 py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg">Close Tracker</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CERTIFICATE VIEWER --- */}
      {viewingCert && (
          <CertificateGenerator 
             certificate={viewingCert} 
             onClose={() => setViewingCert(null)} 
          />
      )}
    </div>
  );
};

const Circle: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const QuizCard: React.FC<{ quiz: QuizQuestion, index: number, selectedOptionId?: string, attemptHistory: StudentAttempt[], onSelect: (opt: QuizOption) => void }> = ({ quiz, index, selectedOptionId, attemptHistory, onSelect }) => {
  const isAnswered = !!selectedOptionId;
  const attemptsForThisQuiz = attemptHistory.filter(h => h.quizId === quiz.id).length;
  
  // Logic to determine if user's ultimate selection was correct for distracter coloring
  const selectedOpt = quiz.options.find(o => o.id === selectedOptionId);
  const userWasCorrect = selectedOpt?.isCorrect;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 relative transition-shadow hover:shadow-xl">
      {attemptsForThisQuiz > 0 && (
          <div className="absolute -top-3 right-8 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <History size={12} /> {attemptsForThisQuiz} {attemptsForThisQuiz === 1 ? 'Attempt' : 'Attempts'}
          </div>
      )}
      <div className="flex gap-6 mb-8 items-start">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-royal-800 text-white font-bold flex items-center justify-center text-lg">{index}</span>
        <div className="flex-1 w-full">
            {quiz.reference && (
                <div className="mb-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-serif leading-relaxed italic relative">
                    <div className="absolute top-2 right-4 text-4xl opacity-10 text-slate-900">”</div>
                    {quiz.reference}
                </div>
            )}
            <h3 className="font-bold text-xl text-gray-900 leading-snug">{quiz.text}</h3>
        </div>
      </div>

      <div className="space-y-4 pl-0 md:pl-16">
        {quiz.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.isCorrect;
            
            let btnClass = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col group overflow-hidden ";
            let feedbackClass = "flex items-center gap-4 w-full ";
            let circleClass = "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 ";
            let textClass = "flex-1 transition-all duration-500 ";

            if (!isAnswered) {
                btnClass += "bg-white border-gray-100 hover:border-royal-200 hover:bg-royal-50 cursor-pointer";
                circleClass += "border-gray-200 text-gray-400 group-hover:border-royal-500 group-hover:text-royal-600";
                textClass += "font-bold text-gray-800";
            } else {
                // If user selected CORRECTLY
                if (userWasCorrect) {
                    if (isCorrect) {
                        textClass += "text-green-600 font-black animate-in zoom-in scale-105";
                        btnClass += "bg-green-50 border-green-500 ring-4 ring-green-100";
                        circleClass += "bg-green-500 border-green-500 text-white";
                    } else {
                        textClass += "text-red-600 font-black animate-in zoom-in";
                        btnClass += "bg-gray-50 border-gray-200 opacity-60";
                        circleClass += "border-gray-300 text-gray-400";
                    }
                } 
                // If user selected WRONGLY
                else {
                    if (isSelected) { // The wrong one they picked
                        textClass += "text-red-600 font-black animate-in zoom-in scale-105";
                        btnClass += "bg-red-50 border-red-500 ring-4 ring-red-100";
                        circleClass += "bg-red-500 border-red-500 text-white";
                    } else if (isCorrect) { // The one they should have picked
                        textClass += "text-green-600 font-black animate-in zoom-in";
                        btnClass += "bg-white border-green-200";
                        circleClass += "bg-green-100 border-green-500 text-green-700";
                    } else { // The other two wrong options
                        textClass += "text-orange-500 font-black animate-in zoom-in";
                        btnClass += "bg-gray-50 border-gray-200 opacity-40";
                        circleClass += "border-gray-300 text-gray-400";
                    }
                }
            }

            return (
                <div key={option.id}>
                    <button disabled={isAnswered} onClick={() => onSelect(option)} className={btnClass}>
                        <div className={feedbackClass}>
                            <span className={circleClass}>{option.label}</span>
                            <span className={textClass}>{option.text}</span>
                            {isAnswered && isCorrect && <CheckCircle size={24} className="text-green-600 animate-in zoom-in" />}
                            {isAnswered && isSelected && !isCorrect && <X size={24} className="text-red-600 animate-in zoom-in" />}
                        </div>
                        
                        <div className={`transition-all duration-500 ease-out overflow-hidden ${isAnswered ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                            <div className={`p-4 rounded-xl border-t-2 ${isCorrect ? 'bg-green-100/50 border-green-200' : 'bg-red-100/50 border-red-200'}`}>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    <strong className="uppercase tracking-wider text-[10px] block mb-1">Explanation:</strong>
                                    {option.explanation || "No explanation provided for this choice."}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default LessonView;