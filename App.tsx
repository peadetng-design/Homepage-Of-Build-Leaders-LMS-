import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePath, setActivePath] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot-password'>('register');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleAuth = (role: UserRole, name: string) => {
    setUser({
      id: '1',
      name: name,
      email: 'user@example.com',
      role: role,
      avatarUrl: ''
    });
    setAuthModalOpen(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setSidebarOpen(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-royal-100 selection:text-royal-900">
      
      {/* Header exists in both states, but changes content */}
      <Header 
        user={user} 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onRoleSwitch={handleRoleSwitch}
      />

      <div className="pt-16"> 
        {user ? (
          <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            <Sidebar 
              isOpen={sidebarOpen} 
              toggle={toggleSidebar} 
              currentRole={user.role}
              activePath={activePath}
              setActivePath={setActivePath}
              onSignOut={handleSignOut}
            />
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
              <Dashboard user={user} />
            </main>
          </div>
        ) : (
          <Hero onRegister={openRegister} onSignIn={openSignIn} />
        )}
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticate={handleAuth}
        switchMode={setAuthMode}
      />
    </div>
  );
};

export default App;