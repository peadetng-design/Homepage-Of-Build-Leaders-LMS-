
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AuthModal from './components/AuthModal';
import CreateGroupModal from './components/CreateGroupModal';
import Dashboard from './components/Dashboard';
import { User, UserRole } from './types';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePath, setActivePath] = useState('dashboard'); // Default to Dashboard if logged in
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot-password' | 'change-password' | 'accept-invite'>('register');
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);
  const [verificationNotification, setVerificationNotification] = useState<string | null>(null);
  
  // Key to force re-render of Dashboard when clicking the same sidebar item
  const [dashboardResetKey, setDashboardResetKey] = useState(0);

  // Initial Session Check, Invite Check & Verification Check
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    
    // 1. Handle Verification Link
    const verifyToken = queryParams.get('verify_token');
    if (verifyToken) {
      handleEmailVerification(verifyToken);
      window.history.replaceState({}, document.title, "/");
      return; 
    }

    // 2. Handle Invite Link
    const token = queryParams.get('invite');
    if (token) {
      setInviteToken(token);
      setAuthMode('accept-invite');
      setAuthModalOpen(true);
      window.history.replaceState({}, document.title, "/");
    }

    // 3. Check for existing session
    const checkSession = async () => {
      const sessionUser = await authService.getSession();
      if (sessionUser) {
        setUser(sessionUser);
        setActivePath('dashboard'); // Ensure dashboard is active on load
      }
    };
    checkSession();
  }, []);

  const handleEmailVerification = async (token: string) => {
    try {
      await authService.verifyEmail(token);
      setVerificationNotification("Email verified successfully! You can now sign in.");
      setAuthMode('signin');
      setAuthModalOpen(true);
    } catch (error) {
      console.error(error);
      setVerificationNotification("Verification failed. Link may be invalid or expired.");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleAuth = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
    setActivePath('dashboard'); // Redirect to dashboard after login
  };

  const handleSignOut = async () => {
    await authService.logout();
    setUser(null);
    setSidebarOpen(true);
    setActivePath('home'); // Go to Home (Hero) on logout
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
      const originalRole = user.originalRole || user.role;
      // When switching roles, we force the active path back to dashboard to prevent 
      // rendering views that might not exist for the new role
      setUser({ ...user, role: newRole, originalRole });
      setActivePath('dashboard');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  const handleNavigation = (path: string) => {
    if (path === activePath) {
      setDashboardResetKey(prev => prev + 1);
    } else {
      setActivePath(path);
      setDashboardResetKey(0);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-royal-100 selection:text-royal-900">
      
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

      {/* Header exists in both states */}
      <Header 
        user={user} 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onRoleSwitch={handleRoleSwitch}
        onCreateGroup={() => setCreateGroupModalOpen(true)}
      />

      <div className="pt-16"> 
        {user ? (
          <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            <Sidebar 
              isOpen={sidebarOpen} 
              toggle={toggleSidebar} 
              currentRole={user.role}
              activePath={activePath}
              setActivePath={handleNavigation}
              onSignOut={handleSignOut}
            />
            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
              {/* If 'home' is active, render Hero inside wrapper. Else render Dashboard. */}
              {activePath === 'home' ? (
                 <Hero 
                    onRegister={() => {}} 
                    onSignIn={() => {}} 
                    currentUser={user} 
                    onNavigateToDashboard={() => setActivePath('dashboard')}
                 />
              ) : (
                 <div className="p-4 md:p-8">
                    <DashboardWrapper 
                       user={user} 
                       onUpdateUser={handleUpdateUser}
                       activePath={activePath}
                       resetKey={dashboardResetKey}
                       onChangePasswordClick={openChangePassword}
                    />
                 </div>
              )}
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

      {user && (
        <CreateGroupModal 
          isOpen={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          currentUser={user}
          onGroupCreated={(updatedUser) => {
             setUser(updatedUser);
          }}
        />
      )}
    </div>
  );
};

const DashboardWrapper: React.FC<{user: User, onUpdateUser: (u: User) => void, activePath: string, resetKey: number, onChangePasswordClick: () => void}> = ({user, onUpdateUser, activePath, resetKey, onChangePasswordClick}) => {
   // FIX: Adding user.role to the key ensures the Dashboard completely resets when switching roles.
   // This solves the issue where users were "stuck" on specific role views like Parent Onboarding.
   return <Dashboard user={user} onUpdateUser={onUpdateUser} onChangePasswordClick={onChangePasswordClick} key={`${activePath}-${user.role}-${resetKey}`} initialView={activePath as any} />;
}

export default App;
