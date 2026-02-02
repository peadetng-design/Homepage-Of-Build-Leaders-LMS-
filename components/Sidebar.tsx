import React from 'react';
import {
  Home, Book, Users, Award, MessageCircle, Settings,
  LogOut, Shield, Heart, ChevronLeft, ChevronRight,
  Library, Building2, UserPlus, Newspaper, MessageSquare, BadgeCheck, LayoutDashboard, UserCircle, History
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  currentRole: UserRole;
  activePath: string;
  setActivePath: (path: string) => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, currentRole, activePath, setActivePath, onSignOut }) => {
  const commonItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
    { label: 'Home', icon: Home, path: 'home' },
    { label: 'My Profile', icon: UserCircle, path: 'profile' },
    { label: 'Resources', icon: Library, path: 'resources' },
    { label: 'News', icon: Newspaper, path: 'news' },
    { label: 'Chat', icon: MessageSquare, path: 'chat' }, 
    { label: 'Certificates', icon: BadgeCheck, path: 'certificates' },
  ];

  const roleItems: Record<string, { label: string, icon: any, path: string }[]> = {
    [UserRole.STUDENT]: [
      { label: 'Progress', icon: Award, path: 'progress' },
    ],
    [UserRole.MENTOR]: [
      { label: 'My Group', icon: Users, path: 'group' },
    ],
    [UserRole.ADMIN]: [],
    [UserRole.CO_ADMIN]: [],
    [UserRole.ORGANIZATION]: [],
    [UserRole.PARENT]: [],
    [UserRole.GUEST]: []
  };

  const items = [...commonItems, ...(roleItems[currentRole] || [])];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white shadow-xl z-40 transition-all duration-300 ease-in-out border-r border-gray-100 flex flex-col
        ${isOpen ? 'w-32 md:w-64' : 'w-12 md:w-20'} pt-20 pb-4`}
    >
      <div className="flex-1 px-2 md:px-3 mt-4 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setActivePath(item.path)}
                className={`w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 group relative
                  ${isActive ? 'bg-royal-50 text-royal-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon size={isActive ? 22 : 20} className={`md:w-6 md:h-6 ${isActive ? 'text-royal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className={`ml-2 md:ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <div className="border-t border-gray-100 my-2 mx-2"></div>
          
          <button
              onClick={() => setActivePath('settings')}
              className={`w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 group relative
                ${activePath === 'settings' ? 'bg-royal-50 text-royal-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <Settings size={20} className={`md:w-6 md:h-6 ${activePath === 'settings' ? 'text-royal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className={`ml-2 md:ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Settings
              </span>
          </button>

           <button
              onClick={onSignOut}
              className={`w-full flex items-center p-2 md:p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group`}
            >
              <LogOut size={20} className="md:w-6 md:h-6 group-hover:text-red-500" />
              <span className={`ml-2 md:ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                Sign Out
              </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 py-4 mt-2 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-royal-900/5 p-4 rounded-[1.5rem] border border-royal-100">
                <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-royal-600" />
                    <span className="text-[9px] font-black text-royal-800 uppercase tracking-widest leading-none">Registry Console</span>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Specification Of Updates</p>
                        <div className="bg-white/50 p-2.5 rounded-xl border border-royal-100 text-[10px] font-bold text-royal-900 leading-snug shadow-sm">
                            Scholarly Persistence Patch: Stabilized text selection within Leadership Notes and resolved viewport-aware taskbar rendering. Implemented anchored inline bookmark markers with multi-layered registry inspection and recursive editing workflows.
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => alert("Restoring previous registry version...")}
                        className="w-full py-2.5 bg-royal-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                        <History size={12} className="text-gold-400" /> Restore Version
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="px-2 md:px-3 mt-2">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors mt-2"
        >
          {isOpen ? <ChevronLeft size={18} className="md:w-5 md:h-5" /> : <ChevronRight size={18} className="md:w-5 md:h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;