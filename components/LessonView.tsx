
import React, { useState, useEffect } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); // quizId -> selectedOptionId
  const [score, setScore] = useState({ total: 0, correct: 0 });

  useEffect(() => {
    loadAttempts();
  }, [lesson.id]);

  const loadAttempts = async () => {
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    const attemptMap: Record<string, string> = {};
    let correctCount = 0;
    let totalCount = 0;

    history.forEach(h => {
      if (!attemptMap[h.quizId]) {
        attemptMap[h.quizId] = h.selectedOptionId;
        if (h.isCorrect) correctCount++;
        totalCount++;
      }
    });

    setAttempts(attemptMap);
    setScore({ total: totalCount, correct: correctCount });
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
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="bg-royal-900 text-white p-6 sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold leading-tight">{lesson.title}</h1>
              <p className="text-indigo-200 text-xs md:text-sm">{lesson.book} {lesson.chapter} • {lesson.lesson_type}</p>
            </div>
          </div>
          
          {score.total > 0 && (
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Your Performance</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-bold text-gold-400">{Math.round((score.correct / score.total) * 100)}%</span>
                   <span className="text-sm text-gray-400">({score.correct}/{score.total})</span>
                </div>
             </div>
          )}
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
                onSelect={handleOptionSelect} 
              />
            )}
          </div>
        ))}

        <div className="text-center pt-12 border-t border-gray-100">
           <div className="inline-block p-4 bg-green-50 rounded-full text-green-600 mb-4">
             <CheckCircle size={48} />
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-2">Lesson Completed</h3>
           <button onClick={onBack} className="px-8 py-3 bg-royal-800 text-white font-bold rounded-full shadow-lg hover:bg-royal-900 transition-transform hover:-translate-y-1">
             Back to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};

const NoteSection: React.FC<{ section: LessonSection }> = ({ section }) => (
  <div className="prose prose-lg max-w-none text-gray-800">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
       <BookOpen className="text-gold-500" size={28} />
       <h2 className="text-3xl font-serif font-bold text-gray-900 m-0">{section.title}</h2>
    </div>
    <div dangerouslySetInnerHTML={{ __html: section.body || '' }} />
  </div>
);

const QuizGroup: React.FC<{ 
  section: LessonSection, 
  attempts: Record<string, string>, 
  onSelect: (q: QuizQuestion, o: QuizOption) => void 
}> = ({ section, attempts, onSelect }) => (
  <div className="space-y-8 mt-12">
    <div className="flex items-center gap-3 mb-6">
       <HelpCircle className="text-royal-500" size={28} />
       <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
    </div>
    <div className="space-y-8">
      {section.quizzes?.map((quiz, idx) => (
        <QuizCard 
          key={quiz.id} 
          quiz={quiz} 
          index={idx + 1}
          selectedOptionId={attempts[quiz.id]}
          onSelect={(opt) => onSelect(quiz, opt)} 
        />
      ))}
    </div>
  </div>
);

const QuizCard: React.FC<{ 
  quiz: QuizQuestion, 
  index: number, 
  selectedOptionId?: string, 
  onSelect: (opt: QuizOption) => void 
}> = ({ quiz, index, selectedOptionId, onSelect }) => {
  const isAnswered = !!selectedOptionId;
  
  // Determine if the user got this specific question right
  const userSelectedOption = quiz.options.find(o => o.id === selectedOptionId);
  const isUserCorrect = userSelectedOption?.isCorrect || false;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex gap-4 mb-4 items-start">
           <span className="flex-shrink-0 w-8 h-8 rounded-full bg-royal-50 text-royal-800 font-bold flex items-center justify-center text-sm">
             Q{index}
           </span>
           <div className="flex-1 w-full min-w-0">
              
              {/* REQUIREMENT: Reference box appearing BEFORE and ON TOP of question */}
              {quiz.reference && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap shadow-inner w-full">
                   <span className="text-xs font-bold text-gray-400 uppercase block mb-2 tracking-wider">Reference / Context</span>
                   {quiz.reference}
                </div>
              )}

              <h3 className="font-bold text-xl text-gray-900 mb-2 leading-snug">{quiz.text}</h3>
           </div>
        </div>

        <div className="space-y-3 pl-0 md:pl-12">
           {quiz.options.map((option) => {
             const isSelected = selectedOptionId === option.id;
             const isCorrect = option.isCorrect;
             
             // Dynamic Class Calculation
             let containerClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ease-in-out relative overflow-hidden ";
             let circleClass = "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 flex-shrink-0 ";
             let textClass = "font-medium text-lg transition-colors duration-300 ";

             if (!isAnswered) {
                // Pre-Answer State
                containerClass += "border-gray-100 hover:border-royal-500 hover:bg-royal-50 cursor-pointer";
                circleClass += "border-gray-300 text-gray-500";
                textClass += "text-gray-800";
             } else {
                // Post-Answer State
                if (isUserCorrect) {
                    // SCENARIO B: User Chose RIGHT
                    if (isCorrect) {
                        // User's correct selection -> Green
                        containerClass += "bg-green-50 border-green-500";
                        circleClass += "bg-green-500 border-green-500 text-white";
                        textClass += "text-green-900 font-bold";
                    } else {
                        // Incorrect options -> Red & Bold
                        containerClass += "bg-red-50 border-red-200 opacity-90";
                        circleClass += "border-red-300 text-red-600 font-bold bg-white";
                        textClass += "text-red-800 font-bold";
                    }
                } else {
                    // SCENARIO A: User Chose WRONG
                    if (isCorrect) {
                        // The actual correct answer -> Green
                        containerClass += "bg-green-50 border-green-500";
                        circleClass += "bg-green-500 border-green-500 text-white";
                        textClass += "text-green-900 font-bold";
                    } else if (isSelected) {
                        // User's wrong selection -> Red
                        containerClass += "bg-red-50 border-red-500"; 
                        circleClass += "bg-red-500 border-red-500 text-white"; 
                        textClass += "text-red-900 font-bold";
                    } else {
                        // Other wrong answers -> Orange & Bold
                        containerClass += "bg-orange-50 border-orange-300 opacity-90";
                        circleClass += "border-orange-400 text-orange-600 font-bold bg-white";
                        textClass += "text-orange-800 font-bold";
                    }
                }
             }

             return (
               <div key={option.id}>
                 <button
                   disabled={isAnswered}
                   onClick={() => onSelect(option)}
                   className={containerClass}
                 >
                   <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-3">
                       <span className={circleClass}>{option.label}</span>
                       <span className={textClass}>{option.text}</span>
                     </div>
                     
                     {/* Feedback Icons */}
                     <div className="flex-shrink-0">
                        {isAnswered && isCorrect && (
                            <div className="animate-in zoom-in spin-in-90 duration-300">
                                <CheckCircle size={24} className="text-green-500" fill="white" />
                            </div>
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                            <div className="animate-in zoom-in duration-300">
                                <X size={24} className="text-red-500" strokeWidth={3} />
                            </div>
                        )}
                     </div>
                   </div>

                   {/* Smooth Reveal Explanation */}
                   <div 
                      className={`transform transition-all duration-500 ease-out origin-top ${isAnswered ? 'scale-y-100 opacity-100 max-h-48 mt-3 pt-3 border-t border-black/5' : 'scale-y-0 opacity-0 max-h-0 overflow-hidden'}`}
                   >
                        <div 
                          className={`text-sm ${isCorrect ? 'text-green-700' : 'text-gray-600'}`}
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
