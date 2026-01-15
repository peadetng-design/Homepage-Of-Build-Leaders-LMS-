
import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, Module, Course, AboutSegment, ImportError, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem, QuizQuestion, QuizOption, LeadershipNote, ProficiencyLevel } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, CheckCircle, HelpCircle, ArrowRight, AlertTriangle, Layers, BadgeCheck, PenTool, Check, Info, Library, Layout, ListChecks, Download, AlertCircle, ArrowLeft, Sparkles, FileText, Fingerprint, UserCircle, AlignLeft, ChevronDown, ListPlus, Send, Target, FileQuestion, GraduationCap, Trophy, Book } from 'lucide-react';

// Fix: Moved HeaderActions helper to top of file
const HeaderActions = ({ onEdit, onDelete }: { onEdit?: () => void, onDelete: () => void }) => (
    <div className="flex gap-2 shrink-0">
        {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 hover:bg-black/10 rounded-xl text-royal-200 hover:text-white transition-all">
                <Edit3 size={20} />
            </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-500/20 rounded-xl text-royal-300 hover:text-red-400 transition-all">
            <Trash2 size={20} />
        </button>
    </div>
);

// Fix: Moved AboutSegmentBuilder helper to top of file
const AboutSegmentBuilder = ({ segments, type, onAdd, onUpdate, onRemove, min, theme = 'light' }: { segments: AboutSegment[], type: string, onAdd: () => void, onUpdate: (i:number, u:Partial<AboutSegment>) => void, onRemove: (i:number) => void, min: number, theme?: 'light' | 'dark' }) => {
    const isDark = theme === 'dark';
    return (
        <div className={`${isDark ? 'bg-indigo-900/50 border-white/5' : 'bg-white border-gray-50'} p-12 rounded-[4rem] border-8 shadow-sm space-y-10 relative`}>
            <div className={`flex justify-between items-center border-b-4 ${isDark ? 'border-white/5' : 'border-gray-50'} pb-8`}>
                <div>
                    <h3 className={`text-2xl font-serif font-black ${isDark ? 'text-white' : 'text-gray-950'} uppercase flex items-center gap-4 leading-none`}>
                        <Sparkles size={32} className="text-gold-500" /> "ABOUT THIS {type.toUpperCase()}" SEGMENTS ({segments.length})
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-4 ${segments.length < min ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                        {segments.length < min ? `Registry Requirement: At least ${min} segment(s)` : 'Registry Protocol Verified'}
                    </p>
                </div>
                <button onClick={onAdd} className={`px-8 py-3.5 ${isDark ? 'bg-white/10 text-white border-white/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100'} font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 border-b-4 shadow-sm`}>
                    <Plus size={20}/> New Segment
                </button>
            </div>
            <div className="space-y-8 max-h-[400px] overflow-y-scroll custom-scrollbar pr-4">
                {segments.map((seg, idx) => (
                    <div key={idx} className={`${isDark ? 'bg-indigo-950/80 border-white/5' : 'bg-gray-50 border-gray-100'} p-10 rounded-[3rem] border-4 flex items-start gap-8 group animate-in slide-in-from-right-8 relative`}>
                        <span className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl shrink-0 border-b-4 border-indigo-800">{idx + 1}</span>
                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <input className={`w-full ${isDark ? 'bg-transparent text-white placeholder:text-white/20' : 'bg-white text-gray-950 placeholder:text-gray-200'} p-3 border-none focus:outline-none font-black uppercase tracking-tighter text-xl`} value={seg.title} onChange={e => onUpdate(idx, {title: e.target.value})} placeholder="Segment Title" />
                                <div className="flex gap-2">
                                    <button className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-royal-200' : 'hover:bg-black/5 text-gray-400'}`}><Edit3 size={18}/></button>
                                    <button onClick={() => onRemove(idx)} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/20 text-royal-300' : 'hover:bg-red-50 text-red-400'}`}><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <textarea className={`w-full ${isDark ? 'bg-white/5 text-white placeholder:text-white/20' : 'bg-white text-gray-700 placeholder:text-gray-200'} p-6 border-2 border-transparent rounded-2xl focus:border-indigo-400 outline-none font-medium leading-relaxed min-h-[180px] text-lg`} value={seg.body} onChange={e => onUpdate(idx, {body: e.target.value})} placeholder="Detailed Segment Body..." />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson | Resource | NewsItem;
  initialContentType?: 'lesson' | 'resource' | 'news' | 'homepage';
}

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData, initialContentType = 'lesson' }) => {
  const [metricMode, setMetricMode] = useState<'manual' | 'bulk'>('bulk');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'course' | 'modules' | 'lessons'>('course');

  const [finishedCourses, setFinishedCourses] = useState<Partial<Course>[]>([]);
  const [finishedModules, setFinishedModules] = useState<Partial<Module>[]>([]);
  const [finishedLessons, setFinishedLessons] = useState<Partial<Lesson>[]>([]);

  const [manualCourse, setManualCourse] = useState<Partial<Course>>({ id: '', title: '', subtitle: '', description: '', level: 'student (Beginner)', language: 'English (US)', author: currentUser.name, totalModulesRequired: 1, about: [] });
  const [manualModule, setManualModule] = useState<Partial<Module>>({ id: '', title: '', subtitle: '', description: '', level: 'student (Beginner)', language: 'English (US)', totalLessonsRequired: 1, about: [], completionRule: { minimumCompletionPercentage: 100 }, certificateConfig: { title: 'Certificate of Achievement', description: 'Certified Excellence', templateId: 'classic', issuedBy: currentUser.name } });
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({ id: '', title: '', book: '', chapter: 1, lesson_type: 'Mixed', targetAudience: 'All', sections: [], about: [], bibleQuizzes: [], noteQuizzes: [], leadershipNotes: [] });

  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [activeSubEditor, setActiveSubEditor] = useState<'BIBLE_QUIZ' | 'NOTE' | 'NOTE_QUIZ' | null>(null);
  const [localQuizzes, setLocalQuizzes] = useState<Partial<QuizQuestion>[]>([]);
  const [localNotes, setLocalNotes] = useState<Partial<LeadershipNote>[]>([]);
  const [activeManualStep, setActiveManualStep] = useState<1 | 2>(1);

  const validateCourseAndProceed = (isFinal: boolean) => {
    if (!manualCourse.id || !manualCourse.title) { setError("Course ID and Title are mandatory."); return; }
    if (manualCourse.about?.length === 0) { setError("At least one 'About' segment is required for the course."); return; }
    setError(null);
    if (!isFinal) {
        setFinishedCourses(p => [...p, manualCourse]);
        setManualCourse({ id: '', title: '', subtitle: '', description: '', level: 'student (Beginner)', language: 'English (US)', author: currentUser.name, totalModulesRequired: 1, about: [] });
    } else {
        setActiveManualStep(2);
    }
  };

  const handleSaveAndExitModule = (isFinal: boolean) => {
    if (!manualModule.id || !manualModule.title) { setError("Module ID and Title are mandatory."); return; }
    if (finishedLessons.length < manualModule.totalLessonsRequired!) {
        setError(`Limit Alert: This module requires ${manualModule.totalLessonsRequired} lessons. You have ${finishedLessons.length}.`);
        return;
    }
    const currentModWithLessons = { ...manualModule, lessonIds: finishedLessons.map(l => l.id!) };
    setFinishedModules(p => [...p, currentModWithLessons]);
    setFinishedLessons([]);
    setManualModule({ id: '', title: '', subtitle: '', description: '', totalLessonsRequired: 1, about: [], completionRule: { minimumCompletionPercentage: 100 }, certificateConfig: { title: 'Certificate of Achievement', description: 'Certified Excellence', templateId: 'classic', issuedBy: currentUser.name } });
    if (isFinal) { setError(null); } else {
        if (finishedModules.length + 1 >= manualCourse.totalModulesRequired!) { setError(`Registry Notification: You have reached the limit of ${manualCourse.totalModulesRequired} modules for this course.`); } else { setError(null); }
    }
  };

  const handleStartAddLesson = () => {
    if (!manualModule.id) { setError("Module ID must be defined before adding units."); return; }
    if (finishedLessons.length >= (manualModule.totalLessonsRequired || 0)) { setError(`Registry Alert: Module limit reached (${manualModule.totalLessonsRequired} units).`); return; }
    setError(null);
    setIsAddingLesson(true);
    setCurrentLesson({ id: `LES-${Math.random().toString(36).substring(7).toUpperCase()}`, title: '', book: '', chapter: 1, lesson_type: 'Mixed', targetAudience: 'All', about: [], bibleQuizzes: [], noteQuizzes: [], leadershipNotes: [] });
  };

  const saveLessonIteratively = (isFinal: boolean) => {
    if (!currentLesson.title) { setError("Lesson Title is mandatory."); return; }
    if (!currentLesson.id) { setError("Lesson ID is mandatory."); return; }
    if ((currentLesson.about?.length || 0) < 1) { setError("At least 1 'About' segment is required."); return; }
    const preparedLesson = { ...currentLesson, moduleId: manualModule.id, orderInModule: finishedLessons.length + 1 };
    setFinishedLessons(prev => [...prev, preparedLesson]);
    if (isFinal) { setIsAddingLesson(false); } else {
        if (finishedLessons.length + 1 >= (manualModule.totalLessonsRequired || 0)) { setError(`Registry Alert: Capacity met. Finalize this lesson or save the module.`); setIsAddingLesson(false); } else {
            setCurrentLesson({ id: `LES-${Math.random().toString(36).substring(7).toUpperCase()}`, title: '', book: '', chapter: 1, lesson_type: 'Mixed', targetAudience: 'All', about: [], bibleQuizzes: [], noteQuizzes: [], leadershipNotes: [] });
        }
    }
    setError(null);
  };

  const finalizeManualBuild = async () => {
    try {
        let finalModules = [...finishedModules];
        if (manualModule.id && finishedLessons.length > 0) { finalModules.push({ ...manualModule, lessonIds: finishedLessons.map(l => l.id!) }); }
        if (manualCourse.id) await lessonService.publishCourse({ ...manualCourse } as Course);
        for (const c of finishedCourses) await lessonService.publishCourse(c as Course);
        for (const m of finalModules) { await lessonService.publishModule({ ...m, courseId: manualCourse.id } as Module); }
        for (const l of finishedLessons) { await lessonService.publishLesson({ ...l, author: currentUser.name, authorId: currentUser.id, status: 'published', views: 0 } as Lesson); }
        onSuccess();
    } catch (e: any) { setError(e.message); }
  };

  const openSubEditor = (type: 'BIBLE_QUIZ' | 'NOTE' | 'NOTE_QUIZ') => {
      setActiveSubEditor(type);
      if (type === 'BIBLE_QUIZ') { setLocalQuizzes(currentLesson.bibleQuizzes || []); if ((currentLesson.bibleQuizzes?.length || 0) === 0) addNewLocalQuiz('Bible Quiz'); } else if (type === 'NOTE_QUIZ') { setLocalQuizzes(currentLesson.noteQuizzes || []); if ((currentLesson.noteQuizzes?.length || 0) === 0) addNewLocalQuiz('Note Quiz'); } else { setLocalNotes(currentLesson.leadershipNotes || []); if ((currentLesson.leadershipNotes?.length || 0) === 0) addNewLocalNote(); }
  };

  const addNewLocalQuiz = (type: 'Bible Quiz' | 'Note Quiz') => { setLocalQuizzes(p => [...p, { id: crypto.randomUUID(), type, text: '', referenceText: '', sequence: p.length + 1, options: [ { id: 'a', label: 'A', text: '', isCorrect: true, explanation: '' }, { id: 'b', label: 'B', text: '', isCorrect: false, explanation: '' }, { id: 'c', label: 'C', text: '', isCorrect: false, explanation: '' }, { id: 'd', label: 'D', text: '', isCorrect: false, explanation: '' } ] }]); };
  const addNewLocalNote = () => setLocalNotes(p => [...p, { id: crypto.randomUUID(), title: '', body: '' }]);
  const deleteLocalQuiz = (idx: number) => setLocalQuizzes(p => p.filter((_, i) => i !== idx));
  const deleteLocalNote = (idx: number) => setLocalNotes(p => p.filter((_, i) => i !== idx));

  const commitSubEditor = () => { if (activeSubEditor === 'BIBLE_QUIZ') setCurrentLesson(prev => ({ ...prev, bibleQuizzes: localQuizzes as QuizQuestion[] })); else if (activeSubEditor === 'NOTE_QUIZ') setCurrentLesson(prev => ({ ...prev, noteQuizzes: localQuizzes as QuizQuestion[] })); else if (activeSubEditor === 'NOTE') setCurrentLesson(prev => ({ ...prev, leadershipNotes: localNotes as LeadershipNote[] })); setActiveSubEditor(null); };

  const addAboutSegment = (type: 'course' | 'module' | 'lesson') => {
      const seg: AboutSegment = { order: 0, title: 'New Segment', body: '' };
      if (type === 'course') setManualCourse(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'lesson') setCurrentLesson(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
  };

  const updateAboutSegment = (type: 'course' | 'module' | 'lesson', idx: number, upd: Partial<AboutSegment>) => {
      if (type === 'course') setManualCourse(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
      if (type === 'lesson') setCurrentLesson(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
  };

  const removeAboutSegment = (type: 'course' | 'module' | 'lesson', idx: number) => {
      if (type === 'course') setManualCourse(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'lesson') setCurrentLesson(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
  };

  const inputClass = "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300";
  const darkInputClass = "w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-bold outline-none focus:border-gold-500 transition-all placeholder:text-white/20";
  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1";
  const darkLabelClass = "text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 block ml-1";

  const processBulkFile = async () => { if (!file) return; setIsParsing(true); setError(null); try { const res = await lessonService.parseExcelUpload(file); setDraft(res); if (res.errors.length > 0) setError(`Protocol violations identified in registry mapping.`); } catch (e: any) { setError(e.message); } finally { setIsParsing(false); } };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-[3rem] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.5)] w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border-4 border-white/20">
            <div className="bg-royal-900 p-8 text-white relative shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md shadow-2xl border border-white/10 text-gold-500"><Library size={40} /></div>
                        <div><h2 className="text-3xl font-serif font-black uppercase tracking-tight leading-none">Curriculum Registry</h2><p className="text-royal-200 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Registry Persistence: 8-Sheet Verification Protocol</p></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-royal-950 p-1.5 rounded-2xl flex border border-white/10">
                            <button onClick={() => { setMetricMode('bulk'); setDraft(null); setError(null); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${metricMode === 'bulk' ? 'bg-white text-royal-900 shadow-xl' : 'text-royal-300 hover:text-white'}`}>Excel Import</button>
                            <button onClick={() => { setMetricMode('manual'); setDraft(null); setError(null); setFinishedLessons([]); setIsAddingLesson(false); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${metricMode === 'manual' ? 'bg-white text-royal-900 shadow-xl' : 'text-royal-300 hover:text-white'}`}>Manual Builder</button>
                        </div>
                        <button onClick={onCancel} className="p-4 bg-white/10 hover:bg-white/20 rounded-full ml-4 transition-colors"><X size={24}/></button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#fdfdfd]">
                {error && (
                    <div className="bg-red-50 border-4 border-red-100 p-8 rounded-[2.5rem] mb-12 flex items-start gap-6 shadow-xl animate-in slide-in-from-top-4">
                        <AlertCircle className="shrink-0 text-red-600" size={48} />
                        <div className="flex-1"><h4 className="text-red-900 font-black text-xl uppercase mb-2">Protocol Violation</h4><p className="text-red-700 font-bold leading-relaxed">{error}</p></div>
                    </div>
                )}
                {metricMode === 'bulk' ? (
                    <div className="max-w-6xl mx-auto space-y-12">
                        {!draft ? (
                            <div className="space-y-8 animate-in fade-in text-center">
                                <div className="border-8 border-dashed border-gray-100 rounded-[4rem] p-32 hover:bg-gray-50/50 hover:border-indigo-200 transition-all cursor-pointer relative group">
                                    <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className="flex flex-col items-center gap-8 group-hover:scale-110 transition-transform duration-500">
                                        <div className="p-10 bg-indigo-50 text-indigo-600 rounded-[2.5rem] shadow-inner"><FileIcon size={80}/></div>
                                        <div><p className="text-3xl font-serif font-black text-gray-800 uppercase tracking-tighter">{file ? file.name : "DEPOSIT 8-SHEET WORKBOOK"}</p><p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs mt-4">Required: COURSE, ABOUT_COURSE, MODULE, ABOUT_MODULE, LESSON, ABOUT_LESSON, QUIZ_BLOCK, QUIZ_QUESTION</p></div>
                                    </div>
                                </div>
                                {file && (
                                    <button onClick={processBulkFile} disabled={isParsing} className="w-full py-7 bg-royal-950 text-white font-black rounded-[2.5rem] shadow-2xl border-b-8 border-black hover:bg-black transition-all flex items-center justify-center gap-8 text-3xl group transform active:scale-95">{isParsing ? <Loader2 className="animate-spin" size={40}/> : <CheckCircle size={40} className="text-gold-500" />} {isParsing ? "Analyzing Mappings..." : "EXECUTE SYSTEM ANALYSIS"}</button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-12 animate-in fade-in duration-700">
                                <div className="flex justify-between items-end border-b-8 border-gray-50 pb-10">
                                    <div><h3 className="text-5xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">Mapping Preview</h3><p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs mt-4">Verified registry mapping. Fix errors inline before commit.</p></div>
                                    <div className="flex gap-4 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                                        <button onClick={() => setPreviewTab('course')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${previewTab === 'course' ? 'bg-white text-royal-900 shadow-md' : 'text-gray-400'}`}>Course</button>
                                        <button onClick={() => setPreviewTab('modules')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${previewTab === 'modules' ? 'bg-white text-royal-900 shadow-md' : 'text-gray-400'}`}>Modules</button>
                                        <button onClick={() => setPreviewTab('lessons')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${previewTab === 'lessons' ? 'bg-white text-royal-900 shadow-md' : 'text-gray-400'}`}>Lessons</button>
                                    </div>
                                </div>
                                <div className="bg-white border-8 border-gray-50 p-12 rounded-[4rem] shadow-2xl space-y-10">
                                    {previewTab === 'course' && (
                                        <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-right-4">
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Course ID</label><input className={inputClass} value={draft.courseMetadata?.id} onChange={e => setDraft({...draft, courseMetadata: {...draft.courseMetadata!, id: e.target.value}})} /></div>
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Author</label><input className={inputClass} value={draft.courseMetadata?.author} onChange={e => setDraft({...draft, courseMetadata: {...draft.courseMetadata!, author: e.target.value}})} /></div>
                                            <div className="col-span-2"><label className={labelClass}>Title</label><input className={inputClass} value={draft.courseMetadata?.title} onChange={e => setDraft({...draft, courseMetadata: {...draft.courseMetadata!, title: e.target.value}})} /></div>
                                            <div className="col-span-2"><label className={labelClass}>Description</label><textarea className={`${inputClass} min-h-[100px]`} value={draft.courseMetadata?.description} onChange={e => setDraft({...draft, courseMetadata: {...draft.courseMetadata!, description: e.target.value}})} /></div>
                                        </div>
                                    )}
                                    {previewTab === 'modules' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4">
                                            {draft.modules.map((m, idx) => (
                                                <div key={idx} className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-100 flex gap-6 items-center">
                                                    <span className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black">{idx + 1}</span>
                                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                                        <div className="col-span-1"><label className={labelClass}>Module ID</label><input className={inputClass} value={m.id} onChange={e => { const modules = [...draft.modules]; modules[idx].id = e.target.value; setDraft({...draft, modules}); }} /></div>
                                                        <div className="col-span-1"><label className={labelClass}>Title</label><input className={inputClass} value={m.title} onChange={e => { const modules = [...draft.modules]; modules[idx].title = e.target.value; setDraft({...draft, modules}); }} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {previewTab === 'lessons' && (
                                        <div className="space-y-6 animate-in slide-in-from-right-4">
                                            {draft.lessons.map((l, idx) => (
                                                <div key={idx} className="p-6 bg-gray-50 rounded-3xl border-2 border-gray-100 flex gap-6 items-center">
                                                    <span className="w-12 h-12 bg-royal-900 text-white rounded-2xl flex items-center justify-center font-black">{idx + 1}</span>
                                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                                        <div className="col-span-1"><label className={labelClass}>Lesson Title</label><input className={inputClass} value={l.title} onChange={e => { const lessons = [...draft.lessons]; lessons[idx].title = e.target.value; setDraft({...draft, lessons}); }} /></div>
                                                        <div className="col-span-1"><label className={labelClass}>Parent Module ID</label><input className={inputClass} value={l.moduleId} onChange={e => { const lessons = [...draft.lessons]; lessons[idx].moduleId = e.target.value; setDraft({...draft, lessons}); }} /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => lessonService.commitDraft(draft, currentUser).then(onSuccess)} disabled={!draft.isValid} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl border-b-8 border-indigo-900 hover:bg-indigo-700 transition-all uppercase tracking-[0.5em] text-xl disabled:opacity-50">VERIFIED COMMIT TO REGISTRY</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in">
                        <div className="flex justify-center mb-16"><div className="flex items-center gap-8 bg-gray-50 p-3 rounded-[2.5rem] border-4 border-gray-100 shadow-inner">{[1,2].map(step => (<button key={step} onClick={() => setActiveManualStep(step as any)} className={`flex items-center gap-4 px-10 py-3.5 rounded-[1.8rem] transition-all duration-500 ${activeManualStep === step ? 'bg-indigo-600 text-white shadow-2xl scale-110' : 'text-gray-400 hover:bg-gray-100'}`}><span className="font-black text-2xl">{step}</span><span className="text-xs font-black uppercase tracking-widest">{step === 1 ? 'Course Creation' : 'Module Creation'}</span></button>))}</div></div>
                        
                        {/* Fix: Wrapped sibling components in React Fragments */}
                        {activeManualStep === 1 && (
                            <>
                                <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                                    <div className="bg-white p-12 rounded-[4rem] border-8 border-gray-50 shadow-sm space-y-10">
                                        <div className="flex justify-between items-center border-b-4 border-gray-50 pb-6">
                                            <div className="flex items-center gap-4"><Library className="text-indigo-600" size={32} /><h3 className="text-3xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">COURSE CREATION PANEL</h3></div>
                                            <div className="flex gap-2"><button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><Edit3 size={24}/></button><button onClick={() => setManualCourse({ id: '', title: '', description: '', totalModulesRequired: 1, author: currentUser.name, about: [] })} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"><Trash2 size={24}/></button></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Course ID</label><input className={inputClass} value={manualCourse.id} onChange={e => setManualCourse({...manualCourse, id: e.target.value.toUpperCase().replace(/\s/g, '-')})} placeholder="e.g. BIBLE-LEAD-101" /></div>
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Author</label><input className={inputClass} value={manualCourse.author} onChange={e => setManualCourse({...manualCourse, author: e.target.value})} placeholder="e.g. Kingdom Institute" /></div>
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Master Title</label><input className={inputClass} value={manualCourse.title} onChange={e => setManualCourse({...manualCourse, title: e.target.value})} placeholder="e.g. Biblical Leadership Foundations" /></div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className={labelClass}>Course Level</label>
                                                <select value={manualCourse.level} onChange={e => setManualCourse({...manualCourse, level: e.target.value as ProficiencyLevel})} className={inputClass}>
                                                    <option value="student (Beginner)">student (Beginner)</option>
                                                    <option value="Mentor, Organization & Parent (Intermediate)">mentor, parent/organization (Intermediate)</option>
                                                    <option value="Mentor, Organization & Parent (Advanced)">mentor/parent/organization (Advanced)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Number of Modules</label><input type="number" className={inputClass} value={manualCourse.totalModulesRequired} onChange={e => setManualCourse({...manualCourse, totalModulesRequired: parseInt(e.target.value)})} /></div>
                                            <div className="col-span-2"><label className={labelClass}>Summary</label><textarea className={`${inputClass} min-h-[120px]`} value={manualCourse.description} onChange={e => setManualCourse({...manualCourse, description: e.target.value})} /></div>
                                        </div>
                                    </div>
                                </div>
                                <AboutSegmentBuilder segments={manualCourse.about || []} type="course" onAdd={() => addAboutSegment('course')} onUpdate={(idx, upd) => updateAboutSegment('course', idx, upd)} onRemove={(idx) => removeAboutSegment('course', idx)} min={1} />
                                <div className="flex justify-center gap-6 pt-10">
                                    <button onClick={() => validateCourseAndProceed(false)} className="px-12 py-7 bg-white text-indigo-600 font-black rounded-[2.5rem] shadow-xl border-4 border-indigo-50 uppercase tracking-[0.3em] text-sm hover:bg-gray-50 transition-all flex items-center gap-4"><Plus size={24}/> ADD NEW COURSE</button>
                                    <button onClick={() => validateCourseAndProceed(true)} className="px-24 py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl border-b-8 border-indigo-950 uppercase tracking-[0.5em] text-lg hover:bg-indigo-700 transition-all flex items-center gap-6 transform hover:-translate-y-1">SAVE & EXIT COURSE <ArrowRight size={32}/></button>
                                </div>
                            </>
                        )}
                        
                        {/* Fix: Wrapped sibling components in React Fragments */}
                        {activeManualStep === 2 && (
                            <>
                                <div className="space-y-12 animate-in slide-in-from-right-8 duration-700 pb-32">
                                    <div className="bg-white p-12 rounded-[4rem] border-8 border-gray-50 shadow-sm space-y-10">
                                        <div className="flex justify-between items-center border-b-4 border-gray-50 pb-6"><div className="flex items-center gap-4"><Layers className="text-indigo-600" size={32} /><h3 className="text-3xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">MODULE CREATION PANEL</h3></div><div className="flex gap-2"><button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><Edit3 size={24}/></button><button onClick={() => setManualModule({ id: '', title: '', description: '', totalLessonsRequired: 1, about: [], completionRule: { minimumCompletionPercentage: 100 }, certificateConfig: { title: 'Certificate of Achievement', description: 'Certified Excellence', templateId: 'classic', issuedBy: currentUser.name } })} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"><Trash2 size={24}/></button></div></div>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Module ID</label><input className={inputClass} value={manualModule.id} onChange={e => setManualModule({...manualModule, id: e.target.value.toUpperCase().replace(/\s/g, '-')})} placeholder="e.g. GENESIS-MOD-1" /></div>
                                            <div className="col-span-2 md:col-span-1"><label className={labelClass}>Units Required</label><input type="number" className={inputClass} value={manualModule.totalLessonsRequired} onChange={e => setManualModule({...manualModule, totalLessonsRequired: parseInt(e.target.value)})} /></div>
                                            <div className="col-span-2"><label className={labelClass}>Module Title</label><input className={inputClass} value={manualModule.title} onChange={e => setManualModule({...manualModule, title: e.target.value})} placeholder="e.g. Creation & Dominion" /></div>
                                            <div className="col-span-2"><label className={labelClass}>Architecture Summary</label><textarea className={`${inputClass} min-h-[100px]`} value={manualModule.description} onChange={e => setManualModule({...manualModule, description: e.target.value})} /></div>
                                        </div>
                                    </div>
                                    <AboutSegmentBuilder segments={manualModule.about || []} type="module" onAdd={() => addAboutSegment('module')} onUpdate={(idx, upd) => updateAboutSegment('module', idx, upd)} onRemove={(idx) => removeAboutSegment('module', idx)} min={1} />
                                    <div className="bg-white p-12 rounded-[4rem] border-8 border-indigo-50 shadow-2xl space-y-10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] flex items-center justify-center text-indigo-200"><Target size={64}/></div>
                                        <div className="flex justify-between items-center border-b-4 border-gray-50 pb-6"><div className="flex items-center gap-4"><BookOpen className="text-indigo-600" size={32} /><h3 className="text-3xl font-serif font-black text-gray-950 uppercase tracking-tighter leading-none">MANUAL LESSON BUILDER PANEL</h3></div><div className="flex gap-2"><button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><Edit3 size={24}/></button><button onClick={() => setFinishedLessons([])} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"><Trash2 size={24}/></button></div></div>
                                        <div className="space-y-6">
                                            {finishedLessons.map((l, idx) => (
                                                <div key={idx} className="p-6 bg-emerald-50 rounded-3xl border-4 border-emerald-100 flex justify-between items-center animate-in slide-in-from-left-4">
                                                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg"><Check size={24}/></div><div><h4 className="font-black text-emerald-900 uppercase text-lg">{l.title}</h4><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Registry ID: {l.id} • {l.about?.length} Perspectives</p></div></div>
                                                    <HeaderActions onDelete={() => setFinishedLessons(prev => prev.filter((_, i) => i !== idx))} onEdit={() => { setCurrentLesson(l); setIsAddingLesson(true); setFinishedLessons(p => p.filter((_, i) => i !== idx)); }} />
                                                </div>
                                            ))}
                                            {!isAddingLesson ? (
                                                <div className="pt-6">
                                                    {finishedLessons.length < (manualModule.totalLessonsRequired || 0) ? (
                                                        <button onClick={handleStartAddLesson} className="group w-full max-w-sm mx-auto py-6 border-4 border-dashed border-indigo-100 rounded-3xl text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2"><Plus size={32} className="group-hover:scale-110 transition-transform"/><span className="font-black uppercase tracking-[0.2em] text-xs">START CREATING LESSON ({finishedLessons.length} / {manualModule.totalLessonsRequired})</span></button>
                                                    ) : (
                                                        <div className="bg-gold-50 border-4 border-gold-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between shadow-lg animate-in fade-in duration-500 opacity-100 scale-100 border-b-[8px] border-gold-300">
                                                            <div className="flex items-center gap-6 mb-4 md:mb-0"><div className="p-4 bg-gold-500 text-white rounded-[1.5rem] shadow-xl"><BadgeCheck size={32}/></div><div><h4 className="text-gold-900 font-black text-xl uppercase leading-none">Registry Capacity Fulfilled</h4><p className="text-gold-600 font-bold mt-1 uppercase text-xs tracking-widest">All {manualModule.totalLessonsRequired} units have been archived.</p></div></div>
                                                            <div className="flex gap-4"><button onClick={() => handleSaveAndExitModule(false)} className="px-8 py-5 bg-white text-royal-950 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-xl border-4 border-royal-50 uppercase text-[10px] tracking-[0.2em] flex items-center gap-3"><Plus size={20}/> CREATE NEW MODULE</button><button onClick={() => handleSaveAndExitModule(true)} className="px-12 py-5 bg-royal-950 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl border-b-4 border-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3"><Save size={20}/> SAVE & EXIT MODULE</button></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-indigo-950 p-10 rounded-[3rem] shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 border-b-[10px] border-black">
                                                    <div className="flex justify-between items-start border-b border-white/10 pb-6 gap-4">
                                                        <div className="flex items-center gap-3"><PenTool className="text-gold-500" size={28}/><h4 className="text-white font-black text-2xl uppercase tracking-tighter">MANUAL LESSON BUILDER</h4></div>
                                                        <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                                                            <button onClick={() => openSubEditor('BIBLE_QUIZ')} className="px-4 py-2 bg-royal-800 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-royal-700 transition-all flex items-center gap-2 border-b-4 border-royal-950 shadow-lg"><Plus size={14}/> Add Bible Quiz</button>
                                                            <button onClick={() => openSubEditor('NOTE')} className="px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 border-b-4 border-emerald-900 shadow-lg"><Plus size={14}/> Add Note</button>
                                                            <button onClick={() => openSubEditor('NOTE_QUIZ')} className="px-4 py-2 bg-amber-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 border-b-4 border-amber-900 shadow-lg"><Plus size={14}/> Add Note Quiz</button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-2 bg-white/5 text-royal-200 rounded-xl hover:bg-white/10 transition-all"><Edit3 size={20}/></button>
                                                            <button onClick={() => setCurrentLesson({ id: '', title: '', book: '', chapter: 1, lesson_type: 'Mixed', targetAudience: 'All', about: [], bibleQuizzes: [], noteQuizzes: [], leadershipNotes: [] })} className="p-2 bg-white/5 text-royal-300 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={20}/></button>
                                                            <button onClick={() => setIsAddingLesson(false)} className="text-white/40 hover:text-white transition-colors ml-2"><X size={24}/></button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="col-span-2 md:col-span-1"><label className={darkLabelClass}>Lesson ID (Registry Key)</label><input className={darkInputClass} value={currentLesson.id} onChange={e => setCurrentLesson({...currentLesson, id: e.target.value.toUpperCase()})} placeholder="e.g. GEN-CH1-L1" /></div>
                                                        <div className="col-span-2 md:col-span-1"><label className={labelClass}>Lesson Title</label><input className={darkInputClass} value={currentLesson.title} onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})} placeholder="e.g. Creation: Order from Chaos" /></div>
                                                        <div className="col-span-2 md:col-span-1"><label className={darkLabelClass}>Bible Book</label><input className={darkInputClass} value={currentLesson.book} onChange={e => setCurrentLesson({...currentLesson, book: e.target.value})} placeholder="e.g. Genesis" /></div>
                                                        <div className="col-span-2 md:col-span-1"><label className={darkLabelClass}>Chapter</label><input type="number" className={darkInputClass} value={currentLesson.chapter} onChange={e => setCurrentLesson({...currentLesson, chapter: parseInt(e.target.value)})} /></div>
                                                    </div>
                                                    {( (currentLesson.bibleQuizzes?.length ?? 0) > 0 || (currentLesson.noteQuizzes?.length ?? 0) > 0 || (currentLesson.leadershipNotes?.length ?? 0) > 0 ) && (
                                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                                            <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Instructional Components Audit</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                                {currentLesson.leadershipNotes?.map((n, i) => (
                                                                    <div key={n.id} className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 flex items-center justify-between text-emerald-100 group">
                                                                        <div className="flex items-center gap-3"><FileText size={20}/><span className="text-xs font-black truncate">{n.title} (ESSAY)</span></div>
                                                                        <HeaderActions onDelete={() => setCurrentLesson(p => ({...p, leadershipNotes: p.leadershipNotes?.filter((_, idx) => idx !== i)}))} onEdit={() => openSubEditor('NOTE')} />
                                                                    </div>
                                                                ))}
                                                                {currentLesson.bibleQuizzes?.map((q, i) => (
                                                                    <div key={q.id} className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 flex items-center justify-between text-indigo-100">
                                                                        <div className="flex items-center gap-3"><Book size={20}/><span className="text-xs font-black truncate">{q.text} (BIBLE)</span></div>
                                                                        <HeaderActions onDelete={() => setCurrentLesson(p => ({...p, bibleQuizzes: p.bibleQuizzes?.filter((_, idx) => idx !== i)}))} onEdit={() => openSubEditor('BIBLE_QUIZ')} />
                                                                    </div>
                                                                ))}
                                                                {currentLesson.noteQuizzes?.map((q, i) => (
                                                                    <div key={q.id} className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/20 flex items-center justify-between text-amber-100">
                                                                        <div className="flex items-center gap-3"><PenTool size={20}/><span className="text-xs font-black truncate">{q.text} (CONTEXT)</span></div>
                                                                        <HeaderActions onDelete={() => setCurrentLesson(p => ({...p, noteQuizzes: p.noteQuizzes?.filter((_, idx) => idx !== i)}))} onEdit={() => openSubEditor('NOTE_QUIZ')} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <AboutSegmentBuilder segments={currentLesson.about || []} type="lesson" theme="dark" onAdd={() => addAboutSegment('lesson')} onUpdate={(idx, upd) => updateAboutSegment('lesson', idx, upd)} onRemove={(idx) => removeAboutSegment('lesson', idx)} min={1} />
                                                    <div className="flex justify-center gap-6 pt-6 border-t border-white/10">
                                                        <button onClick={() => saveLessonIteratively(false)} className="px-12 py-6 bg-white/10 text-white font-black rounded-3xl shadow-xl hover:bg-white/20 transition-all uppercase tracking-[0.3em] text-[10px] flex items-center gap-3 border-2 border-white/5"><Plus size={20}/> ADD NEW LESSON</button>
                                                        <button onClick={() => saveLessonIteratively(true)} className="px-20 py-6 bg-gold-500 text-white font-black rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] border-b-8 border-gold-800 uppercase tracking-[0.4em] text-[10px] hover:bg-gold-600 transition-all flex items-center gap-4 active:scale-95"><Save size={24}/> SAVE & EXIT LESSON</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="flex justify-center gap-6"><button onClick={() => setActiveManualStep(1)} className="px-12 py-6 bg-white text-gray-500 font-black rounded-3xl shadow-2xl border-4 border-gray-50 uppercase tracking-[0.3em] text-sm hover:bg-gray-50 transition-all flex items-center gap-4"><ArrowLeft size={24}/> BACK TO COURSE IDENTITY</button>{(finishedLessons.length > 0 || finishedModules.length > 0) && (<button onClick={finalizeManualBuild} className="px-24 py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(79,70,229,0.5)] border-b-8 border-indigo-950 uppercase tracking-[0.5em] text-lg hover:bg-indigo-700 transition-all flex items-center gap-6 active:scale-95 transform hover:-translate-y-1">COMMIT ENTIRE REGISTRY <Send size={32}/></button>)}</div>
                    </div>
                )}
            </div>
        </div>
        {activeSubEditor && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-indigo-950 rounded-[3.5rem] shadow-[0_50px_150px_-30px_rgba(0,0,0,1)] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border-4 border-white/10 border-b-[12px] border-black">
                    <div className="p-10 border-b border-white/10 flex justify-between items-center bg-royal-950/50">
                        <div className="flex items-center gap-4"><h3 className="text-3xl font-serif font-black text-white uppercase tracking-tighter flex items-center gap-4">{activeSubEditor === 'BIBLE_QUIZ' ? <Book className="text-gold-500" size={32}/> : activeSubEditor === 'NOTE' ? <FileText className="text-emerald-500" size={32}/> : <PenTool className="text-amber-500" size={32}/>}{activeSubEditor.replace('_', ' ')} EDITOR</h3><span className="px-4 py-1.5 bg-white/10 rounded-full text-indigo-300 font-black text-[10px] uppercase tracking-widest border border-white/5">Local Archive</span></div>
                        <div className="flex gap-2"><button className="p-3 bg-white/5 text-royal-200 rounded-xl hover:bg-white/10 transition-all"><Edit3 size={24}/></button><button onClick={() => activeSubEditor === 'NOTE' ? setLocalNotes([]) : setLocalQuizzes([])} className="p-3 bg-white/5 text-royal-300 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={24}/></button></div>
                    </div>
                    <div className="flex-1 overflow-y-scroll custom-scrollbar p-10 space-y-10 bg-indigo-900/20 pr-4">
                        {activeSubEditor === 'NOTE' ? (
                            <div className="space-y-10">{localNotes.map((note, nIdx) => (<div key={note.id} className="p-8 bg-white/5 border-2 border-white/5 rounded-[3rem] space-y-6 relative animate-in slide-in-from-right-4"><div className="flex justify-between items-center border-b border-white/5 pb-4"><span className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">{nIdx + 1}</span><HeaderActions onDelete={() => deleteLocalNote(nIdx)} /></div><div><label className={darkLabelClass}>Note Title</label><input className={darkInputClass} value={note.title} onChange={e => { const next = [...localNotes]; next[nIdx].title = e.target.value; setLocalNotes(next); }} placeholder="Master Instructional Essay Title" /></div><div><label className={darkLabelClass}>Note Body (HTML/Rich Text Enabled)</label><textarea className={`${darkInputClass} min-h-[300px]`} value={note.body} onChange={e => { const next = [...localNotes]; next[nIdx].body = e.target.value; setLocalNotes(next); }} placeholder="Enter detailed theological perspectives here..." /></div></div>))}</div>
                        ) : (
                            <div className="space-y-10">{localQuizzes.map((quiz, qIdx) => (<div key={quiz.id} className="p-8 bg-white/5 border-2 border-white/5 rounded-[3rem] space-y-8 relative animate-in slide-in-from-right-4"><div className="flex justify-between items-center border-b border-white/5 pb-4"><span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${activeSubEditor === 'BIBLE_QUIZ' ? 'bg-royal-600' : 'bg-amber-600'} text-white`}>{qIdx + 1}</span><HeaderActions onDelete={() => deleteLocalQuiz(qIdx)} /></div>{activeSubEditor === 'BIBLE_QUIZ' && (<div><label className={darkLabelClass}>Reference Text (Scripture Focus)</label><input className={darkInputClass} value={quiz.referenceText} onChange={e => { const next = [...localQuizzes]; next[qIdx].referenceText = e.target.value; setLocalQuizzes(next); }} placeholder="e.g. Genesis 1:1" /></div>)}<div><label className={darkLabelClass}>Question Intelligence</label><input className={darkInputClass} value={quiz.text} onChange={e => { const next = [...localQuizzes]; next[qIdx].text = e.target.value; setLocalQuizzes(next); }} placeholder="Inquiry Text..." /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{quiz.options?.map((opt, oIdx) => (<div key={opt.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4"><div className="flex justify-between items-center"><span className="font-black text-indigo-400">OPTION {opt.label}</span><button onClick={() => { const next = [...localQuizzes]; next[qIdx].options?.forEach(o => o.isCorrect = false); next[qIdx].options![oIdx].isCorrect = true; setLocalQuizzes(next); }} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${opt.isCorrect ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 text-white/40'}`}>Correct Choice</button></div><input className={darkInputClass} value={opt.text} onChange={e => { const next = [...localQuizzes]; next[qIdx].options![oIdx].text = e.target.value; setLocalQuizzes(next); }} placeholder="Option Text" /><textarea className={`${darkInputClass} min-h-[80px] text-xs`} value={opt.explanation} onChange={e => { const next = [...localQuizzes]; next[qIdx].options![oIdx].explanation = e.target.value; setLocalQuizzes(next); }} placeholder="System Audit Feedback/Explanation..." /></div>))}</div></div>))}</div>
                        )}
                    </div>
                    <div className="p-3 border-t border-white/10 bg-royal-950/50 flex flex-row items-center justify-center gap-6 shrink-0 shadow-2xl">
                        <button onClick={() => activeSubEditor === 'NOTE' ? addNewLocalNote() : addNewLocalQuiz(activeSubEditor === 'BIBLE_QUIZ' ? 'Bible Quiz' : 'Note Quiz')} className="px-8 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all uppercase tracking-widest text-[9px] flex items-center gap-3 border border-white/5"><Plus size={16}/> {activeSubEditor === 'NOTE' ? 'ADD NOTE' : activeSubEditor === 'BIBLE_QUIZ' ? 'ADD QUIZ' : 'ADD NOTE QUIZ'}</button>
                        <button onClick={commitSubEditor} className="px-12 py-3 bg-gold-500 text-white font-black rounded-2xl shadow-xl hover:bg-gold-600 transition-all uppercase tracking-[0.2em] text-[9px] flex items-center gap-4 border-b-4 border-gold-900 active:scale-95"><CheckCircle size={18}/> VERIFY & APPEND COMPONENT</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default LessonUpload;
