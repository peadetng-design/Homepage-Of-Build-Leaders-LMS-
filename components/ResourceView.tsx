import React, { useState, useEffect } from 'react';
import { Resource } from '../types';
import { lessonService } from '../services/lessonService';
import { FileText, Download, Calendar, HardDrive, FileImage, File, Youtube, Link as LinkIcon, Globe } from 'lucide-react';

const ResourceView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    lessonService.getResources().then(setResources);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
        case 'pdf': return <FileText size={40} className="text-red-500" />;
        case 'doc': return <FileText size={40} className="text-blue-500" />;
        case 'image': return <FileImage size={40} className="text-purple-500" />;
        case 'video': return <Youtube size={40} className="text-red-600" />;
        case 'link': return <LinkIcon size={40} className="text-indigo-500" />;
        default: return <File size={40} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border-b-[10px] border-black">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={180} /></div>
            <div className="relative z-10">
                <h2 className="text-4xl font-serif font-black uppercase tracking-tighter mb-4">RESOURCES PORTAL</h2>
                <p className="text-blue-100 text-lg font-medium opacity-90 italic">Official rulebooks, spiritual study guides, and multimedia instructional assets.</p>
            </div>
        </div>

        {resources.length === 0 ? (
            <div className="text-center py-32 text-gray-300 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 shadow-inner">
                <FileText size={80} className="mx-auto mb-6 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm">Waiting for Asset Deposits...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {resources.map(res => (
                    <div key={res.id} className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-8">
                            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-royal-900 group-hover:text-white transition-all shadow-inner group-hover:scale-110 duration-500">
                                {getIcon(res.fileType)}
                            </div>
                            <span className="text-[10px] font-black bg-royal-50 text-royal-600 px-4 py-1.5 rounded-full border border-royal-100 uppercase tracking-widest">{res.fileType}</span>
                        </div>
                        <h3 className="font-serif font-black text-gray-950 text-xl mb-3 line-clamp-1 group-hover:text-royal-700 transition-colors">{res.title}</h3>
                        <p className="text-gray-500 text-sm font-medium mb-8 line-clamp-2 leading-relaxed h-[40px]">{res.description}</p>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-royal-300"/> {new Date(res.uploadedAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-royal-300"/> {res.size}</span>
                            </div>
                            <a 
                              href={res.url} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-royal-800 text-white font-black rounded-xl hover:bg-black transition-all flex items-center gap-3 shadow-xl border-b-4 border-royal-950 active:scale-95"
                              onClick={(e) => {
                                  if(res.url === '#') { e.preventDefault(); alert("Local simulation: Asset not available in cloud registry."); }
                              }}
                            >
                                <Download size={18} /> DOWNLOAD
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ResourceView;