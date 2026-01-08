
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Plus, X, ChevronDown, User as UserIcon, ShieldCheck } from 'lucide-react';
import { UserRole, User } from '../types';

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  onRoleSwitch: (role: UserRole) => void;
  onCreateGroup?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, sidebarOpen, onRoleSwitch, onCreateGroup }) => {
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setGuestMenuOpen(false);
    }
  };

  const getAvailableRoles = () => {
     if (!user) return [];
     
     const SYSTEM_ADMIN_EMAIL = 'peadetng@gmail.com';
     // Fix: Ensure we check both originalRole and current role for Admin status
     const isSystemAdmin = 
        user.email === SYSTEM_ADMIN_EMAIL || 
        user.originalRole === UserRole.ADMIN || 
        user.originalRole === UserRole.CO_ADMIN ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.CO_ADMIN;

     if (isSystemAdmin) {
        return Object.values(UserRole).filter(r => r !== UserRole.GUEST);
     } 
     
     return [
       UserRole.STUDENT,
       UserRole.MENTOR,
       UserRole.ORGANIZATION,
       UserRole.PARENT
     ];
  };

  const availableRoles = getAvailableRoles();

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 z-50 px-4 flex items-center justify-between transition-all">
      <div className="flex items-center gap-4">
        {user && (
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu size={24} />
          </button>
        )}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-lg hover:scale-105 transition-transform">
            <rect width="40" height="40" rx="10" fill="url(#headerLogoGradient)" />
            <path d="M12 7 L20 3 L28 7" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11 L20 7 L28 11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15 L20 11 L28 15" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20" cy="21" r="3.5" stroke="white" strokeWidth="3" />
            <path d="M10 35C10 30 15 27 20 27C25 27 30 30 30 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="headerLogoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4338ca" />
                <stop offset="1" stopColor="#312e81" />
              </linearGradient>
            </defs>
          </svg>
          <span className="cinzel font-bold text-lg hidden md:block text-royal-900 tracking-wide">
            Build Biblical Leaders
          </span>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onCreateGroup}
            className="hidden md:flex items-center gap-2 bg-royal-800 hover:bg-royal-950 text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-md shadow-royal-900/10 transform active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>CREATE GROUP</span>
          </button>

          <div className="relative" ref={roleRef}>
            <button 
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-black tracking-widest text-royal-900 bg-royal-100 border-2 border-royal-200 rounded-full uppercase hover:bg-royal-200 transition-all shadow-sm"
            >
              <ShieldCheck size={14} className="text-royal-600" />
              {user.role.replace('_', '-')} PERSPECTIVE <ChevronDown size={14} />
            </button>
            
            {roleMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] text-gray-400 font-black px-3 py-2 uppercase border-b border-gray-50 mb-1 tracking-widest">Switch Identity</div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {availableRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleSwitch(role as UserRole);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${user.role === role ? 'bg-royal-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {role.replace('_', '-')}
                      {user.role === role && <UserIcon size={14} fill="currentColor" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm"></span>
          </button>

          <button className="relative p-0.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors overflow-hidden">
             {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover shadow-inner border border-gray-100" />
             ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {user.name.charAt(0)}
                </div>
             )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setGuestMenuOpen(!guestMenuOpen)}
             className="p-2 text-royal-800 hover:bg-royal-50 rounded-lg transition-colors md:hidden"
           >
             {guestMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>

           <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-500">
              <button onClick={() => scrollToSection('about')} className="hover:text-royal-600 transition-colors">About Us</button>
              <button onClick={() => scrollToSection('resources')} className="hover:text-royal-600 transition-colors">Resources</button>
              <button onClick={() => scrollToSection('news')} className="hover:text-royal-600 transition-colors">News</button>
           </div>
        </div>
      )}

      {!user && guestMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl p-4 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
           <button onClick={() => scrollToSection('about')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-gray-700 font-bold text-sm uppercase">About Us</button>
           <button onClick={() => scrollToSection('resources')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-gray-700 font-bold text-sm uppercase">Resources</button>
           <button onClick={() => scrollToSection('news')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-gray-700 font-bold text-sm uppercase">News & Updates</button>
        </div>
      )}
    </header>
  );
};

export default Header;
