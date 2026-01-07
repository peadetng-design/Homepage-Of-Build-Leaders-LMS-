import React, { useState, useEffect } from 'react';
import { User, Certificate, Lesson } from '../types';
import { exportService } from '../services/exportService';
import { lessonService } from '../services/lessonService';
import { Download, Printer, X, FileText, CheckSquare, Loader2, BadgeCheck, BarChart3, BookOpen, ChevronRight, ArrowLeft, Clock, Play } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

type ExportView = 'categories' | 'performance_detail' | 'certificates_detail' | 'lessons_detail';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [currentView, setCurrentView] = useState<ExportView>('categories');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Detail States
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
  const [unattemptedLessons, setUnattemptedLessons] = useState<Lesson[]>([]);
  const [performancePreview, setPerformancePreview] = useState<string>('');

  useEffect(() => {
      if (isOpen) {
          setCurrentView('categories');
          setPerformancePreview('');
          setUserCertificates([]);
          setUnattemptedLessons([]);
      }
  }, [isOpen]);

  const loadPerformanceDetails = async () => {
      setIsLoadingDetails(true);
      setCurrentView('performance_detail');
      try {
          const stats = await exportService.getStats(currentUser);
          setPerformancePreview(stats);
      } finally {
          setIsLoadingDetails(false);
      }
  };

  const loadCertificateDetails = async () => {
      setIsLoadingDetails(true);
      setCurrentView('certificates_detail');
      try {
          const certs = await lessonService.getUserCertificates(currentUser.id);
          setUserCertificates(certs);
      } finally {
          setIsLoadingDetails(false);
      }
  };

  const loadLessonDetails = async () => {
      setIsLoadingDetails(true);
      setCurrentView('lessons_detail');
      try {
          const allLessons = await lessonService.getLessons();
          const unattempted: Lesson[] = [];
          for (const l of allLessons) {
              const done = await lessonService.hasUserAttemptedLesson(currentUser.id, l.id);
              if (!done) unattempted.push(l);
          }
          setUnattemptedLessons(unattempted);
      } finally {
          setIsLoadingDetails(false);
      }
  };

  if (!isOpen) return null;

  const handleFullPerformanceExport = async (format: 'txt' | 'print') => {
      setIsProcessing(true);
      try {
          const stats = await exportService.getStats(currentUser);
          if (format === 'txt') {
              exportService.downloadTxt(`BBL_Performance_${currentUser.name}.txt`, stats);
          } else {
              const html = `<div style='background:#f4f4f5; padding:20px; border-radius:12px;'><pre>${stats}</pre></div>`;
              exportService.printHtml(`Performance Report - ${currentUser.name}`, html);
          }
      } finally {
          setIsProcessing(false);
      }
  };

  const handleLessonExport = (lesson: Lesson, format: 'txt' | 'print') => {
      exportService.exportSingleLesson(lesson, format);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
       
       <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="bg-royal-900 px-8 py-6 text-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                {currentView !== 'categories' && (
                    <button onClick={() => setCurrentView('categories')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h2 className="text-xl font-bold font-serif flex items-center gap-3">
                        <Printer size={24} className="text-gold-500" /> Export Repository
                    </h2>
                    <p className="text-royal-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                        {currentView === 'categories' ? 'Select Category' : currentView.replace('_', ' ').toUpperCase()}
                    </p>
                </div>
             </div>
             <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
             
             {/* CATEGORY SELECTION VIEW */}
             {currentView === 'categories' && (
                <div className="space-y-4">
                   <p className="text-gray-500 text-sm mb-6 font-medium">Choose a repository section to explore and export specific data.</p>
                   
                   <button 
                     onClick={loadPerformanceDetails}
                     className="w-full group bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-royal-500 hover:shadow-xl transition-all flex items-center gap-6 text-left"
                   >
                      <div className="p-4 bg-royal-50 rounded-2xl group-hover:bg-royal-500 group-hover:text-white transition-colors">
                        <BarChart3 size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg">Performance Analysis</h3>
                        <p className="text-gray-400 text-sm">Scores, group rankings, and accuracy metrics.</p>
                      </div>
                      <ChevronRight size={24} className="text-gray-300 group-hover:text-royal-500" />
                   </button>

                   <button 
                     onClick={loadCertificateDetails}
                     className="w-full group bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-gold-500 hover:shadow-xl transition-all flex items-center gap-6 text-left"
                   >
                      <div className="p-4 bg-gold-50 rounded-2xl group-hover:bg-gold-500 group-hover:text-white transition-colors">
                        <BadgeCheck size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg">Certification Vault</h3>
                        <p className="text-gray-400 text-sm">Download official credentials for completed modules.</p>
                      </div>
                      <ChevronRight size={24} className="text-gray-300 group-hover:text-gold-500" />
                   </button>

                   <button 
                     onClick={loadLessonDetails}
                     className="w-full group bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:shadow-xl transition-all flex items-center gap-6 text-left"
                   >
                      <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <BookOpen size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg">Lesson Study Repository</h3>
                        <p className="text-gray-400 text-sm">Unattempted lessons for offline study preparation.</p>
                      </div>
                      <ChevronRight size={24} className="text-gray-300 group-hover:text-emerald-500" />
                   </button>
                </div>
             )}

             {/* PERFORMANCE DETAIL VIEW */}
             {currentView === 'performance_detail' && (
                <div className="space-y-6">
                   {isLoadingDetails ? (
                       <div className="py-20 flex flex-col items-center gap-4">
                           <Loader2 className="animate-spin text-royal-600" size={40} />
                           <p className="text-gray-500 font-bold">Compiling Report...</p>
                       </div>
                   ) : (
                       <>
                           <div className="bg-white rounded-2xl p-6 border-4 border-royal-50 shadow-inner">
                               <h3 className="text-xs font-black text-royal-800 uppercase tracking-widest mb-4">Report Preview</h3>
                               <pre className="text-xs font-mono bg-gray-50 p-4 rounded-xl text-gray-600 overflow-x-auto">
                                   {performancePreview}
                               </pre>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <button 
                                 onClick={() => handleFullPerformanceExport('txt')}
                                 className="py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                               >
                                  <FileText size={20} /> Text File
                               </button>
                               <button 
                                 onClick={() => handleFullPerformanceExport('print')}
                                 className="py-4 bg-royal-800 text-white font-bold rounded-2xl hover:bg-royal-950 transition-all flex items-center justify-center gap-2 shadow-lg"
                               >
                                  <Printer size={20} /> Print / PDF
                               </button>
                           </div>
                       </>
                   )}
                </div>
             )}

             {/* CERTIFICATES DETAIL VIEW */}
             {currentView === 'certificates_detail' && (
                <div className="space-y-4">
                   {isLoadingDetails ? (
                        <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-gold-500" size={40} /></div>
                   ) : userCertificates.length === 0 ? (
                        <div className="text-center py-20 bg-white border-2 border-dashed rounded-3xl">
                            <BadgeCheck size={48} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-400 font-bold">No certificates earned yet.</p>
                        </div>
                   ) : (
                        userCertificates.map(cert => (
                            <div key={cert.id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 flex items-center justify-between shadow-sm hover:border-gold-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-xl flex items-center justify-center font-bold">
                                        <BadgeCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{cert.moduleTitle}</h4>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Code: {cert.uniqueCode} • {new Date(cert.issueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => exportService.printHtml(`Certificate - ${cert.moduleTitle}`, `<div style="text-align:center; padding:50px; border:10px double #d97706;"><h1>CERTIFICATE</h1><h2>${cert.userName}</h2><p>Completed: ${cert.moduleTitle}</p><p>ID: ${cert.uniqueCode}</p></div>`)}
                                    className="p-3 bg-gray-50 text-gray-500 hover:bg-gold-500 hover:text-white rounded-xl transition-all shadow-sm"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        ))
                   )}
                </div>
             )}

             {/* LESSONS DETAIL VIEW */}
             {currentView === 'lessons_detail' && (
                <div className="space-y-4">
                   {isLoadingDetails ? (
                        <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
                   ) : unattemptedLessons.length === 0 ? (
                        <div className="text-center py-20 bg-white border-2 border-dashed rounded-3xl">
                            <CheckSquare size={48} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-400 font-bold">You've attempted all available lessons!</p>
                        </div>
                   ) : (
                        unattemptedLessons.map(lesson => (
                            <div key={lesson.id} className="bg-white p-5 rounded-2xl border-2 border-gray-100 flex items-center justify-between shadow-sm hover:border-emerald-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{lesson.book} {lesson.chapter} • {lesson.lesson_type}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleLessonExport(lesson, 'txt')}
                                        className="px-4 py-2 bg-gray-50 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-100"
                                    >
                                        TEXT
                                    </button>
                                    <button 
                                        onClick={() => handleLessonExport(lesson, 'print')}
                                        className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 shadow-md"
                                    >
                                        PRINT/PDF
                                    </button>
                                </div>
                            </div>
                        ))
                   )}
                </div>
             )}

          </div>

          {/* Footer Branding */}
          <div className="px-8 py-4 bg-white border-t border-gray-100 text-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Build Biblical Leaders Official Reporting Engine</p>
          </div>
       </div>
    </div>
  );
};

export default ExportModal;