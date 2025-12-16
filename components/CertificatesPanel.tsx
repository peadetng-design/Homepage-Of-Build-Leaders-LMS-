
import React, { useState, useEffect } from 'react';
import { User, UserRole, Certificate, Module, CertificateDesign } from '../types';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import CertificateGenerator from './CertificateGenerator';
import { BadgeCheck, Download, Search, Plus, X, Loader2, ArrowLeft, ArrowRight, PenTool, Layout, Palette, Image as ImageIcon } from 'lucide-react';

interface CertificatesPanelProps {
  currentUser: User;
  onBack?: () => void;
}

// Default Designs
const DEFAULT_DESIGN: CertificateDesign = {
    templateId: 'classic',
    primaryColor: '#1e1b4b',
    secondaryColor: '#d97706',
    titleOverride: 'Certificate',
    messageOverride: 'This certifies that',
    signatureName: 'Director'
};

const CertificatesPanel: React.FC<CertificatesPanelProps> = ({ currentUser, onBack }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [activeTab, setActiveTab] = useState<'my_certs' | 'manage'>('my_certs');
  const [isLoading, setIsLoading] = useState(true);

  // Manage / Issue State
  const [manageSearch, setManageSearch] = useState('');
  
  // --- WIZARD STATE ---
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [issueLoading, setIssueLoading] = useState(false);
  
  // Step 1: Data
  const [students, setStudents] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');

  // Step 2 & 3: Design
  const [designConfig, setDesignConfig] = useState<CertificateDesign>(DEFAULT_DESIGN);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const canManage = [UserRole.ADMIN, UserRole.MENTOR, UserRole.ORGANIZATION].includes(currentUser.role);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'my_certs') {
        const data = await lessonService.getUserCertificates(currentUser.id);
        setCertificates(data);
      } else if (activeTab === 'manage' && canManage) {
        const data = await lessonService.getAllCertificates();
        setCertificates(data);
        
        const modData = await lessonService.getModules();
        setModules(modData);
        
        const allUsers = await authService.getAllUsers(currentUser);
        setStudents(allUsers.filter(u => u.id !== currentUser.id)); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
      setIssueLoading(true);
      try {
          const student = students.find(s => s.id === selectedStudentId);
          if (!student) throw new Error("Student not found");
          
          await lessonService.issueCertificate(student.id, student.name, selectedModuleId, designConfig);
          
          setShowWizard(false);
          resetWizard();
          fetchData(); 
          alert(`Certificate successfully issued to ${student.name}!`);
      } catch (e) {
          console.error(e);
          alert("Failed to issue certificate.");
      } finally {
          setIssueLoading(false);
      }
  };

  const resetWizard = () => {
      setWizardStep(1);
      setSelectedStudentId('');
      setSelectedModuleId('');
      setDesignConfig(DEFAULT_DESIGN);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setDesignConfig(prev => ({ ...prev, signatureUrl: ev.target!.result as string }));
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // Mock preview object for the generator
  const getPreviewCertificate = (): Certificate => {
      const student = students.find(s => s.id === selectedStudentId) || { name: 'Student Name' } as any;
      const mod = modules.find(m => m.id === selectedModuleId) || { title: 'Module Title' } as any;
      
      return {
          id: 'preview',
          userId: 'preview',
          userName: student.name,
          moduleId: 'preview',
          moduleTitle: mod.title,
          issueDate: new Date().toISOString(),
          issuerName: currentUser.name || 'Organization',
          uniqueCode: 'PREVIEW-CODE-123',
          design: designConfig
      };
  };

  const getFilteredCertificates = () => {
      if (activeTab === 'my_certs') return certificates;
      return certificates.filter(c => 
          c.userName.toLowerCase().includes(manageSearch.toLowerCase()) || 
          c.moduleTitle.toLowerCase().includes(manageSearch.toLowerCase())
      );
  };

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
          <div className="flex items-center gap-4">
             {onBack && (
                 <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                     <ArrowLeft size={24} />
                 </button>
             )}
             <div>
                 <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
                    <BadgeCheck className="text-gold-500" size={32} /> Certificates
                 </h2>
                 <p className="text-gray-500 mt-1">View, download, and share your achievements.</p>
             </div>
          </div>
          {canManage && (
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('my_certs')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'my_certs' ? 'bg-white shadow text-royal-800' : 'text-gray-500 hover:text-gray-800'}`}
                >
                   My Certificates
                </button>
                <button 
                  onClick={() => setActiveTab('manage')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'manage' ? 'bg-white shadow text-royal-800' : 'text-gray-500 hover:text-gray-800'}`}
                >
                   Manage / Issue
                </button>
             </div>
          )}
       </div>

       {/* Content */}
       <div className="min-h-[400px]">
          {activeTab === 'manage' && (
             <div className="mb-6 bg-royal-50 p-4 rounded-xl border border-royal-100 flex items-center justify-between">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                       type="text" 
                       placeholder="Search student name or module..." 
                       value={manageSearch}
                       onChange={(e) => setManageSearch(e.target.value)}
                       className="w-full pl-10 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-royal-500 outline-none"
                    />
                 </div>
                 <button 
                    onClick={() => { resetWizard(); setShowWizard(true); }}
                    className="px-4 py-2 bg-royal-600 text-white font-bold rounded-lg hover:bg-royal-700 flex items-center gap-2 shadow-md transition-transform hover:-translate-y-0.5"
                 >
                    <Plus size={18} /> Issue Certificate
                 </button>
             </div>
          )}

          {isLoading ? (
             <div className="text-center py-20 text-gray-400">Loading certificates...</div>
          ) : getFilteredCertificates().length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <BadgeCheck size={64} className="mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-bold text-gray-600">No Certificates Found</h3>
                <p className="text-gray-400">
                   {activeTab === 'my_certs' 
                      ? "Complete a learning module to earn your first certificate!" 
                      : "No certificates have been issued yet."}
                </p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredCertificates().map(cert => (
                   <div key={cert.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      {/* Preview Top */}
                      <div className="h-32 bg-royal-900 relative overflow-hidden flex items-center justify-center">
                         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                         <BadgeCheck size={64} className="text-gold-500 relative z-10" />
                      </div>
                      
                      <div className="p-6">
                         <h3 className="font-bold text-gray-900 text-lg mb-1">{cert.moduleTitle}</h3>
                         <p className="text-sm text-gray-500 mb-4">Issued to {cert.userName}</p>
                         
                         <div className="flex justify-between items-center text-xs text-gray-400 mb-6">
                            <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                            <span className="font-mono">{cert.uniqueCode}</span>
                         </div>

                         <button 
                           onClick={() => setViewingCert(cert)}
                           className="w-full py-3 bg-gray-50 hover:bg-royal-600 hover:text-white text-gray-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
                         >
                            <Download size={18} /> View & Download
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       {/* Viewing Modal */}
       {viewingCert && (
          <CertificateGenerator 
             certificate={viewingCert} 
             onClose={() => setViewingCert(null)} 
          />
       )}

       {/* DESIGNER WIZARD MODAL */}
       {showWizard && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                   
                   {/* Wizard Header */}
                   <div className="bg-royal-900 p-6 text-white flex justify-between items-center shrink-0">
                       <div>
                           <h3 className="font-bold text-lg flex items-center gap-2"><BadgeCheck size={20} className="text-gold-500"/> Issue Certificate</h3>
                           <p className="text-xs text-royal-200 mt-1">Step {wizardStep} of 3</p>
                       </div>
                       <button onClick={() => setShowWizard(false)}><X size={20}/></button>
                   </div>

                   {/* Wizard Body */}
                   <div className="flex-1 overflow-y-auto p-8">
                       
                       {/* STEP 1: RECIPIENT */}
                       {wizardStep === 1 && (
                           <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-right-4">
                               <h3 className="text-xl font-bold text-gray-800 border-b pb-2">1. Select Recipient & Context</h3>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student</label>
                                   <select 
                                       required
                                       value={selectedStudentId}
                                       onChange={(e) => setSelectedStudentId(e.target.value)}
                                       className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-royal-500 bg-white"
                                   >
                                       <option value="" disabled>Choose a student...</option>
                                       {students.map(s => (
                                           <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                       ))}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Module Completed</label>
                                   <select 
                                       required
                                       value={selectedModuleId}
                                       onChange={(e) => setSelectedModuleId(e.target.value)}
                                       className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-royal-500 bg-white"
                                   >
                                       <option value="" disabled>Choose a module...</option>
                                       {modules.map(m => (
                                           <option key={m.id} value={m.id}>{m.title}</option>
                                       ))}
                                   </select>
                               </div>
                           </div>
                       )}

                       {/* STEP 2: TEMPLATE */}
                       {wizardStep === 2 && (
                           <div className="space-y-6 animate-in slide-in-from-right-4">
                               <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Layout size={20}/> 2. Choose Design</h3>
                               
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   {['classic', 'modern', 'minimal'].map((tId) => (
                                       <div 
                                           key={tId}
                                           onClick={() => setDesignConfig({ ...designConfig, templateId: tId as any })}
                                           className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all ${designConfig.templateId === tId ? 'border-royal-600 bg-royal-50 ring-2 ring-royal-200' : 'border-gray-200'}`}
                                       >
                                           <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                               {tId} Preview
                                           </div>
                                           <h4 className="font-bold text-center capitalize">{tId} Style</h4>
                                       </div>
                                   ))}
                               </div>

                               <div className="grid grid-cols-2 gap-6 mt-6">
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Color</label>
                                       <div className="flex gap-2">
                                           {['#1e1b4b', '#be185d', '#047857', '#1d4ed8', '#000000'].map(c => (
                                               <button 
                                                   key={c}
                                                   onClick={() => setDesignConfig({...designConfig, primaryColor: c})}
                                                   className={`w-8 h-8 rounded-full border-2 ${designConfig.primaryColor === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                                                   style={{ backgroundColor: c }}
                                               />
                                           ))}
                                       </div>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Accent Color</label>
                                       <div className="flex gap-2">
                                           {['#d97706', '#f59e0b', '#fbbf24', '#cbd5e1', '#ef4444'].map(c => (
                                               <button 
                                                   key={c}
                                                   onClick={() => setDesignConfig({...designConfig, secondaryColor: c})}
                                                   className={`w-8 h-8 rounded-full border-2 ${designConfig.secondaryColor === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                                                   style={{ backgroundColor: c }}
                                               />
                                           ))}
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {/* STEP 3: CUSTOMIZE */}
                       {wizardStep === 3 && (
                           <div className="space-y-6 animate-in slide-in-from-right-4">
                               <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><PenTool size={20}/> 3. Customize Text & Signature</h3>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Certificate Title</label>
                                       <input 
                                           className="w-full p-2 border rounded-lg" 
                                           value={designConfig.titleOverride} 
                                           onChange={e => setDesignConfig({...designConfig, titleOverride: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Intro Message</label>
                                       <input 
                                           className="w-full p-2 border rounded-lg" 
                                           value={designConfig.messageOverride} 
                                           onChange={e => setDesignConfig({...designConfig, messageOverride: e.target.value})}
                                       />
                                   </div>
                               </div>

                               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                   <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><PenTool size={16}/> Signature Options</h4>
                                   <div className="flex flex-col md:flex-row gap-6">
                                       <div className="flex-1">
                                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Digital Text Signature</label>
                                           <input 
                                               className="w-full p-2 border rounded-lg font-serif italic text-xl" 
                                               value={designConfig.signatureName} 
                                               onChange={e => setDesignConfig({...designConfig, signatureName: e.target.value, signatureUrl: undefined})}
                                               placeholder="Type Name..."
                                           />
                                       </div>
                                       <div className="flex items-center justify-center text-gray-400 font-bold text-sm">OR</div>
                                       <div className="flex-1">
                                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Signature Image</label>
                                           <div className="relative">
                                               <input type="file" accept="image/*" onChange={handleSignatureUpload} className="w-full p-2 bg-white border rounded-lg text-sm" />
                                               {designConfig.signatureUrl && <div className="absolute top-2 right-2 text-green-600"><BadgeCheck size={16}/></div>}
                                           </div>
                                       </div>
                                   </div>
                               </div>

                               <button 
                                   onClick={() => setShowPreviewModal(true)} 
                                   className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-200 flex items-center justify-center gap-2"
                               >
                                   <ImageIcon size={18}/> Preview Certificate
                               </button>
                           </div>
                       )}
                   </div>

                   {/* Footer Actions */}
                   <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
                       {wizardStep > 1 ? (
                           <button onClick={() => setWizardStep(prev => prev - 1 as any)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Back</button>
                       ) : <div></div>}

                       {wizardStep < 3 ? (
                           <button 
                               onClick={() => setWizardStep(prev => prev + 1 as any)} 
                               disabled={!selectedStudentId || !selectedModuleId}
                               className="px-6 py-2 bg-royal-600 text-white rounded-lg font-bold hover:bg-royal-700 disabled:opacity-50 flex items-center gap-2"
                           >
                               Next <ArrowRight size={16}/>
                           </button>
                       ) : (
                           <button 
                               onClick={handleIssueCertificate}
                               disabled={issueLoading}
                               className="px-8 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg"
                           >
                               {issueLoading ? <Loader2 className="animate-spin" size={18}/> : <BadgeCheck size={18}/>} 
                               Issue Now
                           </button>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* PREVIEW MODAL (Inside Wizard) */}
       {showPreviewModal && (
           <CertificateGenerator 
               certificate={getPreviewCertificate()} 
               previewDesign={designConfig}
               onClose={() => setShowPreviewModal(false)}
           />
       )}
    </div>
  );
};

export default CertificatesPanel;
