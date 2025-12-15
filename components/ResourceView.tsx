
import React, { useState, useEffect } from 'react';
import { Resource } from '../types';
import { lessonService } from '../services/lessonService';
import { FileText, Download, Calendar, HardDrive, FileImage, File } from 'lucide-react';

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
        default: return <File size={40} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
            <h2 className="text-3xl font-serif font-bold mb-2">Resource Library</h2>
            <p className="text-blue-100">Download official rulebooks, study guides, and administrative documents.</p>
        </div>

        {resources.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p>No resources uploaded yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                    <div key={res.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                                {getIcon(res.fileType)}
                            </div>
                            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">{res.fileType}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{res.title}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{res.description}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-400">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(res.uploadedAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><HardDrive size={12}/> {res.size}</span>
                            </div>
                            <a 
                              href={res.url} 
                              download={res.title}
                              className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                              onClick={(e) => {
                                  // Since URLs might be blobs or mock, prevent default if hash
                                  if(res.url === '#') { e.preventDefault(); alert("File download simulation."); }
                              }}
                            >
                                <Download size={16} /> Download
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
