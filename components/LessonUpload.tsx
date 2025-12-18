import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem, HomepageContent, Module } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, X, Loader2, Save, Plus, Trash2, Edit3, BookOpen, File as FileIcon, Newspaper, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, Circle, AlertCircle, AlertTriangle, Home, Mail, Phone, MapPin, Share2, ListChecks, Layers, BadgeCheck } from 'lucide-react';

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

  // Bulk Import State
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Builder State
  const [modules, setModules] = useState<Module[]>([]);
  const [showModuleWizard, setShowModuleWizard] = useState(false);
  const [newModule, setNewModule] = useState<Partial<Module>>({
      id: '', title: '', description: '', 
      completionRule: { minimumCompletionPercentage: 100 },
      certificateConfig: { title: 'Certificate of Completion', description: '', templateId: 'classic', issuedBy: 'Build Biblical Leaders' }
  });

  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>(initialData ? { ...initialData } : {
    title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', book: '', chapter: 1, sections: [], moduleId: '', orderInModule: 1
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Homepage Content State
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
      if (contentType === 'homepage') {
          lessonService.getHomepageContent().then(setHomepageContent);
      }
      if (contentType === 'lesson') {
          lessonService.getModules().then(setModules);
      }
  }, [contentType]);

  // --- HANDLERS: MODULES ---
  const handleCreateModule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newModule.id || !newModule.title) return;
      const modObj: Module = {
          id: newModule.id,
          title: newModule.title,
          description: newModule.description || '',
          lessonIds: [],
          completionRule: newModule.completionRule || { minimumCompletionPercentage: 100 },
          certificateConfig: newModule.certificateConfig || { title: 'Certificate', description: '', templateId: 'classic', issuedBy: '' }
      };
      await lessonService.createModule(modObj);
      const updatedModules = await lessonService.getModules();
      setModules(updatedModules);
      setManualLesson(prev => ({ ...prev, moduleId: modObj.id }));
      setShowModuleWizard(false);
  };

  // --- HANDLERS: BULK IMPORT ---
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
    } catch (err: any) {
      setError("Failed to parse file: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const commitImport = async () => {
    if (!draft) return;
    try {
      await lessonService.commitDraft(draft, currentUser);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- HANDLERS: MANUAL BUILDER ---
  const saveManualLesson = async () => {
    setError(null);
    try {
      if (!manualLesson.title) throw new Error("Lesson Title is required");
      if (!manualLesson.moduleId) throw new Error("A module assignment is required for certificate tracking.");

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
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
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

  const updateSection = (id: string, updates: Partial<LessonSection>) => {
    setManualLesson(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === id ? { ...s, ...updates } : s) }));
  };

  const removeSection = (id: string) => {
    setManualLesson(prev => ({ ...prev, sections: prev.sections?.filter(s => s.id !== id) }));
  };

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
    setManualLesson(prev => ({
        ...prev,
        sections: prev.sections?.map(s => {
            if (s.id === sectionId) return { ...s, quizzes: [...(s.quizzes || []), { ...newQuiz, sequence: (s.quizzes?.length || 0) + 1 }] };
            return s;
        })
    }));
  };

  const updateQuestion = (sectionId: string, quizId: string, updates: Partial<QuizQuestion>) => {
      setManualLesson(prev => ({
          ...prev,
          sections: prev.sections?.map(s => {
              if (s.id === sectionId) return { ...s, quizzes: s.quizzes?.map(q => q.id === quizId ? { ...q, ...updates } : q) };
              return s;
          })
      }));
  };

  const updateOption = (sectionId: string, quizId: string, optionId: string, updates: Partial<QuizOption>) => {
      setManualLesson(prev => ({
          ...prev,
          sections: prev.sections?.map(s => {
              if (s.id === sectionId) {
                  return { 
                      ...s, 
                      quizzes: s.quizzes?.map(q => {
                          if (q.id === quizId) {
                              const updatedOptions = q.options.map(o => {
                                  if (updates.isCorrect && o.id !== optionId) return { ...o, isCorrect: false };
                                  if (o.id === optionId) return { ...o, ...updates };
                                  return o;
                              });
                              return { ...q, options: updatedOptions };
                          }
                          return q;
                      }) 
                  };
              }
              return s;
          })
      }));
  };

  const removeQuestion = (sectionId: string, quizId: string) => {
      setManualLesson(prev => ({
          ...prev,
          sections: prev.sections?.map(s => {
              if (s.id === sectionId) return { ...s, quizzes: s.quizzes?.filter(q => q.id !== quizId) };
              return s;
          })
      }));
  };

  const handleUpdateHomepage = async () => {
      if (!homepageContent) return;
      try { await lessonService.updateHomepageContent(homepageContent); onSuccess(); } catch (e: any) { setError(e.message); }
  };

  const renderAudienceOptions = () => (
    <>
        <option value="All">All Users (Public)</option>
        <option value="Student">(Student Only)</option>
        <option value="Mentors_Org_Parents">(Mentors, Org, Parents)</option>
        <option value="Mentor">(Mentors Only)</option>
        <option value="Organization">(Organization Only)</option>
        <option value="Parent">(Parent Only)</option>
    </>
  );

  const inputClass = "w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm";
  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] w-full max-w-6xl animate-in zoom-in-95 duration-200">
       
       <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    {initialData ? <Edit3 size={20} /> : <Upload size={20} />}
                </div>
                <h2 className="font-bold text-gray-800 text-lg">
                    {initialData ? 'Edit Content' : 'Upload Content'}
                </h2>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
          </div>

          {isAdmin && !initialData && (
             <div className="flex gap-2 p-1 bg-gray-200 rounded-lg w-max overflow-x-auto max-w-full">
                <button onClick={() => { setContentType('lesson'); setError(null); }} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${contentType === 'lesson' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <BookOpen size={16}/> Lessons
                </button>
                <button onClick={() => { setContentType('homepage'); setError(null); }} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${contentType === 'homepage' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <Home size={16}/> Homepage Content
                </button>
             </div>
          )}
       </div>

       <div id="upload-modal-content" className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
               <AlertCircle className="mt-0.5 flex-shrink-0" size={20} />
               <div>
                 <h4 className="font-bold text-sm">Validation Error</h4>
                 <p className="text-sm">{error}</p>
               </div>
            </div>
          )}

          {/* === LESSON UPLOAD UI === */}
          {contentType === 'lesson' && (
             <div className="space-y-6">
                {!initialData && (
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg flex shadow-inner">
                            <button onClick={() => setMode('bulk')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Excel Import (4 Sheets)</button>
                            <button onClick={() => setMode('manual')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Manual Builder</button>
                        </div>
                    </div>
                )}
                
                {mode === 'manual' ? (
                   <div className="max-w-5xl mx-auto space-y-8">
                      {/* MODULE ASSIGNMENT SECTION */}
                      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Module Assignment (Required)</h3>
                            <button onClick={() => setShowModuleWizard(true)} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700"><Plus size={14}/> Create New Module</button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Select Parent Module</label>
                                <select 
                                    className={`${inputClass} bg-white`} 
                                    value={manualLesson.moduleId} 
                                    onChange={e => setManualLesson({...manualLesson, moduleId: e.target.value})}
                                >
                                    <option value="">-- Choose Module --</option>
                                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Order in Module (1, 2, 3...)</label>
                                <input 
                                    type="number" 
                                    className={inputClass} 
                                    value={manualLesson.orderInModule} 
                                    onChange={e => setManualLesson({...manualLesson, orderInModule: parseInt(e.target.value)})}
                                />
                            </div>
                         </div>
                      </div>

                      {showModuleWizard && (
                          <div className="bg-white p-6 rounded-xl border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95">
                              <div className="flex justify-between mb-4 border-b pb-2">
                                  <h4 className="font-bold text-indigo-800 flex items-center gap-2"><BadgeCheck size={18}/> New Module Creation</h4>
                                  <button onClick={() => setShowModuleWizard(false)}><X size={16}/></button>
                              </div>
                              <form onSubmit={handleCreateModule} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className={labelClass}>Unique Module ID</label><input required placeholder="e.g. GENESIS-MOD-1" className={inputClass} value={newModule.id} onChange={e => setNewModule({...newModule, id: e.target.value.toUpperCase()})} /></div>
                                      <div><label className={labelClass}>Display Title</label><input required placeholder="Foundations of Faith" className={inputClass} value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} /></div>
                                  </div>
                                  <div><label className={labelClass}>Certificate Award Title</label><input required className={inputClass} value={newModule.certificateConfig?.title} onChange={e => setNewModule({...newModule, certificateConfig: {...newModule.certificateConfig!, title: e.target.value}})} /></div>
                                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700">Save Module & Link Lesson</button>
                              </form>
                          </div>
                      )}

                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Lesson Details</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><label className={labelClass}>Lesson Title</label><input className={inputClass} value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} placeholder="e.g. Genesis Chapter 1"/></div>
                            <div className="md:col-span-2"><label className={labelClass}>Description</label><input className={inputClass} value={manualLesson.description} onChange={e => setManualLesson({...manualLesson, description: e.target.value})} placeholder="Short summary"/></div>
                            <div><label className={labelClass}>Type</label><select className={`${inputClass} bg-white`} value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                            <div><label className={labelClass}>Audience</label><select className={`${inputClass} bg-white`} value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}>{renderAudienceOptions()}</select></div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <h3 className="font-bold text-gray-800 flex items-center gap-2">Content Sections</h3>
                             <div className="flex gap-2">
                                <button onClick={() => addSection('note')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 flex items-center gap-1">+ Note</button>
                                <button onClick={() => addSection('quiz_group')} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 flex items-center gap-1">+ Quiz Group</button>
                             </div>
                         </div>
                         {manualLesson.sections?.map((s, idx) => (
                             <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                 <div className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}>
                                     <div className="flex items-center gap-3">
                                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.type.replace('_', ' ')}</span>
                                         <span className="font-bold text-gray-800">{s.title}</span>
                                     </div>
                                     {expandedSection === s.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                 </div>
                                 {expandedSection === s.id && (
                                     <div className="p-6 border-t space-y-6">
                                         <div><label className={labelClass}>Section Title</label><input className={inputClass} value={s.title} onChange={e => updateSection(s.id, {title: e.target.value})} /></div>
                                         {s.type === 'note' ? (
                                             <div><label className={labelClass}>Note Body (HTML)</label><textarea className="w-full p-4 border rounded-lg h-60 font-mono text-sm" value={s.body || ''} onChange={e => updateSection(s.id, {body: e.target.value})} /></div>
                                         ) : (
                                             <div className="space-y-6">
                                                 <div className="flex justify-between items-center"><h4 className="font-bold text-sm">Questions ({s.quizzes?.length || 0})</h4><button onClick={() => addQuestion(s.id)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold">+ Add Question</button></div>
                                                 {s.quizzes?.map((q, qIdx) => (
                                                     <div key={q.id} className="bg-gray-50 p-5 rounded-xl border relative">
                                                         <button onClick={() => removeQuestion(s.id, q.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16}/></button>
                                                         <input className={`${inputClass} mb-2`} placeholder="Question Text" value={q.text} onChange={e => updateQuestion(s.id, q.id, {text: e.target.value})} />
                                                         <div className="space-y-2">{q.options.map(opt => (<div key={opt.id} className="flex gap-2"><button onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{opt.label}</button><input className="flex-1 p-2 border rounded-md" value={opt.text} onChange={e => updateOption(s.id, q.id, opt.id, {text: e.target.value})} /></div>))}</div>
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
                   <div className="space-y-8 max-w-4xl mx-auto">
                      {!draft ? (
                          <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100"><h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><HelpCircle size={20}/> New Excel Structure</h3><p className="text-sm text-blue-800 mb-4">Upload a single Excel file with 4 sheets: <strong>Module_Metadata</strong>, <strong>Lesson_Metadata</strong>, <strong>Bible_Quiz</strong>, and <strong>Note_Quiz</strong>.</p></div>
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 relative transition-colors cursor-pointer"><input type="file" accept=".xlsx,.csv" onChange={handleLessonFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><div className="flex flex-col items-center pointer-events-none"><Upload size={32} className="text-indigo-600 mb-4" /><p className="font-bold text-gray-700">Click to Upload Excel File</p><p className="text-sm text-gray-400 mt-1">{file ? file.name : "Drag & drop or browse"}</p></div></div>
                            {file && (<button onClick={processFile} disabled={isParsing} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">{isParsing ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />} Parse & Preview</button>)}
                          </div>
                      ) : (
                          <div className="animate-in fade-in slide-in-from-bottom-4">
                              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900">Import Preview</h3><button onClick={() => { setDraft(null); setFile(null); }} className="text-sm text-gray-500 hover:text-red-500 underline">Discard & Upload New</button></div>
                              
                              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
                                  <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2"><Layers size={20}/> Module: {draft.moduleMetadata?.title}</h4>
                                  <p className="text-sm text-indigo-700">{draft.moduleMetadata?.description}</p>
                                  <div className="mt-4 flex gap-4">
                                      <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-bold uppercase">Award: {draft.moduleMetadata?.certificateConfig.title}</span>
                                      <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-bold uppercase">Min Score: {draft.moduleMetadata?.completionRule.minimumCompletionPercentage}%</span>
                                  </div>
                              </div>

                              <div className="grid gap-4">
                                  {draft.lessons.map(l => (
                                      <div key={l.metadata.lesson_id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                                          <div>
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lesson {l.metadata.lesson_order}</span>
                                              <h4 className="font-bold text-gray-800">{l.metadata.title}</h4>
                                              <p className="text-xs text-gray-500">{l.bibleQuizzes.length + l.noteQuizzes.length} Questions • {l.metadata.targetAudience}</p>
                                          </div>
                                          <CheckCircle size={20} className="text-green-500" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                   </div>
                )}
             </div>
          )}

          {contentType === 'homepage' && homepageContent && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in pb-12">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                   <Home size={24} className="text-blue-600" />
                   <p className="text-sm text-blue-800">Changes made here will instantly update the text seen by guests on the landing page.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><ArrowRight size={16} className="text-indigo-500" /> Hero Section</h3>
                      <div><label className={labelClass}>Tagline</label><input className={inputClass} value={homepageContent.heroTagline} onChange={e => setHomepageContent({...homepageContent, heroTagline: e.target.value})} /></div>
                      <div><label className={labelClass}>Main Title</label><input className={inputClass} value={homepageContent.heroTitle} onChange={e => setHomepageContent({...homepageContent, heroTitle: e.target.value})} /></div>
                      <div><label className={labelClass}>Hero Subtitle</label><textarea className={`${inputClass} h-24`} value={homepageContent.heroSubtitle} onChange={e => setHomepageContent({...homepageContent, heroSubtitle: e.target.value})} /></div>
                   </div>
                   
                   <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
                      <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><ListChecks size={18} className="text-indigo-500" /> "Why BBL?" Section</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                         <div className="md:col-span-2"><label className={labelClass}>Section Heading</label><input className={inputClass} value={homepageContent.whyBblHeading} onChange={e => setHomepageContent({...homepageContent, whyBblHeading: e.target.value})} /></div>
                         <div><label className={labelClass}>Item 1</label><input className={inputClass} value={homepageContent.whyBblItem1} onChange={e => setHomepageContent({...homepageContent, whyBblItem1: e.target.value})} /></div>
                         <div><label className={labelClass}>Item 2</label><input className={inputClass} value={homepageContent.whyBblItem2} onChange={e => setHomepageContent({...homepageContent, whyBblItem2: e.target.value})} /></div>
                         <div><label className={labelClass}>Item 3</label><input className={inputClass} value={homepageContent.whyBblItem3} onChange={e => setHomepageContent({...homepageContent, whyBblItem3: e.target.value})} /></div>
                         <div><label className={labelClass}>Item 4</label><input className={inputClass} value={homepageContent.whyBblItem4} onChange={e => setHomepageContent({...homepageContent, whyBblItem4: e.target.value})} /></div>
                      </div>
                   </div>

                   <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
                      <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Share2 size={16} className="text-indigo-500" /> Footer Details</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                         <div className="lg:col-span-2"><label className={labelClass}>Footer Copyright Text</label><input className={inputClass} value={homepageContent.footerCopyright} onChange={e => setHomepageContent({...homepageContent, footerCopyright: e.target.value})} /></div>
                      </div>
                   </div>
                </div>
             </div>
          )}
       </div>

       <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 z-10 relative">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 bg-white">Cancel</button>
          
          {contentType === 'lesson' && (
             <button type="button" onClick={mode === 'manual' ? saveManualLesson : commitImport} disabled={mode === 'bulk' && (!draft?.isValid)} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"><Save size={18} /> {mode === 'manual' ? (initialData ? 'Update Lesson' : 'Save Lesson') : 'Import Module'}</button>
          )}

          {contentType === 'homepage' && (
             <button onClick={handleUpdateHomepage} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"><Save size={18} /> Update Homepage</button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;