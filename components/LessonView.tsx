
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, LessonSection, QuizQuestion, QuizOption, StudentAttempt, User, Module, Course, AboutSegment, Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import CertificateGenerator from './CertificateGenerator';
import { ArrowLeft, BookOpen, Check, X, HelpCircle, CheckCircle, Clock, Trophy, BadgeCheck, Loader2, Info, LayoutGrid, Layers, Sparkles, Book, Star, ChevronRight, ArrowRight, Library, FileText } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, [lesson.id]);

  const loadData = async () => {
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    const mod = await lessonService.getModuleById(lesson.moduleId);
    if (mod) {
        setParentModule(mod);
        const course = await lessonService.getCourseById(mod.courseId);
        if (course) setParentCourse(course);
    }
    const attemptMap: Record<string, string> = {};
    history.forEach(h => { attemptMap[h.quizId] = h.selectedOptionId; });
    setAttempts(attemptMap);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption) => {
    if (attempts[quiz.id]) return;
    setAttempts(prev => ({ ...prev, [quiz.id]: option.id }));
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
  };

  const renderAboutGrid = (segments: AboutSegment[], type: string) => (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] shadow-[0_50px_150px_-30px_rgba(0,0,0,0.8)] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border-4 border-white/30">
              
              <div className="bg-royal-950 p-10 md:p-14 text-white relative shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="relative z-10 flex justify-between items-center">
                      <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl flex items-center justify-center border-b-8 border-indigo-900">
                             {type === 'Course' ? <Library size={40}/> : type === 'Module' ? <Layers size={40}/> : <Sparkles size={40}/>}
                          </div>
                          <div>
                            <h3 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tight leading-none">Structured Insights</h3>
                            <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.5em] mt-3">{type} Strategic Context</p>
                          </div>
                      </div>
                      <button onClick={() => setActiveAboutType(null)} className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/20 shadow-xl group"><X size={40} className="group-hover:rotate-90 transition-transform"/></button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-[#fdfdfd] custom-scrollbar">
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
                                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">Expand Perspective <ArrowRight size={14}/></span>
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
                      <div className="flex-1 overflow-y-auto p-12 md:p-16 text-xl text-gray-700 leading-relaxed custom-scrollbar font-medium prose prose-indigo max-w-none prose-p:mb-8 prose-h3:text-indigo-900 prose-h3:uppercase prose-h3:font-black">
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
    <div className="bg-gray-100 min-h-screen pb-40">
      {/* Mature Hierarchical Navigation */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-[6px] border-indigo-100 shadow-2xl px-6 py-6">
          <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                  <button onClick={onBack} className="p-4 bg-gray-100 hover:bg-white rounded-2xl text-gray-500 hover:text-royal-950 transition-all shadow-inner border border-gray-200 group"><ArrowLeft size={32} className="group-hover:-translate-x-2 transition-transform" /></button>
                  <div>
                      <h2 className="text-2xl md:text-4xl font-serif font-black text-gray-950 leading-none uppercase tracking-tighter truncate max-w-md">{lesson.title}</h2>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-3 ml-1 flex items-center gap-2"><Sparkles size={14} className="animate-pulse" /> Strategic Academic View Enabled</p>
                  </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 bg-indigo-50/50 p-2 rounded-[2.5rem] shadow-inner border-2 border-indigo-100/50">
                  <button onClick={() => setActiveAboutType('course')} className="px-8 py-3.5 bg-white text-royal-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-gray-200"><Library size={18} className="text-indigo-600" /> ABOUT THIS COURSE</button>
                  <button onClick={() => setActiveAboutType('module')} className="px-8 py-3.5 bg-white text-royal-950 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-gray-200"><Layers size={18} className="text-indigo-600" /> ABOUT THIS MODULE</button>
                  <button onClick={() => setActiveAboutType('lesson')} className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-indigo-900"><Sparkles size={18} className="text-gold-400" /> ABOUT THIS LESSON</button>
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        {lesson.sections.map((section) => (
          <div key={section.id}>
            {section.type === 'note' ? (
              <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-[0_60px_150px_-40px_rgba(0,0,0,0.15)] border-[10px] border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-4 h-full bg-indigo-600"></div>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-gray-950 border-b-8 border-indigo-50 mb-14 pb-8 flex items-center gap-6"><BookOpen size={48} className="text-indigo-600"/> {section.title}</h2>
                <div className="font-medium leading-relaxed text-gray-800 text-2xl prose prose-2xl prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: section.body || '' }} />
              </div>
            ) : (
              <div className="space-y-16">
                <div className="flex items-center gap-10">
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                    <h2 className="text-4xl font-serif font-black text-gray-950 flex items-center gap-6 uppercase tracking-tighter"><HelpCircle className="text-indigo-600" size={48} /> Knowledge Validation</h2>
                    <div className="h-2 flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
                </div>
                {section.quizzes?.map((quiz, qIdx) => (
                  <QuizCard key={quiz.id} quiz={quiz} index={qIdx + 1} selectedOptionId={attempts[quiz.id]} onSelect={(opt: any) => handleOptionSelect(quiz, opt)} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeAboutType === 'course' && parentCourse && renderAboutGrid(parentCourse.about, 'Course')}
      {activeAboutType === 'module' && parentModule && renderAboutGrid(parentModule.about, 'Module')}
      {activeAboutType === 'lesson' && renderAboutGrid(lesson.about, 'Lesson')}
    </div>
  );
};

const QuizCard = ({ quiz, index, selectedOptionId, onSelect }: any) => {
    const isAnswered = !!selectedOptionId;
    return (
        <div className="bg-white rounded-[4rem] shadow-2xl border-[8px] border-gray-50 p-12 md:p-16 relative transition-all hover:border-indigo-100">
            <div className="flex gap-10 mb-14 items-start">
                <span className="shrink-0 w-24 h-24 rounded-[2.5rem] bg-royal-950 text-white font-black flex items-center justify-center text-5xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-8 border-black">{index}</span>
                <div className="flex-1 space-y-6">
                    {quiz.reference && <div className="text-indigo-600 font-black text-sm uppercase tracking-[0.4em] bg-indigo-50 px-6 py-2 rounded-2xl w-fit border border-indigo-100 shadow-sm">{quiz.reference}</div>}
                    <h3 className="font-black text-3xl md:text-4xl text-gray-950 leading-tight tracking-tight">{quiz.text}</h3>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quiz.options.map((opt: any) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.isCorrect;
                    let cls = "w-full text-left p-8 rounded-[2.5rem] border-4 transition-all duration-500 flex items-center gap-6 relative overflow-hidden ";
                    if (!isAnswered) cls += "bg-white border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-2xl hover:-translate-y-1 shadow-sm";
                    else if (isCorrect) cls += "bg-green-50 border-green-500 shadow-2xl scale-[1.05] z-10 text-green-950";
                    else if (isSelected) cls += "bg-red-50 border-red-500 shadow-xl text-red-950 scale-95";
                    else cls += "opacity-30 grayscale pointer-events-none";
                    
                    return (
                        <button key={opt.id} disabled={isAnswered} onClick={() => onSelect(opt)} className={cls}>
                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-4 shrink-0 shadow-inner ${isAnswered && isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>{opt.label}</span>
                            <span className="font-black text-xl flex-1 tracking-tight leading-snug">{opt.text}</span>
                            {isAnswered && isCorrect && <CheckCircle size={36} className="text-green-600 shrink-0 drop-shadow-lg" />}
                            {isAnswered && isSelected && !isCorrect && <X size={36} className="text-red-600 shrink-0 drop-shadow-lg" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonView;
