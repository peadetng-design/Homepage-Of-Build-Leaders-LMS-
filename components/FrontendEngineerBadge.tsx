import React from 'react';
import { Shield } from 'lucide-react';

const FrontendEngineerBadge: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none opacity-30 hover:opacity-100 transition-opacity">
      <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 flex items-center gap-2.5 shadow-xl ring-1 ring-black/5">
        <div className="p-1 bg-royal-50 rounded-md">
            <Shield size={14} className="text-royal-600" />
        </div>
        <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-[0.2em] text-royal-900 uppercase leading-none">System Integrity</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Verified Session</span>
        </div>
      </div>
    </div>
  );
};

export default FrontendEngineerBadge;