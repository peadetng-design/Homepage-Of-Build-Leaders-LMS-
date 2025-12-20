import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem, HomepageContent, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, Newspaper, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, Circle, AlertCircle, AlertTriangle, Home, Mail, Phone, MapPin, Share2, ListChecks, Layers, BadgeCheck, PenTool, Check, Flag, Sparkles } from 'lucide-react';

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
  const [moduleComplete, setModuleComplete] = useState(false);

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

  const selectedModule = modules.find(m => m.id === manualLesson.moduleId);
  const totalInModule = selectedModule?.totalLessonsRequired || 0;
  const currentOrder = manualLesson.orderInModule || 1;
  const isTerminationPoint = totalInModule > 0 && currentOrder >= totalInModule;
  const isLimitExceeded = totalInModule > 0 && currentOrder > totalInModule;

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
      
      for (const section of manualLesson.sections || []) {
        if (section.type === 'quiz_group') {
          for (const [idx, quiz] of (section.quizzes || []).entries()) {
            if (!quiz.options.some(o => o.isCorrect)) {
              throw new Error(`Question #${idx + 1} in "${section.title}" has no correct answer selected.`);
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
        if (isTerminationPoint) {
            setModuleComplete(true);
            setSaveFeedback(`Module complete. Final lesson saved.`);
        } else {
            onSuccess();
        }
      } else {
        setManualLesson({
            title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', book: '', chapter: 1, sections: [], moduleId: manualLesson.moduleId, orderInModule: (manualLesson.orderInModule || 1) + 1 
        });
        setExpandedSection(null);
        setSaveFeedback(`Lesson "${finalLesson.title}" saved. Starting Lesson ${currentOrder + 1}.`);
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
    ...p, sections: p.sections?.map(s => s.id === secId ? { ...s, quizzes: s.quizzes?.map(q => q.id === qId ? { ...q, options: q.options.map(o => { if (upd.isCorrect && o.id !== oId) return { ...o, isCorrect: false }; if (o.id === oId) return { ...o, ...upd }; return o; }) } : q) } : s) 
  }));
  const removeQuestion = (secId: string, qId: string) => setManualLesson(p => ({ ...p, sections: p.sections?.map(s => s.id === secId ? { ...s, quizzes: s.quizzes?.filter(q => q.id !== qId) } : s) }));

  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block";
  const inputClass = "w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-royal-500 focus:border-royal-500 outline-none transition-all text-sm bg-white font-medium text-gray-800 shadow-sm";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] w-full max-w-6xl animate-in zoom-in-95 duration-200">
       <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className="bg-royal-800 text-white p-3 rounded-2xl shadow-lg">{initialData ? <Edit3 size={24} /> : <Upload size={24} />}</div>
              <div><h2 className="font-bold text-gray-800 text-xl">{initialData ? 'Edit Content' : 'Manual Builder'}</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Lesson Ingestion Console</p></div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={24} /></button>
       </div>

       <div id="upload-modal-content" className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#fdfdfd]">
          {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-start gap-4"><AlertCircle className="shrink-0" size={24} /><div><h4 className="font-bold text-lg">Alert</h4><p className="text-sm opacity-90">{error}</p></div></div>}
          {saveFeedback && <div className="bg-green-50 border-2 border-green-200 text-green-700 p-6 rounded-2xl mb-8 flex items-start gap-4"><CheckCircle className="shrink-0" size={24} /><div><h4 className="font-bold text-lg">Recorded</h4><p className="text-sm opacity-90">{saveFeedback}</p></div></div>}

          {moduleComplete ? (
               <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95">
                  <div className="bg-white border-4 border-gold-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10"><Check className="text-gold-600" size={64} strokeWidth={3} /></div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900">Module fulfilled.</h3>
                  <button onClick={onSuccess} className="px-12 py-4 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 shadow-xl">FINALIZE & EXIT</button>
               </div>
          ) : (
             <div className="max-w-5xl mx-auto space-y-10 pb-20">
                <div className="bg-indigo-50/50 p-8 rounded-3xl border-4 border-indigo-200 shadow-sm relative overflow-hidden">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-3"><Layers className="text-indigo-600"/> 1. Define Module</h3>
                      <button onClick={() => setShowModuleWizard(true)} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">New Module</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className={labelClass}>Module Container</label><select className={inputClass} value={manualLesson.moduleId} onChange={e => setManualLesson({...manualLesson, moduleId: e.target.value})}><option value="">-- Choose Module --</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                      <div><label className={labelClass}>Order in Module (of {totalInModule})</label><input type="number" className={inputClass} value={manualLesson.orderInModule} onChange={e => setManualLesson({...manualLesson, orderInModule: parseInt(e.target.value)})} /></div>
                   </div>
                </div>

                {showModuleWizard && (
                    <div className="bg-white p-8 rounded-3xl border-4 border-indigo-500 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between mb-6 border-b-2 pb-4"><h4 className="font-bold text-indigo-800 text-xl">Module Meta</h4><button onClick={() => setShowModuleWizard(false)}><X size={24}/></button></div>
                        <form onSubmit={handleCreateModule} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className={labelClass}>ID</label><input required className={inputClass} value={newModule.id} onChange={e => setNewModule({...newModule, id: e.target.value.toUpperCase()})} /></div>
                                <div><label className={labelClass}>Title</label><input required className={inputClass} value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} /></div>
                                <div><label className={labelClass}>Capacity</label><input type="number" required className={inputClass} value={newModule.totalLessonsRequired} onChange={e => setNewModule({...newModule, totalLessonsRequired: parseInt(e.target.value)})} /></div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl">Create Module</button>
                        </form>
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl border-4 border-gray-200 shadow-sm">
                   <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-3"><CheckCircle className="text-green-500"/> 2. Lesson Metadata</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><label className={labelClass}>Title</label><input className={inputClass} value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} /></div>
                      <div>
                        <label className={labelClass}>Audience Context</label>
                        <select className={inputClass} value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}>
                            <option value="All">All Users</option>
                            <option value="Student">Student Only</option>
                            <option value="Mentor">Mentor Only</option>
                            <option value="Parent">Parent Only</option>
                            <option value="Organization">Organization Only</option>
                            <option value="Mentors_Org_Parents">Mentor, Organization and Parent Only</option>
                        </select>
                      </div>
                      <div><label className={labelClass}>Type</label><select className={inputClass} value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-2xl border-4 border-gray-200"><h3 className="font-bold text-gray-800">3. Content Architecture</h3><div className="flex gap-2"><button onClick={() => addSection('note')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">+ Note</button><button onClick={() => addSection('quiz_group')} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold">+ Quiz Group</button></div></div>
                   {manualLesson.sections?.map((s) => (
                       <div key={s.id} className="border-4 border-gray-200 rounded-3xl overflow-hidden bg-white">
                           <div className="bg-gray-50/50 p-6 flex justify-between items-center cursor-pointer" onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}>
                               <div className="flex items-center gap-4"><span className="font-bold">{s.title}</span></div>
                               {expandedSection === s.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                           </div>
                           {expandedSection === s.id && (
                               <div className="p-8 border-t-2 border-gray-200 space-y-8 animate-in slide-in-from-top-4">
                                   {s.type === 'note' ? (
                                       <div><label className={labelClass}>Body (Rich Text)</label><textarea className="w-full p-5 border-4 border-gray-300 rounded-2xl h-80" value={s.body || ''} onChange={e => updateSection(s.id, {body: e.target.value})} /></div>
                                   ) : (
                                       <div className="space-y-8">
                                           <div className="flex justify-between items-center"><h4 className="font-bold text-sm uppercase text-gray-400">Questions ({s.quizzes?.length || 0})</h4><button onClick={() => addQuestion(s.id)} className="text-xs font-bold bg-royal-100 text-royal-700 px-4 py-2 rounded-xl border border-royal-200">+ Add Question</button></div>
                                           {s.quizzes?.map((q) => (
                                               <div key={q.id} className="bg-slate-50 p-6 rounded-3xl border-4 border-slate-200 relative">
                                                   <button onClick={() => removeQuestion(s.id, q.id)} className="absolute top-4 right-4 text-red-400"><Trash2 size={20}/></button>
                                                   <div className="space-y-6">
                                                      <div>
                                                          <label className={labelClass}>Reference Text (60% Font Scale)</label>
                                                          <textarea className="w-full p-4 border-4 border-gray-300 rounded-2xl font-bold text-[9px] bg-white h-24" value={q.reference || ''} onChange={e => updateQuestion(s.id, q.id, {reference: e.target.value})} />
                                                      </div>
                                                      <div><label className={labelClass}>Prompt</label><input className={inputClass} value={q.text} onChange={e => updateQuestion(s.id, q.id, {text: e.target.value})} /></div>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                          {q.options.map(opt => (
                                                            <div key={opt.id} className={`p-4 rounded-2xl border-4 transition-all ${opt.isCorrect ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}>
                                                              <div className="flex gap-3 items-center mb-3">
                                                                <button onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})} className={`w-10 h-10 rounded-xl border-4 flex items-center justify-center font-bold ${opt.isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300 text-gray-400'}`}>{opt.isCorrect ? <Check size={20}/> : opt.label}</button>
                                                                <input className="flex-1 p-2 bg-transparent font-bold" value={opt.text} onChange={e => updateOption(s.id, q.id, opt.id, {text: e.target.value})} />
                                                              </div>
                                                            </div>
                                                          ))}
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
          )}
       </div>

       <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-end gap-4 shrink-0">
          <button onClick={onCancel} className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors bg-white border-2 border-gray-300">Cancel</button>
          {!moduleComplete && (
              <button onClick={() => saveManualLesson(true)} className={`px-10 py-3 font-bold rounded-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl border-4 ${isTerminationPoint ? 'bg-gold-500 border-gold-600 text-white' : 'bg-royal-800 border-royal-900 text-white'}`}>
                <Save size={20} /> {isTerminationPoint ? 'SAVE & FINISH MODULE' : 'COMMIT & EXIT'}
              </button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;