
import React, { useState } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, FileText, Check, AlertTriangle, X, Loader2, Save, Plus, Trash2, Users, Edit3, BookOpen, File as FileIcon, Newspaper, ChevronDown, ChevronUp, CheckCircle, HelpCircle, ArrowRight, MousePointerClick } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson;
}

type ContentType = 'lesson' | 'resource' | 'news';

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData }) => {
  const [contentType, setContentType] = useState<ContentType>('lesson');
  
  // Mode State
  const [mode, setMode] = useState<'manual' | 'bulk'>(initialData ? 'manual' : 'bulk');

  // Bulk Import State
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkTargetAudience, setBulkTargetAudience] = useState<TargetAudience>('All');

  // Manual Builder State
  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>(initialData ? { ...initialData } : {
    title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', book: '', chapter: 1, sections: []
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Resource & News State
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'Announcement'|'Event'|'Update'>('Announcement');

  const isAdmin = currentUser.role === UserRole.ADMIN;

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
      draft.metadata.targetAudience = bulkTargetAudience;
      const lesson = lessonService.convertDraftToLesson(draft, currentUser);
      await lessonService.publishLesson(lesson);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- HANDLERS: MANUAL BUILDER ---

  const saveManualLesson = async () => {
    try {
      if (!manualLesson.title) throw new Error("Title is required");
      if (!manualLesson.sections || manualLesson.sections.length === 0) throw new Error("Add at least one section (Note or Quiz)");

      // Validation: Check if every quiz has a correct answer
      let missingAnswer = false;
      manualLesson.sections.forEach(s => {
          if (s.type === 'quiz_group' && s.quizzes) {
              s.quizzes.forEach(q => {
                  if (!q.options.some(o => o.isCorrect)) missingAnswer = true;
              });
          }
      });
      if (missingAnswer) throw new Error("All quiz questions must have one correct option selected.");

      const finalLesson: Lesson = {
        id: initialData?.id || crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      type,
      title: type === 'note' ? 'New Leadership Note' : 'New Quiz Group',
      body: type === 'note' ? '' : undefined,
      quizzes: type === 'quiz_group' ? [] : undefined,
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
        id: crypto.randomUUID(),
        type: 'Bible Quiz',
        text: 'New Question',
        reference: '',
        sequence: 0,
        options: [
            { id: crypto.randomUUID(), label: 'A', text: 'Option A', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'B', text: 'Option B', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'C', text: 'Option C', isCorrect: false, explanation: '' },
            { id: crypto.randomUUID(), label: 'D', text: 'Option D', isCorrect: false, explanation: '' },
        ]
    };
    
    setManualLesson(prev => ({
        ...prev,
        sections: prev.sections?.map(s => {
            if (s.id === sectionId) {
                return { ...s, quizzes: [...(s.quizzes || []), { ...newQuiz, sequence: (s.quizzes?.length || 0) + 1 }] };
            }
            return s;
        })
    }));
  };

  const updateQuestion = (sectionId: string, quizId: string, updates: Partial<QuizQuestion>) => {
      setManualLesson(prev => ({
          ...prev,
          sections: prev.sections?.map(s => {
              if (s.id === sectionId) {
                  return { ...s, quizzes: s.quizzes?.map(q => q.id === quizId ? { ...q, ...updates } : q) };
              }
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
                                  // If setting this option as correct, others must be incorrect (Radio behavior)
                                  if (updates.isCorrect && o.id !== optionId) {
                                      return { ...o, isCorrect: false };
                                  }
                                  if (o.id === optionId) {
                                      return { ...o, ...updates };
                                  }
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
              if (s.id === sectionId) {
                  return { ...s, quizzes: s.quizzes?.filter(q => q.id !== quizId) };
              }
              return s;
          })
      }));
  };

  // --- HANDLERS: RESOURCE & NEWS ---
  
  const saveResource = async () => {
     if (!resourceTitle || !resourceFile) { setError("Please provide a title and select a file."); return; }
     try {
       const newRes: Resource = {
         id: crypto.randomUUID(),
         title: resourceTitle,
         description: resourceDesc,
         fileType: resourceFile.name.endsWith('.pdf') ? 'pdf' : 'doc',
         url: URL.createObjectURL(resourceFile), // Simulation
         uploadedBy: currentUser.name,
         uploadedAt: new Date().toISOString(),
         size: `${(resourceFile.size / 1024 / 1024).toFixed(2)} MB`
       };
       await lessonService.addResource(newRes);
       onSuccess();
     } catch(e: any) { setError(e.message); }
  };

  const saveNews = async () => {
     if (!newsTitle || !newsContent) { setError("Title and content are required."); return; }
     try {
       const newItem: NewsItem = {
         id: crypto.randomUUID(),
         title: newsTitle,
         content: newsContent,
         date: new Date().toISOString(),
         category: newsCategory,
         author: currentUser.name
       };
       await lessonService.addNews(newItem);
       onSuccess();
     } catch(e: any) { setError(e.message); }
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[90vh] w-full max-w-6xl animate-in zoom-in-95 duration-200">
       
       {/* Header */}
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

          {/* Type Tabs */}
          {isAdmin && !initialData && (
             <div className="flex gap-2 p-1 bg-gray-200 rounded-lg w-max">
                <button onClick={() => { setContentType('lesson'); setError(null); }} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${contentType === 'lesson' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <BookOpen size={16}/> Lessons
                </button>
                <button onClick={() => { setContentType('resource'); setError(null); }} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${contentType === 'resource' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <FileIcon size={16}/> Resources
                </button>
                <button onClick={() => { setContentType('news'); setError(null); }} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${contentType === 'news' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <Newspaper size={16}/> News
                </button>
             </div>
          )}
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 text-sm"><AlertTriangle size={18} /> {error}</div>}

          {/* === LESSON UPLOAD UI === */}
          {contentType === 'lesson' && (
             <div className="space-y-6">
                {!initialData && (
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button onClick={() => setMode('bulk')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Excel Import Package</button>
                            <button onClick={() => setMode('manual')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Manual Builder</button>
                        </div>
                    </div>
                )}
                
                {mode === 'manual' ? (
                   /* --- MANUAL BUILDER --- */
                   <div className="max-w-5xl mx-auto space-y-8">
                      {/* Step 1: Metadata */}
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Lesson Details</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="text-xs font-bold text-gray-500">Lesson Title</label><input className="w-full p-2 border rounded" value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} placeholder="e.g. Genesis Chapter 1"/></div>
                            <div className="col-span-2"><label className="text-xs font-bold text-gray-500">Description</label><input className="w-full p-2 border rounded" value={manualLesson.description} onChange={e => setManualLesson({...manualLesson, description: e.target.value})} placeholder="Short summary"/></div>
                            <div><label className="text-xs font-bold text-gray-500">Type</label><select className="w-full p-2 border rounded" value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                            <div><label className="text-xs font-bold text-gray-500">Target Audience</label><select className="w-full p-2 border rounded" value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}>{renderAudienceOptions()}</select></div>
                            <div><label className="text-xs font-bold text-gray-500">Bible Book</label><input className="w-full p-2 border rounded" value={manualLesson.book} onChange={e => setManualLesson({...manualLesson, book: e.target.value})} placeholder="e.g. Genesis"/></div>
                            <div><label className="text-xs font-bold text-gray-500">Chapter</label><input type="number" className="w-full p-2 border rounded" value={manualLesson.chapter} onChange={e => setManualLesson({...manualLesson, chapter: parseInt(e.target.value)})}/></div>
                         </div>
                      </div>
                      
                      {/* Step 2: Content Builder */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <h3 className="font-bold text-gray-800 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Content Sections</h3>
                             <div className="flex gap-2">
                                <button onClick={() => addSection('note')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center gap-1">+ Note</button>
                                <button onClick={() => addSection('quiz_group')} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 flex items-center gap-1">+ Quiz Group</button>
                             </div>
                         </div>

                         {manualLesson.sections?.map((s, idx) => (
                             <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                 {/* Section Header */}
                                 <div className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}>
                                     <div className="flex items-center gap-3">
                                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.type.replace('_', ' ')}</span>
                                         <span className="font-bold text-gray-800">{s.title}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={(e) => { e.stopPropagation(); removeSection(s.id); }} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                                         {expandedSection === s.id ? <ChevronUp size={20} className="text-gray-500"/> : <ChevronDown size={20} className="text-gray-500"/>}
                                     </div>
                                 </div>

                                 {/* Section Body */}
                                 {expandedSection === s.id && (
                                     <div className="p-6 border-t border-gray-200 space-y-6">
                                         <div>
                                             <label className="text-xs font-bold text-gray-500 mb-1">Section Title</label>
                                             <input className="w-full p-2 border rounded" value={s.title} onChange={e => updateSection(s.id, {title: e.target.value})} />
                                         </div>

                                         {s.type === 'note' ? (
                                             <div>
                                                 <label className="text-xs font-bold text-gray-500 mb-1">Note Content (HTML supported)</label>
                                                 <textarea className="w-full p-2 border rounded h-40 font-mono text-sm" value={s.body || ''} onChange={e => updateSection(s.id, {body: e.target.value})} placeholder="<p>Enter your study notes here...</p>" />
                                             </div>
                                         ) : (
                                             <div className="space-y-4">
                                                 <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                     <h4 className="font-bold text-sm text-gray-700">Questions</h4>
                                                     <button onClick={() => addQuestion(s.id)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded font-bold hover:bg-indigo-100">+ Add Question</button>
                                                 </div>
                                                 {s.quizzes?.map((q, qIdx) => (
                                                     <div key={q.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                         <div className="flex justify-between mb-3">
                                                             <span className="font-bold text-sm text-gray-500">Question {qIdx + 1}</span>
                                                             <button onClick={() => removeQuestion(s.id, q.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                         </div>
                                                         <div className="grid grid-cols-3 gap-3 mb-4">
                                                             <div className="col-span-2">
                                                                 <input className="w-full p-2 border rounded text-sm" placeholder="Question Text" value={q.text} onChange={e => updateQuestion(s.id, q.id, {text: e.target.value})} />
                                                             </div>
                                                             <div>
                                                                 <input className="w-full p-2 border rounded text-sm" placeholder="Reference (e.g. Gen 1:1)" value={q.reference} onChange={e => updateQuestion(s.id, q.id, {reference: e.target.value})} />
                                                             </div>
                                                         </div>
                                                         
                                                         {/* Options */}
                                                         <div className="space-y-2">
                                                             {q.options.map(opt => (
                                                                 <div key={opt.id} className="flex gap-2 items-start">
                                                                     <button 
                                                                        onClick={() => updateOption(s.id, q.id, opt.id, {isCorrect: true})}
                                                                        className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-300 hover:border-gray-400'}`}
                                                                        title={opt.isCorrect ? "Correct Answer Selected" : "Click to mark as Correct Answer"}
                                                                     >
                                                                         <Check size={16} strokeWidth={3} />
                                                                     </button>
                                                                     <div className="flex-1 space-y-1">
                                                                         <div className={`flex items-center gap-2 border rounded p-1.5 bg-white ${opt.isCorrect ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'}`}>
                                                                            <span className="text-xs font-bold text-gray-400 px-1">{opt.label}</span>
                                                                            <input className="flex-1 bg-transparent outline-none text-sm" placeholder={`Option Text`} value={opt.text} onChange={e => updateOption(s.id, q.id, opt.id, {text: e.target.value})} />
                                                                         </div>
                                                                         <input className="w-full p-1.5 border rounded text-xs bg-yellow-50 text-gray-600 focus:bg-white transition-colors" placeholder="Explanation (Shown after attempt)" value={opt.explanation} onChange={e => updateOption(s.id, q.id, opt.id, {explanation: e.target.value})} />
                                                                     </div>
                                                                 </div>
                                                             ))}
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         ))}
                         {manualLesson.sections?.length === 0 && <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl">No content added yet. Start by adding a Note or Quiz Group.</div>}
                      </div>
                   </div>
                ) : (
                   /* --- BULK IMPORT --- */
                   <div className="space-y-8 max-w-4xl mx-auto">
                      {!draft ? (
                          <>
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><HelpCircle size={20}/> Instructions</h3>
                                <p className="text-sm text-blue-800 mb-4">Upload a single Excel (.xlsx) file with 3 sheets: <strong>Lesson_Metadata</strong>, <strong>Bible_Quiz</strong>, and <strong>Note_Quiz</strong>.</p>
                                <div className="flex gap-4 text-xs font-mono bg-white p-3 rounded border border-blue-200 text-gray-600 overflow-x-auto">
                                    <span>Sheet 1: Lesson_Metadata (ID, Title, NoteBody...)</span>
                                    <span>Sheet 2: Bible_Quiz (Ref, Question, Options, Explanations...)</span>
                                </div>
                            </div>

                            <div className="bg-royal-50 p-6 rounded-xl border border-royal-100 flex items-center justify-between gap-4">
                                <div><h3 className="font-bold text-gray-900">Audience Config</h3><p className="text-xs text-gray-600">Applies to all imported lessons.</p></div>
                                <select value={bulkTargetAudience} onChange={(e) => setBulkTargetAudience(e.target.value as TargetAudience)} className="p-3 rounded-lg border-2 border-indigo-200 text-sm font-bold outline-none">{renderAudienceOptions()}</select>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 relative transition-colors">
                                <input type="file" accept=".xlsx,.csv" onChange={handleLessonFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="flex flex-col items-center">
                                    <div className="bg-indigo-100 p-4 rounded-full mb-4 text-indigo-600"><Upload size={32} /></div>
                                    <p className="font-bold text-gray-700">Click to Upload Excel File</p>
                                    <p className="text-sm text-gray-400 mt-1">{file ? file.name : "Drag & drop or browse"}</p>
                                </div>
                            </div>

                            {file && (
                                <button onClick={processFile} disabled={isParsing} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5">
                                    {isParsing ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />} 
                                    Parse & Preview
                                </button>
                            )}
                          </>
                      ) : (
                          /* --- PREVIEW SCREEN --- */
                          <div className="animate-in fade-in slide-in-from-bottom-4">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-bold text-gray-900">Import Preview</h3>
                                  <button onClick={() => { setDraft(null); setFile(null); }} className="text-sm text-gray-500 hover:text-red-500 underline">Discard & Upload New</button>
                              </div>

                              {/* Validation Status */}
                              {draft.isValid ? (
                                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 mb-6 font-bold">
                                      <CheckCircle size={24} /> File Validated Successfully! Ready to Import.
                                  </div>
                              ) : (
                                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
                                      <div className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={20}/> Validation Errors Found</div>
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                          {draft.errors.map((err, i) => <li key={i}>{err}</li>)}
                                      </ul>
                                  </div>
                              )}

                              {/* Data Preview Card */}
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
                                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                                      <h4 className="font-bold text-gray-700">{draft.metadata.title}</h4>
                                      <p className="text-xs text-gray-500">{draft.metadata.book} {draft.metadata.chapter} • {draft.bibleQuizzes.length + draft.noteQuizzes.length} Questions Total</p>
                                  </div>
                                  <div className="p-4 space-y-4">
                                      <div>
                                          <span className="text-xs font-bold text-gray-400 uppercase">Leadership Note</span>
                                          <p className="text-sm font-bold text-gray-800">{draft.leadershipNote.title}</p>
                                          <p className="text-xs text-gray-500 line-clamp-2">{(draft.leadershipNote.body || "").replace(/<[^>]*>?/gm, '')}</p>
                                      </div>
                                      <div>
                                          <span className="text-xs font-bold text-gray-400 uppercase">Sample Question & Correct Answer</span>
                                          {draft.bibleQuizzes[0] && (
                                              <div className="mt-2 bg-gray-50 p-4 rounded border border-gray-100">
                                                  <p className="text-sm font-medium mb-3">{draft.bibleQuizzes[0].text}</p>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                      {draft.bibleQuizzes[0].options.map((o:any) => (
                                                          <div 
                                                            key={o.label} 
                                                            className={`text-sm p-3 rounded border flex items-center justify-between ${o.isCorrect ? 'bg-green-100 border-green-300 text-green-900 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}
                                                          >
                                                              <span><span className="font-bold mr-2">{o.label}.</span> {o.text}</span>
                                                              {o.isCorrect && <Check size={16} className="text-green-600" />}
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                   </div>
                )}
             </div>
          )}

          {/* RESOURCE & NEWS UPLOAD UI (Unchanged logic) */}
          {contentType === 'resource' && (
              <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><FileIcon size={20}/> Upload Document</h3>
                      <div className="space-y-4">
                          <div><label className="block text-xs font-bold text-blue-700 mb-1">Resource Title</label><input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="e.g. 2024 Rulebook"/></div>
                          <div><label className="block text-xs font-bold text-blue-700 mb-1">Description</label><textarea className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400" value={resourceDesc} onChange={e => setResourceDesc(e.target.value)} placeholder="Short description..."/></div>
                          <div><label className="block text-xs font-bold text-blue-700 mb-1">File (PDF, Doc, Image)</label><input type="file" onChange={e => setResourceFile(e.target.files ? e.target.files[0] : null)} className="w-full p-2 bg-white rounded border border-blue-200"/></div>
                      </div>
                  </div>
              </div>
          )}

          {contentType === 'news' && (
              <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                      <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2"><Newspaper size={20}/> Post News / Announcement</h3>
                      <div className="space-y-4">
                          <div><label className="block text-xs font-bold text-orange-700 mb-1">Headline</label><input className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-400" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="e.g. Finals Registration Open"/></div>
                          <div><label className="block text-xs font-bold text-orange-700 mb-1">Category</label><select className="w-full p-3 border rounded-lg bg-white" value={newsCategory} onChange={e => setNewsCategory(e.target.value as any)}><option>Announcement</option><option>Event</option><option>Update</option></select></div>
                          <div><label className="block text-xs font-bold text-orange-700 mb-1">Content</label><textarea className="w-full h-32 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-orange-400" value={newsContent} onChange={e => setNewsContent(e.target.value)} placeholder="Write your announcement..."/></div>
                      </div>
                  </div>
              </div>
          )}
       </div>

       {/* Footer Actions */}
       <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
          
          {contentType === 'lesson' && (
             <button onClick={mode === 'manual' ? saveManualLesson : commitImport} disabled={mode === 'bulk' && (!draft?.isValid)} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={18} /> {mode === 'manual' ? (initialData ? 'Update Lesson' : 'Save Lesson') : 'Import Lesson'}
             </button>
          )}
          
          {contentType === 'resource' && (
             <button onClick={saveResource} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2">
                <Upload size={18} /> Upload Resource
             </button>
          )}

          {contentType === 'news' && (
             <button onClick={saveNews} className="px-8 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-md flex items-center gap-2">
                <Save size={18} /> Post News
             </button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;
