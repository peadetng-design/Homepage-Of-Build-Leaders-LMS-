
import React from 'react';
import {
  Home, Book, Users, Award, MessageCircle, Settings,
  LogOut, Shield, Heart, ChevronLeft, ChevronRight,
  Library, Building2, UserPlus, Newspaper, MessageSquare, BadgeCheck, LayoutDashboard
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
  // Common items visible to all authenticated users
  const commonItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
    { label: 'Home', icon: Home, path: 'home' },
    { label: 'Resources', icon: Library, path: 'resources' },
    { label: 'News', icon: Newspaper, path: 'news' },
    { label: 'Chat', icon: MessageSquare, path: 'chat' }, 
    { label: 'Certificates', icon: BadgeCheck, path: 'certificates' },
  ];

  // Specific items per role
  const roleItems = {
    [UserRole.STUDENT]: [
      { label: 'My Lessons', icon: Book, path: 'lessons' },
      { label: 'Progress', icon: Award, path: 'progress' },
    ],
    [UserRole.MENTOR]: [
      { label: 'My Group', icon: Users, path: 'group' },
      { label: 'Assignments', icon: Book, path: 'assignments' },
    ],
    [UserRole.ADMIN]: [
      { label: 'Admin Panel', icon: Shield, path: 'admin' },
      { label: 'User Mgmt', icon: Users, path: 'users' },
    ],
    [UserRole.ORGANIZATION]: [
      { label: 'Ministry Panel', icon: Building2, path: 'org-panel' },
      { label: 'Staff Mgmt', icon: UserPlus, path: 'staff' },
    ],
    [UserRole.PARENT]: [
      { label: 'Child Progress', icon: Heart, path: 'child-progress' },
    ],
    [UserRole.GUEST]: []
  };

  const items = [...commonItems, ...(roleItems[currentRole] || [])];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white shadow-xl z-40 transition-all duration-300 ease-in-out border-r border-gray-100 flex flex-col
        ${isOpen ? 'w-32 md:w-64' : 'w-12 md:w-20'} pt-20 pb-4`}
    >
      <div className="flex-1 px-2 md:px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
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
              <span className={`ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-2 md:px-3 mt-auto space-y-2">
        <div className="border-t border-gray-100 my-2"></div>
        
        <button
            onClick={() => setActivePath('settings')}
            className={`w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 group relative
              ${activePath === 'settings' ? 'bg-royal-50 text-royal-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <Settings size={20} className={`md:w-6 md:h-6 ${activePath === 'settings' ? 'text-royal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className={`ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Settings
            </span>
        </button>

         <button
            onClick={onSignOut}
            className={`w-full flex items-center p-2 md:p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group`}
          >
            <LogOut size={20} className="md:w-6 md:h-6 group-hover:text-red-500" />
            <span className={`ml-3 font-bold md:font-medium text-[10px] md:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Sign Out
            </span>
        </button>
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
