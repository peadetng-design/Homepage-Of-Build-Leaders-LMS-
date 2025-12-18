
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, AlertCircle, Clock, Trophy, BadgeCheck, Loader2, History } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); // quizId -> selectedOptionId
  const [attemptHistory, setAttemptHistory] = useState<StudentAttempt[]>([]);
  const [score, setScore] = useState({ total: 0, correct: 0 });
  const [completedModule, setCompletedModule] = useState<Module | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certIssued, setCertIssued] = useState(false);
  
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
  };

  const handleClaimCertificate = async () => {
      if (!completedModule) return;
      setIsIssuingCert(true);
      try {
          await lessonService.issueCertificate(currentUser.id, currentUser.name, completedModule.id);
          setCertIssued(true);
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

        <div className="text-center pt-12 border-t border-gray-100">
           {isCompleted && (
               <div className="inline-block p-6 bg-green-50 rounded-full text-green-600 mb-6 animate-bounce shadow-xl border border-green-100">
                 <CheckCircle size={48} />
               </div>
           )}
           <h3 className="text-2xl font-bold text-gray-900 mb-4">{isCompleted ? "Lesson Mastery Achieved!" : "Progressing through Lesson..."}</h3>
           
           {completedModule && (
               <div className="mb-10 p-8 bg-gradient-to-br from-gold-50 to-orange-50 border border-gold-200 rounded-3xl shadow-xl animate-in zoom-in-95">
                   <BadgeCheck size={64} className="text-gold-600 mx-auto mb-4" />
                   <h4 className="font-serif font-bold text-2xl text-gold-900 mb-2">Module Completed: {completedModule.title}</h4>
                   <p className="text-gold-700 mb-6">Excellent work! You have completed all requirements for this module's certification.</p>
                   {certIssued ? (
                       <button className="px-8 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 mx-auto cursor-default"><CheckCircle size={20} /> Certificate Claimed</button>
                   ) : (
                       <button onClick={handleClaimCertificate} disabled={isIssuingCert} className="px-10 py-4 bg-gradient-to-r from-gold-500 to-orange-600 text-white font-bold rounded-full shadow-2xl hover:scale-105 transform transition-all flex items-center gap-3 mx-auto">
                           {isIssuingCert ? <Loader2 className="animate-spin" /> : <Trophy />} CLAIM CERTIFICATE
                       </button>
                   )}
               </div>
           )}
           <button onClick={onBack} className="px-8 py-3 bg-royal-900 text-white font-bold rounded-full hover:bg-royal-800 transition-colors">Return to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

const QuizCard: React.FC<{ quiz: QuizQuestion, index: number, selectedOptionId?: string, attemptHistory: StudentAttempt[], onSelect: (opt: QuizOption) => void }> = ({ quiz, index, selectedOptionId, attemptHistory, onSelect }) => {
  const isAnswered = !!selectedOptionId;
  const attemptsForThisQuiz = attemptHistory.filter(h => h.quizId === quiz.id).length;

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

            if (!isAnswered) {
                btnClass += "bg-white border-gray-100 hover:border-royal-200 hover:bg-royal-50 cursor-pointer";
                circleClass += "border-gray-200 text-gray-400 group-hover:border-royal-500 group-hover:text-royal-600";
            } else {
                if (isCorrect) {
                    btnClass += "bg-green-50 border-green-500 ring-4 ring-green-100";
                    circleClass += "bg-green-500 border-green-500 text-white";
                } else if (isSelected) {
                    btnClass += "bg-red-50 border-red-500 ring-4 ring-red-100";
                    circleClass += "bg-red-500 border-red-500 text-white";
                } else {
                    btnClass += "bg-gray-50 border-gray-200 opacity-60";
                    circleClass += "border-gray-300 text-gray-400";
                }
            }

            return (
                <div key={option.id}>
                    <button disabled={isAnswered} onClick={() => onSelect(option)} className={btnClass}>
                        <div className={feedbackClass}>
                            <span className={circleClass}>{option.label}</span>
                            <span className="font-bold text-gray-800 flex-1">{option.text}</span>
                            {isAnswered && isCorrect && <CheckCircle size={24} className="text-green-600 animate-in zoom-in" />}
                            {isAnswered && isSelected && !isCorrect && <X size={24} className="text-red-600 animate-in zoom-in" />}
                        </div>
                        
                        {/* Slide and Appear Animation for Explanation */}
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
