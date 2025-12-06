import React from 'react';
import {
  Home, Book, Users, Award, MessageCircle, Settings,
  LogOut, Shield, Heart, ChevronLeft, ChevronRight,
  Library
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
    { label: 'Home', icon: Home, path: 'home' },
    { label: 'Resources', icon: Library, path: 'resources' },
    { label: 'Community', icon: MessageCircle, path: 'community', badge: 3 },
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
    [UserRole.PARENT]: [
      { label: 'Child Progress', icon: Heart, path: 'child-progress' },
    ],
    [UserRole.GUEST]: []
  };

  // Combine common items with role-specific items
  const items = [...commonItems, ...(roleItems[currentRole] || [])];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white shadow-xl z-40 transition-all duration-300 ease-in-out border-r border-gray-100 flex flex-col
        ${isOpen ? 'w-64' : 'w-20'} pt-20 pb-4`}
    >
      <div className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setActivePath(item.path)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
                ${isActive ? 'bg-royal-50 text-royal-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <Icon size={24} className={`${isActive ? 'text-royal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                {item.label}
              </span>
              {item.badge && isOpen && (
                <span className="absolute right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
               {item.badge && !isOpen && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 mt-auto space-y-2">
        <div className="border-t border-gray-100 my-2"></div>
        
        {/* Settings - Available for all logged in users */}
        <button
            onClick={() => setActivePath('settings')}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
              ${activePath === 'settings' ? 'bg-royal-50 text-royal-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <Settings size={24} className={`${activePath === 'settings' ? 'text-royal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Settings
            </span>
        </button>

         <button
            onClick={onSignOut}
            className={`w-full flex items-center p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group`}
          >
            <LogOut size={24} className="group-hover:text-red-500" />
            <span className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Sign Out
            </span>
        </button>
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors mt-2"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;