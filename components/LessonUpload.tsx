import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, HomepageContent, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, AlertCircle, AlertTriangle, Home, ListChecks, Layers, BadgeCheck, PenTool, Check, Flag, Info } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson;
}

type ContentType = 'lesson' | 'resource' | 'news' | 'homepage';

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData }) => {
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [metricMode, setMetricMode] = useState<'manual' | 'bulk'>(initialData ? 'manual' : 'bulk');

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
      
      // Proactive Check: If user clicks "Save & Add Another" but they are already on the last expected lesson
      if (!shouldClose && isTerminationPoint) {
          throw new Error("THE MODULE HAS ALREADY REACHED ITS SPECIFIED NUMBER OF LESSONS");
      }

      for (const section of manualLesson.sections || []) {
        if (section.type === 'quiz_group') {
          for (const [idx, quiz] of (section.quizzes || []).entries()) {
            if (!quiz.options.some(o => o.isCorrect)) {
              throw new Error(`CRITICAL ERROR: Question #${idx + 1} in "${section.title}" has NO correct answer selected. Users cannot be scored correctly until an option is marked as correct.`);
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
        authorId: initialData?.authorId || currentUser.id,
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
        setSaveFeedback(`Lesson "${finalLesson.title}" saved. Ready for Lesson ${currentOrder + 1}.`);
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
              <div><h2 className="font-bold text-gray-800 text-xl">{initialData ? 'Edit Content' : 'Manual Builder'}</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">LMS Console</p></div>
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
          {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-in slide-in-from-top-4 shadow-lg ring-4 ring-red-100"><AlertTriangle className="shrink-0 text-red-500" size={32} /><div><h4 className="font-black text-xl uppercase tracking-tighter mb-1 text-red-600">Action Blocked</h4><p className="text-sm font-bold opacity-90 leading-relaxed">{error}</p></div></div>}
          {saveFeedback && <div className="bg-green-50 border-2 border-green-200 text-green-700 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-in slide-in-from-top-4 shadow-lg"><CheckCircle className="shrink-0 text-green-500" size={32} /><div><h4 className="font-black text-xl uppercase tracking-tighter mb-1 text-red-600">Recorded</h4><p className="text-sm font-bold opacity-90">{saveFeedback}</p></div></div>}

          {contentType === 'lesson' && (
             <div className="space-y-8">
                {!initialData && !moduleComplete && (
                    <div className="flex justify-center">
                        <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner">
                            <button onClick={() => setMetricMode('bulk')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${metricMode === 'bulk' ? 'bg-white shadow-xl text-royal-700' : 'text-gray-500'}`}><FileIcon size={18}/> Excel Import</button>
                            <button onClick={() => setMetricMode('manual')} className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${metricMode === 'manual' ? 'bg-white shadow-xl text-royal-700' : 'text-gray-500'}`}><PenTool size={18}/> Manual Builder</button>
                        </div>
                    </div>
                )}

                {moduleComplete ? (
                   <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95">
                      <div className="bg-white border-4 border-gold-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10"><Check className="text-gold-600" size={64} strokeWidth={3} /></div>
                      <h3 className="text-3xl font-serif font-bold text-gray-900">Termination Point Fulfilled.</h3>
                      <button onClick={onSuccess} className="px-12 py-4 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 shadow-xl transition-all">FINALIZE & EXIT</button>
                   </div>
                ) : metricMode === 'manual' ? (
                   <div className="max-w-5xl mx-auto space-y-10 pb-20">
                      <div className="bg-indigo-50/50 p-8 rounded-3xl border-4 border-indigo-200 shadow-sm relative overflow-hidden">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-3"><Layers className="text-indigo-600"/> 1. Assign to Module</h3>
                            <button onClick={() => setShowModuleWizard(true)} className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">New Module</button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelClass}>Module Selection</label><select className={inputClass} value={manualLesson.moduleId} onChange={e => setManualLesson({...manualLesson, moduleId: e.target.value})}><option value="">-- Choose Module for Certification --</option>{modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                            <div><label className={labelClass}>Lesson Order (Target: {totalInModule})</label><input type="number" className={inputClass} value={manualLesson.orderInModule} onChange={e => setManualLesson({...manualLesson, orderInModule: parseInt(e.target.value)})} /></div>
                         </div>
                      </div>

                      {showModuleWizard && (
                          <div className="bg-white p-8 rounded-3xl border-4 border-indigo-500 shadow-2xl animate-in zoom-in-95">
                              <div className="flex justify-between mb-6 border-b-2 pb-4"><h4 className="font-bold text-indigo-800 text-xl">Module Definitions</h4><button onClick={() => setShowModuleWizard(false)}><X size={24}/></button></div>
                              <form onSubmit={handleCreateModule} className="space-y-6">
                                  <div className="grid grid-cols-2 gap-6">
                                      <div><label className={labelClass}>Module ID</label><input required className={inputClass} value={newModule.id} onChange={e => setNewModule({...newModule, id: e.target.value.toUpperCase()})} /></div>
                                      <div><label className={labelClass}>Title</label><input required className={inputClass} value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} /></div>
                                      <div><label className={labelClass}>Max Lessons</label><input type="number" required className={inputClass} value={newModule.totalLessonsRequired} onChange={e => setNewModule({...newModule, totalLessonsRequired: parseInt(e.target.value)})} /></div>
                                  </div>
                                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl">Create Module Container</button>
                              </form>
                          </div>
                      )}

                      <div className="bg-white p-8 rounded-3xl border-4 border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-3"><CheckCircle className="text-green-500"/> 2. Meta Information</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className={labelClass}>Lesson Title</label><input className={inputClass} value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} /></div>
                            <div>
                                <label className={labelClass}>Target Audience Context</label>
                                <select className={inputClass} value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}>
                                    <option value="All">All Users</option>
                                    <option value="Student">Student Only</option>
                                    <option value="Mentor">Mentor Only</option>
                                    <option value="Parent">Parent Only</option>
                                    <option value="Organization">Organization Only</option>
                                    <option value="Mentors_Org_Parents">Mentor, Org and Parent Only</option>
                                </select>
                            </div>
                            <div><label className={labelClass}>Lesson Type</label><select className={inputClass} value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-2xl border-4 border-gray-200"><h3 className="font-bold text-gray-800">3. Content Architecture</h3><div className="flex gap-2"><button onClick={() => addSection('note')} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm">+ Note</button><button onClick={() => addSection('quiz_group')} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-sm">+ Quiz Group</button></div></div>
                         {manualLesson.sections?.map((s) => (
                             <div key={s.id} className="border-4 border-gray-200 rounded-3xl overflow-hidden bg-white shadow-md">
                                 <div className="bg-gray-50/50 p-6 flex justify-between items-center cursor-pointer" onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}>
                                     <div className="flex items-center gap-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.type}</span><span className="font-bold text-gray-950">{s.title}</span></div>
                                     <div className="flex items-center gap-4">
                                        {s.type === 'quiz_group' && (
                                            <div className="flex gap-1">
                                                {(s.quizzes || []).map((q, idx) => (
                                                    <div key={q.id} className={`w-2 h-2 rounded-full ${q.options.some(o => o.isCorrect) ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} title={`Question ${idx+1} status`}></div>
                                                ))}
                                            </div>
                                        )}
                                        {expandedSection === s.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                                     </div>
                                 </div>
                                 {expandedSection === s.id && (
                                     <div className="p-8 border-t-2 border-gray-200 space-y-8 animate-in slide-in-from-top-4">
                                         <div><label className={labelClass}>Component Heading</label><input className={inputClass} value={s.title} onChange={e => updateSection(s.id, {title: e.target.value})} /></div>
                                         {s.type === 'note' ? (
                                             <div><label className={labelClass}>Leadership Note Text (Rich Body)</label><textarea className="w-full p-5 border-4 border-gray-300 rounded-2xl h-80 focus:border-royal-500 outline-none transition-all font-sans" value={s.body || ''} onChange={e => updateSection(s.id, {body: e.target.value})} /></div>
                                         ) : (
                                             <div className="space-y-8">
                                                 <div className="flex justify-between items-center"><h4 className="font-bold text-sm uppercase text-gray-400">Question Queue ({s.quizzes?.length || 0})</h4><button onClick={() => addQuestion(s.id)} className="text-xs font-bold bg-royal-100 text-royal-700 px-4 py-2 rounded-xl border border-royal-200">+ Add Question</button></div>
                                                 
                                                 {/* INSTRUCTIONAL BANNER */}
                                                 <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                                                     <Info className="text-amber-600 shrink-0" size={24}/>
                                                     <p className="text-xs font-black text-amber-900 uppercase tracking-tighter">Crucial Step: Tap the circular label (A, B, C, or D) to identify the correct answer for each question. This enables the system to score students.</p>
                                                 </div>

                                                 {s.quizzes?.map((q, idx) => {
                                                     const hasCorrectAnswer = q.options.some(o => o.isCorrect);
                                                     return (
                                                     <div key={q.id} className={`bg-slate-50 p-6 rounded-3xl border-4 transition-all relative ${hasCorrectAnswer ? 'border-slate-200' : 'border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}>
                                                         <button onClick={() => removeQuestion(s.id, q.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={20}/></button>
                                                         
                                                         <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
                                                            <span className="font-black text-slate-400 uppercase tracking-widest text-xs">Question #{idx + 1}</span>
                                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${hasCorrectAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                                                                {hasCorrectAnswer ? <Check size={12}/> : <AlertTriangle size={12}/>}
                                                                {hasCorrectAnswer ? 'Answer Verified' : 'Missing Correct Answer'}
                                                            </div>
                                                         </div>

                                                         <div className="space-y-6">
                                                            <div>
                                                                <label className={labelClass}>Reference Text (Academic Preview)</label>
                                                                <textarea className="w-full p-8 border-4 border-gray-300 rounded-2xl font-semibold text-xl bg-royal-50/30 text-slate-800 h-32 outline-none focus:border-royal-500 transition-all font-sans" placeholder="Enter reference text (scripture or core reading)..." value={q.reference || ''} onChange={e => updateQuestion(s.id, q.id, {reference: e.target.value})} />
                                                            </div>
                                                            <div><label className={labelClass}>Question Prompt Text</label><input className={inputClass} placeholder="Enter your question prompt..." value={q.text} onChange={e => updateQuestion(s.id, q.id, {text: e.target.value})} /></div>
                                                            
                                                            <div className="bg-royal-950/5 p-4 rounded-2xl border-2 border-royal-950/10 mb-2">
                                                                <p className="text-[10px] font-black text-royal-800 uppercase tracking-widest text-center">Tap A, B, C, or D below to mark the correct choice:</p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {q.options.map(opt => (
                                                                  <div key={opt.id} className={`p-4 rounded-2xl border-4 transition-all ${opt.isCorrect ? 'bg-green-50 border-green-500 shadow-md ring-4 ring-green-100' : 'bg-white border-gray-200 hover:border-royal-200 shadow-sm'}`}>
                                                                    <div className="flex gap-3 items-center mb-3">
                                                                      <button 
                                                                        onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})} 
                                                                        className={`shrink-0 w-12 h-12 rounded-xl border-4 flex items-center justify-center font-black transition-all transform active:scale-90 ${opt.isCorrect ? 'bg-green-600 text-white border-green-700 shadow-lg scale-110' : 'bg-white border-gray-300 text-gray-400 hover:bg-royal-50 hover:border-royal-400 ' + (!hasCorrectAnswer ? 'animate-bounce' : '')}`}
                                                                        title="Mark as Correct Answer"
                                                                      >
                                                                          {opt.isCorrect ? <Check size={24} strokeWidth={3}/> : opt.label}
                                                                      </button>
                                                                      <input className="flex-1 p-2 bg-transparent font-bold outline-none text-gray-800 placeholder:text-gray-300" placeholder={`Type Option ${opt.label}...`} value={opt.text} onChange={e => updateOption(s.id, q.id, opt.id, {text: e.target.value})} />
                                                                    </div>
                                                                    <div className="relative">
                                                                        <textarea className="w-full p-2 text-sm border-2 border-dashed border-gray-200 rounded-lg h-20 outline-none bg-white/50 focus:bg-white focus:border-royal-300 transition-colors font-medium text-gray-600" placeholder="Explanation (Revealed at scale text-xl after answer)..." value={opt.explanation} onChange={e => updateOption(s.id, q.id, opt.id, {explanation: e.target.value})} />
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                            </div>
                                                         </div>
                                                     </div>
                                                 )})}
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
                            <div className="bg-royal-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden border-4 border-royal-950"><div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="relative z-10"><h3 className="text-2xl font-serif font-bold mb-4 flex items-center gap-3"><HelpCircle className="text-gold-400"/> Mass Upload System</h3><p className="text-indigo-200 text-lg">Synchronize entire modules using our spreadsheet protocol.</p></div></div>
                            <div className="border-4 border-dashed border-gray-300 rounded-[2.5rem] p-20 text-center hover:bg-gray-50 relative transition-all group cursor-pointer"><input type="file" accept=".xlsx,.csv" onChange={handleLessonFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="flex flex-col items-center pointer-events-none group-hover:scale-105 transition-transform"><div className="p-6 bg-royal-100 rounded-3xl mb-6 text-royal-700 shadow-inner"><Upload size={48} /></div><p className="font-bold text-xl text-gray-800">Tap to Upload Protocol File</p><p className="text-gray-400 mt-2 font-black">{file ? file.name : "XLSX or CSV required"}</p></div></div>
                            {file && (<button onClick={processFile} disabled={isParsing} className="w-full py-5 bg-royal-800 text-white font-bold rounded-3xl hover:bg-royal-950 shadow-2xl transition-all flex items-center justify-center gap-4 text-xl border-4 border-royal-900">{isParsing ? <Loader2 className="animate-spin" /> : <ArrowRight />} START PARSING ENGINE</button>)}
                          </div>
                      ) : (
                          <div className="animate-in fade-in slide-in-from-bottom-8">
                              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-bold text-gray-900">Module Sync Preview</h3><button onClick={() => { setDraft(null); setFile(null); }} className="text-sm font-bold text-red-500 underline hover:text-red-700">Discard Data</button></div>
                              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl mb-8 border-4 border-indigo-950"><h4 className="font-serif font-bold text-2xl mb-2">Module: {draft.moduleMetadata?.title}</h4><p className="text-indigo-200 font-medium mb-6">{draft.moduleMetadata?.description}</p></div>
                              <div className="grid gap-4">{draft.lessons.map(l => (<div key={l.metadata.lesson_id} className="bg-white border-4 border-gray-100 rounded-2xl p-6 flex justify-between items-center shadow-sm"><div><h4 className="font-bold text-gray-900 text-lg">{l.metadata.title}</h4><p className="text-xs text-gray-400 font-black">{l.bibleQuizzes.length} Bible Quizzes Identified</p></div><CheckCircle size={28} className="text-green-500" /></div>))}</div>
                          </div>
                      )}
                   </div>
                )}
             </div>
          )}

          {contentType === 'homepage' && homepageContent && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in pb-20">
                <div className="bg-amber-50 p-6 rounded-3xl border-4 border-amber-100 flex items-center gap-4 shadow-sm"><Home size={32} className="text-amber-600" /><p className="text-sm font-bold text-amber-900">Branding & CMS Engine: Customize every text element on the landing page.</p></div>
                
                {/* 1. Hero */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">1. Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Promo Tagline</label><input className={inputClass} value={homepageContent.heroTagline} onChange={e => setHomepageContent({...homepageContent, heroTagline: e.target.value})} /></div>
                        <div><label className={labelClass}>Main Hero Title</label><input className={inputClass} value={homepageContent.heroTitle} onChange={e => setHomepageContent({...homepageContent, heroTitle: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Animated Hero Subtitle</label><textarea className={`${inputClass} h-32 border-4`} value={homepageContent.heroSubtitle} onChange={e => setHomepageContent({...homepageContent, heroSubtitle: e.target.value})} /></div>
                    </div>
                </div>

                {/* 2. Mission & Cards */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">2. Mission & About Us</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Mission Small Tag</label><input className={inputClass} value={homepageContent.aboutMission} onChange={e => setHomepageContent({...homepageContent, aboutMission: e.target.value})} /></div>
                        <div><label className={labelClass}>Main About Heading</label><input className={inputClass} value={homepageContent.aboutHeading} onChange={e => setHomepageContent({...homepageContent, aboutHeading: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>About Body Text</label><textarea className={`${inputClass} h-40 border-4`} value={homepageContent.aboutBody} onChange={e => setHomepageContent({...homepageContent, aboutBody: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Knowledge Card Title</label><input className={inputClass} value={homepageContent.knowledgeTitle} onChange={e => setHomepageContent({...homepageContent, knowledgeTitle: e.target.value})} /></div>
                        <div><label className={labelClass}>Knowledge Card Desc</label><input className={inputClass} value={homepageContent.knowledgeDesc} onChange={e => setHomepageContent({...homepageContent, knowledgeDesc: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Community Card Title</label><input className={inputClass} value={homepageContent.communityTitle} onChange={e => setHomepageContent({...homepageContent, communityTitle: e.target.value})} /></div>
                        <div><label className={labelClass}>Community Card Desc</label><input className={inputClass} value={homepageContent.communityDesc} onChange={e => setHomepageContent({...homepageContent, communityDesc: e.target.value})} /></div>
                    </div>
                </div>

                {/* 3. Why BBL */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">3. "Why BBL?" Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className={labelClass}>Section Heading</label><input className={inputClass} value={homepageContent.whyBblHeading} onChange={e => setHomepageContent({...homepageContent, whyBblHeading: e.target.value})} /></div>
                        <div><label className={labelClass}>Item 1</label><input className={inputClass} value={homepageContent.whyBblItem1} onChange={e => setHomepageContent({...homepageContent, whyBblItem1: e.target.value})} /></div>
                        <div><label className={labelClass}>Item 2</label><input className={inputClass} value={homepageContent.whyBblItem2} onChange={e => setHomepageContent({...homepageContent, whyBblItem2: e.target.value})} /></div>
                        <div><label className={labelClass}>Item 3</label><input className={inputClass} value={homepageContent.whyBblItem3} onChange={e => setHomepageContent({...homepageContent, whyBblItem3: e.target.value})} /></div>
                        <div><label className={labelClass}>Item 4</label><input className={inputClass} value={homepageContent.whyBblItem4} onChange={e => setHomepageContent({...homepageContent, whyBblItem4: e.target.value})} /></div>
                    </div>
                </div>

                {/* 4. Features */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">4. Study Materials & Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Main Heading</label><input className={inputClass} value={homepageContent.resourcesHeading} onChange={e => setHomepageContent({...homepageContent, resourcesHeading: e.target.value})} /></div>
                        <div><label className={labelClass}>Resources Title</label><input className={inputClass} value={homepageContent.resourcesTitle} onChange={e => setHomepageContent({...homepageContent, resourcesTitle: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Resources Subtitle</label><textarea className={`${inputClass} h-24 border-4`} value={homepageContent.resourcesSubtitle} onChange={e => setHomepageContent({...homepageContent, resourcesSubtitle: e.target.value})} /></div>
                        
                        <div className="md:col-span-2 border-t-2 pt-6 mt-4"><h4 className="font-bold text-sm text-gray-400 uppercase">Feature 1: Study Guides</h4></div>
                        <div><label className={labelClass}>Title</label><input className={inputClass} value={homepageContent.feature1Title} onChange={e => setHomepageContent({...homepageContent, feature1Title: e.target.value})} /></div>
                        <div><label className={labelClass}>Button Text</label><input className={inputClass} value={homepageContent.feature1Button} onChange={e => setHomepageContent({...homepageContent, feature1Button: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea className={`${inputClass} h-20`} value={homepageContent.feature1Desc} onChange={e => setHomepageContent({...homepageContent, feature1Desc: e.target.value})} /></div>

                        <div className="md:col-span-2 border-t-2 pt-6 mt-4"><h4 className="font-bold text-sm text-gray-400 uppercase">Feature 2: Flashcards</h4></div>
                        <div><label className={labelClass}>Title</label><input className={inputClass} value={homepageContent.feature2Title} onChange={e => setHomepageContent({...homepageContent, feature2Title: e.target.value})} /></div>
                        <div><label className={labelClass}>Button Text</label><input className={inputClass} value={homepageContent.feature2Button} onChange={e => setHomepageContent({...homepageContent, feature2Button: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea className={`${inputClass} h-20`} value={homepageContent.feature2Desc} onChange={e => setHomepageContent({...homepageContent, feature2Desc: e.target.value})} /></div>

                        <div className="md:col-span-2 border-t-2 pt-6 mt-4"><h4 className="font-bold text-sm text-gray-400 uppercase">Feature 3: Quiz Generator</h4></div>
                        <div><label className={labelClass}>Title</label><input className={inputClass} value={homepageContent.feature3Title} onChange={e => setHomepageContent({...homepageContent, feature3Title: e.target.value})} /></div>
                        <div><label className={labelClass}>Button Text</label><input className={inputClass} value={homepageContent.feature3Button} onChange={e => setHomepageContent({...homepageContent, feature3Button: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea className={`${inputClass} h-20`} value={homepageContent.feature3Desc} onChange={e => setHomepageContent({...homepageContent, feature3Desc: e.target.value})} /></div>
                    </div>
                </div>

                {/* 5. News */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">5. News & Announcements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Section Tagline</label><input className={inputClass} value={homepageContent.newsTagline} onChange={e => setHomepageContent({...homepageContent, newsTagline: e.target.value})} /></div>
                        <div><label className={labelClass}>Section Heading</label><input className={inputClass} value={homepageContent.newsHeading} onChange={e => setHomepageContent({...homepageContent, newsHeading: e.target.value})} /></div>
                        
                        <div className="md:col-span-2 border-t-2 pt-6 mt-4"><h4 className="font-bold text-sm text-gray-400 uppercase">Latest Article 1</h4></div>
                        <div><label className={labelClass}>Tag (e.g. Tournament)</label><input className={inputClass} value={homepageContent.news1Tag} onChange={e => setHomepageContent({...homepageContent, news1Tag: e.target.value})} /></div>
                        <div><label className={labelClass}>Date</label><input className={inputClass} value={homepageContent.news1Date} onChange={e => setHomepageContent({...homepageContent, news1Date: e.target.value})} /></div>
                        <div><label className={labelClass}>Title</label><input className={inputClass} value={homepageContent.news1Title} onChange={e => setHomepageContent({...homepageContent, news1Title: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Content</label><textarea className={`${inputClass} h-24`} value={homepageContent.news1Content} onChange={e => setHomepageContent({...homepageContent, news1Content: e.target.value})} /></div>

                        <div className="md:col-span-2 border-t-2 pt-6 mt-4"><h4 className="font-bold text-sm text-gray-400 uppercase">Latest Article 2</h4></div>
                        <div><label className={labelClass}>Tag (e.g. Update)</label><input className={inputClass} value={homepageContent.news2Tag} onChange={e => setHomepageContent({...homepageContent, news2Tag: e.target.value})} /></div>
                        <div><label className={labelClass}>Date</label><input className={inputClass} value={homepageContent.news2Date} onChange={e => setHomepageContent({...homepageContent, news2Date: e.target.value})} /></div>
                        <div><label className={labelClass}>Title</label><input className={inputClass} value={homepageContent.news2Title} onChange={e => setHomepageContent({...homepageContent, news2Title: e.target.value})} /></div>
                        <div className="md:col-span-2"><label className={labelClass}>Content</label><textarea className={`${inputClass} h-24`} value={homepageContent.news2Content} onChange={e => setHomepageContent({...homepageContent, news2Content: e.target.value})} /></div>
                    </div>
                </div>

                {/* 6. Footer */}
                <div className="space-y-6 bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-lg border-b-2 pb-4">6. Footer Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><label className={labelClass}>Footer Tagline</label><textarea className={`${inputClass} h-20`} value={homepageContent.footerTagline} onChange={e => setHomepageContent({...homepageContent, footerTagline: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Social Links (Comma separated)</label><input className={inputClass} value={homepageContent.footerSocials} onChange={e => setHomepageContent({...homepageContent, footerSocials: e.target.value})} /></div>
                        <div><label className={labelClass}>Contact Heading</label><input className={inputClass} value={homepageContent.footerContactHeading} onChange={e => setHomepageContent({...homepageContent, footerContactHeading: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Email Address</label><input className={inputClass} value={homepageContent.footerEmail} onChange={e => setHomepageContent({...homepageContent, footerEmail: e.target.value})} /></div>
                        <div><label className={labelClass}>Phone Number</label><input className={inputClass} value={homepageContent.footerPhone} onChange={e => setHomepageContent({...homepageContent, footerPhone: e.target.value})} /></div>
                        
                        <div className="md:col-span-2"><label className={labelClass}>Physical Address</label><input className={inputClass} value={homepageContent.footerAddress} onChange={e => setHomepageContent({...homepageContent, footerAddress: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Quick Info Heading</label><input className={inputClass} value={homepageContent.footerQuickInfoHeading} onChange={e => setHomepageContent({...homepageContent, footerQuickInfoHeading: e.target.value})} /></div>
                        <div><label className={labelClass}>Quick Info Items (Comma separated)</label><input className={inputClass} value={homepageContent.footerQuickInfoItems} onChange={e => setHomepageContent({...homepageContent, footerQuickInfoItems: e.target.value})} /></div>
                        
                        <div className="md:col-span-2"><label className={labelClass}>Copyright Text</label><input className={inputClass} value={homepageContent.footerCopyright} onChange={e => setHomepageContent({...homepageContent, footerCopyright: e.target.value})} /></div>
                        
                        <div><label className={labelClass}>Privacy Policy Label</label><input className={inputClass} value={homepageContent.footerPrivacyText} onChange={e => setHomepageContent({...homepageContent, footerPrivacyText: e.target.value})} /></div>
                        <div><label className={labelClass}>Terms of Service Label</label><input className={inputClass} value={homepageContent.footerTermsText} onChange={e => setHomepageContent({...homepageContent, footerTermsText: e.target.value})} /></div>
                    </div>
                </div>
             </div>
          )}
       </div>

       <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-end gap-4 shrink-0">
          <button onClick={onCancel} className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-2xl transition-colors bg-white border-2 border-gray-300">Cancel Action</button>
          
          {contentType === 'lesson' && metricMode === 'manual' && !moduleComplete && (
              <>
                 <button 
                   onClick={() => saveManualLesson(false)} 
                   disabled={isLimitExceeded}
                   className="px-10 py-3 bg-white border-4 border-royal-800 text-royal-800 font-bold rounded-2xl hover:bg-royal-50 flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-sm disabled:opacity-50"
                 >
                    <Plus size={20} /> SAVE & ADD ANOTHER
                 </button>
                 
                 <button 
                   onClick={() => saveManualLesson(true)} 
                   className={`px-10 py-3 font-bold rounded-2xl flex items-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl border-4 ${isTerminationPoint ? 'bg-gold-500 border-gold-600 text-white hover:bg-gold-600' : 'bg-royal-800 border-royal-900 text-white hover:bg-royal-950'}`}
                 >
                    {isTerminationPoint ? <Flag size={20} /> : <Save size={20} />} 
                    {isTerminationPoint ? 'SAVE & FINISH MODULE' : 'COMMIT & CLOSE'}
                 </button>
              </>
          )}

          {contentType === 'lesson' && metricMode === 'bulk' && (
             <button onClick={commitImport} disabled={!draft?.isValid} className="px-10 py-3 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 shadow-xl flex items-center justify-center gap-3 border-4 border-royal-900 transition-all transform hover:-translate-y-1"><Save size={20} /> SYNCHRONIZE DATA</button>
          )}

          {contentType === 'homepage' && (
             <button onClick={async () => { if (!homepageContent) return; try { await lessonService.updateHomepageContent(homepageContent); onSuccess(); } catch (e: any) { setError(e.message); } }} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl flex items-center justify-center gap-3 border-4 border-indigo-800 transition-all transform hover:-translate-y-1"><Save size={20} /> Push Updates Live</button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;