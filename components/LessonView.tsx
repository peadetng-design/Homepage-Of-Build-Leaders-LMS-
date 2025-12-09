
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
              <p className="text-royal-200 text-xs md:text-sm">{lesson.book} {lesson.chapter} • {lesson.lesson_type}</p>
            </div>
          </div>
          
          {score.total > 0 && (
             <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-royal-300 uppercase font-bold tracking-wider">Your Performance</span>
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
       <HelpCircle className="text-royal-600" size={28} />
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex gap-4 mb-4">
           <span className="flex-shrink-0 w-8 h-8 rounded-full bg-royal-50 text-royal-700 font-bold flex items-center justify-center text-sm">
             Q{index}
           </span>
           <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{quiz.text}</h3>
              {quiz.reference && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded uppercase tracking-wide">
                   Ref: {quiz.reference}
                </span>
              )}
           </div>
        </div>

        <div className="space-y-3 pl-12">
           {quiz.options.map((option) => {
             const isSelected = selectedOptionId === option.id;
             const isCorrect = option.isCorrect;
             
             let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all relative ";
             
             if (!isAnswered) {
                btnClass += "border-gray-100 hover:border-royal-300 hover:bg-royal-50 cursor-pointer";
             } else {
                // Post-attempt logic:
                // Green if this is the Correct option
                if (isCorrect) {
                   btnClass += "border-[#2ecc71] bg-[#2ecc71]/10 text-green-900"; 
                } 
                // Red if this was selected but is WRONG
                else if (isSelected && !isCorrect) {
                   btnClass += "border-[#e74c3c] bg-[#e74c3c]/10 text-red-900"; 
                } 
                // Grey/Faded if this is wrong and wasn't selected
                else {
                   btnClass += "border-gray-100 opacity-60"; 
                }
             }

             return (
               <div key={option.id}>
                 <button
                   disabled={isAnswered}
                   onClick={() => onSelect(option)}
                   className={btnClass}
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm
                          ${!isAnswered ? 'border-gray-300 text-gray-500' : 
                            isCorrect ? 'border-[#2ecc71] bg-[#2ecc71] text-white' :
                            isSelected ? 'border-[#e74c3c] bg-[#e74c3c] text-white' : 'border-gray-200 text-gray-400'}
                       `}>
                          {option.label}
                       </span>
                       <span className="font-medium">{option.text}</span>
                     </div>
                     {isAnswered && isCorrect && <CheckCircle size={20} className="text-[#2ecc71]" />}
                     {isAnswered && isSelected && !isCorrect && <AlertCircle size={20} className="text-[#e74c3c]" />}
                   </div>
                 </button>
                 
                 {/* REVEAL EXPLANATION: Show for ALL options if answered */}
                 {isAnswered && (
                   <div className={`mt-2 ml-4 pl-4 border-l-2 text-sm italic animate-in fade-in slide-in-from-top-1
                     ${isCorrect ? 'border-[#2ecc71] text-green-700' : 'border-gray-300 text-gray-600'}
                   `}>
                     <span className="font-bold not-italic mr-1">Explanation:</span> {option.explanation}
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default LessonView;
