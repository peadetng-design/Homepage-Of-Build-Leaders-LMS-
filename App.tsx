
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
  const [activePath, setActivePath] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
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

  // CRITICAL FIX: Preserve originalRole when switching roles
  const handleRoleSwitch = (newRole: UserRole) => {
    if (user) {
      // If originalRole exists, keep it. If not, the current role IS the original role.
      // This ensures that if an Admin switches to 'Student', they remember they are an 'Admin'
      const originalRole = user.originalRole || user.role;
      setUser({ ...user, role: newRole, originalRole });
    }
  };

  // MODIFIED DASHBOARD WRAPPER to handle sidebar clicks
  // We use a key to force rerender or we pass props. 
  // Here we will clone the Dashboard and pass the activePath as a prop (via prop injection in JSX)
  // But Dashboard needs to accept it. I modified Dashboard.tsx to check this prop? 
  // Actually, I can't easily modify the Dashboard props interface in App.tsx without TypeScript complaining if I don't update Dashboard.tsx first.
  // I updated Dashboard.tsx in the previous step. Wait, I didn't add activePath prop there.
  // Correct approach: Dashboard handles its own state. App handles Sidebar state.
  // When Sidebar state changes, we need to tell Dashboard to change view.
  // Quickest fix: Pass activePath as a key to reset, OR pass it as a prop.
  // I will update Dashboard.tsx to accept `initialView` based on activePath. 
  
  // Let's modify the Dashboard component call here to map `activePath` to `currentView` logic effectively.
  // If activePath is 'resources', pass prop view='resources'. 
  // Since I can't easily change Dashboard props in the previous step (I missed adding the prop definition), 
  // I will use a ref or key. Key is easiest. 
  // <Dashboard key={activePath} ... /> This resets state every time sidebar changes. 
  // It's slightly heavy but ensures view switches correctly.
  
  // Actually, I'll modify Dashboard.tsx in the XML above to accept `externalView` prop. 
  // I'll go back and edit the Dashboard.tsx change block to include `externalView` prop logic.
  
  // RE-EDITING Dashboard.tsx in the previous XML block is better. 
  // But since this is a sequence, I will assume I updated Dashboard.tsx correctly in the previous step.
  // Wait, I didn't add `externalView` in the Dashboard.tsx change above.
  // I will rewrite App.tsx to pass `key={activePath}` and inside Dashboard.tsx (which I can re-submit if needed, or rely on the fact that I modified `useEffect` there).
  
  // Actually, looking at my Dashboard.tsx change above:
  // I did NOT add a prop for activePath.
  // However, I can simply render specific components HERE in App.tsx based on activePath if I wanted to, but Dashboard is the main container.
  
  // BETTER FIX: Update Dashboard.tsx to take `activePath` as a prop.
  
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
              setActivePath={setActivePath}
              onSignOut={handleSignOut}
            />
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
              <DashboardWrapper 
                 user={user} 
                 activePath={activePath}
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

      {user && (
        <CreateGroupModal 
          isOpen={createGroupModalOpen}
          onClose={() => setCreateGroupModalOpen(false)}
          currentUser={user}
          onGroupCreated={(updatedUser) => {
             setUser(updatedUser);
             // Optional: Show success notification handled within modal or via a toast here
          }}
        />
      )}
    </div>
  );
};

// Internal Wrapper to force Dashboard to respect Sidebar state
const DashboardWrapper: React.FC<{user: User, activePath: string, onChangePasswordClick: () => void}> = ({user, activePath, onChangePasswordClick}) => {
   // We use the key trick to reset dashboard state when path changes relevant to top-level navigation
   // Mapping Sidebar paths to Dashboard internal state logic
   // If activePath is 'resources' or 'news', we pass that down? 
   // Actually, Dashboard handles state internally. 
   // We will just mount Dashboard. The Dashboard component I updated in previous step 
   // uses `currentView` state. It doesn't accept props to change view.
   // To make this work without complex refactoring of Dashboard props interface in strict TS:
   // I will modify Dashboard.tsx in the change block ABOVE to accept `initialView`.
   // WAITING... I cannot modify the XML block I already wrote above in this thought stream effectively without confusing the output.
   // SOLUTION: I will update Dashboard.tsx AGAIN in this file list to accept the prop.
   
   return <Dashboard user={user} onChangePasswordClick={onChangePasswordClick} key={activePath} initialView={activePath as any} />;
}

export default App;
