import React, { useState, useEffect, useRef } from 'react';
import { User, Lesson, Module, Course, AboutSegment } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import { Play, Download, RefreshCcw, CheckCircle, Database, Star, Layers, Trophy, BarChart3, X, Info as InfoIcon, PenTool, Save, Loader2, Globe, Activity, Edit3, ChevronDown, ChevronRight, BookOpen, Target, Zap, Search, ArrowLeft } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
  isManagementMode?: boolean;
  onUpdateUser?: (user: User) => void;
  onBack?: () => void;
}

interface LessonStatusData {
    status: 'COMPLETED' | 'STARTED' | 'UNATTEMPTED';
    label: 'Not started' | 'In progress' | 'Completed';
    score: string;
    timeSpent: number;
    percent: number;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson, isManagementMode = false, onUpdateUser, onBack }) => {
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

  const [tierSelections, setTierSelections] = useState<Record<string, { courseId: string; moduleId: string; lessonId: string }>>({});
  const [openDropdown, setOpenDropdown] = useState<{ tier: string; type: 'course' | 'module' | 'lesson' } | null>(null);

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

      let providerOrder: Record<string, string[]> = currentUser.customModuleOrder || {};
      
      if (!isManagementMode && (currentUser.mentorId || currentUser.organizationId)) {
          const managerId = currentUser.mentorId || currentUser.organizationId;
          if (managerId) {
              const manager = await authService.getUserById(managerId);
              if (manager?.customModuleOrder) {
                  providerOrder = manager.customModuleOrder;
              }
          }
      }

      const filteredCourses = allCourses.filter(c => {
          if (c.authorId === 'usr_main_admin' || isSysAdmin(c.author || '')) return true;
          if (c.authorId === currentUser.id) return true;
          const isFromMyMentor = currentUser.mentorId === c.authorId;
          const isFromMyOrg = currentUser.organizationId === c.authorId || currentUser.organizationId === c.organizationId;
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
          const lvl = (c.level || '').toString();
          if (levels[lvl]) {
              levels[lvl].push(c);
          } else {
              const lower = lvl.toLowerCase();
              if (lower.includes('beginner') || lower.includes('student')) {
                  levels['student (Beginner)'].push(c);
              } else if (lower.includes('advanced')) {
                  levels['Mentor, Organization & Parent (Advanced)'].push(c);
              } else if (lower.includes('intermediate') || lower.includes('mentor') || lower.includes('parent') || lower.includes('organization')) {
                  levels['Mentor, Organization & Parent (Intermediate)'].push(c);
              } else {
                  levels['student (Beginner)'].push(c);
              }
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
          const bibleCount = (les.bibleQuizzes?.length || 0);
          const noteCount = (les.noteQuizzes?.length || 0);
          const totalQ = bibleCount + noteCount;
          const uniqueAnswered = new Set(attempts.map(a => a.quizId)).size;
          const correct = attempts.filter(a => a.isCorrect).length;
          let status: 'COMPLETED' | 'STARTED' | 'UNATTEMPTED' = 'UNATTEMPTED';
          let label: 'Not started' | 'In progress' | 'Completed' = 'Not started';
          let percent = 0;
          if (uniqueAnswered >= totalQ && totalQ > 0) {
              status = 'COMPLETED'; label = 'Completed'; percent = 100;
          } else if (uniqueAnswered > 0 || time > 0) {
              status = 'STARTED'; label = 'In progress'; percent = totalQ > 0 ? Math.round((uniqueAnswered / totalQ) * 100) : 50;
          }
          statusMap[les.id] = { status, label, score: `${correct}/${totalQ}`, timeSpent: time, percent };
      }
      setLessonStatuses(statusMap);

      const initialSelections: Record<string, any> = {};
      Object.keys(levels).forEach(tier => {
          const firstCourse = levels[tier][0];
          if (firstCourse) {
              const firstMod = modMap[firstCourse.id]?.[0];
              const firstLesson = firstMod ? lesMap[firstMod.id]?.[0] : null;
              initialSelections[tier] = { courseId: firstCourse.id, moduleId: firstMod?.id || '', lessonId: firstLesson?.id || '' };
          }
      });
      setTierSelections(initialSelections);

      const stats = await lessonService.getStudentSummary(currentUser.id);
      setSummary(stats);
    } catch (e) { console.error("Hierarchy Sync Failure:", e); } finally { setIsLoading(false); }
  };

  const handleTierSelection = (tier: string, type: 'course' | 'module' | 'lesson', id: string) => {
      setTierSelections(prev => {
          const current = { ...prev[tier] };
          if (type === 'course') {
              current.courseId = id;
              const mods = modulesByCourse[id] || [];
              current.moduleId = mods[0]?.id || '';
              const lessons = lessonsByModule[current.moduleId] || [];
              current.lessonId = lessons[0]?.id || '';
          } else if (type === 'module') {
              current.moduleId = id;
              const lessons = lessonsByModule[id] || [];
              current.lessonId = lessons[0]?.id || '';
          } else if (type === 'lesson') {
              current.lessonId = id;
          }
          return { ...prev, [tier]: current };
      });
      setOpenDropdown(null);
  };

  const getModuleStatusLabel = (moduleId: string) => {
      const lessons = lessonsByModule[moduleId] || [];
      if (lessons.length === 0) return 'Not started';
      const stats = lessons.map(l => lessonStatuses[l.id]);
      if (stats.every(s => s?.status === 'COMPLETED')) return 'Completed';
      if (stats.some(s => s?.status !== 'UNATTEMPTED')) return 'In progress';
      return 'Not started';
  };

  const getModuleProgress = (moduleId: string) => {
      const lessons = lessonsByModule[moduleId] || [];
      if (lessons.length === 0) return 0;
      const completed = lessons.filter(l => lessonStatuses[l.id]?.status === 'COMPLETED').length;
      return Math.round((completed / lessons.length) * 100);
  };

  const getCourseStatusLabel = (courseId: string) => {
      const modules = modulesByCourse[courseId] || [];
      const moduleLabels = modules.map(m => getModuleStatusLabel(m.id));
      if (moduleLabels.every(l => l === 'Completed')) return 'Completed';
      if (moduleLabels.some(l => l !== 'Not started')) return 'In progress';
      return 'Not started';
  };

  const handleUpdateOrder = async (courseId: string, moduleId: string, newVal: number) => {
    if (!onUpdateUser) return;
    const courseModules = [...(modulesByCourse[courseId] || [])];
    const targetIdx = courseModules.findIndex(m => m.id === moduleId);
    if (targetIdx === -1) return;
    const [movedItem] = courseModules.splice(targetIdx, 1);
    const destinationIdx = Math.max(0, Math.min(newVal - 1, courseModules.length));
    courseModules.splice(destinationIdx, 0, movedItem);
    const newOrderedIds = courseModules.map(m => m.id);
    try {
        const updatedUser = await authService.saveCustomModuleOrder(currentUser.id, courseId, newOrderedIds);
        onUpdateUser(updatedUser);
        setEditingModuleId(null);
    } catch (e) { console.error("Failed to save custom order:", e); }
  };

  const handleOpenInsights = async (lesson: Lesson) => {
      const savedNote = await lessonService.getUserLessonNote(currentUser.id, lesson.id);
      setInsightModal({ isOpen: true, lessonId: lesson.id, lessonTitle: lesson.title, text: savedNote });
  };

  const handleSaveInsight = async () => {
      setIsSavingInsight(true);
      await lessonService.saveUserLessonNote(currentUser.id, insightModal.lessonId, insightModal.text);
      setTimeout(() => {
          setIsSavingInsight(false);
          setInsightModal({ ...insightModal, isOpen: false });
      }, 600);
  };

  const StatusBadge = ({ label }: { label: string }) => {
      const color = label === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                    label === 'In progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                    'bg-gray-50 text-gray-500 border-gray-200';
      return <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm whitespace-nowrap ${color}`}>{label}</span>;
  };

  const ProgressBar = ({ percent }: { percent: number }) => (
      <div className="w-full mt-2">
          <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Mastery Velocity</span>
              <span className="text-[12px] font-black text-indigo-600">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full border-2 border-gray-200 overflow-hidden p-0.5">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${percent}%` }} />
          </div>
      </div>
  );

  const renderTierTable = (levelLabel: string, courses: Course[], tierIcon: React.ReactNode, tierColor: string) => {
      const isEmpty = courses.length === 0;
      const selection = tierSelections[levelLabel];
      const activeCourse = courses.find(c => c.id === selection?.courseId) || courses[0];
      const activeModules = modulesByCourse[activeCourse?.id] || [];
      const activeModule = activeModules.find(m => m.id === selection?.moduleId) || activeModules[0];
      const activeLessons = lessonsByModule[activeModule?.id] || [];
      const activeLesson = activeLessons.find(l => l.id === selection?.lessonId) || activeLessons[0];
      const moduleStatus = activeModule ? getModuleStatusLabel(activeModule.id) : 'Not started';
      const moduleProgress = activeModule ? getModuleProgress(activeModule.id) : 0;
      const courseStatus = activeCourse ? getCourseStatusLabel(activeCourse.id) : 'Not started';
      const lessonStat = activeLesson ? lessonStatuses[activeLesson.id] : null;

      return (
          <div className={`space-y-6 animate-in slide-in-from-bottom-8 duration-1000 ${isEmpty ? 'opacity-50' : ''}`}>
              <div className={`flex items-center gap-4 p-5 rounded-[2rem] border-[4px] ${tierColor} bg-white shadow-xl relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">{tierIcon}</div>
                  <div className={`p-4 rounded-2xl text-white shadow-xl relative z-10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500`} style={{ backgroundColor: tierColor.includes('indigo') ? '#4f46e5' : tierColor.includes('blue') ? '#2563eb' : '#f59e0b' }}>{tierIcon}</div>
                  <div className="relative z-10"><h3 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">{levelLabel}</h3><p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[8px] mt-2">Verified Matrix Navigation</p></div>
              </div>
              
              <div className="bg-white border-4 border-gray-300 rounded-[2.5rem] shadow-xl overflow-visible flex flex-col min-h-[375px]">
                  {isEmpty ? (
                      <div className="py-24 text-center flex flex-col items-center gap-4"><Database size={60} className="text-gray-100 animate-pulse" /><p className="text-xs font-black text-gray-300 uppercase tracking-[0.5em] animate-pulse">Waiting for Deposit...</p></div>
                  ) : (
                      <div className="overflow-x-auto custom-scrollbar flex-1 border-collapse relative overflow-y-visible">
                        <table className="w-full text-left border-collapse min-w-[1800px]">
                            <thead>
                                <tr className="bg-royal-900 text-white text-[13px] font-black uppercase tracking-[0.4em] sticky top-0 z-50 shadow-xl border-b-4 border-gold-500">
                                    <th className="py-5 px-6 border-2 border-white/20 min-w-[400px]">COURSE IDENTITY</th>
                                    <th className="py-5 px-6 border-2 border-white/20 min-w-[500px]">MODULE STRUCTURE</th>
                                    <th className="py-5 px-6 border-2 border-white/20 min-w-[150px] text-center">ORDER</th>
                                    <th className="py-5 px-6 border-2 border-white/20 min-w-[600px] text-center">CURRICULUM CONTROLS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                <tr className="group transition-all align-top bg-white h-[375px]">
                                    <td className="p-6 border-2 border-gray-300 bg-white relative overflow-visible">
                                        <div className="flex flex-col gap-6">
                                            {activeCourse ? (
                                                <>
                                                    <div className="relative z-[60]">
                                                        <button 
                                                            onClick={() => setOpenDropdown(openDropdown?.type === 'course' && openDropdown.tier === levelLabel ? null : { tier: levelLabel, type: 'course' })}
                                                            className="w-full py-4 bg-royal-800 hover:bg-black text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all border-b-8 border-black flex items-center justify-center gap-3 shadow-lg"
                                                        >
                                                            <Globe size={18} /> BROWSE COURSES <ChevronDown size={16} className={openDropdown?.type === 'course' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                                        </button>
                                                        {openDropdown?.tier === levelLabel && openDropdown?.type === 'course' && (
                                                            <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-royal-900 z-[70] p-4 animate-in slide-in-from-top-3 overflow-y-auto max-h-[450px] custom-scrollbar">
                                                                {courses.map(c => (
                                                                    <button key={c.id} onClick={() => handleTierSelection(levelLabel, 'course', c.id)} className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2 ${selection?.courseId === c.id ? 'bg-royal-900 text-white shadow-xl scale-[1.02]' : 'hover:bg-royal-50 text-gray-700'}`}>{c.title}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                                        <h3 className="text-2xl font-serif font-black text-royal-950 uppercase leading-tight mb-3">{activeCourse.title}</h3>
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            <StatusBadge label={courseStatus} />
                                                            <span className="text-[10px] font-black text-gold-600 bg-gold-50 px-3 py-1.5 rounded-full border-2 border-gold-100 uppercase">{activeCourse.level}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setAboutModal({ isOpen: true, title: activeCourse.title, segments: activeCourse.about })} className="w-full py-3 bg-gray-50 hover:bg-royal-100 text-royal-800 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all border-2 border-royal-200">Review Course Details</button>
                                                </>
                                            ) : <div className="p-10 text-center opacity-20"><Database size={40}/></div>}
                                        </div>
                                    </td>

                                    <td className="p-6 border-2 border-gray-300 bg-white relative overflow-visible">
                                        <div className="flex flex-col h-full gap-6">
                                            {activeModule ? (
                                                <>
                                                    <div className="relative z-[60]">
                                                        <button 
                                                            onClick={() => setOpenDropdown(openDropdown?.type === 'module' && openDropdown.tier === levelLabel ? null : { tier: levelLabel, type: 'module' })}
                                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] transition-all border-b-8 border-indigo-950 flex items-center justify-center gap-3 shadow-lg"
                                                        >
                                                            <Layers size={18} /> BROWSE MODULES <ChevronDown size={16} />
                                                        </button>
                                                        {openDropdown?.tier === levelLabel && openDropdown?.type === 'module' && (
                                                            <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-indigo-600 z-[70] p-4 animate-in slide-in-from-top-3 overflow-y-auto max-h-[450px] custom-scrollbar">
                                                                {activeModules.map(m => (
                                                                    <button key={m.id} onClick={() => handleTierSelection(levelLabel, 'module', m.id)} className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2 ${selection?.moduleId === m.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'hover:bg-indigo-50 text-gray-700'}`}>{m.title}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border-2 border-indigo-100 shadow-sm"><Layers size={24} /></div>
                                                                <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">MODULE STRUCTURE</p><h4 className="text-xl font-serif font-black text-gray-900 uppercase">{activeModule.title}</h4></div>
                                                            </div>
                                                            <StatusBadge label={moduleStatus} />
                                                        </div>
                                                        <ProgressBar percent={moduleProgress} />
                                                    </div>
                                                    <div className="relative mt-auto z-[55]">
                                                        <button 
                                                            onClick={() => setOpenDropdown(openDropdown?.type === 'lesson' && openDropdown.tier === levelLabel ? null : { tier: levelLabel, type: 'lesson' })}
                                                            className="w-full py-3.5 bg-white text-indigo-600 border-4 border-indigo-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                                                        >
                                                            <BookOpen size={18} /> EXPAND UNITS <ChevronDown size={16} />
                                                        </button>
                                                        {openDropdown?.tier === levelLabel && openDropdown?.type === 'lesson' && (
                                                            <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] border-4 border-indigo-200 z-[70] p-4 animate-in slide-in-from-top-3 overflow-y-auto max-h-[500px] custom-scrollbar">
                                                                {activeLessons.map(l => (
                                                                    <button key={l.id} onClick={() => handleTierSelection(levelLabel, 'lesson', l.id)} className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2 ${selection?.lessonId === l.id ? 'bg-indigo-50 text-indigo-800 font-black' : 'hover:bg-gray-50 text-gray-600'}`}>{l.title}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : <div className="p-10 text-center opacity-10"><Layers size={40}/></div>}
                                        </div>
                                    </td>

                                    <td className="p-6 border-2 border-gray-300 text-center align-middle bg-gray-50/30">
                                        <div className="flex flex-col justify-center items-center gap-3">
                                            {activeModule && (
                                                editingModuleId === activeModule.id ? (
                                                    <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
                                                        <input autoFocus type="number" className="w-20 p-2 text-center font-black text-2xl border-4 border-indigo-500 rounded-xl outline-none" value={newOrderValue} onChange={(e) => setNewOrderValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateOrder(activeCourse.id, activeModule.id, parseInt(newOrderValue)); if (e.key === 'Escape') setEditingModuleId(null); }} />
                                                        <div className="flex gap-1"><button onClick={() => handleUpdateOrder(activeCourse.id, activeModule.id, parseInt(newOrderValue))} className="p-1 bg-green-500 text-white rounded shadow hover:bg-green-600"><CheckCircle size={16}/></button><button onClick={() => setEditingModuleId(null)} className="p-1 bg-red-50 text-white rounded shadow hover:bg-red-600"><X size={16}/></button></div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-5xl font-serif font-black text-royal-900 leading-none">{activeModules.indexOf(activeModule) + 1}</span>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Registry Rank</p>
                                                        {isManagementMode && (
                                                            <button onClick={() => { setEditingModuleId(activeModule.id); setNewOrderValue((activeModules.indexOf(activeModule) + 1).toString()); }} className="mt-2 p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1 text-[8px] font-black uppercase"><Edit3 size={12} /> Edit Seq</button>
                                                        )}
                                                    </>
                                                )
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-6 border-2 border-gray-300 align-middle bg-gray-50/50">
                                        {activeLesson ? (
                                            <div className="flex flex-col gap-6 animate-in fade-in">
                                                <div className="bg-white p-6 rounded-[2.5rem] border-4 border-indigo-100 shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg border-4 ${lessonStat?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : lessonStat?.status === 'STARTED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-300 border-gray-200'}`}>
                                                            {activeLessons.indexOf(activeLesson) + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">SELECTED COMPONENT</p>
                                                            <h4 className="text-xl font-black text-gray-950 leading-tight truncate max-w-[250px]">{activeLesson.title}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <StatusBadge label={lessonStat?.label || 'Not started'} />
                                                        {lessonStat?.percent! > 0 && <span className="text-[10px] font-black text-indigo-400 uppercase mt-2">{lessonStat?.percent}% Mastery</span>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <button 
                                                        onClick={() => onTakeLesson?.(activeLesson.id)}
                                                        className="py-5 bg-royal-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-[0.3em] border-b-8 border-black active:scale-95 transform hover:-translate-y-1"
                                                    >
                                                        <Play size={22} className="fill-gold-400 text-gold-400" /> START/RESUME LESSON
                                                    </button>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button onClick={() => setAboutModal({ isOpen: true, title: activeLesson.title, segments: activeLesson.about })} className="py-4 bg-white text-indigo-700 border-4 border-indigo-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                                            <InfoIcon size={16} /> Details
                                                        </button>
                                                        <button onClick={() => handleOpenInsights(activeLesson)} className="py-4 bg-white text-emerald-700 border-4 border-emerald-50 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                                            <PenTool size={16} /> Insight
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 opacity-30 italic font-black text-xs uppercase tracking-widest">Select a Lesson to Access Controls</div>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-[0_80px_150px_-50px_rgba(0,0,0,0.3)] border-[12px] border-gray-50 p-6 md:p-14 min-h-[850px] animate-in fade-in duration-1000 overflow-visible">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-[8px] border-indigo-50 pb-12 mb-20">
            <div className="flex items-center gap-6">
              {onBack && (
                <button onClick={onBack} className="p-5 bg-gray-100 hover:bg-white rounded-[1.8rem] text-gray-400 hover:text-indigo-600 transition-all shadow-xl border-4 border-gray-200 active:scale-90 group">
                    <ArrowLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              <div className="flex items-center gap-8">
                <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-2xl animate-float border-b-8 border-indigo-900"><Layers size={48} /></div>
                <div><h2 className="text-4xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">Curriculum Browser</h2><div className="flex items-center gap-3 mt-4 ml-1"><span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center"><CheckCircle size={10} className="text-indigo-600" /></span><p className="text-indigo-600 font-black uppercase tracking-[0.5em] text-[11px]">{isManagementMode ? "Registry Management Protocol" : "Independent Matrix Navigation"} (TABLE 3 Protocol)</p></div></div>
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
                        <textarea value={insightModal.text} onChange={(e) => setInsightModal({ ...insightModal, text: e.target.value })} className="flex-1 w-full bg-white border-4 border-indigo-50 rounded-[2.5rem] p-10 outline-none font-bold text-gray-800 text-xl resize-none shadow-inner custom-scrollbar" placeholder="Your spiritual reflections for this lesson..."/>
                        <button onClick={handleSaveInsight} disabled={isSavingInsight} className="mt-8 py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] shadow-2xl border-b-8 border-indigo-950 active:scale-95">
                            {isSavingInsight ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} {isSavingInsight ? 'ARCHIVING...' : 'Update Insight Registry'}
                        </button>
                    </div>
                </div>
            </div>
         )}
    </div>
  );
};

export default StudentPanel;