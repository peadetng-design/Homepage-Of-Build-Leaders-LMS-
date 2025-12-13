import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { User, UserRole } from './types';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePath, setActivePath] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot-password' | 'change-password' | 'accept-invite'>('register');
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);
  const [verificationNotification, setVerificationNotification] = useState<string | null>(null);

  // Initial Session Check, Invite Check & Verification Check
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    
    // 1. Handle Verification Link
    const verifyToken = queryParams.get('verify_token');
    if (verifyToken) {
      handleEmailVerification(verifyToken);
      // Clean URL
      window.history.replaceState({}, document.title, "/");
      return; // Stop further processing to avoid race conditions
    }

    // 2. Handle Invite Link
    const token = queryParams.get('invite');
    if (token) {
      setInviteToken(token);
      setAuthMode('accept-invite');
      setAuthModalOpen(true);
      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }

    // 3. Check for existing session
    const checkSession = async () => {
      const sessionUser = await authService.getSession();
      if (sessionUser) {
        setUser(sessionUser);
      }
    };
    checkSession();
  }, []);

  const handleEmailVerification = async (token: string) => {
    try {
      await authService.verifyEmail(token);
      setVerificationNotification("Email verified successfully! You can now sign in.");
      // Open Sign In Modal
      setAuthMode('signin');
      setAuthModalOpen(true);
    } catch (error) {
      console.error(error);
      setVerificationNotification("Verification failed. Link may be invalid or expired.");
      // Optional: Show error state
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    await authService.logout();
    setUser(null);
    setSidebarOpen(true);
    setActivePath('home');
  };

  const openRegister = () => {
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const openChangePassword = () => {
    setAuthMode('change-password');
    setAuthModalOpen(true);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    if (user) {
      // If we haven't stored the original role yet, store the current one (which is the true role)
      // This ensures we can always get back to the true role (e.g. Admin)
      const originalRole = user.originalRole || user.role;
      setUser({ ...user, role: newRole, originalRole });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-royal-100 selection:text-royal-900">
      
      {/* Global Notification for Verification */}
      {verificationNotification && (
        <div className={`fixed top-0 left-0 w-full z-[100] px-4 py-3 text-center font-bold text-white shadow-md ${verificationNotification.includes('failed') ? 'bg-red-500' : 'bg-green-600'}`}>
          <div className="flex items-center justify-center gap-2">
             <span>{verificationNotification}</span>
             <button onClick={() => setVerificationNotification(null)} className="p-1 hover:bg-white/20 rounded-full">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
             </button>
          </div>
        </div>
      )}

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
              <Dashboard 
                key={user.role} /* CRITICAL FIX: Force remount when role changes to reset internal dashboard state (e.g. escaping Parent Onboarding) */
                user={user} 
                onChangePasswordClick={openChangePassword}
              />
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
        inviteToken={inviteToken}
        currentUser={user}
      />
    </div>
  );
};

export default App;