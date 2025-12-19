
import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem, HomepageContent, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, Newspaper, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, Circle, AlertCircle, AlertTriangle, Home, Mail, Phone, MapPin, Share2, ListChecks, Layers, BadgeCheck, PenTool, Check } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson;
}

type ContentType = 'lesson' | 'resource' | 'news' | 'homepage';

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData }) => {
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [mode, setMode] = useState<'manual' | 'bulk'>(initialData ? 'manual' : 'bulk');

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [showModuleWizard, setShowModuleWizard] = useState(false);
  const [newModule, setNewModule] = useState<Partial<Module>>({
      id: '', title: '', description: '', totalLessonsRequired: 1,
      completionRule: { minimumCompletionPercentage: 100 },
      certificateConfig: { title: 'Certificate of Achievement', description: '', templateId: 'classic', issuedBy: 'Build Biblical Leaders' }
  });

  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>(initialData ? { ...initialData } : {
    title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', book: '', chapter: 1, sections: [], moduleId: '', orderInModule: 1
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
      if (contentType === 'homepage') lessonService.getHomepageContent().then(setHomepageContent);
      if (contentType === 'lesson') lessonService.getModules().then(setModules);
  }, [contentType]);

  const handleCreateModule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newModule.id || !newModule.title) return;
      const modObj: Module = {
          id: newModule.id, title: newModule.title, description: newModule.description || '',
          lessonIds: [], totalLessonsRequired: newModule.totalLessonsRequired || 1,
          completionRule: newModule.completionRule || { minimumCompletionPercentage: 100 },
          certificateConfig: newModule.certificateConfig || { title: 'Certificate', description: '', templateId: 'classic', issuedBy: '' }
      };
      await lessonService.createModule(modObj);
      const updatedModules = await lessonService.getModules();
      setModules(updatedModules);
      setManualLesson(prev => ({ ...prev, moduleId: modObj.id }));
      setShowModuleWizard(false);
  };

  const handleLessonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const result = await lessonService.parseExcelUpload(file);
      setDraft(result);
    } catch (err: any) { setError("Failed to parse file: " + err.message); }
    finally { setIsParsing(false); }
  };

  const commitImport = async () => {
    if (!draft) return;
    try { await lessonService.commitDraft(draft, currentUser); onSuccess(); }
    catch (err: any) { setError(err.message); }
  };

  const saveManualLesson = async (shouldClose: boolean = true) => {
    setError(null);
    setSaveFeedback(null);
    try {
      if (!manualLesson.title) throw new Error("Lesson Title is required");
      if (!manualLesson.moduleId) throw new Error("A module assignment is required for certification tracking.");
      
      // Validation: Ensure every quiz has exactly one correct option
      for (const section of manualLesson.sections || []) {
        if (section.type === 'quiz_group') {
          for (const [idx, quiz] of (section.quizzes || []).entries()) {
            if (!quiz.options.some(o => o.isCorrect)) {
              throw new Error(`Question #${idx + 1} in "${section.title}" has no correct answer selected. Please indicate the correct option before saving.`);
            }
          }
        }
      }

      const finalLesson: Lesson = {
        id: initialData?.id || crypto.randomUUID(),
        moduleId: manualLesson.moduleId || '',
        orderInModule: manualLesson.orderInModule || 1,
        title: manualLesson.title,
        description: manualLesson.description || '',
        lesson_type: manualLesson.lesson_type || 'Mixed',
        targetAudience: manualLesson.targetAudience || 'All',
        book: manualLesson.book,
        chapter: manualLesson.chapter,
        author: initialData?.author || currentUser.name,
        created_at: initialData?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published',
        views: initialData?.views || 0,
        sections: manualLesson.sections || []
      };
      
      await lessonService.publishLesson(finalLesson);
      
      if (shouldClose) {
        onSuccess();
      } else {
        setManualLesson({
            title: '', 
            description: '', 
            lesson_type: 'Mixed', 
            targetAudience: 'All', 
            book: '', 
            chapter: 1, 
            sections: [], 
            moduleId: manualLesson.moduleId, 
            orderInModule: (manualLesson.orderInModule || 1) + 1 
        });
        setExpandedSection(null);
        setSaveFeedback(`Lesson "${finalLesson.title}" successfully saved! Builder reset for the next lesson.`);
        document.getElementById('upload-modal-content')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) { setError(err.message); }
  };

  const addSection = (type: SectionType) => {
    const newSection: LessonSection = {
      id: crypto.randomUUID(), type, title: type === 'note' ? 'New Leadership Note' : 'New Quiz Group',
      body: type === 'note' ? '' : undefined, quizzes: type === 'quiz_group' ? [] : undefined,
      sequence: (manualLesson.sections?.length || 0) + 1
    };
    setManualLesson(prev => ({ ...prev, sections: [...(prev.sections || []), newSection] }));
    setExpandedSection(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<LessonSection>) => setManualLesson(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === id ? { ...s, ...updates } : s) }));
  const removeSection = (id: string) => setManualLesson(prev => ({ ...prev, sections: prev.sections?.filter(s => s.id !== id) }));
  
  const addQuestion = (sectionId: string) => {
    const newQuiz: QuizQuestion = {
        id: crypto.randomUUID(), type: 'Bible Quiz', text: 'New Question', reference: '', sequence: 0,
        options: [
            { id: crypto.randomUUID(), label: 'A', text: '', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'B', text: '', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'C', text: '', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'D', text: '', isCorrect: false, explanation: '' },
        ]
    };
    setManualLesson(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === sectionId ? { ...s, quizzes: [...(s.quizzes || []), { ...newQuiz, sequence: (s.quizzes?.length || 0) + 1 }] } : s) }));
  };

  const updateQuestion = (secId: string, qId: string, upd: Partial<QuizQuestion>) => setManualLesson(p => ({ ...p, sections: p.sections?.map(s => s.id === secId ? { ...s, quizzes: s.quizzes?.map(q => q.id === qId ? { ...q, ...upd } : q) } : s) }));
  
  const updateOption = (secId: string, qId: string, oId: string, upd: Partial<QuizOption>) => setManualLesson(p => ({ 
    ...p, 
    sections: p.sections?.map(s => s.id === secId ? { 
      ...s, 
      quizzes: s.quizzes?.map(q => q.id === qId ? { 
        ...q, 
        options: q.options.map(o => {
          // If we are setting this option to correct, clear correctness on all other options in this question
          if (upd.isCorrect && o.id !== oId) {
             return { ...o, isCorrect: false };
          }
          if (o.id === oId) {
             return { ...o, ...upd };
          }
          return o;
        }) 
      } : q) 
    } : s) 
  }));

  const removeQuestion = (secId: string, qId: string) => setManualLesson(p => ({ ...p, sections: p.sections?.map(s => s.id === secId ? { ...s, quizzes: s.quizzes?.filter(q => q.id !== qId) } : s) }));

  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block";
  const inputClass = "w-full p-3 border rounded-xl focus:ring-2 focus:ring-royal-500 outline-none transition-all text-sm bg-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] w-full max-w-6xl animate-in zoom-in-95 duration-200">
       <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className="bg-royal-800 text-white p-3 rounded-2xl shadow-lg">
                  {initialData ? <Edit3 size={24} /> : <Upload size={24} />}
              </div>
              <div>
                  <h2 className="font-bold text-gray-800 text-xl">{initialData ? 'Edit Content' : 'Mass Content Ingestion'}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">LMS Administration Console</p>
              </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && !initialData && (
                <div className="flex gap-1 p-1 bg-gray-200 rounded-xl mr-4">
                    <button onClick={() => setContentType('lesson')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'lesson' ? 'bg-white shadow text-royal-700' : 'text-gray-500'}`}>Lessons</button>
                    <button onClick={() => setContentType('homepage')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'homepage' ? 'bg-white shadow text-royal-700' : 'text-gray-500'}`}>Landing Page</button>
                </div>
            )}
            <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={24} /></button>
          </div>
       </div>

       <div id="upload-modal-content" className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#fdfdfd]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
               <AlertCircle className="shrink-0" size={24} />
               <div><h4 className="font-bold">Validation Error</h4><p className="text-sm opacity-80">{error}</p></div>
            </div>
          )}

          {saveFeedback && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl mb-8 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
               <CheckCircle className="shrink-0" size={24} />
               <div><h4 className="font-bold">Entry Recorded</h4><p className="text-sm opacity-80">{saveFeedback}</p></div>
            </div>
          )}

          {contentType === 'lesson' && (
             <div className="space-y-8">
                {!initialData && (
                    <div className="flex justify-center">
                        <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner">
                            <button onClick={() => setMode('bulk')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'bulk' ? 'bg-white shadow-xl text-royal-700' : 'text-gray-500 hover:text-gray-700'}`}><FileIcon size={18}/> Excel Import (4 Sheets)</button>
                            <button onClick={() => setMode('manual')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white shadow-xl text-royal-700' : 'text-gray-500 hover:text-gray-700'}`}><PenTool size={18}/> Manual Builder</button>
                        </div>
                    </div>
                )}
                
                {mode === 'manual' ? (
                   <div className="max-w-5xl mx-auto space-y-10 pb-20">
                      <div className="bg-indigo-50/50 p-8 rounded-3xl border-2 border-indigo-100 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-3"><Layers className="text-indigo-600"/> 1. Define Module & Hierarchy</h3>
                            <button onClick={() => setShowModuleWizard(true)} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"><Plus size={16}/> New Module</button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelClass}>Module Container</label><select className={inputClass} value={manualLesson.moduleId} onChange={e => setManualLesson({...manualLesson, moduleId: e.target.value})}><option value="">-- Choose Module for Certification --</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                            <div><label className={labelClass}>Sequence Order (1-200)</label><input type="number" className={inputClass} value={manualLesson.orderInModule} onChange={e => setManualLesson({...manualLesson, orderInModule: parseInt(e.target.value)})} /></div>
                         </div>
                      </div>

                      {showModuleWizard && (
                          <div className="bg-white p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95">
                              <div className="flex justify-between mb-6 border-b pb-4"><h4 className="font-bold text-indigo-800 text-xl">Module Metadata Config</h4><button onClick={() => setShowModuleWizard(false)}><X size={24}/></button></div>
                              <form onSubmit={handleCreateModule} className="space-y-6">
                                  <div className="grid grid-cols-2 gap-6">
                                      <div><label className={labelClass}>Unique ID</label><input required placeholder="e.g. FAITH-101" className={inputClass} value={newModule.id} onChange={e => setNewModule({...newModule, id: e.target.value.toUpperCase()})} /></div>
                                      <div><label className={labelClass}>Module Title</label><input required placeholder="Foundations of Faith" className={inputClass} value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} /></div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                      <div><label className={labelClass}>Certificate Award Label</label><input required className={inputClass} value={newModule.certificateConfig?.title} onChange={e => setNewModule({...newModule, certificateConfig: {...newModule.certificateConfig!, title: e.target.value}})} /></div>
                                      <div><label className={labelClass}>Total Lessons in Module</label><input type="number" min="1" required className={inputClass} value={newModule.totalLessonsRequired} onChange={e => setNewModule({...newModule, totalLessonsRequired: parseInt(e.target.value)})} /></div>
                                  </div>
                                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg">Initialize Module Container</button>
                              </form>
                          </div>
                      )}

                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                         <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-3"><CheckCircle className="text-green-500"/> 2. Lesson Metadata</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className={labelClass}>Display Title</label><input className={inputClass} value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} /></div>
                            <div><label className={labelClass}>Audience Context</label><select className={inputClass} value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}><option value="All">All Users</option><option value="Student">Student Only</option><option value="Mentor">Mentor Only</option></select></div>
                            <div><label className={labelClass}>Lesson Type</label><select className={inputClass} value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-2xl border border-gray-200"><h3 className="font-bold text-gray-800">3. Content Architecture</h3><div className="flex gap-2"><button onClick={() => addSection('note')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">+ Note</button><button onClick={() => addSection('quiz_group')} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700">+ Quiz Group</button></div></div>
                         {manualLesson.sections?.map((s) => (
                             <div key={s.id} className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-md">
                                 <div className="bg-gray-50/50 p-6 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}>
                                     <div className="flex items-center gap-4"><span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${s.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.type}</span><span className="font-bold text-gray-900">{s.title}</span></div>
                                     {expandedSection === s.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                                 </div>
                                 {expandedSection === s.id && (
                                     <div className="p-8 border-t space-y-8 animate-in slide-in-from-top-4">
                                         <div><label className={labelClass}>Component Title</label><input className={inputClass} value={s.title} onChange={e => updateSection(s.id, {title: e.target.value})} /></div>
                                         {s.type === 'note' ? (
                                             <div><label className={labelClass}>Note Body (Rich Text / HTML)</label><textarea className="w-full p-5 border rounded-2xl h-80 font-mono text-sm shadow-inner" value={s.body || ''} onChange={e => updateSection(s.id, {body: e.target.value})} /></div>
                                         ) : (
                                             <div className="space-y-8">
                                                 <div className="flex justify-between items-center"><h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">Questions ({s.quizzes?.length || 0})</h4><button onClick={() => addQuestion(s.id)} className="text-xs font-bold bg-royal-100 text-royal-700 px-4 py-2 rounded-xl">+ Add Question</button></div>
                                                 {s.quizzes?.map((q, idx) => (
                                                     <div key={q.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative">
                                                         <button onClick={() => removeQuestion(s.id, q.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                                                         <div className="grid grid-cols-1 gap-6">
                                                            {/* Reference Text Area (Bold, thick-bordered, 90% font size) */}
                                                            <div>
                                                                <label className={labelClass}>Reference Text / Context</label>
                                                                <textarea 
                                                                    className="w-full p-4 border-4 border-gray-300 rounded-2xl focus:border-royal-500 outline-none transition-all font-bold text-[12.6px] bg-white h-48 custom-scrollbar" 
                                                                    placeholder="Enter scriptural reference or context (up to 2000+ words)..." 
                                                                    value={q.reference || ''} 
                                                                    onChange={e => updateQuestion(s.id, q.id, {reference: e.target.value})} 
                                                                />
                                                            </div>

                                                            <div>
                                                              <label className={labelClass}>Question Prompt</label>
                                                              <input className={inputClass} placeholder="Enter the question here..." value={q.text} onChange={e => updateQuestion(s.id, q.id, {text: e.target.value})} />
                                                            </div>

                                                            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
                                                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Correct Option Selection Panel</p>
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {q.options.map(opt => (
                                                                  <div key={opt.id} className={`p-4 rounded-2xl border-2 transition-all group ${opt.isCorrect ? 'bg-green-50 border-green-500 shadow-md ring-4 ring-green-50' : 'bg-gray-50 border-gray-100 hover:border-royal-200'}`}>
                                                                    <div className="flex gap-3 items-center mb-3">
                                                                      <button 
                                                                        onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})} 
                                                                        className={`shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold shadow-sm transition-all ${opt.isCorrect ? 'bg-green-600 border-green-600 text-white scale-110' : 'bg-white border-gray-300 text-gray-400 hover:border-royal-400 hover:text-royal-500'}`}
                                                                      >
                                                                        {opt.isCorrect ? <Check size={24} /> : opt.label}
                                                                      </button>
                                                                      <input 
                                                                        className="flex-1 p-2 bg-transparent font-bold text-gray-800 outline-none border-b-2 border-transparent focus:border-royal-500 transition-colors" 
                                                                        placeholder={`Type Option ${opt.label}...`} 
                                                                        value={opt.text} 
                                                                        onChange={e => updateOption(s.id, q.id, opt.id, {text: e.target.value})} 
                                                                      />
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-col gap-2">
                                                                      <textarea 
                                                                        className="w-full p-2 text-[10px] border border-dashed rounded-lg bg-white/50 h-16 outline-none focus:border-royal-300" 
                                                                        placeholder="Explain why this choice is correct or incorrect..." 
                                                                        value={opt.explanation} 
                                                                        onChange={e => updateOption(s.id, q.id, opt.id, {explanation: e.target.value})} 
                                                                      />
                                                                      <button 
                                                                         onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})}
                                                                         className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all border ${opt.isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'}`}
                                                                      >
                                                                        {opt.isCorrect ? 'CURRENTLY MARKED AS CORRECT' : 'CLICK TO MARK AS CORRECT'}
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            </div>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="max-w-4xl mx-auto space-y-10 pb-20">
                      {!draft ? (
                          <div className="space-y-8">
                            <div className="bg-royal-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden"><div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="relative z-10"><h3 className="text-2xl font-serif font-bold mb-4 flex items-center gap-3"><HelpCircle className="text-gold-400"/> Bulk Import Specification</h3><p className="text-indigo-200 text-lg mb-6">A single .xlsx file with 4 specific sheets is required for synchronization:</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center"><span className="block font-bold mb-1">1</span><span className="text-[10px] uppercase font-bold text-gold-400">Module_Metadata</span></div><div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center"><span className="block font-bold mb-1">2</span><span className="text-[10px] uppercase font-bold text-gold-400">Lesson_Metadata</span></div><div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center"><span className="block font-bold mb-1">3</span><span className="text-[10px] uppercase font-bold text-gold-400">Bible_Quiz</span></div><div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center"><span className="block font-bold mb-1">4</span><span className="text-[10px] uppercase font-bold text-gold-400">Note_Quiz</span></div></div></div></div>
                            <div className="border-4 border-dashed border-gray-200 rounded-[2.5rem] p-20 text-center hover:bg-gray-50 relative transition-all group cursor-pointer"><input type="file" accept=".xlsx,.csv" onChange={handleLessonFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="flex flex-col items-center pointer-events-none group-hover:scale-105 transition-transform"><div className="p-6 bg-royal-100 rounded-3xl mb-6 text-royal-700 shadow-inner"><Upload size={48} /></div><p className="font-bold text-xl text-gray-800">Tap to Upload Spreadsheet</p><p className="text-gray-400 mt-2 font-medium">{file ? file.name : "Ensure all 4 tabs are present"}</p></div></div>
                            {file && (<button onClick={processFile} disabled={isParsing} className="w-full py-5 bg-royal-800 text-white font-bold rounded-3xl hover:bg-royal-950 shadow-2xl transition-all flex items-center justify-center gap-4 text-xl">{isParsing ? <Loader2 className="animate-spin" /> : <ArrowRight />} BEGIN PARSING ENGINE</button>)}
                          </div>
                      ) : (
                          <div className="animate-in fade-in slide-in-from-bottom-8">
                              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-bold text-gray-900">Synchronized Import Preview</h3><button onClick={() => { setDraft(null); setFile(null); }} className="text-sm font-bold text-red-500 underline hover:text-red-700">Discard & Restart</button></div>
                              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl mb-8 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Layers size={100} /></div><div className="relative z-10"><h4 className="font-serif font-bold text-2xl flex items-center gap-3 mb-2"><BadgeCheck className="text-gold-500" /> Module: {draft.moduleMetadata?.title}</h4><p className="text-indigo-200 font-medium mb-6">{draft.moduleMetadata?.description}</p><div className="flex flex-wrap gap-4"><span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10">Certification: {draft.moduleMetadata?.certificateConfig.title}</span><span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10">Accuracy Threshold: {draft.moduleMetadata?.completionRule.minimumCompletionPercentage}%</span></div></div></div>
                              <div className="grid gap-4">{draft.lessons.map(l => (<div key={l.metadata.lesson_id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 flex justify-between items-center shadow-sm hover:border-royal-200 transition-colors"><div><div className="flex items-center gap-3 mb-1"><span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase tracking-tighter">Order {l.metadata.lesson_order}</span><h4 className="font-bold text-gray-900 text-lg">{l.metadata.title}</h4></div><p className="text-xs text-gray-400 font-medium">{l.bibleQuizzes.length} Bible Quizzes • {l.metadata.targetAudience} Level</p></div><CheckCircle size={28} className="text-green-500" /></div>))}</div>
                          </div>
                      )}
                   </div>
                )}
             </div>
          )}

          {contentType === 'homepage' && homepageContent && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in pb-20">
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 flex items-center gap-4 shadow-sm"><Home size={32} className="text-amber-600" /><p className="text-sm font-bold text-amber-900">Direct Branding Engine: These fields modify the public appearance of the landing page.</p></div>
                <div className="grid grid-cols-1 gap-10">
                   <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"><h3 className="font-bold text-gray-900 text-lg border-b pb-4 flex items-center gap-3"><ArrowRight className="text-indigo-500" /> Hero & Headlines</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className={labelClass}>Promo Tagline</label><input className={inputClass} value={homepageContent.heroTagline} onChange={e => setHomepageContent({...homepageContent, heroTagline: e.target.value})} /></div><div><label className={labelClass}>Main Title</label><input className={inputClass} value={homepageContent.heroTitle} onChange={e => setHomepageContent({...homepageContent, heroTitle: e.target.value})} /></div><div className="md:col-span-2"><label className={labelClass}>Hero Subtitle Paragraph</label><textarea className={`${inputClass} h-32`} value={homepageContent.heroSubtitle} onChange={e => setHomepageContent({...homepageContent, heroSubtitle: e.target.value})} /></div></div></div>
                   <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"><h3 className="font-bold text-gray-900 text-lg border-b pb-4 flex items-center gap-3"><ListChecks className="text-indigo-500" /> "Why BBL?" Checklist</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2"><label className={labelClass}>Section Heading</label><input className={inputClass} value={homepageContent.whyBblHeading} onChange={e => setHomepageContent({...homepageContent, whyBblHeading: e.target.value})} /></div><div><label className={labelClass}>Item 1</label><input className={inputClass} value={homepageContent.whyBblItem1} onChange={e => setHomepageContent({...homepageContent, whyBblItem1: e.target.value})} /></div><div><label className={labelClass}>Item 2</label><input className={inputClass} value={homepageContent.whyBblItem2} onChange={e => setHomepageContent({...homepageContent, whyBblItem2: e.target.value})} /></div><div><label className={labelClass}>Item 3</label><input className={inputClass} value={homepageContent.whyBblItem3} onChange={e => setHomepageContent({...homepageContent, whyBblItem3: e.target.value})} /></div><div><label className={labelClass}>Item 4</label><input className={inputClass} value={homepageContent.whyBblItem4} onChange={e => setHomepageContent({...homepageContent, whyBblItem4: e.target.value})} /></div></div></div>
                </div>
             </div>
          )}
       </div>

       <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-end gap-4 shrink-0">
          <button onClick={onCancel} className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors bg-white border border-gray-200">Cancel</button>
          
          {contentType === 'lesson' && mode === 'manual' && (
              <>
                 <button 
                   onClick={() => saveManualLesson(false)} 
                   className="px-10 py-3 bg-white border-2 border-royal-800 text-royal-800 font-bold rounded-2xl hover:bg-royal-50 flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-sm"
                 >
                    <Plus size={20} /> SAVE & ADD NEW LESSON
                 </button>
                 <button 
                   onClick={() => saveManualLesson(true)} 
                   className="px-10 py-3 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 shadow-xl flex items-center gap-3 transition-all transform hover:-translate-y-1"
                 >
                    <Save size={20} /> COMMIT TO LIBRARY
                 </button>
              </>
          )}

          {contentType === 'lesson' && mode === 'bulk' && (
             <button onClick={commitImport} disabled={!draft?.isValid} className="px-10 py-3 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:grayscale transition-all transform hover:-translate-y-1"><Save size={20} /> PERFORM SYNCHRONIZATION</button>
          )}

          {contentType === 'homepage' && (
             <button onClick={async () => { if (!homepageContent) return; try { await lessonService.updateHomepageContent(homepageContent); onSuccess(); } catch (e: any) { setError(e.message); } }} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl flex items-center gap-3"><Save size={20} /> Push Updates Live</button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;
