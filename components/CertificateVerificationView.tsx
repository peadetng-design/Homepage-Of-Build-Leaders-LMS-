
import React, { useEffect, useState } from 'react';
import { Certificate } from '../types';
import { lessonService } from '../services/lessonService';
import { BadgeCheck, ShieldCheck, Calendar, User, BookOpen, AlertCircle, ArrowLeft, Loader2, Globe } from 'lucide-react';

interface CertificateVerificationViewProps {
  code: string;
  onBack: () => void;
}

const CertificateVerificationView: React.FC<CertificateVerificationViewProps> = ({ code, onBack }) => {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lessonService.verifyCertificate(code).then(result => {
        setCert(result || null);
        setLoading(false);
    });
  }, [code]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-royal-900 p-12 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                    <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 bg-gold-400 blur-3xl opacity-30 animate-pulse"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-gold-400 to-gold-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/20">
                            <BadgeCheck size={56} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-serif font-black uppercase tracking-tight mb-2">Credential Verification</h1>
                    <p className="text-royal-200 font-bold uppercase tracking-[0.2em] text-xs">Official Authenticity Report</p>
                </div>
            </div>

            <div className="p-12">
                {loading ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-royal-600" size={48} />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Synchronizing with Registry...</p>
                    </div>
                ) : cert ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-green-50 border-2 border-green-100 rounded-3xl p-8 flex items-center gap-6">
                            <div className="p-4 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h3 className="text-green-900 font-black text-2xl">Verified Authentically</h3>
                                <p className="text-green-700 font-medium">This certificate is a genuine credential issued by Build Biblical Leaders.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Recipient Name</h4>
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <User className="text-royal-400" size={20} />
                                        <span className="text-xl font-black">{cert.userName}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Learning Module</h4>
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <BookOpen className="text-royal-400" size={20} />
                                        <span className="text-xl font-black">{cert.moduleTitle}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Issue Date</h4>
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <Calendar className="text-royal-400" size={20} />
                                        <span className="text-xl font-black">{new Date(cert.issueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Registry ID</h4>
                                    <div className="flex items-center gap-3 text-gray-900">
                                        <Globe className="text-royal-400" size={20} />
                                        <span className="text-xl font-mono font-black">{cert.uniqueCode}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <button 
                                onClick={onBack}
                                className="w-full py-5 bg-royal-800 text-white font-black rounded-3xl shadow-xl shadow-royal-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                            >
                                <ArrowLeft size={20} /> Return to Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-8 animate-in shake duration-500">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase">Registry Match Not Found</h3>
                            <p className="text-gray-500 mt-2">The verification code <span className="font-mono font-bold text-red-600">{code}</span> does not exist in our secure registry.</p>
                        </div>
                        <button 
                            onClick={onBack}
                            className="px-12 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-sm"
                        >
                            Return Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CertificateVerificationView;
