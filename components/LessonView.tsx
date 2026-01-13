
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module, Course, AboutSegment, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, Clock, Trophy, BadgeCheck, Loader2, Info, LayoutGrid, Layers, Sparkles, Book, Star, ChevronRight, ArrowRight, Library } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); 
  const [attemptHistory, setAttemptHistory] = useState<StudentAttempt[]>([]);
  const [score, setScore] = useState({ total: 0, correct: 0 });
  const [parentModule, setParentModule] = useState<Module | null>(null);
  const [parentCourse, setParentCourse] = useState<Course | null>(null);
  
  const [activeAboutType, setActiveAboutType] = useState<'course' | 'module' | 'lesson' | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<AboutSegment | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  const totalQuestions = lesson.sections.reduce((acc, sec) => acc + (sec.quizzes?.length || 0), 0);
  const questionsAnswered = Object.keys(attempts).length;
  const isCompleted = totalQuestions > 0 && questionsAnswered === totalQuestions;

  useEffect(() => {
    loadData();
    if (!isCompleted) {
        timerRef.current = setInterval(() => {
           setElapsedTime(prev => prev + 1);
        }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lesson.id]);

  const loadData = async () => {
    const savedTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedTime(savedTime);
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    setAttemptHistory(history);
    
    // Load hierarchy
    const mod = await lessonService.getModuleById(lesson.moduleId);
    if (mod) {
        setParentModule(mod);
        const course = await lessonService.getCourseById(mod.courseId);
        if (course) setParentCourse(course);
    }

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
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    const isCorrect = option.isCorrect;
    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));
    setScore(prev => ({ total: prev.total + 1, correct: isCorrect ? prev.correct + 1 : prev.correct }));
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, isCorrect);
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const renderAboutGrid = (segments: AboutSegment[], type: string) => (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-white/20">
              <div className="bg-royal-950 p-10 md:p-14 text-white relative shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex justify-between items-center">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-indigo-600 rounded-[1.8rem] shadow-2xl">
                             {type === 'Course' ? <Library size={40}/> : type === 'Module' ? <Layers size={40}/> : <BookOpen size={40}/>}
                          </div>
                          <div>
                            <h3 className="text-4xl font-serif font-black uppercase tracking-tight">Structured Insights</h3>
                            <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.4em] mt-1">{type} Perspective</p>
                          </div>
                      </div>
                      <button onClick={() => setActiveAboutType(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] transition-all"><X size={32}/></button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-[#fdfdfd] custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {segments.map((seg, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border-4 border-gray-50 p-8 rounded-[2.5rem] hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full"
                            onClick={() => setSelectedSegment(seg)}
                          >
                              <div className="flex justify-between items-start mb-6">
                                  <span className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">{seg.order}</span>
                                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors"><ChevronRight size={18}/></div>
                              </div>
                              <h4 className="text-xl font-serif font-black text-gray-900 uppercase leading-tight mb-4 group-hover:text-indigo-600 transition-colors">{seg.title}</h4>
                              <p className="text-gray-400 text-sm font-medium line-clamp-3 leading-relaxed">{seg.body.replace(/<[^>]*>?/gm, '')}</p>
                              <div className="mt-auto pt-6">
                                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">Read Segment <ArrowRight size={12}/></span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {selectedSegment && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-indigo-950/90 backdrop-blur-md animate-in zoom-in-95 duration-300">
                  <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                      <div className="p-10 border-b-4 border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <div className="flex items-center gap-4">
                              <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">{selectedSegment.order}</span>
                              <h4 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter">{selectedSegment.title}</h4>
                          </div>
                          <button onClick={() => setSelectedSegment(null)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><X size={28}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-12 text-lg text-gray-700 leading-relaxed custom-scrollbar font-medium prose prose-indigo max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedSegment.body }} />
                      </div>
                      <div className="p-8 border-t border-gray-100 flex justify-center bg-white">
                          <button onClick={() => setSelectedSegment(null)} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all active:scale-95">CLOSE SEGMENT</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Dynamic Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white border-b-4 border-indigo-100 shadow-lg px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 group transition-all"><ArrowLeft size={24} className="group-hover:-translate-x-1" /></button>
                  <div>
                      <h2 className="text-xl font-serif font-black text-gray-900 leading-none uppercase truncate max-w-xs">{lesson.title}</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Academic Perspective Active</p>
                  </div>
              </div>
              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-[1.8rem] shadow-inner overflow-x-auto no-scrollbar max-w-full">
                  <button 
                    onClick={() => setActiveAboutType('course')}
                    className="px-6 py-2.5 bg-white text-royal-900 rounded-[1.4rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                      <Library size={14} className="text-indigo-500" /> ABOUT THIS COURSE
                  </button>
                  <button 
                    onClick={() => setActiveAboutType('module')}
                    className="px-6 py-2.5 bg-white text-royal-900 rounded-[1.4rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                      <Layers size={14} className="text-indigo-500" /> ABOUT THIS MODULE
                  </button>
                  <button 
                    onClick={() => setActiveAboutType('lesson')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-[1.4rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                      <Sparkles size={14} className="text-gold-400" /> ABOUT THIS LESSON
                  </button>
              </div>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {lesson.sections.map((section) => (
          <div key={section.id}>
            {section.type === 'note' ? (
              <div className="prose prose-lg max-w-none text-gray-800 bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-full bg-indigo-600"></div>
                <h2 className="text-4xl font-serif font-black text-gray-950 border-b-4 border-indigo-50 mb-10 pb-6 flex items-center gap-4"><BookOpen size={32} className="text-indigo-600"/> {section.title}</h2>
                <div className="font-medium leading-relaxed text-gray-700 text-xl" dangerouslySetInnerHTML={{ __html: section.body || '' }} />
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center gap-6">
                    <div className="h-1.5 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                    <h2 className="text-3xl font-serif font-black text-gray-900 flex items-center gap-4 uppercase tracking-tighter"><HelpCircle className="text-indigo-600" size={32} /> Knowledge Validation</h2>
                    <div className="h-1.5 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                </div>
                {section.quizzes?.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1} selectedOptionId={attempts[quiz.id]} onSelect={(opt) => handleOptionSelect(quiz, opt)} />
                ))}
              </div>
            )}
          </div>
        ))}

        {isCompleted && (
            <div className="text-center pt-20 border-t-8 border-dashed border-gray-100 animate-in zoom-in-95 duration-1000">
                <div className="w-32 h-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(34,197,94,0.4)] mb-10 border-8 border-white animate-bounce-pulse">
                    <CheckCircle size={64} />
                </div>
                <h2 className="text-6xl font-serif font-black text-gray-950 leading-tight mb-4">Lesson Validated!</h2>
                <p className="text-gray-400 font-bold uppercase tracking-[0.4em] mb-12">Excellent Standing Confirmed</p>
                <button onClick={onBack} className="px-20 py-6 bg-royal-950 text-white font-black rounded-3xl text-xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] hover:bg-black transition-all border-b-8 border-black transform active:scale-95">RETURN TO CURRICULUM</button>
            </div>
        )}
      </div>

      {/* About Content Overlays */}
      {activeAboutType === 'course' && parentCourse && renderAboutGrid(parentCourse.about, 'Course')}
      {activeAboutType === 'module' && parentModule && renderAboutGrid(parentModule.about, 'Module')}
      {activeAboutType === 'lesson' && renderAboutGrid(lesson.about, 'Lesson')}
    </div>
  );
};

const QuizCard = ({ quiz, index, selectedOptionId, onSelect }: any) => {
    const isAnswered = !!selectedOptionId;
    return (
        <div className="bg-white rounded-[3.5rem] shadow-2xl border-4 border-gray-50 p-12 relative transition-all hover:shadow-indigo-900/5">
            <div className="flex gap-8 mb-10 items-start">
                <span className="shrink-0 w-16 h-16 rounded-[1.8rem] bg-royal-950 text-white font-black flex items-center justify-center text-3xl shadow-2xl border-b-4 border-black">{index}</span>
                <div className="flex-1 space-y-4">
                    {quiz.reference && <div className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1 rounded-full w-fit">{quiz.reference}</div>}
                    <h3 className="font-black text-2xl text-gray-950 leading-snug tracking-tight">{quiz.text}</h3>
                </div>
            </div>
            <div className="space-y-4">
                {quiz.options.map((opt: any) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.isCorrect;
                    let cls = "w-full text-left p-6 rounded-[2rem] border-4 transition-all duration-300 flex items-center gap-6 ";
                    if (!isAnswered) cls += "bg-white border-gray-100 hover:border-indigo-400 hover:bg-indigo-50";
                    else if (isCorrect) cls += "bg-green-50 border-green-500 shadow-xl scale-[1.02] z-10 text-green-950";
                    else if (isSelected) cls += "bg-red-50 border-red-500 shadow-lg text-red-950";
                    else cls += "opacity-40 grayscale";
                    
                    return (
                        <button key={opt.id} disabled={isAnswered} onClick={() => onSelect(opt)} className={cls}>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 ${isAnswered && isCorrect ? 'bg-green-500 text-white' : 'border-gray-200 text-gray-400'}`}>{opt.label}</span>
                            <span className="font-black text-lg flex-1">{opt.text}</span>
                            {isAnswered && isCorrect && <CheckCircle size={28} className="text-green-500" />}
                            {isAnswered && isSelected && !isCorrect && <X size={28} className="text-red-500" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonView;
