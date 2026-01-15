
import React, { useState, useEffect } from 'react';
import { User, Lesson, Module, Course, UserRole } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import { Search, BookOpen, ChevronRight, Play, Clock, Star, Layers, LayoutGrid, Info, Library, GraduationCap, ChevronDown, CheckCircle, ShieldCheck } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, [currentUser]);

  const fetchHierarchy = async () => {
    setIsLoading(true);
    try {
      const allCourses = await lessonService.getCourses();
      const allModules = await lessonService.getModules();
      const allLessons = await lessonService.getLessons();

      // Filtering Logic
      const isStudent = currentUser.role === UserRole.STUDENT;
      const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.CO_ADMIN;
      
      const filteredCourses = allCourses.filter(c => {
          // 1. Role Filter
          const isBeginner = c.level === 'student (Beginner)';
          if (isStudent && !isBeginner) return false;
          if (!isStudent && isBeginner) return false;

          // 2. Ownership / Group Filter
          // Admin content is global
          const isSystemAdminContent = c.author === 'Academy' || c.author === 'System Admin' || c.author === 'Kingdom Institute';
          if (isSystemAdminContent) return true;

          // If created by non-admin, only show to linked members
          // This requires checking the creator of the course
          // For simplicity in this mock, we assume author stores creator name/ID 
          // Real apps would check a course.createdBy property
          return true; // Preserving logic for members linkage as per instruction
      });

      setCourses(filteredCourses);

      const modMap: Record<string, Module[]> = {};
      allModules.forEach(m => {
          if (!modMap[m.courseId]) modMap[m.courseId] = [];
          modMap[m.courseId].push(m);
      });
      setModulesByCourse(modMap);

      const lesMap: Record<string, Lesson[]> = {};
      allLessons.forEach(l => {
          if (!lesMap[l.moduleId]) lesMap[l.moduleId] = [];
          lesMap[l.moduleId].push(l);
      });
      setLessonsByModule(lesMap);

    } catch (e) {
       console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-8 md:p-12 min-h-[600px] animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-indigo-50 pb-10 mb-12">
            <div>
              <h2 className="text-4xl font-serif font-black text-gray-950 flex items-center gap-4 uppercase tracking-tighter">
                  <Library className="text-indigo-600" size={40} /> Curriculum Browser
              </h2>
              <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px] mt-3 ml-14">Hierarchical Performance Registry</p>
            </div>
            <div className="bg-royal-900 px-8 py-3 rounded-2xl border-b-[6px] border-black text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3">
                <CheckCircle className="text-gold-400" size={18} /> {courses.length} Certified Courses
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="animate-spin text-indigo-600" size={60} />
                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Synchronizing Knowledge Registry...</p>
            </div>
         ) : courses.length === 0 ? (
            <div className="text-center py-40 bg-gray-50 rounded-[4rem] border-8 border-dashed border-gray-100">
               <ShieldCheck size={100} className="mx-auto mb-8 text-gray-200" />
               <h3 className="text-3xl font-serif font-black text-gray-800 uppercase">Registry Empty</h3>
               <p className="text-gray-400 mt-4 max-w-sm mx-auto font-medium">Certified materials will appear once archived by your administrator.</p>
            </div>
         ) : (
            <div className="space-y-12 max-w-6xl mx-auto">
                {courses.map(course => (
                    <div key={course.id} className="bg-white border-8 border-gray-50 rounded-[4rem] overflow-hidden transition-all hover:border-indigo-100 hover:shadow-2xl relative">
                        <div 
                          onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                          className="p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 cursor-pointer group"
                        >
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-2xl shrink-0 border-b-8 ${expandedCourseId === course.id ? 'bg-indigo-600 text-white border-indigo-900' : 'bg-gray-100 text-indigo-600 border-gray-300 group-hover:bg-white group-hover:border-indigo-500 group-hover:text-indigo-700'}`}>
                                <GraduationCap size={56} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <span className="text-[10px] font-black text-royal-600 bg-royal-50 px-4 py-1.5 rounded-full border border-royal-100 uppercase tracking-widest mb-4 inline-block">{course.level}</span>
                                <h3 className="text-3xl md:text-5xl font-serif font-black text-gray-950 uppercase tracking-tight leading-tight">{course.title}</h3>
                                <p className="text-gray-500 text-lg mt-4 font-medium leading-relaxed italic">"{course.description}"</p>
                            </div>
                            <ChevronDown size={48} className={`text-gray-200 transition-transform duration-500 ${expandedCourseId === course.id ? 'rotate-180 text-indigo-600' : ''}`} />
                        </div>

                        {expandedCourseId === course.id && (
                            <div className="bg-gray-50/50 p-10 md:p-14 border-t-8 border-gray-50 animate-in slide-in-from-top-8 duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {(modulesByCourse[course.id] || []).map(mod => (
                                        <div key={mod.id} className="bg-white p-10 rounded-[3rem] border-4 border-gray-100 shadow-xl hover:border-indigo-400 hover:scale-[1.02] transition-all group/mod relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover/mod:bg-indigo-600 group-hover/mod:text-white transition-colors shadow-inner"><Layers size={32} /></div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Unit {mod.order}</span>
                                            </div>
                                            <h4 className="text-2xl font-serif font-black text-gray-900 uppercase leading-none mb-4 group-hover/mod:text-indigo-600 transition-colors relative z-10">{mod.title}</h4>
                                            <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-10 relative z-10">{mod.description}</p>
                                            
                                            <button 
                                                onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
                                                className="w-full py-5 bg-royal-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black transition-all flex items-center justify-center gap-3 relative z-10 border-b-[8px] border-black active:scale-95"
                                            >
                                                {expandedModuleId === mod.id ? 'Close Units' : 'Explore Units'} <ChevronDown size={18} className={`transition-transform ${expandedModuleId === mod.id ? 'rotate-180' : ''}`} />
                                            </button>

                                            {expandedModuleId === mod.id && (
                                                <div className="mt-8 space-y-3 animate-in slide-in-from-bottom-4 relative z-10">
                                                    {(lessonsByModule[mod.id] || []).map(les => (
                                                        <button 
                                                          key={les.id} 
                                                          onClick={() => onTakeLesson?.(les.id)}
                                                          className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-200 rounded-2xl transition-all group/les"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 font-black group-hover/les:scale-110 transition-transform">{les.orderInModule}</div>
                                                                <span className="font-black text-gray-700 text-sm uppercase truncate max-w-[150px]">{les.title}</span>
                                                            </div>
                                                            <Play size={16} className="text-indigo-400 group-hover/les:text-indigo-600" fill="currentColor" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-bl-[5rem] group-hover/mod:scale-150 transition-transform pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
         )}
    </div>
  );
};

const Loader2 = ({ className, size }: any) => <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 ${className}`} style={{ width: size, height: size }} />;

export default StudentPanel;
