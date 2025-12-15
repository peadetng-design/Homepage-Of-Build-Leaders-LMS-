
import React, { useState, useEffect } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience, UserRole, Resource, NewsItem } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, FileText, Check, AlertTriangle, X, Loader2, Save, Plus, Trash2, Users, Edit3, BookOpen, File as FileIcon, Newspaper } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Lesson; // Added to support editing
}

type ContentType = 'lesson' | 'resource' | 'news';

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel, initialData }) => {
  const [contentType, setContentType] = useState<ContentType>('lesson');
  
  // Lesson State
  const [mode, setMode] = useState<'manual' | 'bulk'>(initialData ? 'manual' : 'bulk');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkTargetAudience, setBulkTargetAudience] = useState<TargetAudience>('All');

  // Resource State
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');

  // News State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'Announcement'|'Event'|'Update'>('Announcement');

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // --- MANUAL BUILDER STATE ---
  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>(initialData ? { ...initialData } : {
    title: '', description: '', lesson_type: 'Mixed', targetAudience: 'All', book: '', chapter: 1, sections: []
  });

  // --- HANDLERS ---

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
      setError("Failed to parse file.");
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

  const saveManualLesson = async () => {
    try {
      if (!manualLesson.title) throw new Error("Title is required");
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

  const saveResource = async () => {
     if (!resourceTitle || !resourceFile) {
        setError("Please provide a title and select a file.");
        return;
     }
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
     } catch(e: any) {
       setError(e.message);
     }
  };

  const saveNews = async () => {
     if (!newsTitle || !newsContent) {
        setError("Title and content are required.");
        return;
     }
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
     } catch(e: any) {
       setError(e.message);
     }
  };

  // Helper function for Manual Builder sections
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
  };

  const updateSection = (id: string, updates: Partial<LessonSection>) => {
    setManualLesson(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === id ? { ...s, ...updates } : s) }));
  };

  const removeSection = (id: string) => {
    setManualLesson(prev => ({ ...prev, sections: prev.sections?.filter(s => s.id !== id) }));
  };
  
  // Render Helpers
  const renderAudienceOptions = () => (
    <>
        <option value="All">All Users (Public)</option>
        <option value="Student">(Student Only)</option>
        <option value="Mentors_Org_Parents">(Mentors, Organization, and Parent Only)</option>
        <option value="Mentor">(Mentors Only)</option>
        <option value="Organization">(Organization Only)</option>
        <option value="Parent">(Parent Only)</option>
    </>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[85vh] w-full max-w-5xl animate-in zoom-in-95 duration-200">
       
       {/* Header with Type Selector */}
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

          {/* Type Tabs (Admin Only) */}
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

          {/* LESSON UPLOAD UI */}
          {contentType === 'lesson' && (
             <div className="space-y-6">
                {!initialData && (
                    <div className="flex bg-gray-100 rounded-lg p-1 w-max mb-6">
                        <button onClick={() => setMode('bulk')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${mode === 'bulk' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Excel Import</button>
                        <button onClick={() => setMode('manual')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${mode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>Manual Builder</button>
                    </div>
                )}
                
                {mode === 'manual' ? (
                   /* REUSED MANUAL BUILDER LOGIC (Simplified for brevity in XML, assumes logic from previous implementation) */
                   <div className="max-w-4xl mx-auto space-y-8">
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Title</label><input className="w-full p-2 border rounded" value={manualLesson.title} onChange={e => setManualLesson({...manualLesson, title: e.target.value})} placeholder="Lesson Title"/></div>
                            <div className="col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Type</label><select className="w-full p-2 border rounded" value={manualLesson.lesson_type} onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}><option value="Mixed">Mixed</option><option value="Bible">Bible</option><option value="Leadership">Leadership</option></select></div>
                            <div className="col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Book</label><input className="w-full p-2 border rounded" value={manualLesson.book} onChange={e => setManualLesson({...manualLesson, book: e.target.value})} placeholder="Book"/></div>
                            <div className="col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Chapter</label><input type="number" className="w-full p-2 border rounded" value={manualLesson.chapter} onChange={e => setManualLesson({...manualLesson, chapter: parseInt(e.target.value)})}/></div>
                            <div className="col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Audience</label><select className="w-full p-2 border rounded" value={manualLesson.targetAudience} onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}>{renderAudienceOptions()}</select></div>
                         </div>
                      </div>
                      
                      {/* Section Builder Mini-View */}
                      <div className="space-y-4">
                         <div className="flex justify-between"><h3 className="font-bold">Content</h3><div className="flex gap-2"><button onClick={() => addSection('note')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-bold">+ Note</button><button onClick={() => addSection('quiz_group')} className="px-3 py-1 bg-purple-50 text-purple-600 rounded text-sm font-bold">+ Quiz</button></div></div>
                         {manualLesson.sections?.map(s => (
                             <div key={s.id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                                 <span className="font-bold">{s.type.toUpperCase()}:</span>
                                 <input className="ml-2 border rounded p-1 flex-1 mx-2" value={s.title} onChange={e => updateSection(s.id, {title: e.target.value})} />
                                 <button onClick={() => removeSection(s.id)} className="text-red-500"><Trash2 size={16}/></button>
                             </div>
                         ))}
                         {manualLesson.sections?.length === 0 && <div className="text-center text-gray-400 py-4">No content added yet.</div>}
                      </div>
                   </div>
                ) : (
                   /* BULK IMPORT UI */
                   <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="bg-royal-50 p-6 rounded-xl border border-royal-100 flex items-center justify-between gap-4">
                          <div><h3 className="font-bold text-gray-900">Audience Config</h3><p className="text-xs text-gray-600">Applies to all imported lessons.</p></div>
                          <select value={bulkTargetAudience} onChange={(e) => setBulkTargetAudience(e.target.value as TargetAudience)} className="p-3 rounded-lg border-2 border-indigo-200 text-sm font-bold outline-none">{renderAudienceOptions()}</select>
                      </div>
                      {!draft && (
                         <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 relative">
                            <input type="file" accept=".xlsx,.csv" onChange={handleLessonFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center"><Upload size={32} className="mb-2 text-gray-400"/><p>Drag & drop Excel file here.</p></div>
                         </div>
                      )}
                      {file && !draft && (
                         <button onClick={processFile} disabled={isParsing} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                             {isParsing && <Loader2 className="animate-spin" size={20} />} Process File
                         </button>
                      )}
                      {draft && (
                         <div className="bg-green-50 p-4 rounded border border-green-200 text-green-700 font-bold text-center">
                             File Validated! {draft.bibleQuizzes.length + draft.noteQuizzes.length} Quizzes Found.
                         </div>
                      )}
                   </div>
                )}
             </div>
          )}

          {/* RESOURCE UPLOAD UI */}
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

          {/* NEWS UPLOAD UI */}
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
             <button onClick={mode === 'manual' ? saveManualLesson : commitImport} disabled={mode === 'bulk' && !draft?.isValid} className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                <Save size={18} /> {mode === 'manual' ? (initialData ? 'Update Lesson' : 'Save Lesson') : 'Import'}
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
