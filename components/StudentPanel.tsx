
import React, { useState, useEffect } from 'react';
import { User, Lesson, Module } from '../types';
import { lessonService } from '../services/lessonService';
import Tooltip from './Tooltip';
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
         {/* LESSONS LIST TAB */}
         {activeTab === 'lessons' && (
            <div className="space-y-10">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-gray-900 flex items-center gap-3">
                        <LayoutGrid className="text-indigo-600" size={32} /> Available Curriculum
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Select a module to begin your leadership journey.</p>
                  </div>
                  <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">
                      {modules.length} Modules Assigned
                  </div>
               </div>

               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Accessing Knowledge Registry...</p>
                  </div>
               ) : modules.length === 0 ? (
                  <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100">
                     <BookOpen size={80} className="mx-auto mb-6 text-gray-200" />
                     <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">No Curriculum Modules Identified</h3>
                     <p className="text-gray-400 mt-4 max-w-sm mx-auto">Please contact your system administrator or mentor to have learning materials assigned to your profile.</p>
                  </div>
               ) : (
                  <div className="space-y-6">
                      {modules.map(mod => {
                          const lessons = lessonsByModule[mod.id] || [];
                          const isExpanded = expandedModuleId === mod.id;
                          return (
                              <div key={mod.id} className="bg-white border-4 border-gray-50 rounded-[2.5rem] overflow-hidden transition-all hover:border-indigo-100 hover:shadow-xl group">
                                  <div 
                                    onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                                    className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer"
                                  >
                                      <div className={`p-5 rounded-[1.5rem] transition-colors shadow-lg ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-royal-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                                          <Layers size={32} />
                                      </div>
                                      <div className="flex-1">
                                          <h3 className="text-2xl font-serif font-black text-gray-900 leading-tight uppercase">{mod.title}</h3>
                                          <p className="text-gray-500 text-sm mt-1 font-medium">{mod.description || 'Master the principles of character and influence.'}</p>
                                          <div className="flex gap-4 mt-4">
                                              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{lessons.length} Lessons</span>
                                              <span className="text-[10px] font-black uppercase tracking-widest bg-gold-50 text-gold-600 px-3 py-1 rounded-full flex items-center gap-1"><Star size={10} fill="currentColor" /> Certification Ready</span>
                                          </div>
                                      </div>
                                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                          <ChevronRight size={32} className="text-gray-300" />
                                      </div>
                                  </div>

                                  {isExpanded && (
                                      <div className="bg-gray-50/50 p-8 border-t-2 border-gray-50 animate-in slide-in-from-top-4">
                                          {lessons.length === 0 ? (
                                              <div className="text-center py-8 text-gray-400 font-bold italic">This module is currently awaiting content deployment.</div>
                                          ) : (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {lessons.map(lesson => (
                                                      <div key={lesson.id} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 hover:border-indigo-400 hover:shadow-xl transition-all group/lesson">
                                                          <div className="flex justify-between items-start mb-4">
                                                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Lesson {lesson.orderInModule}</span>
                                                              <span className="text-[9px] font-black text-gray-400 flex items-center gap-1"><Clock size={12}/> 15M</span>
                                                          </div>
                                                          <h4 className="font-black text-gray-900 text-lg leading-tight mb-6 group-hover/lesson:text-indigo-600 transition-colors">{lesson.title}</h4>
                                                          <button 
                                                              onClick={(e) => { e.stopPropagation(); onTakeLesson && onTakeLesson(lesson.id); }}
                                                              className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest border-b-4 border-black"
                                                          >
                                                              <Play size={16} fill="currentColor" /> Start Lesson
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

export default StudentPanel;
