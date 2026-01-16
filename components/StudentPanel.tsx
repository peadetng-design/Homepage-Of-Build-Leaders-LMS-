
import React, { useState, useEffect } from 'react';
import { User, Lesson, Module, Course, UserRole, AboutSegment } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import { Search, BookOpen, ChevronRight, Play, Clock, Star, Layers, LayoutGrid, Info, Library, GraduationCap, ChevronDown, CheckCircle, ShieldCheck, Download, Trophy, Target, Share2, Save, FileText, File as FileIcon, Activity, Database, RefreshCcw, Zap, BarChart3 } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
}

interface LessonStatusData {
    status: 'COMPLETED' | 'STARTED' | 'UNATTEMPTED';
    score: string;
    timeSpent: number;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [lessonStatuses, setLessonStatuses] = useState<Record<string, LessonStatusData>>({});
  const [summary, setSummary] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, [currentUser]);

  const formatDigitalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const fetchHierarchy = async () => {
    setIsLoading(true);
    try {
      const allCourses = await lessonService.getCourses();
      const allModules = await lessonService.getModules();
      const allLessons = await lessonService.getLessons();

      const isStudent = currentUser.role === UserRole.STUDENT;
      
      const filteredCourses = allCourses.filter(c => {
          const isBeginner = c.level === 'student (Beginner)';
          if (isStudent && !isBeginner) return false;
          if (!isStudent && isBeginner) return false;
          return true; 
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

      const statusMap: Record<string, LessonStatusData> = {};
      for (const les of allLessons) {
          const attempts = await lessonService.getAttempts(currentUser.id, les.id);
          const time = await lessonService.getQuizTimer(currentUser.id, les.id);
          
          const totalQ = (les.bibleQuizzes?.length || 0) + (les.noteQuizzes?.length || 0);
          const uniqueAnswered = new Set(attempts.map(a => a.quizId)).size;
          const correct = attempts.filter(a => a.isCorrect).length;

          let status: 'COMPLETED' | 'STARTED' | 'UNATTEMPTED' = 'UNATTEMPTED';
          if (uniqueAnswered >= totalQ && totalQ > 0) status = 'COMPLETED';
          else if (uniqueAnswered > 0 || time > 0) status = 'STARTED';

          statusMap[les.id] = {
              status,
              score: `${correct}/${totalQ}`,
              timeSpent: time
          };
      }
      setLessonStatuses(statusMap);

      // Fetch the 5 requested summary stats
      const stats = await lessonService.getStudentSummary(currentUser.id);
      setSummary(stats);

    } catch (e) {
       console.error("Hierarchy Fetch Failure:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const AboutSection = ({ segments }: { segments: AboutSegment[] }) => (
    <div className="space-y-4 mt-4">
        {segments.length > 0 ? segments.map((seg, idx) => (
            <div key={idx} className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group/seg">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-black text-[9px] border border-indigo-100">P{seg.order}</span>
                    <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5>
                </div>
                <div className="text-[10px] text-gray-500 leading-relaxed font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: seg.body }} />
            </div>
        )) : (
            <div className="p-6 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 opacity-40">
                <p className="text-[8px] font-black uppercase tracking-widest">No Context Records</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.2)] border-[8px] border-gray-50 p-4 md:p-10 min-h-[700px] animate-in fade-in duration-700">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-[6px] border-indigo-50 pb-8 mb-10">
            <div>
              <div className="flex items-center gap-5">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl animate-float">
                  <Library size={36} />
                </div>
                <div>
                  <h2 className="text-4xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">Curriculum Browser</h2>
                  <p className="text-indigo-600 font-black uppercase tracking-[0.45em] text-[9px] mt-2 ml-1">Independent Matrix Navigation (TABLE 3 Protocol)</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={fetchHierarchy} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-inner border border-gray-200 group">
                    <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                </button>
                <div className="flex items-center gap-3 bg-royal-900 px-8 py-4 rounded-[1.8rem] border-b-[6px] border-black text-white shadow-xl">
                    <div className="p-2 bg-white/10 rounded-lg"><CheckCircle className="text-gold-400" size={20} /></div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black leading-none">{courses.length}</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Verified Courses</span>
                    </div>
                </div>
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-48 gap-8">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-[8px] border-indigo-50 border-t-indigo-600 animate-spin"></div>
                    <Database className="absolute inset-0 m-auto text-indigo-600" size={32} />
                </div>
                <div className="text-center">
                    <p className="font-black text-gray-900 uppercase tracking-[0.6em] text-[11px] animate-pulse">Synchronizing Intelligence Registry...</p>
                </div>
            </div>
         ) : (
            <div className="space-y-10">
                <div className="bg-white border-[8px] border-gray-50 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar flex-1 max-h-[75vh]">
                        <table className="w-full text-left border-collapse min-w-[2000px]">
                            <thead>
                                <tr className="bg-royal-900 text-white text-[11px] font-black uppercase tracking-[0.3em] border-b-[8px] border-gold-500 sticky top-0 z-20">
                                    <th className="p-8 min-w-[400px] border-r border-white/10">COURSE & "ABOUT THIS COURSE"</th>
                                    <th className="p-8 min-w-[160px] text-center border-r border-white/10">NO. OF MODULES</th>
                                    <th className="p-8 min-w-[400px] border-r border-white/10">MODULE TITLE & "ABOUT THIS MODULE"</th>
                                    <th className="p-8 min-w-[160px] text-center border-r border-white/10">NO. OF LESSONS</th>
                                    <th className="p-8 min-w-[400px] border-r border-white/10">LESSON TITLE & "ABOUT THIS LESSON"</th>
                                    <th className="p-8 min-w-[450px]">LESSON MANAGEMENT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[8px] divide-gray-50">
                                {courses.length > 0 ? courses.map(course => {
                                    const courseModules = modulesByCourse[course.id] || [];
                                    return courseModules.map((mod, modIdx) => {
                                        const modLessons = lessonsByModule[mod.id] || [];
                                        return modLessons.map((les, lesIdx) => (
                                            <tr key={les.id} className="group hover:bg-royal-50/10 transition-all align-top">
                                                <td className="p-8 border-r border-gray-100 relative bg-white/50 group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] overflow-y-auto custom-scrollbar pr-4 scroll-smooth">
                                                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pb-4 mb-4 border-b-2 border-indigo-50">
                                                            <h3 className="text-2xl font-serif font-black text-royal-950 uppercase leading-tight tracking-tight">{course.title}</h3>
                                                            <div className="flex items-center gap-2 mt-3">
                                                                <span className="text-[8px] font-black text-gold-600 bg-gold-50 px-3 py-1 rounded-full border border-gold-100 uppercase tracking-widest">{course.level}</span>
                                                            </div>
                                                        </div>
                                                        <AboutSection segments={course.about} />
                                                    </div>
                                                </td>

                                                <td className="p-8 border-r border-gray-100 text-center align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] flex items-center justify-center overflow-y-auto custom-scrollbar">
                                                        <span className="text-7xl font-serif font-black text-gray-200 group-hover:text-indigo-600 transition-all duration-700">{course.totalModulesRequired}</span>
                                                    </div>
                                                </td>

                                                <td className="p-8 border-r border-gray-100 relative group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] overflow-y-auto custom-scrollbar pr-4 scroll-smooth">
                                                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pb-4 mb-4 border-b-2 border-indigo-50">
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">MODULE {mod.order}</p>
                                                            <h4 className="text-xl font-serif font-black text-gray-900 uppercase leading-tight tracking-tight">{mod.title}</h4>
                                                        </div>
                                                        <AboutSection segments={mod.about} />
                                                    </div>
                                                </td>

                                                <td className="p-8 border-r border-gray-100 text-center align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] flex items-center justify-center overflow-y-auto custom-scrollbar">
                                                        <span className="text-7xl font-serif font-black text-gray-200 group-hover:text-indigo-600 transition-all duration-700">{mod.totalLessonsRequired}</span>
                                                    </div>
                                                </td>

                                                <td className="p-8 border-r border-gray-100 relative group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] overflow-y-auto custom-scrollbar pr-4 scroll-smooth">
                                                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pb-4 mb-4 border-b-2 border-indigo-50">
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">LESSON {les.orderInModule}</p>
                                                            <h4 className="text-xl font-serif font-black text-gray-900 uppercase leading-tight tracking-tight">{les.title}</h4>
                                                            <div className="flex flex-wrap gap-1 mt-3">
                                                                <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-100">{les.lesson_type}</span>
                                                                <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider border border-gray-200">{les.book} {les.chapter}</span>
                                                            </div>
                                                        </div>
                                                        <AboutSection segments={les.about} />
                                                    </div>
                                                </td>

                                                <td className="p-8 align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[520px] overflow-y-auto custom-scrollbar pr-4 space-y-6 flex flex-col justify-center">
                                                        <button 
                                                            onClick={() => onTakeLesson?.(les.id)}
                                                            className="w-full py-6 bg-royal-800 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all flex flex-col items-center justify-center gap-3 uppercase text-[10px] tracking-[0.3em] border-b-[6px] border-royal-950 active:scale-95 group/btn"
                                                        >
                                                            <Play size={20} fill="currentColor" className="group-hover/btn:scale-110 transition-transform" /> 
                                                            {lessonStatuses[les.id]?.status === 'STARTED' ? 'RESUME SESSION' : 'EXECUTE START'}
                                                        </button>

                                                        <div className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase text-center border-[3px] tracking-[0.2em] shadow-md ${
                                                            lessonStatuses[les.id]?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                                            lessonStatuses[les.id]?.status === 'STARTED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                                                            'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                            STATUS: {lessonStatuses[les.id]?.status}
                                                        </div>

                                                        <div className="p-6 bg-white rounded-3xl border-[3px] border-gray-100 space-y-4 shadow-xl relative overflow-hidden group/perf">
                                                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/30 rounded-bl-[2rem] group-hover/perf:scale-125 transition-transform"></div>
                                                            <div className="flex items-center gap-2 relative z-10">
                                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm"><Activity size={18} /></div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Intelligence Summary</span>
                                                            </div>
                                                            <div className="flex justify-between items-end relative z-10">
                                                                <div>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">SCORE</p>
                                                                    <p className="text-3xl font-black text-royal-900 leading-none">{lessonStatuses[les.id]?.score}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">DUR</p>
                                                                    <p className="text-sm font-black text-gray-700">{formatTime(lessonStatuses[les.id]?.timeSpent || 0)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                                            <button 
                                                                className="p-4 bg-white text-gray-600 border-[3px] border-gray-100 rounded-2xl hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                                                onClick={() => alert("Extraction Successful (Simulation)")}
                                                            >
                                                                <Download size={18}/>
                                                                <span className="text-[9px] font-black uppercase">OFFLINE</span>
                                                            </button>
                                                            <div className="flex flex-col gap-2">
                                                                <button className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all text-[8px] font-black uppercase flex items-center justify-center gap-2 shadow-sm">
                                                                    <Save size={12}/> SAVE
                                                                </button>
                                                                <button className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-[8px] font-black uppercase flex items-center justify-center gap-2 shadow-sm">
                                                                    <Share2 size={12}/> SHARE
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    });
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center bg-gray-50/30">
                                            <div className="max-w-xl mx-auto space-y-8">
                                                <Library size={64} className="mx-auto text-indigo-100" />
                                                <h3 className="text-3xl font-serif font-black text-gray-900 uppercase tracking-tighter">Registry Persistence Empty</h3>
                                                <button onClick={fetchHierarchy} className="px-10 py-5 bg-white text-indigo-600 font-black rounded-3xl shadow-xl border-2 border-indigo-50 uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 hover:bg-gray-50 transition-all mx-auto">
                                                    <RefreshCcw size={18} /> SYNCHRONIZE REGISTRY
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t-[6px] border-indigo-50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-4">Intra-Cell Matrix Scroll Enabled • Permanent Registry Protocol</p>
                        <div className="flex items-center gap-6 mr-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-60">
                                <ShieldCheck className="text-indigo-600" size={16} />
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* (a) PERFORMANCE STATS SECTION JUST BELOW THE GRID */}
                {summary && (
                    <div className="bg-royal-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border-b-[12px] border-black relative overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="relative z-10 mb-10 border-b border-white/10 pb-6 flex items-center gap-4">
                            <div className="p-3 bg-gold-500 text-white rounded-2xl shadow-xl"><BarChart3 size={32} /></div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-tight">Registry Performance Summary</h3>
                                <p className="text-royal-300 text-[10px] font-black uppercase tracking-[0.4em]">Official Analytical Insight Report</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group">
                                <p className="text-[9px] font-black text-gold-400 uppercase tracking-widest mb-3 leading-tight min-h-[2.5rem]">MOST RECENT LESSON SCORE</p>
                                <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{summary.lastLessonScore}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group">
                                <p className="text-[9px] font-black text-gold-400 uppercase tracking-widest mb-3 leading-tight min-h-[2.5rem]">MOST RECENT LESSON DURATION</p>
                                <p className="text-3xl font-mono font-black text-white group-hover:scale-110 transition-transform origin-left">{formatDigitalTime(summary.lastLessonTime)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group">
                                <p className="text-[9px] font-black text-gold-400 uppercase tracking-widest mb-3 leading-tight min-h-[2.5rem]">NUMBER OF MODULES</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-white">{summary.modulesCompleted}</p>
                                    <p className="text-xs font-bold text-royal-400">/ {summary.totalModules}</p>
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group">
                                <p className="text-[9px] font-black text-gold-400 uppercase tracking-widest mb-3 leading-tight min-h-[2.5rem]">TOTAL TIME SPENT</p>
                                <p className="text-3xl font-mono font-black text-white group-hover:scale-110 transition-transform origin-left">{formatDigitalTime(summary.totalTime)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all group">
                                <p className="text-[9px] font-black text-gold-400 uppercase tracking-widest mb-3 leading-tight min-h-[2.5rem]">AVERAGE TOTAL SCORE (%)</p>
                                <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform origin-left">{summary.avgScore}%</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
         )}
    </div>
  );
};

export default StudentPanel;
