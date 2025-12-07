import React, { useState } from 'react';
import { Bell, Menu, Plus, X } from 'lucide-react';
import { UserRole, User } from '../types';

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  onRoleSwitch: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, sidebarOpen, onRoleSwitch }) => {
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setGuestMenuOpen(false);
    }
  };

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
            {/* Three Golden Chevrons (Upward Growth) */}
            <path d="M12 7 L20 3 L28 7" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11 L20 7 L28 11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15 L20 11 L28 15" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Minimalist Human Frame (The Leader) - Adjusted position */}
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
          {/* Create Group Action */}
          <button className="hidden md:flex items-center gap-2 bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} />
            <span>Create Group</span>
          </button>

          {/* Role Switcher */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-xs font-semibold tracking-wider text-royal-700 bg-royal-50 border border-royal-200 rounded-full uppercase hover:bg-royal-100 transition-colors">
              {user.role} View
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
              <div className="text-xs text-gray-400 font-medium px-2 py-1 uppercase">Switch Perspective</div>
              {Object.values(UserRole).filter(r => r !== UserRole.GUEST).map(role => (
                <button
                  key={role}
                  onClick={() => onRoleSwitch(role)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${user.role === role ? 'bg-royal-50 text-royal-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          {/* Icons */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
               {user.name.charAt(0)}
             </div>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
           {/* Guest Header Actions */}
           <button 
             onClick={() => setGuestMenuOpen(!guestMenuOpen)}
             className="p-2 text-royal-800 hover:bg-royal-50 rounded-lg transition-colors md:hidden"
           >
             {guestMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>

           {/* Desktop Nav */}
           <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => scrollToSection('about')} className="hover:text-royal-600 transition-colors">About Us</button>
              <button onClick={() => scrollToSection('resources')} className="hover:text-royal-600 transition-colors">Resources</button>
              <button onClick={() => scrollToSection('news')} className="hover:text-royal-600 transition-colors">News</button>
           </div>
        </div>
      )}

      {/* Mobile Menu Dropdown for Guests */}
      {!user && guestMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl p-4 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
           <button onClick={() => scrollToSection('about')} className="w-full text-left p-2 hover:bg-gray-50 rounded text-gray-700 font-medium">About Us</button>
           <button onClick={() => scrollToSection('resources')} className="w-full text-left p-2 hover:bg-gray-50 rounded text-gray-700 font-medium">Resources</button>
           <button onClick={() => scrollToSection('news')} className="w-full text-left p-2 hover:bg-gray-50 rounded text-gray-700 font-medium">News & Updates</button>
        </div>
      )}
    </header>
  );
};

export default Header;