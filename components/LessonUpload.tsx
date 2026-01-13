

import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, Module, Course, AboutSegment, ImportError, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem } from '../types';
import { lessonService } from '../services/lessonService';
// Added missing ArrowLeft and Sparkles to imports
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, CheckCircle, HelpCircle, ArrowRight, AlertTriangle, Layers, BadgeCheck, PenTool, Check, Info, Library, Layout, ListChecks, Download, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson | Resource | NewsItem;
  initialContentType?: 'lesson' | 'resource' | 'news' | 'homepage';
}

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData, initialContentType = 'lesson' }) => {
  const [contentType, setContentType] = useState<'lesson' | 'resource' | 'news' | 'homepage'>(initialContentType);
  const [metricMode, setMetricMode] = useState<'manual' | 'bulk'>(initialData ? 'manual' : 'bulk');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Creation State
  const [manualCourse, setManualCourse] = useState<Partial<Course>>({ title: '', description: '', level: 'Beginner', language: 'English', author: currentUser.name, about: [] });
  const [manualModule, setManualModule] = useState<Partial<Module>>({ title: '', description: '', totalLessonsRequired: 1, about: [], completionRule: { minimumCompletionPercentage: 100 }, certificateConfig: { title: 'Certificate', description: '', templateId: 'classic', issuedBy: currentUser.name } });
  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>({ title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', sections: [], about: [] });

  const [activeManualStep, setActiveManualStep] = useState<1 | 2 | 3>(1);

  const addAboutSegment = (type: 'course' | 'module' | 'lesson') => {
      const seg: AboutSegment = { order: 0, title: 'New Segment', body: '' };
      if (type === 'course') setManualCourse(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'lesson') setManualLesson(p => { const list = [...(p.about || []), seg]; list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
  };

  const updateAboutSegment = (type: 'course' | 'module' | 'lesson', idx: number, upd: Partial<AboutSegment>) => {
      if (type === 'course') setManualCourse(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
      if (type === 'lesson') setManualLesson(p => { const list = [...(p.about || [])]; list[idx] = {...list[idx], ...upd}; return {...p, about: list}; });
  };

  const removeAboutSegment = (type: 'course' | 'module' | 'lesson', idx: number) => {
      if (type === 'course') setManualCourse(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'module') setManualModule(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
      if (type === 'lesson') setManualLesson(p => { const list = (p.about || []).filter((_, i) => i !== idx); list.forEach((s, i) => s.order = i+1); return {...p, about: list}; });
  };

  const validateManual = () => {
      if (activeManualStep === 1) {
          if (!manualCourse.title) return "Course Title is mandatory.";
          if ((manualCourse.about?.length || 0) < 5) return "Courses require 5–20 segments of structured content.";
      }
      if (activeManualStep === 2) {
          if (!manualModule.title) return "Module Title is mandatory.";
          if ((manualModule.about?.length || 0) < 5) return "Modules require 5–20 segments of structured content.";
      }
      if (activeManualStep === 3) {
          if (!manualLesson.title) return "Lesson Title is mandatory.";
          if ((manualLesson.about?.length || 0) < 7) return "Lessons require 7–20 segments of structured content.";
      }
      return null;
  };

  const saveManual = async () => {
    const err = validateManual();
    if (err) { setError(err); return; }

    if (activeManualStep < 3) {
        setActiveManualStep(prev => prev + 1 as any);
        return;
    }

    try {
        const courseId = manualCourse.id || crypto.randomUUID();
        const moduleId = manualModule.id || crypto.randomUUID();
        const lessonId = manualLesson.id || crypto.randomUUID();

        await lessonService.publishCourse({ ...manualCourse, id: courseId } as Course);
        await lessonService.publishModule({ ...manualModule, id: moduleId, courseId, lessonIds: [lessonId] } as Module);
        await lessonService.publishLesson({ ...manualLesson, id: lessonId, moduleId, author: currentUser.name, authorId: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: 'published', views: 0 } as Lesson);
        
        onSuccess();
    } catch (e: any) { setError(e.message); }
  };

  const processBulkFile = async () => {
      if (!file) return;
      setIsParsing(true);
      setError(null);
      try {
          const res = await lessonService.parseExcelUpload(file);
          setDraft(res);
      } catch (e: any) { setError(e.message); }
      finally { setIsParsing(false); }
  };

  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1";
  const inputClass = "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-white/20">
            
            <div className="bg-royal-900 p-8 text-white relative shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md shadow-2xl border border-white/10 text-gold-500">
                            <Upload size={40} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-black uppercase tracking-tight">Structured Content Upload</h2>
                            <p className="text-royal-200 text-xs font-black uppercase tracking-[0.4em] mt-1">Hierarchical Knowledge Engine</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-royal-950 p-1 rounded-2xl flex border border-white/10">
                            <button onClick={() => setMetricMode('bulk')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${metricMode === 'bulk' ? 'bg-white text-royal-900 shadow-xl' : 'text-royal-300 hover:text-white'}`}>Bulk Import</button>
                            <button onClick={() => setMetricMode('manual')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${metricMode === 'manual' ? 'bg-white text-royal-900 shadow-xl' : 'text-royal-300 hover:text-white'}`}>Builder</button>
                        </div>
                        <button onClick={onCancel} className="p-3 bg-white/10 hover:bg-white/20 rounded-full ml-4 transition-colors"><X size={24}/></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#fdfdfd]">
                {error && (
                    <div className="bg-red-50 border-4 border-red-100 p-8 rounded-[2.5rem] mb-12 flex items-start gap-6 shadow-xl animate-in slide-in-from-top-4">
                        <AlertCircle className="shrink-0 text-red-600" size={48} />
                        <div>
                            <h4 className="text-red-900 font-black text-xl uppercase tracking-tighter mb-2">Protocol Violation</h4>
                            <p className="text-red-700 font-bold leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                {metricMode === 'bulk' ? (
                    <div className="max-w-4xl mx-auto space-y-12">
                        {!draft ? (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="bg-indigo-50 border-4 border-indigo-100 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <Library className="absolute top-0 right-0 text-indigo-100 -mr-10 -mt-10 group-hover:scale-110 transition-transform" size={300} />
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-serif font-black text-indigo-900 uppercase mb-4">Hierarchical Spreadsheet Protocol</h3>
                                        <p className="text-indigo-700 font-medium leading-relaxed max-w-xl">Upload your consolidated .xlsx workbook including Course, Module, Lesson, and Quiz definitions along with structured "About" segments.</p>
                                        <div className="mt-10 flex gap-4">
                                            <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl border-b-4 border-indigo-900 hover:bg-indigo-700 transition-all flex items-center gap-3">
                                                <Download size={20} /> DOWNLOAD PROTOCOL TEMPLATE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="border-8 border-dashed border-gray-100 rounded-[3.5rem] p-24 text-center hover:bg-gray-50/50 hover:border-indigo-100 transition-all cursor-pointer relative group">
                                    <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className="flex flex-col items-center gap-6 group-hover:scale-105 transition-transform">
                                        <div className="p-8 bg-indigo-50 text-indigo-600 rounded-[2.5rem] shadow-inner"><FileIcon size={64}/></div>
                                        <div><p className="text-2xl font-serif font-black text-gray-800 uppercase tracking-tighter">{file ? file.name : "DEPOSIT DATA WORKBOOK"}</p><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Maximum file size: 25MB • .xlsx only</p></div>
                                    </div>
                                </div>
                                
                                {file && (
                                    <button onClick={processBulkFile} disabled={isParsing} className="w-full py-6 bg-royal-950 text-white font-black rounded-[2rem] shadow-2xl border-b-8 border-black hover:bg-black transition-all flex items-center justify-center gap-6 text-2xl group">
                                        {isParsing ? <Loader2 className="animate-spin" size={32}/> : <CheckCircle size={32} className="text-gold-500" />} {isParsing ? "Synchronizing..." : "START SYSTEM IMPORT"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-12 animate-in fade-in duration-700">
                                <div className="flex justify-between items-end border-b-4 border-gray-50 pb-8">
                                    <div><h3 className="text-4xl font-serif font-black text-gray-950 uppercase tracking-tighter">Workbook Snapshot</h3><p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Integrity Check Completed</p></div>
                                    <button onClick={() => setDraft(null)} className="px-6 py-2 bg-red-50 text-red-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">DISCARD WORKBOOK</button>
                                </div>

                                {draft.errors.length > 0 && (
                                    <div className="bg-white border-4 border-red-50 rounded-[2.5rem] shadow-xl overflow-hidden">
                                        <div className="bg-red-600 p-6 text-white font-black uppercase text-sm tracking-widest flex items-center gap-3"><AlertTriangle size={24}/> Row-Level Integrity Violations</div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead><tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100"><th className="p-4">Sheet</th><th className="p-4">Row</th><th className="p-4">Column</th><th className="p-4">Violation Details</th></tr></thead>
                                                <tbody className="divide-y divide-gray-50 text-sm font-bold">
                                                    {draft.errors.map((e,i) => (
                                                        <tr key={i} className="hover:bg-red-50/30">
                                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px]">{e.sheet}</span></td>
                                                            <td className="p-4 font-mono">#{e.row}</td>
                                                            <td className="p-4 text-gray-500">{e.column}</td>
                                                            <td className="p-4 text-red-600">{e.message}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                        <Library className="absolute top-0 right-0 p-4 opacity-5" size={180}/>
                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-4">Course Context</h4>
                                        <h2 className="text-3xl font-serif font-black uppercase tracking-tight">{draft.courseMetadata?.title}</h2>
                                        <p className="mt-4 text-indigo-200 font-medium leading-relaxed">{draft.courseMetadata?.description}</p>
                                        <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
                                            <div className="text-center"><p className="text-2xl font-black">{draft.courseMetadata?.about.length}</p><p className="text-[8px] font-black uppercase text-indigo-400">Segments</p></div>
                                            <div className="text-center"><p className="text-2xl font-black">{draft.modules.length}</p><p className="text-[8px] font-black uppercase text-indigo-400">Modules</p></div>
                                            <div className="text-center"><p className="text-2xl font-black">{draft.lessons.length}</p><p className="text-[8px] font-black uppercase text-indigo-400">Lessons</p></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {draft.modules.map((m,i) => (
                                            <div key={i} className="bg-white border-4 border-gray-50 p-6 rounded-[2.2rem] shadow-lg flex justify-between items-center">
                                                <div className="flex items-center gap-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Layers size={24}/></div><div><h4 className="font-serif font-black text-gray-900 uppercase tracking-tighter leading-tight">{m.title}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.about.length} Structured Segments Attached</p></div></div>
                                                <CheckCircle size={24} className="text-green-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <button onClick={() => lessonService.commitDraft(draft, currentUser).then(onSuccess)} disabled={!draft.isValid} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl border-b-8 border-indigo-900 hover:bg-indigo-700 transition-all uppercase tracking-[0.4em] disabled:opacity-50">COMMIT VERIFIED DATA</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
                        {/* MANUAL STEPPER UI */}
                        <div className="flex justify-center mb-12">
                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[2rem] border-2 border-gray-100">
                                {[1,2,3].map(step => (
                                    <div key={step} className={`flex items-center gap-3 px-6 py-2 rounded-[1.4rem] transition-all ${activeManualStep === step ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-gray-400'}`}>
                                        <span className="font-black text-lg">{step}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{step === 1 ? 'Course' : step === 2 ? 'Module' : 'Lesson'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STEP 1: COURSE */}
                        {activeManualStep === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="bg-white p-10 rounded-[3rem] border-4 border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-2xl font-serif font-black text-gray-900 uppercase flex items-center gap-3"><Library className="text-indigo-600"/> 1. COURSE DEFINITION</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2"><label className={labelClass}>Course Title</label><input className={inputClass} value={manualCourse.title} onChange={e => setManualCourse({...manualCourse, title: e.target.value})} placeholder="e.g. Master Class 101" /></div>
                                        <div><label className={labelClass}>Proficiency Level</label><select className={inputClass} value={manualCourse.level} onChange={e => setManualCourse({...manualCourse, level: e.target.value as any})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                                        <div><label className={labelClass}>Language</label><input className={inputClass} value={manualCourse.language} onChange={e => setManualCourse({...manualCourse, language: e.target.value})} /></div>
                                    </div>
                                </div>
                                <AboutSegmentBuilder segments={manualCourse.about || []} type="course" onAdd={() => addAboutSegment('course')} onUpdate={(idx, upd) => updateAboutSegment('course', idx, upd)} onRemove={(idx) => removeAboutSegment('course', idx)} min={5} />
                            </div>
                        )}

                        {/* STEP 2: MODULE */}
                        {activeManualStep === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="bg-white p-10 rounded-[3rem] border-4 border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-2xl font-serif font-black text-gray-900 uppercase flex items-center gap-3"><Layers className="text-indigo-600"/> 2. MODULE ARCHITECTURE</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2"><label className={labelClass}>Module Title</label><input className={inputClass} value={manualModule.title} onChange={e => setManualModule({...manualModule, title: e.target.value})} placeholder="e.g. Identity Foundations" /></div>
                                        <div><label className={labelClass}>Units Required</label><input type="number" className={inputClass} value={manualModule.totalLessonsRequired} onChange={e => setManualModule({...manualModule, totalLessonsRequired: parseInt(e.target.value)})} /></div>
                                        <div><label className={labelClass}>Pass Threshold (%)</label><input type="number" className={inputClass} value={manualModule.completionRule?.minimumCompletionPercentage} onChange={e => setManualModule({...manualModule, completionRule: { minimumCompletionPercentage: parseInt(e.target.value) }})} /></div>
                                    </div>
                                </div>
                                <AboutSegmentBuilder segments={manualModule.about || []} type="module" onAdd={() => addAboutSegment('module')} onUpdate={(idx, upd) => updateAboutSegment('module', idx, upd)} onRemove={(idx) => removeAboutSegment('module', idx)} min={5} />
                            </div>
                        )}

                        {/* STEP 3: LESSON */}
                        {activeManualStep === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 pb-20">
                                <div className="bg-white p-10 rounded-[3rem] border-4 border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-2xl font-serif font-black text-gray-900 uppercase flex items-center gap-3"><BookOpen className="text-indigo-600"/> 3. LESSON SPECIFICATION</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2"><label className={labelClass}>Lesson Title</label><input className={inputClass} value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} placeholder="e.g. Genesis 1: Creation Order" /></div>
                                        <div><label className={labelClass}>Type</label><select className={inputClass} value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as any})}><option>Bible</option><option>Leadership</option><option>Mixed</option></select></div>
                                        <div><label className={labelClass}>Audience</label><select className={inputClass} value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as any})}><option>All</option><option>Student</option><option>Mentor</option></select></div>
                                    </div>
                                </div>
                                <AboutSegmentBuilder segments={manualLesson.about || []} type="lesson" onAdd={() => addAboutSegment('lesson')} onUpdate={(idx, upd) => updateAboutSegment('lesson', idx, upd)} onRemove={(idx) => removeAboutSegment('lesson', idx)} min={7} />
                            </div>
                        )}
                        
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                            {activeManualStep > 1 && (
                                <button onClick={() => setActiveManualStep(prev => prev - 1 as any)} className="px-12 py-5 bg-white text-gray-500 font-black rounded-3xl shadow-2xl border-4 border-gray-50 uppercase tracking-widest text-xs hover:bg-gray-50 transition-all flex items-center gap-3"><ArrowLeft size={18}/> Previous Section</button>
                            )}
                            <button onClick={saveManual} className="px-20 py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] border-b-8 border-indigo-950 uppercase tracking-[0.4em] text-sm hover:bg-indigo-700 transition-all flex items-center gap-4 active:scale-95">
                                {activeManualStep === 3 ? <Save size={24}/> : <ArrowRight size={24}/>} {activeManualStep === 3 ? "FINALIZE & COMMIT" : "CONTINUE TO NEXT SECTION"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const AboutSegmentBuilder = ({ segments, type, onAdd, onUpdate, onRemove, min }: { segments: AboutSegment[], type: string, onAdd: () => void, onUpdate: (i:number, u:Partial<AboutSegment>) => void, onRemove: (i:number) => void, min: number }) => {
    const isError = segments.length < min;
    return (
        <div className="bg-white p-10 rounded-[3rem] border-4 border-gray-50 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b-4 border-gray-50 pb-6">
                <div>
                    <h3 className="text-xl font-serif font-black text-gray-900 uppercase flex items-center gap-3"><Sparkles size={24} className="text-gold-500" /> Instructional segments ({segments.length})</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isError ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>{isError ? `Requirement: Minimum ${min} segments required` : 'Segment Requirement Fulfilled'}</p>
                </div>
                <button onClick={onAdd} className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"><Plus size={16}/> Add New Segment</button>
            </div>

            <div className="space-y-6">
                {segments.map((seg, idx) => (
                    <div key={idx} className="p-8 bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 flex items-start gap-6 group relative animate-in slide-in-from-right-4">
                        <span className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shrink-0">{idx + 1}</span>
                        <div className="flex-1 space-y-4">
                            <input 
                                className="w-full bg-white p-4 border-2 border-transparent rounded-2xl focus:border-indigo-400 outline-none font-black text-gray-800 uppercase tracking-tighter text-lg"
                                value={seg.title}
                                onChange={e => onUpdate(idx, {title: e.target.value})}
                                placeholder="Segment Title (e.g. Theological Context)"
                            />
                            <textarea 
                                className="w-full bg-white p-5 border-2 border-transparent rounded-2xl focus:border-indigo-400 outline-none font-medium text-gray-700 leading-relaxed min-h-[150px]"
                                value={seg.body}
                                onChange={e => onUpdate(idx, {body: e.target.value})}
                                placeholder="Educational Content Body (Supports Markdown/HTML)..."
                            />
                        </div>
                        <button onClick={() => onRemove(idx)} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={24}/></button>
                    </div>
                ))}
                {segments.length === 0 && <div className="text-center py-20 border-4 border-dashed border-gray-100 rounded-[2.5rem]"><Info size={48} className="mx-auto mb-4 text-gray-200" /><p className="font-black text-gray-400 uppercase tracking-widest text-sm">Instructional Architecture is Empty</p></div>}
            </div>
        </div>
    );
};

export default LessonUpload;
