
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, AlertCircle, Clock, Trophy, Target, History } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); // quizId -> selectedOptionId
  const [attemptHistory, setAttemptHistory] = useState<StudentAttempt[]>([]);
  const [score, setScore] = useState({ total: 0, correct: 0 });
  
  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Stats
  const totalQuestions = lesson.sections.reduce((acc, sec) => acc + (sec.quizzes?.length || 0), 0);
  const questionsAnswered = Object.keys(attempts).length;
  const progressPercent = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;
  const isCompleted = totalQuestions > 0 && questionsAnswered === totalQuestions;

  useEffect(() => {
    loadData();
    
    // Start Timer
    // Only start if not already completed
    if (!isCompleted) {
        timerRef.current = setInterval(() => {
           setElapsedTime(prev => {
               const newTime = prev + 1;
               // Save periodically (every 5 seconds) to avoid too many writes
               if (newTime % 5 === 0) {
                   lessonService.saveQuizTimer(currentUser.id, lesson.id, newTime);
               }
               return newTime;
           });
        }, 1000);
    }

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        // Save on unmount
        lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedTime);
    };
  }, [lesson.id]); // Run once on mount (and ID change)

  // FIX: Monitor completion to stop timer
  useEffect(() => {
      if (isCompleted && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Force save final time
          lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedTime);
      }
  }, [isCompleted, elapsedTime, currentUser.id, lesson.id]);

  const loadData = async () => {
    // Load Timer
    const savedTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedTime(savedTime);

    // Load Attempts
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    setAttemptHistory(history);

    const attemptMap: Record<string, string> = {};
    let correctCount = 0;
    
    // We only care about the *latest* attempt for visual state
    history.forEach(h => {
       attemptMap[h.quizId] = h.selectedOptionId;
    });

    // Recalculate Score based on *distinct* questions answered correctly in latest state
    Object.keys(attemptMap).forEach(qId => {
        const attempt = history.filter(h => h.quizId === qId).pop(); // Get last
        if (attempt && attempt.isCorrect) correctCount++;
    });

    setAttempts(attemptMap);
    setScore({ total: Object.keys(attemptMap).length, correct: correctCount });
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;

    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));

    if (option.isCorrect) {
      setScore(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }

    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
    
    // Update local history for "Attempts" count immediate feedback
    setAttemptHistory(prev => [...prev, {
        id: crypto.randomUUID(),
        studentId: currentUser.id,
        lessonId: lesson.id,
        quizId: quiz.id,
        selectedOptionId: option.id,
        isCorrect: option.isCorrect,
        score: option.isCorrect ? 10 : 0,
        attempted_at: new Date().toISOString()
    }]);
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      
      {/* 3D Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Left: Back & Title */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors shadow-sm border border-gray-100">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none truncate max-w-[200px] md:max-w-xs">{lesson.title}</h1>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-bold text-indigo-500">{lesson.lesson_type}</p>
                    </div>
                </div>

                {/* Right: 3D Circular Metrics */}
                <div className="flex items-center gap-6 md:gap-8">
                    
                    {/* (2) 3D Circular Score */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.8)] flex items-center justify-center ring-1 ring-gray-100">
                            <svg className="w-full h-full transform -rotate-90 p-1">
                                <circle cx="24" cy="24" r="20" stroke="#f0f0f0" strokeWidth="4" fill="none" />
                                <circle 
                                    cx="24" cy="24" r="20" 
                                    stroke="url(#scoreGradient)" 
                                    strokeWidth="4" fill="none" 
                                    strokeDasharray={126} 
                                    strokeDashoffset={126 - (126 * (totalQuestions > 0 ? score.correct / totalQuestions : 0))} 
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out filter drop-shadow-md"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#fbbf24" />
                                        <stop offset="100%" stopColor="#d97706" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 flex-col leading-none">
                                <span className="text-sm">{Math.round((score.correct / (totalQuestions || 1)) * 100)}%</span>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
                            <p className="text-sm font-bold text-gray-800">{score.correct} / {totalQuestions}</p>
                        </div>
                    </div>

                    {/* (3) 3D Circular Timer */}
                    <div className="flex items-center gap-3">
                         <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.8)] flex items-center justify-center ring-1 ring-gray-100">
                            <svg className="w-full h-full transform -rotate-90 p-1">
                                <circle cx="24" cy="24" r="20" stroke="#f0f0f0" strokeWidth="4" fill="none" />
                                <circle 
                                    cx="24" cy="24" r="20" 
                                    stroke="url(#timerGradient)" 
                                    strokeWidth="4" fill="none" 
                                    strokeDasharray={126} 
                                    strokeDashoffset={126 - (126 * ((elapsedTime % 60) / 60))} 
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear filter drop-shadow-md"
                                />
                                <defs>
                                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Only minutes inside small circle if needed, or just icon */}
                                <Clock size={16} className={`${isCompleted ? 'text-green-500' : 'text-indigo-500'}`} />
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                            <p className={`text-sm font-bold font-mono ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>{formatTime(elapsedTime)}</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* (1) 3D Horizontal Progress Bar */}
            <div className="mt-4 md:mt-3 relative w-full h-6 bg-gray-200 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-300 overflow-hidden">
                <div 
                    className="h-full rounded-full transition-all duration-700 ease-out relative"
                    style={{ 
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(180deg, #4f46e5 0%, #3730a3 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    {/* Gloss Effect */}
                    <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/30 to-transparent"></div>
                </div>
                {/* Text centered in bar */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 drop-shadow-sm uppercase tracking-widest z-10 mix-blend-multiply">
                   {Math.round(progressPercent)}% Complete
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
        {lesson.sections.map((section) => (
          <div key={section.id} className="animate-in slide-in-from-bottom-4 duration-700">
            {section.type === 'note' ? (
              <NoteSection section={section} />
            ) : (
              <QuizGroup 
                section={section} 
                attempts={attempts} 
                attemptHistory={attemptHistory}
                onSelect={handleOptionSelect} 
              />
            )}
          </div>
        ))}

        <div className="text-center pt-12 border-t border-gray-100">
           {questionsAnswered === totalQuestions && totalQuestions > 0 && (
               <div className="inline-block p-4 bg-green-50 rounded-full text-green-600 mb-4 animate-bounce shadow-lg shadow-green-100 border border-green-100">
                 <CheckCircle size={48} />
               </div>
           )}
           <h3 className="text-2xl font-bold text-gray-900 mb-2">
               {questionsAnswered === totalQuestions && totalQuestions > 0 ? "Lesson Completed!" : "Keep Going!"}
           </h3>
           <p className="text-gray-500 mb-6">
               You have answered {questionsAnswered} of {totalQuestions} questions.
           </p>
           <button onClick={onBack} className="px-8 py-3 bg-gradient-to-r from-royal-800 to-royal-900 text-white font-bold rounded-full shadow-xl shadow-royal-900/30 hover:scale-105 transition-transform border border-royal-700">
             Back to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};

const NoteSection: React.FC<{ section: LessonSection }> = ({ section }) => (
  <div className="prose prose-lg max-w-none text-gray-800 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
       <div className="p-2 bg-gold-50 rounded-lg"><BookOpen className="text-gold-500" size={24} /></div>
       <h2 className="text-2xl font-serif font-bold text-gray-900 m-0">{section.title}</h2>
    </div>
    <div dangerouslySetInnerHTML={{ __html: section.body || '' }} />
  </div>
);

const QuizGroup: React.FC<{ 
  section: LessonSection, 
  attempts: Record<string, string>, 
  attemptHistory: StudentAttempt[],
  onSelect: (q: QuizQuestion, o: QuizOption) => void 
}> = ({ section, attempts, attemptHistory, onSelect }) => (
  <div className="space-y-8 mt-12">
    <div className="flex items-center gap-3 mb-6">
       <div className="p-2 bg-royal-50 rounded-lg"><HelpCircle className="text-royal-500" size={24} /></div>
       <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
    </div>
    <div className="space-y-12">
      {section.quizzes?.map((quiz, idx) => {
        // Calculate attempts for this specific question
        const count = attemptHistory.filter(h => h.quizId === quiz.id).length;
        return (
            <QuizCard 
                key={quiz.id} 
                quiz={quiz} 
                index={idx + 1}
                selectedOptionId={attempts[quiz.id]}
                attemptCount={count}
                onSelect={(opt) => onSelect(quiz, opt)} 
            />
        );
      })}
    </div>
  </div>
);

const QuizCard: React.FC<{ 
  quiz: QuizQuestion, 
  index: number, 
  selectedOptionId?: string, 
  attemptCount: number,
  onSelect: (opt: QuizOption) => void 
}> = ({ quiz, index, selectedOptionId, attemptCount, onSelect }) => {
  const isAnswered = !!selectedOptionId;
  const userSelectedOption = quiz.options.find(o => o.id === selectedOptionId);
  const isUserCorrect = userSelectedOption?.isCorrect || false;

  return (
    <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 overflow-visible relative transition-all hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)]">
      
      {/* (4) 3D Attempt Indicator */}
      {attemptCount > 0 && (
          <div className="absolute -top-3 right-6 bg-gradient-to-b from-gray-50 to-gray-200 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md border-b-4 border-gray-300 transform transition-transform hover:-translate-y-0.5 z-10">
              <History size={14} className="text-indigo-500" />
              {attemptCount} Attempt{attemptCount !== 1 ? 's' : ''}
          </div>
      )}

      <div className="p-8">
        <div className="flex gap-5 mb-6 items-start">
           <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-royal-500 to-royal-700 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-royal-500/30">
             {index}
           </span>
           <div className="flex-1 w-full min-w-0">
              
              {/* Reference Box - REDUCED FONT SIZE by ~40% (was text-2xl/3xl, now text-lg) */}
              {quiz.reference && (
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl text-gray-700 leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap shadow-inner w-full font-serif relative">
                   {/* Decorative quote mark */}
                   <div className="absolute top-2 right-4 text-6xl text-gray-100 font-serif opacity-50 select-none">”</div>
                   
                   <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-widest font-sans">Reference / Context</span>
                   {/* Reduced size here: text-lg instead of text-3xl */}
                   <p className="text-lg text-gray-800 font-medium leading-relaxed">
                     {quiz.reference}
                   </p>
                </div>
              )}

              <h3 className="font-bold text-xl text-gray-900 mb-2 leading-snug">{quiz.text}</h3>
           </div>
        </div>

        <div className="space-y-4 pl-0 md:pl-14">
           {quiz.options.map((option) => {
             const isSelected = selectedOptionId === option.id;
             const isCorrect = option.isCorrect;
             
             // 3D Button Styling Logic
             let baseClass = "w-full text-left p-4 rounded-xl border-b-4 transition-all duration-200 ease-out relative overflow-hidden group ";
             let contentClass = "flex items-center justify-between w-full relative z-10 ";
             let circleClass = "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 flex-shrink-0 mr-3 ";

             if (!isAnswered) {
                // Default State (3D Hover)
                baseClass += "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:border-b-0 active:translate-y-1 shadow-sm";
                circleClass += "border-gray-200 text-gray-400 group-hover:border-royal-400 group-hover:text-royal-500";
             } else {
                if (isUserCorrect) {
                    if (isCorrect) {
                        // Correct Selection (Green 3D)
                        baseClass += "bg-green-50 border-green-500 shadow-md transform translate-y-0";
                        circleClass += "bg-green-500 border-green-500 text-white";
                    } else {
                        // Impossible state (if user correct, this option must be correct)
                        baseClass += "opacity-50 border-gray-100";
                    }
                } else {
                     if (isCorrect) {
                        // Show Correct Answer (Green 3D)
                        baseClass += "bg-green-50 border-green-500 shadow-md";
                        circleClass += "bg-green-500 border-green-500 text-white";
                    } else if (isSelected) {
                        // Wrong Selection (Red 3D)
                        baseClass += "bg-red-50 border-red-500 shadow-md";
                        circleClass += "bg-red-500 border-red-500 text-white";
                    } else {
                        // Unselected (Muted)
                        baseClass += "opacity-40 border-gray-100 bg-gray-50";
                        circleClass += "border-gray-300 text-gray-400";
                    }
                }
             }

             return (
               <div key={option.id}>
                 <button
                   disabled={isAnswered}
                   onClick={() => onSelect(option)}
                   className={baseClass}
                 >
                   <div className={contentClass}>
                     <div className="flex items-center">
                       <span className={circleClass}>{option.label}</span>
                       <span className={`font-medium text-lg ${isAnswered && isSelected ? 'font-bold' : 'text-gray-700'}`}>{option.text}</span>
                     </div>
                     
                     {/* Feedback Icons */}
                     <div className="flex-shrink-0 ml-2">
                        {isAnswered && isCorrect && (
                            <div className="animate-in zoom-in spin-in-90 duration-300 bg-green-500 rounded-full p-1 text-white shadow-sm">
                                <Check size={16} strokeWidth={4} />
                            </div>
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                            <div className="animate-in zoom-in duration-300 bg-red-500 rounded-full p-1 text-white shadow-sm">
                                <X size={16} strokeWidth={4} />
                            </div>
                        )}
                     </div>
                   </div>

                   {/* Smooth Reveal Explanation */}
                   <div 
                      className={`transform transition-all duration-500 ease-out origin-top ${isAnswered ? 'scale-y-100 opacity-100 max-h-48 mt-3 pt-3 border-t border-black/5' : 'scale-y-0 opacity-0 max-h-0 overflow-hidden'}`}
                   >
                        <div 
                          className={`text-sm ${isCorrect ? 'text-green-800' : 'text-gray-600'}`}
                          dangerouslySetInnerHTML={{ __html: `<strong>Explanation:</strong> ${option.explanation || 'No explanation provided.'}` }} 
                        />
                   </div>
                 </button>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default LessonView;
