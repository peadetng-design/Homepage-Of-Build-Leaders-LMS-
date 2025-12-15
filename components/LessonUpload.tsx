
import React, { useState } from 'react';
import { User, LessonDraft, Lesson, LessonSection, QuizQuestion, QuizOption, SectionType, LessonType, TargetAudience } from '../types';
import { lessonService } from '../services/lessonService';
import { Upload, FileText, Check, AlertTriangle, X, Loader2, Save, Plus, Trash2, Users } from 'lucide-react';

interface LessonUploadProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const LessonUpload: React.FC<LessonUploadProps> = ({ currentUser, onSuccess, onCancel }) => {
  const [mode, setMode] = useState<'manual' | 'bulk'>('bulk');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for Bulk Import Audience
  const [bulkTargetAudience, setBulkTargetAudience] = useState<TargetAudience>('All');

  // --- MANUAL BUILDER STATE ---
  const [manualLesson, setManualLesson] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    lesson_type: 'Mixed',
    targetAudience: 'All', // Default
    book: '',
    chapter: 1,
    sections: []
  });

  // --- BULK UPLOAD HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError("Failed to parse file. Ensure it follows the template.");
    } finally {
      setIsParsing(false);
    }
  };

  const commitImport = async () => {
    if (!draft) return;
    try {
      // Apply the selected audience to the draft metadata
      draft.metadata.targetAudience = bulkTargetAudience;
      
      const lesson = lessonService.convertDraftToLesson(draft, currentUser);
      await lessonService.publishLesson(lesson);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- MANUAL BUILDER HANDLERS ---
  const addSection = (type: SectionType) => {
    const newSection: LessonSection = {
      id: crypto.randomUUID(),
      type,
      title: type === 'note' ? 'New Leadership Note' : 'New Quiz Group',
      body: type === 'note' ? '' : undefined,
      quizzes: type === 'quiz_group' ? [] : undefined,
      sequence: (manualLesson.sections?.length || 0) + 1
    };
    setManualLesson(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const updateSection = (id: string, updates: Partial<LessonSection>) => {
    setManualLesson(prev => ({
      ...prev,
      sections: prev.sections?.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const removeSection = (id: string) => {
    setManualLesson(prev => ({
      ...prev,
      sections: prev.sections?.filter(s => s.id !== id)
    }));
  };

  const addQuizToSection = (sectionId: string) => {
    const newQuiz: QuizQuestion = {
      id: crypto.randomUUID(),
      type: 'Bible Quiz',
      text: 'New Question',
      reference: '',
      sequence: 0,
      options: [
        { id: crypto.randomUUID(), label: 'A', text: '', isCorrect: true, explanation: '' },
        { id: crypto.randomUUID(), label: 'B', text: '', isCorrect: false, explanation: '' },
        { id: crypto.randomUUID(), label: 'C', text: '', isCorrect: false, explanation: '' },
        { id: crypto.randomUUID(), label: 'D', text: '', isCorrect: false, explanation: '' },
      ]
    };

    setManualLesson(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id === sectionId && s.quizzes) {
          return { ...s, quizzes: [...s.quizzes, { ...newQuiz, sequence: s.quizzes.length + 1 }] };
        }
        return s;
      })
    }));
  };

  const updateQuiz = (sectionId: string, quizId: string, updates: Partial<QuizQuestion>) => {
    setManualLesson(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id === sectionId && s.quizzes) {
          return {
            ...s,
            quizzes: s.quizzes.map(q => q.id === quizId ? { ...q, ...updates } : q)
          };
        }
        return s;
      })
    }));
  };

  const updateOption = (sectionId: string, quizId: string, optionId: string, updates: Partial<QuizOption>) => {
     setManualLesson(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id === sectionId && s.quizzes) {
          return {
            ...s,
            quizzes: s.quizzes.map(q => {
               if (q.id === quizId) {
                  // If setting isCorrect to true, set others to false (single choice)
                  const newOptions = q.options.map(o => {
                     if (o.id === optionId) return { ...o, ...updates };
                     if (updates.isCorrect) return { ...o, isCorrect: false };
                     return o;
                  });
                  return { ...q, options: newOptions };
               }
               return q;
            })
          };
        }
        return s;
      })
    }));
  };

  const saveManualLesson = async () => {
    try {
      if (!manualLesson.title) throw new Error("Title is required");
      // Validate structure
      const finalLesson: Lesson = {
        id: crypto.randomUUID(),
        title: manualLesson.title,
        description: manualLesson.description || '',
        lesson_type: manualLesson.lesson_type || 'Mixed',
        targetAudience: manualLesson.targetAudience || 'All',
        book: manualLesson.book,
        chapter: manualLesson.chapter,
        author: currentUser.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published',
        views: 0,
        sections: manualLesson.sections || []
      };
      await lessonService.publishLesson(finalLesson);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Audience Options Render - EXACTLY AS REQUESTED
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
       
       {/* Header */}
       <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-royal-800 text-white p-2 rounded-lg"><Upload size={20} /></div>
             <h2 className="font-bold text-gray-800 text-lg">Upload Lesson</h2>
          </div>
          
          <div className="flex bg-gray-200 rounded-lg p-1">
             <button 
               onClick={() => { setMode('bulk'); setDraft(null); }}
               className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-white shadow-sm text-royal-800' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Excel Import
             </button>
             <button 
               onClick={() => { setMode('manual'); setDraft(null); }}
               className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-royal-800' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Manual Builder
             </button>
          </div>

          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
             <X size={20} />
          </button>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
             </div>
          )}

          {mode === 'manual' ? (
             <div className="max-w-4xl mx-auto space-y-8">
                {/* Lesson Metadata */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                   <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Lesson Metadata</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Lesson Title</label>
                        <input 
                           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-royal-500 outline-none"
                           value={manualLesson.title}
                           onChange={e => setManualLesson({...manualLesson, title: e.target.value})}
                           placeholder="e.g. Genesis Chapter 1"
                        />
                      </div>
                      
                      {/* TARGET AUDIENCE SELECTOR - MANUAL */}
                      <div className="col-span-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                        <label className="block text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1"><Users size={12}/> Select User Type (Audience)</label>
                        <select
                           className="w-full p-2 border border-yellow-300 rounded bg-white outline-none focus:ring-2 focus:ring-royal-500"
                           value={manualLesson.targetAudience}
                           onChange={e => setManualLesson({...manualLesson, targetAudience: e.target.value as TargetAudience})}
                        >
                            {renderAudienceOptions()}
                        </select>
                      </div>

                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Lesson Type</label>
                        <select
                           className="w-full p-2 border border-gray-300 rounded bg-white outline-none focus:ring-2 focus:ring-royal-500"
                           value={manualLesson.lesson_type}
                           onChange={e => setManualLesson({...manualLesson, lesson_type: e.target.value as LessonType})}
                        >
                            <option value="Mixed">Mixed (Note + Quiz)</option>
                            <option value="Bible">Bible Only</option>
                            <option value="Leadership">Leadership Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Bible Book</label>
                        <input 
                           className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-royal-500"
                           value={manualLesson.book}
                           onChange={e => setManualLesson({...manualLesson, book: e.target.value})}
                           placeholder="Genesis"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Chapter</label>
                        <input 
                           type="number"
                           className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-royal-500"
                           value={manualLesson.chapter}
                           onChange={e => setManualLesson({...manualLesson, chapter: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                        <textarea 
                           className="w-full p-2 border border-gray-300 rounded h-20 outline-none focus:ring-2 focus:ring-royal-500"
                           value={manualLesson.description}
                           onChange={e => setManualLesson({...manualLesson, description: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                {/* Sections Builder */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h3 className="font-bold text-gray-800">Lesson Content</h3>
                     <div className="flex gap-2">
                        <button onClick={() => addSection('note')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
                           <FileText size={16} /> Add Note
                        </button>
                        <button onClick={() => addSection('quiz_group')} className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors">
                           <Check size={16} /> Add Quiz Group
                        </button>
                     </div>
                   </div>

                   {manualLesson.sections?.map((section, idx) => (
                      <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                         <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                            <div className="flex items-center gap-2">
                               <span className="bg-gray-300 text-gray-700 text-xs font-bold px-2 py-0.5 rounded">
                                  {section.type === 'note' ? 'NOTE' : 'QUIZ GROUP'}
                               </span>
                               <input 
                                  className="bg-transparent font-bold text-gray-800 outline-none focus:bg-white px-1 rounded transition-colors"
                                  value={section.title}
                                  onChange={e => updateSection(section.id, { title: e.target.value })}
                               />
                            </div>
                            <button onClick={() => removeSection(section.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                               <Trash2 size={16} />
                            </button>
                         </div>
                         
                         <div className="p-4">
                            {section.type === 'note' ? (
                               <textarea 
                                  className="w-full h-40 p-3 border border-gray-200 rounded-lg font-mono text-sm outline-none focus:border-royal-500"
                                  placeholder="Enter note content (HTML supported)..."
                                  value={section.body}
                                  onChange={e => updateSection(section.id, { body: e.target.value })}
                               />
                            ) : (
                               <div className="space-y-6">
                                  {section.quizzes?.map((quiz, qIdx) => (
                                     <div key={quiz.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                                        <div className="mb-3">
                                           <label className="block text-xs font-bold text-gray-500 mb-1">Question {qIdx + 1}</label>
                                           <input 
                                              className="w-full p-2 border border-gray-300 rounded mb-2 outline-none focus:border-royal-500"
                                              value={quiz.text}
                                              onChange={e => updateQuiz(section.id, quiz.id, { text: e.target.value })}
                                              placeholder="Question text..."
                                           />
                                           <input 
                                              className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-royal-500"
                                              value={quiz.reference}
                                              onChange={e => updateQuiz(section.id, quiz.id, { reference: e.target.value })}
                                              placeholder="Bible Reference (e.g. John 3:16)"
                                           />
                                        </div>
                                        
                                        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                           {quiz.options.map(opt => (
                                              <div key={opt.id} className="grid grid-cols-12 gap-2 items-start">
                                                 <div className="col-span-1 pt-2 flex justify-center">
                                                    <input 
                                                       type="radio" 
                                                       name={`correct-${quiz.id}`}
                                                       checked={opt.isCorrect}
                                                       onChange={() => updateOption(section.id, quiz.id, opt.id, { isCorrect: true })}
                                                    />
                                                 </div>
                                                 <div className="col-span-5">
                                                    <input 
                                                       className="w-full p-1.5 border border-gray-300 rounded text-sm outline-none focus:border-royal-500"
                                                       value={opt.text}
                                                       onChange={e => updateOption(section.id, quiz.id, opt.id, { text: e.target.value })}
                                                       placeholder={`Option ${opt.label}`}
                                                    />
                                                 </div>
                                                 <div className="col-span-6">
                                                    <input 
                                                       className="w-full p-1.5 border border-gray-300 rounded text-sm bg-yellow-50 outline-none focus:border-yellow-400"
                                                       value={opt.explanation}
                                                       onChange={e => updateOption(section.id, quiz.id, opt.id, { explanation: e.target.value })}
                                                       placeholder="Explanation..."
                                                    />
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  ))}
                                  <button onClick={() => addQuizToSection(section.id)} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-royal-500 hover:text-royal-600 font-bold text-sm transition-colors">
                                     + Add Question
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          ) : (
             <div className="space-y-8 max-w-4xl mx-auto">
                {/* BULK IMPORT AUDIENCE SELECTOR - PROMINENT */}
                <div className="bg-royal-50 p-6 rounded-xl border border-royal-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-lg text-royal-600 shadow-sm"><Users size={24}/></div>
                         <div>
                             <h3 className="font-bold text-royal-900">Import Configuration</h3>
                             <p className="text-xs text-royal-600">This audience setting will apply to all lessons in the file.</p>
                         </div>
                     </div>
                     <div className="w-full md:w-auto min-w-[300px]">
                        <label className="block text-xs font-bold text-royal-600 mb-1 uppercase tracking-wider">Select User Type (Audience)</label>
                        <select 
                           value={bulkTargetAudience}
                           onChange={(e) => setBulkTargetAudience(e.target.value as TargetAudience)}
                           className="w-full p-3 rounded-lg border-2 border-royal-200 text-sm font-bold focus:ring-2 focus:ring-royal-500 outline-none bg-white shadow-sm"
                        >
                           {renderAudienceOptions()}
                        </select>
                     </div>
                </div>

                {/* File Drop Area */}
                {!draft && (
                   <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 transition-colors relative">
                      <input 
                         type="file" 
                         accept=".xlsx,.csv"
                         onChange={handleFileChange}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Lesson Package</h3>
                         <p className="text-gray-500 max-w-sm mx-auto mb-6">
                            Drag & drop your formatted Excel file here. Must contain "Lesson_Metadata", "Bible_Quiz", and "Note_Quiz" sheets.
                         </p>
                         <button className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 z-10 relative pointer-events-none">
                            Select File
                         </button>
                      </div>
                   </div>
                )}

                {/* Parsing Progress */}
                {file && !draft && (
                   <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                         <FileText className="text-royal-600" size={24} />
                         <span className="font-bold text-gray-700">{file.name}</span>
                         <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button 
                         onClick={processFile}
                         disabled={isParsing}
                         className="w-full py-3 bg-royal-800 text-white font-bold rounded-lg shadow-md hover:bg-royal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isParsing && <Loader2 className="animate-spin" size={20} />}
                         {isParsing ? "Analyzing Data Structure..." : "Process & Validate"}
                      </button>
                   </div>
                )}

                {/* Preview & Validation Report */}
                {draft && (
                   <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {draft.isValid ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                            Import Validation
                         </h3>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${draft.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {draft.isValid ? 'Ready to Import' : 'Errors Found'}
                         </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Title:</span> <span className="font-bold">{draft.metadata.title}</span></div>
                            <div><span className="text-gray-500">Book/Ch:</span> <span className="font-bold">{draft.metadata.book} {draft.metadata.chapter}</span></div>
                            <div><span className="text-gray-500">Audience:</span> <span className="font-bold text-royal-800">{bulkTargetAudience}</span></div>
                         </div>
                         
                         {/* Counts */}
                         <div className="flex gap-4 border-t border-gray-200 pt-4">
                            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-center">
                               <span className="block text-lg font-bold text-royal-800">{draft.bibleQuizzes.length}</span>
                               <span className="text-xs text-gray-500">Bible Quizzes</span>
                            </div>
                            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-center">
                               <span className="block text-lg font-bold text-royal-800">{draft.noteQuizzes.length}</span>
                               <span className="text-xs text-gray-500">Note Quizzes</span>
                            </div>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          )}
       </div>

       {/* Footer Actions */}
       <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
          
          {mode === 'manual' ? (
             <button onClick={saveManualLesson} className="px-8 py-2 bg-royal-800 text-white font-bold rounded-lg hover:bg-royal-700 shadow-md flex items-center gap-2">
                <Save size={18} /> Save & Publish
             </button>
          ) : (
             <button 
               onClick={commitImport}
               disabled={!draft?.isValid}
               className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save size={18} /> Import Lesson
             </button>
          )}
       </div>
    </div>
    </div>
  );
};

export default LessonUpload;
