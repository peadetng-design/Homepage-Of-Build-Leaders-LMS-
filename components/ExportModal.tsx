
import React, { useState } from 'react';
import { User } from '../types';
import { exportService } from '../services/exportService';
import { Download, Printer, X, FileText, CheckSquare, Loader2, BadgeCheck } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [includeStats, setIncludeStats] = useState(true);
  const [includeUnattempted, setIncludeUnattempted] = useState(false);
  const [includeCertificates, setIncludeCertificates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (format: 'txt' | 'print') => {
    setIsProcessing(true);
    try {
      let textContent = '';
      let htmlContent = '';

      // 1. Get Stats
      if (includeStats) {
        const stats = await exportService.getStats(currentUser);
        textContent += stats + "\n\n";
        htmlContent += `<div class='stats-section'><h2>Performance Report</h2><pre style='background:#f4f4f5; padding:15px; border-radius:8px;'>${stats}</pre></div>`;
      }

      // 2. Get Certificates
      if (includeCertificates) {
          const data = await exportService.getCertificatesContent(currentUser);
          textContent += data.text;
          htmlContent += data.html;
      }

      // 3. Get Unattempted Lessons
      if (includeUnattempted) {
         const data = await exportService.getUnattemptedContent(currentUser);
         textContent += data.text;
         htmlContent += data.html;
      }

      // 4. Output
      if (format === 'txt') {
         exportService.downloadTxt(`BBL_Report_${currentUser.role}_${Date.now()}.txt`, textContent);
      } else {
         exportService.printHtml(`BBL Report - ${currentUser.name}`, htmlContent);
      }
      
      onClose(); // Optional: close after export
    } catch (e) {
      console.error(e);
      alert("Error generating report");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
       
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-royal-900 p-6 text-white flex justify-between items-center">
             <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Printer size={24} className="text-gold-500" /> Print / Export
             </h2>
             <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
          </div>

          <div className="p-6">
             <p className="text-gray-600 mb-6 text-sm">
               Select the data you wish to export or print.
             </p>

             <div className="space-y-3 mb-8">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${includeStats ? 'border-royal-500 bg-royal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                   <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 ${includeStats ? 'bg-royal-600 border-royal-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {includeStats && <CheckSquare size={16} />}
                   </div>
                   <input type="checkbox" className="hidden" checked={includeStats} onChange={() => setIncludeStats(!includeStats)} />
                   <div>
                      <span className="block font-bold text-gray-800">Performance Scores & Stats</span>
                      <span className="text-xs text-gray-500">Your current dashboard metrics</span>
                   </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${includeCertificates ? 'border-royal-500 bg-royal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                   <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 ${includeCertificates ? 'bg-royal-600 border-royal-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {includeCertificates && <CheckSquare size={16} />}
                   </div>
                   <input type="checkbox" className="hidden" checked={includeCertificates} onChange={() => setIncludeCertificates(!includeCertificates)} />
                   <div>
                      <span className="flex items-center gap-2 font-bold text-gray-800">
                          Certificates <BadgeCheck size={14} className="text-gold-500" />
                      </span>
                      <span className="text-xs text-gray-500">List of all earned credentials</span>
                   </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${includeUnattempted ? 'border-royal-500 bg-royal-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                   <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 ${includeUnattempted ? 'bg-royal-600 border-royal-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {includeUnattempted && <CheckSquare size={16} />}
                   </div>
                   <input type="checkbox" className="hidden" checked={includeUnattempted} onChange={() => setIncludeUnattempted(!includeUnattempted)} />
                   <div>
                      <span className="block font-bold text-gray-800">Unattempted Lessons</span>
                      <span className="text-xs text-gray-500">Full content of quizzes you haven't taken yet</span>
                   </div>
                </label>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleExport('txt')}
                  disabled={isProcessing || (!includeStats && !includeUnattempted && !includeCertificates)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-royal-600 hover:bg-royal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                   {isProcessing ? <Loader2 className="animate-spin mb-2 text-royal-600" /> : <FileText size={32} className="mb-2 text-gray-400 group-hover:text-royal-600" />}
                   <span className="font-bold text-gray-700 group-hover:text-royal-800">Text File (.txt)</span>
                </button>

                <button 
                  onClick={() => handleExport('print')}
                  disabled={isProcessing || (!includeStats && !includeUnattempted && !includeCertificates)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-gold-500 hover:bg-gold-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                   {isProcessing ? <Loader2 className="animate-spin mb-2 text-gold-600" /> : <Printer size={32} className="mb-2 text-gray-400 group-hover:text-gold-600" />}
                   <span className="font-bold text-gray-700 group-hover:text-gold-800">Print / PDF</span>
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default ExportModal;
