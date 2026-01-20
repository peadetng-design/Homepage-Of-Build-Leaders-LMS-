
import React, { useState, useEffect } from 'react';
import { User, Lesson, Module, Course, UserRole, AboutSegment, ProficiencyLevel } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import { Search, BookOpen, ChevronRight, Play, Clock, Star, Layers, LayoutGrid, Info, Library, GraduationCap, ChevronDown, CheckCircle, ShieldCheck, Download, Trophy, Target, Share2, Save, FileText, File as FileIcon, Activity, Database, RefreshCcw, Zap, BarChart3, Settings } from 'lucide-react';
import Tooltip from './Tooltip';

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
  const [coursesByLevel, setCoursesByLevel] = useState<Record<string, Course[]>>({
    'student (Beginner)': [],
    'Mentor, Organization & Parent (Intermediate)': [],
    'Mentor, Organization & Parent (Advanced)': []
  });
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
      // Force sync with LocalStorage before retrieval
      const allCourses = await lessonService.getCourses();
      const allModules = await lessonService.getModules();
      const allLessons = await lessonService.getLessons();

      const isSysAdmin = (email: string) => email === 'peadetng@gmail.com';

      // Access Control: Filters global repository vs local organization/mentor content
      const filteredCourses = allCourses.filter(c => {
          if (c.authorId === 'usr_main_admin' || isSysAdmin(c.author || '')) return true;
          if (c.authorId === currentUser.id) return true;
          const isFromMyMentor = currentUser.mentorId === c.authorId;
          const isFromMyOrg = currentUser.organizationId === c.authorId || currentUser.organizationId === c.organizationId;
          return isFromMyMentor || isFromMyOrg;
      });

      // Triage into Registry Tiers (Table 3 Architecture)
      const levels: Record<string, Course[]> = {
        'student (Beginner)': [],
        'Mentor, Organization & Parent (Intermediate)': [],
        'Mentor, Organization & Parent (Advanced)': []
      };

      filteredCourses.forEach(c => {
          if (levels[c.level]) {
              levels[c.level].push(c);
          } else {
              const lower = c.level.toLowerCase();
              if (lower.includes('beginner')) levels['student (Beginner)'].push(c);
              else if (lower.includes('intermediate')) levels['Mentor, Organization & Parent (Intermediate)'].push(c);
              else if (lower.includes('advanced')) levels['Mentor, Organization & Parent (Advanced)'].push(c);
          }
      });
      setCoursesByLevel(levels);

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
          statusMap[les.id] = { status, score: `${correct}/${totalQ}`, timeSpent: time };
      }
      setLessonStatuses(statusMap);
      const stats = await lessonService.getStudentSummary(currentUser.id);
      setSummary(stats);
    } catch (e) {
       console.error("Hierarchy Sync Failure:", e);
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
    <div className="space-y-6 mt-4 h-full overflow-y-auto custom-scrollbar pr-3 pb-8">
        {segments.length > 0 ? segments.map((seg, idx) => (
            <div key={idx} className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group/seg">
                <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs border border-indigo-100">P{seg.order}</span>
                    <h5 className="text-[12px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5>
                </div>
                <div className="text-[13px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: seg.body }} />
            </div>
        )) : (
            <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Repository Dimension Empty</p>
            </div>
        )}
    </div>
  );

  const renderTierTable = (levelLabel: string, courses: Course[], tierIcon: React.ReactNode, tierColor: string) => {
      const isEmpty = courses.length === 0;

      return (
          <div className={`space-y-8 animate-in slide-in-from-bottom-8 duration-1000 ${isEmpty ? 'opacity-50' : ''}`}>
              <div className={`flex items-center gap-6 p-8 rounded-[3rem] border-[6px] ${tierColor} bg-white shadow-2xl relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">{tierIcon}</div>
                  <div className={`p-6 rounded-[2rem] text-white shadow-2xl relative z-10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500`} style={{ backgroundColor: tierColor.includes('indigo') ? '#4f46e5' : tierColor.includes('blue') ? '#2563eb' : '#f59e0b' }}>{tierIcon}</div>
                  <div className="relative z-10">
                      <h3 className="text-4xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">{levelLabel}</h3>
                      <p className="text-gray-400 font-black uppercase tracking-[0.5em] text-[10px] mt-3">Verified Matrix Navigation Infrastructure</p>
                  </div>
              </div>
              
              <div className="bg-white border-[12px] border-gray-50 rounded-[4rem] shadow-[0_60px_100px_-30px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col min-h-[750px]">
                  {isEmpty ? (
                      <div className="py-64 text-center flex flex-col items-center gap-6">
                         <Database size={80} className="text-gray-100 animate-pulse" />
                         <p className="text-sm font-black text-gray-300 uppercase tracking-[0.6em] animate-pulse">Waiting for Repository Deposit in this Tier...</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse min-w-[2400px]">
                            <thead>
                                <tr className="bg-royal-900 text-white text-[12px] font-black uppercase tracking-[0.4em] border-b-[12px] border-gold-500 sticky top-0 z-30 shadow-2xl">
                                    <th className="p-10 min-w-[500px] border-r border-white/10">COURSE & "ABOUT THIS COURSE"</th>
                                    <th className="p-10 min-w-[180px] text-center border-r border-white/10">NO. OF MODULES</th>
                                    <th className="p-10 min-w-[500px] border-r border-white/10">MODULE TITLE & "ABOUT THIS MODULE"</th>
                                    <th className="p-10 min-w-[180px] text-center border-r border-white/10">NO. OF LESSONS</th>
                                    <th className="p-10 min-w-[500px] border-r border-white/10">LESSON TITLE & "ABOUT THIS LESSON"</th>
                                    <th className="p-10 min-w-[540px]">LESSON MANAGEMENT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[12px] divide-gray-50">
                                {courses.map(course => {
                                    const courseModules = modulesByCourse[course.id] || [];
                                    return courseModules.map((mod) => {
                                        const modLessons = lessonsByModule[mod.id] || [];
                                        return modLessons.map((les) => (
                                            <tr key={les.id} className="group hover:bg-royal-50/10 transition-all align-top">
                                                {/* COLUMN 1: COURSE & ABOUT */}
                                                <td className="p-10 border-r border-gray-100 relative bg-white/50 group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] flex flex-col">
                                                        <div className="sticky top-0 bg-white/98 backdrop-blur-xl z-10 pb-6 mb-6 border-b-4 border-indigo-50 shrink-0">
                                                            <h3 className="text-3xl font-serif font-black text-royal-950 uppercase leading-tight tracking-tight drop-shadow-sm">{course.title}</h3>
                                                            <div className="flex items-center gap-3 mt-4">
                                                                <span className="text-[9px] font-black text-gold-600 bg-gold-50 px-4 py-1.5 rounded-full border-2 border-gold-100 uppercase tracking-widest">{course.level}</span>
                                                                {course.authorId !== 'usr_main_admin' && (
                                                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border-2 border-indigo-100 uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><ShieldCheck size={12}/> Locked Repository</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <AboutSection segments={course.about} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* COLUMN 2: NO OF MODULES */}
                                                <td className="p-10 border-r border-gray-100 text-center align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] flex flex-col justify-center items-center overflow-y-auto custom-scrollbar">
                                                        <span className="text-[180px] font-serif font-black text-gray-100 group-hover:text-indigo-600 transition-all duration-1000 transform group-hover:scale-110 leading-none">{course.totalModulesRequired}</span>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-2">Active Modules</p>
                                                    </div>
                                                </td>

                                                {/* COLUMN 3: MODULE & ABOUT */}
                                                <td className="p-10 border-r border-gray-100 relative group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] flex flex-col">
                                                        <div className="sticky top-0 bg-white/98 backdrop-blur-xl z-10 pb-6 mb-6 border-b-4 border-indigo-50 shrink-0 flex justify-between items-start gap-4">
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">MODULE ARCHITECTURE {mod.order}</p>
                                                                <h4 className="text-2xl font-serif font-black text-gray-900 uppercase leading-tight tracking-tight truncate">{mod.title}</h4>
                                                            </div>
                                                            <Tooltip content="Re-sequence the curriculum flow to match your personal study strategy. Custom versions reside in 'My List'.">
                                                                <button className="px-6 py-3 bg-royal-800 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95 shrink-0 border-b-4 border-royal-950">CUSTOMIZE THIS COURSE</button>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <AboutSection segments={mod.about} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* COLUMN 4: NO OF LESSONS */}
                                                <td className="p-10 border-r border-gray-100 text-center align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] flex flex-col justify-center items-center overflow-y-auto custom-scrollbar">
                                                        <span className="text-[180px] font-serif font-black text-gray-100 group-hover:text-indigo-600 transition-all duration-1000 transform group-hover:scale-110 leading-none">{mod.totalLessonsRequired}</span>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-2">Instructional Units</p>
                                                    </div>
                                                </td>

                                                {/* COLUMN 5: LESSON & ABOUT */}
                                                <td className="p-10 border-r border-gray-100 relative group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] flex flex-col">
                                                        <div className="sticky top-0 bg-white/98 backdrop-blur-xl z-10 pb-6 mb-6 border-b-4 border-indigo-50 shrink-0">
                                                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">LESSON UNIT {les.orderInModule}</p>
                                                            <h4 className="text-2xl font-serif font-black text-gray-900 uppercase leading-tight tracking-tight truncate drop-shadow-sm">{les.title}</h4>
                                                            <p className="text-[9px] font-black text-gray-400 mt-2 uppercase tracking-widest flex items-center gap-2"><Zap size={10} className="text-gold-500" /> ID: {les.id}</p>
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <AboutSection segments={les.about} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* COLUMN 6: LESSON MANAGEMENT */}
                                                <td className="p-10 align-middle bg-gray-50/30 group-hover:bg-white transition-colors">
                                                    <div className="h-[600px] space-y-8 flex flex-col justify-center overflow-y-auto custom-scrollbar pr-4">
                                                        <button 
                                                            onClick={() => onTakeLesson?.(les.id)}
                                                            className="w-full py-10 bg-royal-800 text-white font-black rounded-3xl shadow-2xl hover:bg-black transition-all flex flex-col items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] border-b-[10px] border-royal-950 active:scale-95 group/btn"
                                                        >
                                                            <Play size={36} fill="currentColor" className="group-hover/btn:scale-125 transition-transform duration-500" /> 
                                                            {lessonStatuses[les.id]?.status === 'STARTED' ? 'RESUME SESSION' : 'EXECUTE START'}
                                                        </button>

                                                        <div className={`w-full py-5 rounded-3xl text-[11px] font-black uppercase text-center border-[4px] tracking-[0.3em] shadow-xl ${
                                                            lessonStatuses[les.id]?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                                            lessonStatuses[les.id]?.status === 'STARTED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                                                            'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                            REGISTRY STATUS: {lessonStatuses[les.id]?.status}
                                                        </div>

                                                        <div className="p-10 bg-white rounded-[3rem] border-4 border-gray-100 space-y-6 shadow-2xl relative overflow-hidden group/audit">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover/audit:rotate-0 transition-transform duration-700"><Activity size={80}/></div>
                                                            <div className="flex items-center gap-3 relative z-10">
                                                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner border border-indigo-100"><Activity size={24} /></div>
                                                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Session Audit</span>
                                                            </div>
                                                            <div className="flex justify-between items-end relative z-10">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PRECISION SCORE</p>
                                                                    <p className="text-5xl font-black text-royal-900 leading-none tracking-tighter">{lessonStatuses[les.id]?.score}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">DURATION</p>
                                                                    <p className="text-lg font-black text-indigo-600 font-mono">{formatTime(lessonStatuses[les.id]?.timeSpent || 0)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <button className="w-full py-5 bg-white text-royal-800 border-[3px] border-royal-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-royal-50 hover:border-royal-300 transition-all flex items-center justify-center gap-3 shadow-sm">
                                                            <Download size={18} /> DOWNLOAD OFFLINE PERSPECTIVE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    });
                                })}
                            </tbody>
                        </table>
                      </div>
                  )}
                  <div className="p-6 bg-gray-50 border-t-[8px] border-indigo-50 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 ml-6">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] italic">Active Intra-Cell Matrix Protocols Synchronized</p>
                      </div>
                      <div className="flex items-center gap-3 mr-6">
                         <Layers size={14} className="text-indigo-300" />
                         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">v4.2 Persistence Engine</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-[0_80px_150px_-50px_rgba(0,0,0,0.3)] border-[12px] border-gray-50 p-6 md:p-14 min-h-[850px] animate-in fade-in duration-1000">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-[8px] border-indigo-50 pb-12 mb-20">
            <div>
              <div className="flex items-center gap-8">
                <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-2xl animate-float border-b-8 border-indigo-900">
                  <Library size={48} />
                </div>
                <div>
                  <h2 className="text-6xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">Curriculum Browser</h2>
                  <div className="flex items-center gap-3 mt-4 ml-1">
                    <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center"><CheckCircle size={10} className="text-indigo-600" /></span>
                    <p className="text-indigo-600 font-black uppercase tracking-[0.5em] text-[11px]">Independent Matrix Navigation (TABLE 3 Protocol)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5">
                <button onClick={fetchHierarchy} className="p-5 bg-gray-100 hover:bg-white rounded-[1.8rem] text-gray-400 hover:text-indigo-600 transition-all shadow-xl border-4 border-gray-200 active:scale-90 group">
                    <RefreshCcw size={28} className="group-active:rotate-180 transition-transform duration-700" />
                </button>
                <div className="flex items-center gap-5 bg-royal-900 px-12 py-6 rounded-[2.5rem] border-b-[10px] border-black text-white shadow-2xl transform hover:scale-105 transition-transform">
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><CheckCircle className="text-gold-400" size={28} /></div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-black leading-none">{Object.values(coursesByLevel).flat().length}</span>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Verified Records</span>
                    </div>
                </div>
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-64 gap-12">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-[12px] border-indigo-50 border-t-indigo-600 animate-spin"></div>
                    <Database className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={48} />
                </div>
                <div className="text-center">
                    <p className="font-black text-gray-900 uppercase tracking-[0.8em] text-[14px] animate-pulse">Synchronizing Intelligence Registry Matrix...</p>
                </div>
            </div>
         ) : (
            <div className="space-y-40 pb-20">
                {renderTierTable(
                    "STUDENTS (Beginner)", 
                    coursesByLevel['student (Beginner)'], 
                    <Star size={48} />, 
                    "border-blue-100 shadow-blue-900/10"
                )}

                {renderTierTable(
                    "MENTORS, PARENTS & ORGANIZATIONS (Intermediate)", 
                    coursesByLevel['Mentor, Organization & Parent (Intermediate)'], 
                    <Layers size={48} />, 
                    "border-indigo-100 shadow-indigo-900/10"
                )}

                {renderTierTable(
                    "MENTORS, PARENTS & ORGANIZATIONS (Advanced)", 
                    coursesByLevel['Mentor, Organization & Parent (Advanced)'], 
                    <Trophy size={48} />, 
                    "border-gold-100 shadow-gold-900/10"
                )}

                {summary && (
                    <div className="bg-royal-900 rounded-[4rem] p-12 md:p-20 shadow-[0_100px_150px_-40px_rgba(0,0,0,0.5)] border-b-[15px] border-black relative overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-64 -mt-64 blur-[120px] animate-pulse"></div>
                        <div className="relative z-10 mb-16 border-b-2 border-white/10 pb-10 flex items-center gap-6">
                            <div className="p-5 bg-gold-500 text-white rounded-[2rem] shadow-2xl border-b-8 border-gold-800"><BarChart3 size={48} /></div>
                            <div>
                                <h3 className="text-4xl md:text-5xl font-serif font-black text-white uppercase tracking-tighter">Holistic Analytics Dashboard</h3>
                                <p className="text-royal-300 text-[12px] font-black uppercase tracking-[0.6em] mt-2">Consolidated Performance Persistance Data</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-14">
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">LATEST SESSION ACCURACY</p>
                                <p className="text-6xl font-black text-white group-hover:scale-110 transition-transform origin-left drop-shadow-lg">{summary.lastLessonScore}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">LATEST SESSION TEMPO</p>
                                <p className="text-5xl font-mono font-black text-white group-hover:scale-110 transition-transform origin-left drop-shadow-lg">{formatDigitalTime(summary.lastLessonTime)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">CURRICULUM MASTERY</p>
                                <div className="flex items-baseline gap-4">
                                    <p className="text-6xl font-black text-white">{summary.modulesCompleted}</p>
                                    <p className="text-xl font-bold text-royal-400 uppercase tracking-tighter">/ {summary.totalModules}</p>
                                </div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">TOTAL STUDY COMMITMENT</p>
                                <p className="text-5xl font-mono font-black text-white group-hover:scale-110 transition-transform origin-left drop-shadow-lg">{formatDigitalTime(summary.totalTime)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">MEAN PERFORMANCE METRIC</p>
                                <p className="text-6xl font-black text-white group-hover:scale-110 transition-transform origin-left drop-shadow-lg">{summary.avgScore}%</p>
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
