import React, { useState, useEffect } from 'react';
import { User, Lesson, Module, Course, AboutSegment } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import { Play, Download, RefreshCcw, CheckCircle, Database, Star, Layers, Trophy, BarChart3, X, Info as InfoIcon, PenTool, Save, Loader2, Globe, Activity, Edit3 } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
  // New props for Edit Capability in "My List" mode
  isManagementMode?: boolean;
  onUpdateUser?: (user: User) => void;
}

interface LessonStatusData {
    status: 'COMPLETED' | 'STARTED' | 'UNATTEMPTED';
    score: string;
    timeSpent: number;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson, isManagementMode = false, onUpdateUser }) => {
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
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newOrderValue, setNewOrderValue] = useState<string>("");

  // Modal States
  const [aboutModal, setAboutModal] = useState<{ isOpen: boolean; title: string; segments: AboutSegment[] }>({
      isOpen: false,
      title: '',
      segments: []
  });

  const [insightModal, setInsightModal] = useState<{ isOpen: boolean; lessonId: string; lessonTitle: string; text: string }>({
      isOpen: false,
      lessonId: '',
      lessonTitle: '',
      text: ''
  });
  const [isSavingInsight, setIsSavingInsight] = useState(false);

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

      const isSysAdmin = (email: string) => email === 'peadetng@gmail.com';

      // 1. Identify "Provider" for custom orders
      let providerOrder: Record<string, string[]> = currentUser.customModuleOrder || {};
      
      // If student, check mentor then org for custom order overrides
      if (!isManagementMode && (currentUser.mentorId || currentUser.organizationId)) {
          const managerId = currentUser.mentorId || currentUser.organizationId;
          if (managerId) {
              const manager = await authService.getUserById(managerId);
              if (manager?.customModuleOrder) {
                  providerOrder = manager.customModuleOrder;
              }
          }
      }

      // FIX: Ensure global courses or courses by current user are visible
      const filteredCourses = allCourses.filter(c => {
          if (c.authorId === 'usr_main_admin' || isSysAdmin(c.author || '')) return true;
          if (c.authorId === currentUser.id) return true;
          const isFromMyMentor = currentUser.mentorId === c.authorId;
          const isFromMyOrg = currentUser.organizationId === c.authorId || currentUser.organizationId === c.organizationId;
          
          // Also check if any lesson in any module of this course is for 'All'
          const courseModules = allModules.filter(m => m.courseId === c.id);
          const hasGlobalContent = courseModules.some(m => {
              const moduleLessons = allLessons.filter(l => l.moduleId === m.id);
              return moduleLessons.some(l => l.targetAudience === 'All');
          });

          return isFromMyMentor || isFromMyOrg || hasGlobalContent;
      });

      const levels: Record<string, Course[]> = {
        'student (Beginner)': [],
        'Mentor, Organization & Parent (Intermediate)': [],
        'Mentor, Organization & Parent (Advanced)': []
      };

      filteredCourses.forEach(c => {
          if (levels[c.level]) {
              levels[c.level].push(c);
          } else {
              const lower = (c.level || '').toLowerCase();
              if (lower.includes('beginner')) levels['student (Beginner)'].push(c);
              else if (lower.includes('intermediate')) levels['Mentor, Organization & Parent (Intermediate)'].push(c);
              else if (lower.includes('advanced')) levels['Mentor, Organization & Parent (Advanced)'].push(c);
              else levels['student (Beginner)'].push(c); // Default
          }
      });
      setCoursesByLevel(levels);

      const modMap: Record<string, Module[]> = {};
      for (const course of filteredCourses) {
          const customOrder = providerOrder[course.id];
          const sortedModules = await lessonService.getModulesByCourseId(course.id, customOrder);
          modMap[course.id] = sortedModules;
      }
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

  const handleUpdateOrder = async (courseId: string, moduleId: string, newVal: number) => {
    if (!onUpdateUser) return;
    
    const courseModules = [...(modulesByCourse[courseId] || [])];
    const targetIdx = courseModules.findIndex(m => m.id === moduleId);
    if (targetIdx === -1) return;

    // Remove item and re-insert at new position
    const [movedItem] = courseModules.splice(targetIdx, 1);
    const destinationIdx = Math.max(0, Math.min(newVal - 1, courseModules.length));
    courseModules.splice(destinationIdx, 0, movedItem);

    // Get the new array of IDs
    const newOrderedIds = courseModules.map(m => m.id);
    
    try {
        const updatedUser = await authService.saveCustomModuleOrder(currentUser.id, courseId, newOrderedIds);
        onUpdateUser(updatedUser);
        setEditingModuleId(null);
        // fetchHierarchy will trigger due to currentUser dependency
    } catch (e) {
        console.error("Failed to save custom order:", e);
    }
  };

  const handleOpenInsights = async (lesson: Lesson) => {
      const savedNote = await lessonService.getUserLessonNote(currentUser.id, lesson.id);
      setInsightModal({
          isOpen: true,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          text: savedNote
      });
  };

  const handleSaveInsight = async () => {
      setIsSavingInsight(true);
      await lessonService.saveUserLessonNote(currentUser.id, insightModal.lessonId, insightModal.text);
      setTimeout(() => {
          setIsSavingInsight(false);
          setInsightModal({ ...insightModal, isOpen: false });
      }, 600);
  };

  const renderTierTable = (levelLabel: string, courses: Course[], tierIcon: React.ReactNode, tierColor: string) => {
      const isEmpty = courses.length === 0;

      return (
          <div className={`space-y-6 animate-in slide-in-from-bottom-8 duration-1000 ${isEmpty ? 'opacity-50' : ''}`}>
              <div className={`flex items-center gap-4 p-5 rounded-[2rem] border-[4px] ${tierColor} bg-white shadow-xl relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">{tierIcon}</div>
                  <div className={`p-4 rounded-2xl text-white shadow-xl relative z-10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500`} style={{ backgroundColor: tierColor.includes('indigo') ? '#4f46e5' : tierColor.includes('blue') ? '#2563eb' : '#f59e0b' }}>{tierIcon}</div>
                  <div className="relative z-10">
                      <h3 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">{levelLabel}</h3>
                      <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[8px] mt-2">Verified Matrix Navigation</p>
                  </div>
              </div>

              {!isEmpty && isManagementMode && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl shadow-sm animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-200 text-amber-800 rounded-xl"><InfoIcon size={20} /></div>
                    <p className="text-royal-900 font-black uppercase text-[10px] md:text-xs tracking-wider leading-tight">
                      Registry Management: Change the Module Order numbers to rearrange your curriculum sequence. Linked members will inherit this structure automatically.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-white border-4 border-gray-300 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[440px]">
                  {isEmpty ? (
                      <div className="py-32 text-center flex flex-col items-center gap-4">
                         <Database size={60} className="text-gray-100 animate-pulse" />
                         <p className="text-xs font-black text-gray-300 uppercase tracking-[0.5em] animate-pulse">Waiting for Deposit...</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto custom-scrollbar flex-1 border-collapse">
                        <table className="w-full text-left border-collapse min-w-[2500px]">
                            <thead>
                                <tr className="bg-royal-900 text-white text-[13px] font-black uppercase tracking-[0.4em] sticky top-0 z-30 shadow-xl border-b-4 border-gold-500">
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[400px]">ABOUT COURSE</th>
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[150px] text-center">MODULE ORDER</th>
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[400px]">ABOUT MODULE</th>
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[150px] text-center">LESSON ORDER</th>
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[400px]">ABOUT LESSON</th>
                                    <th className="py-5 px-4 border-2 border-white/20 min-w-[600px] text-center">LESSON MANAGEMENT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                {courses.map(course => {
                                    const courseModules = modulesByCourse[course.id] || [];
                                    return courseModules.map((mod, modIndex) => {
                                        const modLessons = lessonsByModule[mod.id] || [];
                                        return modLessons.map((les, lesIndex) => (
                                            <tr key={les.id} className="group hover:bg-royal-50/10 transition-all align-top">
                                                <td className="p-3 border-2 border-gray-300 bg-white">
                                                    <div className="h-[140px] flex flex-col justify-between">
                                                        <div className="shrink-0">
                                                            <h3 className="text-xl font-serif font-black text-royal-950 uppercase leading-tight truncate">{course.title}</h3>
                                                            <span className="text-[11px] font-black text-gold-600 bg-gold-50 px-3 py-1 rounded-full border border-gold-100 uppercase mt-2 inline-block">{course.level}</span>
                                                        </div>
                                                        <button onClick={() => setAboutModal({ isOpen: true, title: course.title, segments: course.about })} className="w-full py-3 bg-royal-100 hover:bg-royal-200 text-royal-800 font-black rounded-xl text-[14px] uppercase tracking-widest transition-all mt-4 border border-royal-200">READ MORE</button>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-2 border-gray-300 text-center align-middle bg-gray-50/50">
                                                    <div className="h-[140px] flex flex-col justify-center items-center gap-3">
                                                        {editingModuleId === mod.id && lesIndex === 0 ? (
                                                            <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
                                                                <input 
                                                                    autoFocus
                                                                    type="number"
                                                                    className="w-20 p-2 text-center font-black text-2xl border-4 border-indigo-500 rounded-xl outline-none"
                                                                    value={newOrderValue}
                                                                    onChange={(e) => setNewOrderValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleUpdateOrder(course.id, mod.id, parseInt(newOrderValue));
                                                                        if (e.key === 'Escape') setEditingModuleId(null);
                                                                    }}
                                                                />
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => handleUpdateOrder(course.id, mod.id, parseInt(newOrderValue))} className="p-1 bg-green-500 text-white rounded shadow hover:bg-green-600"><CheckCircle size={16}/></button>
                                                                    <button onClick={() => setEditingModuleId(null)} className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"><X size={16}/></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="text-3xl font-serif font-black text-royal-900 leading-none">Module {modIndex + 1}</span>
                                                                <p className="text-[7px] font-black text-gray-300 uppercase mt-2">Sequential Unit</p>
                                                                {isManagementMode && lesIndex === 0 && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingModuleId(mod.id);
                                                                            setNewOrderValue((modIndex + 1).toString());
                                                                        }}
                                                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1 text-[8px] font-black uppercase"
                                                                    >
                                                                        <Edit3 size={12} /> Edit Order
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 border-2 border-gray-300 bg-white">
                                                    <div className="h-[140px] flex flex-col justify-between">
                                                        <div className="shrink-0">
                                                            <p className="text-[12px] font-black text-indigo-400 uppercase leading-none mb-2">M-{modIndex + 1}</p>
                                                            <h4 className="text-lg font-serif font-black text-gray-900 uppercase truncate">{mod.title}</h4>
                                                        </div>
                                                        <button onClick={() => setAboutModal({ isOpen: true, title: mod.title, segments: mod.about })} className="w-full py-3 bg-royal-100 hover:bg-royal-200 text-royal-800 font-black rounded-xl text-[14px] uppercase tracking-widest transition-all mt-4 border border-royal-200">READ MORE</button>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-2 border-gray-300 text-center align-middle bg-gray-50/50">
                                                    <div className="h-[140px] flex flex-col justify-center items-center">
                                                        <span className="text-3xl font-serif font-black text-royal-900 leading-none">Lesson {lesIndex + 1}</span>
                                                        <p className="text-[7px] font-black text-gray-300 uppercase mt-2">Current Position</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-2 border-gray-300 bg-white">
                                                    <div className="h-[140px] flex flex-col justify-between">
                                                        <div className="shrink-0">
                                                            <p className="text-[12px] font-black text-indigo-400 uppercase leading-none mb-2">L-{lesIndex + 1}</p>
                                                            <h4 className="text-lg font-serif font-black text-gray-900 uppercase truncate">{les.title}</h4>
                                                        </div>
                                                        <button onClick={() => setAboutModal({ isOpen: true, title: les.title, segments: les.about })} className="w-full py-3 bg-royal-100 hover:bg-royal-200 text-royal-800 font-black rounded-xl text-[14px] uppercase tracking-widest transition-all mt-4 border border-royal-200">READ MORE</button>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-2 border-gray-300 align-middle bg-gray-50/50 text-center">
                                                    <div className="h-[140px] flex flex-col justify-center gap-3 max-w-[500px] mx-auto">
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <button onClick={() => onTakeLesson?.(les.id)} className="py-3.5 bg-royal-800 text-white font-black rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-[10px] md:text-xs tracking-widest border-b-[4px] border-royal-950 active:scale-95 group/btn">
                                                                <Play size={14} fill="currentColor" /> take/resume lesson.
                                                            </button>
                                                            <div className={`py-3.5 px-1 rounded-xl text-[10px] md:text-xs font-black uppercase text-center border-[3px] tracking-tighter shadow-md truncate flex items-center justify-center ${lessonStatuses[les.id]?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : lessonStatuses[les.id]?.status === 'STARTED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                                {lessonStatuses[les.id]?.status}
                                                            </div>
                                                            <button onClick={() => handleOpenInsights(les)} className="py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 uppercase text-[10px] md:text-xs tracking-widest border-b-[4px] border-indigo-950 active:scale-95">
                                                                <PenTool size={14} /> MY INSIGHTS
                                                            </button>
                                                            <button className="py-3.5 bg-white text-royal-800 border-[3px] border-royal-200 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-royal-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                                                <Download size={14} /> OFFLINE STUDY
                                                            </button>
                                                            <div className="bg-white rounded-xl border-[3px] border-gray-200 px-2 py-1 flex items-center justify-between shadow-inner col-span-2">
                                                                <div className="text-left"><p className="text-[7px] font-black text-gray-400 uppercase leading-none">SCORE</p><p className="text-sm font-black text-royal-900 leading-none">{lessonStatuses[les.id]?.score}</p></div>
                                                                <div className="text-right"><p className="text-[7px] font-black text-gray-400 uppercase leading-none">TIME</p><p className="text-sm font-black text-indigo-600 leading-none">{formatDigitalTime(lessonStatuses[les.id]?.timeSpent || 0)}</p></div>
                                                            </div>
                                                        </div>
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
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-[0_80px_150px_-50px_rgba(0,0,0,0.3)] border-[12px] border-gray-50 p-6 md:p-14 min-h-[850px] animate-in fade-in duration-1000">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-[8px] border-indigo-50 pb-12 mb-20">
            <div>
              <div className="flex items-center gap-8">
                <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-2xl animate-float border-b-8 border-indigo-900"><Layers size={48} /></div>
                <div><h2 className="text-6xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">Curriculum Browser</h2><div className="flex items-center gap-3 mt-4 ml-1"><span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center"><CheckCircle size={10} className="text-indigo-600" /></span><p className="text-indigo-600 font-black uppercase tracking-[0.5em] text-[11px]">{isManagementMode ? "Registry Management Protocol" : "Independent Matrix Navigation"} (TABLE 3 Protocol)</p></div></div>
              </div>
            </div>
            <div className="flex items-center gap-5">
                <button onClick={fetchHierarchy} className="p-5 bg-gray-100 hover:bg-white rounded-[1.8rem] text-gray-400 hover:text-indigo-600 transition-all shadow-xl border-4 border-gray-200 active:scale-90 group"><RefreshCcw size={28} className="group-active:rotate-180 transition-transform duration-700" /></button>
                <div className="flex items-center gap-5 bg-royal-900 px-12 py-6 rounded-[2.5rem] border-b-[10px] border-black text-white shadow-2xl transform hover:scale-105 transition-transform"><div className="p-3 bg-white/10 rounded-2xl border border-white/20"><CheckCircle className="text-gold-400" size={28} /></div><div className="flex flex-col"><span className="text-3xl font-black leading-none">{Object.values(coursesByLevel).flat().length}</span><span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Verified Records</span></div></div>
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-64 gap-12"><div className="relative"><div className="w-32 h-32 rounded-full border-[12px] border-indigo-50 border-t-indigo-600 animate-spin"></div><Database className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={48} /></div><div className="text-center"><p className="font-black text-gray-900 uppercase tracking-[0.8em] text-[14px] animate-pulse">Synchronizing Intelligence Registry Matrix...</p></div></div>
         ) : (
            <div className="space-y-40 pb-20">
                {renderTierTable("STUDENTS (Beginner)", coursesByLevel['student (Beginner)'], <Star size={48} />, "border-blue-100 shadow-blue-900/10")}
                {renderTierTable("MENTORS, PARENTS & ORGANIZATIONS (Intermediate)", coursesByLevel['Mentor, Organization & Parent (Intermediate)'], <Layers size={48} />, "border-indigo-100 shadow-indigo-900/10")}
                {renderTierTable("MENTORS, PARENTS & ORGANIZATIONS (Advanced)", coursesByLevel['Mentor, Organization & Parent (Advanced)'], <Trophy size={48} />, "border-gold-100 shadow-gold-900/10")}
                
                {summary && (
                    <div className="bg-royal-900 rounded-[4rem] p-12 md:p-20 shadow-[0_100px_150px_-40px_rgba(0,0,0,0.5)] border-b-[15px] border-black relative overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-64 -mt-64 blur-[120px] animate-pulse"></div>
                        <div className="relative z-10 mb-16 border-b-2 border-white/10 pb-10 flex items-center gap-6"><div className="p-5 bg-gold-500 text-white rounded-[2rem] shadow-2xl border-b-8 border-gold-800"><BarChart3 size={48} /></div><div><h3 className="text-4xl md:text-5xl font-serif font-black text-white uppercase tracking-tighter">Holistic Analytics Dashboard</h3><p className="text-royal-300 text-[12px] font-black uppercase tracking-[0.6em] mt-2">Consolidated Performance Persistance Data</p></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-14">
                            {[ 
                                { label: 'LATEST SESSION ACCURACY', val: summary.lastLessonScore },
                                { label: 'LATEST SESSION TEMPO', val: formatDigitalTime(summary.lastLessonTime), mono: true },
                                { label: 'CURRICULUM MASTERY', val: `${summary.modulesCompleted} / ${summary.totalModules}` },
                                { label: 'TOTAL STUDY COMMITMENT', val: formatDigitalTime(summary.totalTime), mono: true },
                                { label: 'MEAN PERFORMANCE METRIC', val: `${summary.avgScore}%` }
                            ].map((s, idx) => (
                                <div key={idx} className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all group shadow-2xl">
                                    <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[3rem]">{s.label}</p>
                                    <p className={`${s.mono ? 'text-5xl font-mono' : 'text-6xl'} font-black text-white group-hover:scale-110 transition-transform origin-left drop-shadow-lg`}>{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
         )}

         {/* Modals */}
         {aboutModal.isOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border-8 border-royal-900">
                    <div className="bg-royal-900 p-8 text-white flex justify-between items-center shrink-0"><h3 className="text-2xl font-serif font-black uppercase tracking-tight">{aboutModal.title}</h3><button onClick={() => setAboutModal({ ...aboutModal, isOpen: false })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div>
                    <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 custom-scrollbar">
                        <div className="space-y-6 mt-4 h-full pr-3 pb-8">
                            {aboutModal.segments.length > 0 ? aboutModal.segments.map((seg, idx) => (
                                <div key={idx} className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group/seg">
                                    <div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs border border-indigo-100">P{seg.order}</span><h5 className="text-[12px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5></div>
                                    <div className="text-[13px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: seg.body }} />
                                </div>
                            )) : <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Empty Perspectives</p></div>}
                        </div>
                    </div>
                </div>
            </div>
         )}

         {insightModal.isOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border-8 border-indigo-600">
                    <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4"><PenTool className="text-white" size={32}/><h3 className="text-2xl font-serif font-black uppercase tracking-tight">Personal Insight: {insightModal.lessonTitle}</h3></div>
                        <button onClick={() => setInsightModal({ ...insightModal, isOpen: false })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="flex-1 p-10 bg-gray-50/30 flex flex-col">
                        <textarea 
                            value={insightModal.text}
                            onChange={(e) => setInsightModal({ ...insightModal, text: e.target.value })}
                            className="flex-1 w-full bg-white border-4 border-indigo-50 rounded-[2.5rem] p-10 outline-none font-bold text-gray-800 text-xl resize-none shadow-inner custom-scrollbar"
                            placeholder="Your spiritual reflections for this lesson..."
                        />
                        <button onClick={handleSaveInsight} disabled={isSavingInsight} className="mt-8 py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] shadow-2xl border-b-8 border-indigo-950 active:scale-95">
                            {isSavingInsight ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} {isSavingInsight ? 'Archiving...' : 'Update Insight Registry'}
                        </button>
                    </div>
                </div>
            </div>
         )}
    </div>
  );
};

export default StudentPanel;