
import React, { useState, useEffect } from 'react';
import { User, Lesson, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { Search, BookOpen, ChevronRight, Play, Clock, Star, Layers, LayoutGrid, Info } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'lessons') {
        const allModules = await lessonService.getModules();
        setModules(allModules);
        
        const moduleMap: Record<string, Lesson[]> = {};
        for (const mod of allModules) {
            const modLessons = await lessonService.getLessonsByModuleId(mod.id);
            moduleMap[mod.id] = modLessons;
        }
        setLessonsByModule(moduleMap);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 min-h-[600px] animate-in fade-in duration-500">
         {/* CURRICULUM BROWSER TAB */}
         {activeTab === 'lessons' && (
            <div className="space-y-10">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-indigo-50 pb-8">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                        <LayoutGrid className="text-indigo-600" size={32} /> Available Curriculum
                    </h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 ml-11">Authenticated Certification Paths</p>
                  </div>
                  <div className="bg-indigo-600 px-6 py-2.5 rounded-2xl border-b-4 border-indigo-900 text-white font-black text-xs uppercase tracking-widest shadow-xl">
                      {modules.length} Modules Identified
                  </div>
               </div>

               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                      <Loader2 className="animate-spin text-indigo-600" size={60} />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Accessing Knowledge Registry...</p>
                  </div>
               ) : modules.length === 0 ? (
                  <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-8 border-dashed border-gray-100 shadow-inner">
                     <BookOpen size={100} className="mx-auto mb-8 text-gray-200" />
                     <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">No Curriculum Modules Identified</h3>
                     <p className="text-gray-400 mt-4 max-w-sm mx-auto font-medium">Learning materials will appear here once assigned to your profile by an administrator.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
                      {modules.map(mod => {
                          const lessons = lessonsByModule[mod.id] || [];
                          const isExpanded = expandedModuleId === mod.id;
                          return (
                              <div key={mod.id} className="bg-white border-4 border-gray-50 rounded-[3rem] overflow-hidden transition-all hover:border-indigo-200 hover:shadow-2xl group relative">
                                  <div 
                                    onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                                    className="p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8 cursor-pointer relative z-10"
                                  >
                                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl shrink-0 border-b-8 ${isExpanded ? 'bg-indigo-600 text-white border-indigo-900' : 'bg-royal-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100'}`}>
                                          <Layers size={48} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl md:text-4xl font-serif font-black text-gray-950 leading-none uppercase tracking-tighter">{mod.title}</h3>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-100">{mod.subtitle || 'Core Unit'}</span>
                                          </div>
                                          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed line-clamp-2">{mod.description || 'Master the principles of character and influence through structured study.'}</p>
                                          <div className="flex flex-wrap gap-4 mt-6">
                                              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full border border-gray-200">{lessons.length} LESSON BLOCKS</span>
                                              <span className="text-[10px] font-black uppercase tracking-widest bg-gold-50 text-gold-600 px-4 py-1.5 rounded-full flex items-center gap-2 border border-gold-100"><Star size={12} fill="currentColor" /> CERTIFICATION READY</span>
                                          </div>
                                      </div>
                                      <div className={`transition-transform duration-500 shrink-0 ${isExpanded ? 'rotate-90 scale-125' : ''}`}>
                                          <ChevronRight size={48} className="text-gray-200" />
                                      </div>
                                  </div>

                                  {isExpanded && (
                                      <div className="bg-gray-50/50 p-8 md:p-12 border-t-8 border-gray-50 animate-in slide-in-from-top-8 duration-700">
                                          {lessons.length === 0 ? (
                                              <div className="text-center py-16 text-gray-400 font-black uppercase tracking-widest text-sm bg-white rounded-[2rem] border-4 border-dashed border-gray-100">Awaiting Instructional Content Deployment...</div>
                                          ) : (
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                  {lessons.map(lesson => (
                                                      <div key={lesson.id} className="bg-white p-8 rounded-[2.5rem] border-4 border-gray-100 hover:border-indigo-400 hover:shadow-2xl transition-all group/lesson flex flex-col justify-between">
                                                          <div className="space-y-4">
                                                              <div className="flex justify-between items-start">
                                                                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">BLOCK {lesson.orderInModule}</span>
                                                                  <span className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1.5"><Clock size={12} className="text-indigo-200"/> 20M</span>
                                                              </div>
                                                              <h4 className="font-black text-gray-950 text-xl leading-tight mb-8 group-hover/lesson:text-indigo-600 transition-colors uppercase tracking-tight">{lesson.title}</h4>
                                                          </div>
                                                          <button 
                                                              onClick={(e) => { e.stopPropagation(); onTakeLesson && onTakeLesson(lesson.id); }}
                                                              className="w-full py-5 bg-gray-950 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-widest border-b-[6px] border-black shadow-xl"
                                                          >
                                                              <Play size={18} fill="currentColor" className="text-gold-400" /> START BLOCK
                                                          </button>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
               )}
            </div>
         )}
    </div>
  );
};

const Loader2 = ({ className, size }: any) => <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 ${className}`} style={{ width: size, height: size }} />;

export default StudentPanel;
