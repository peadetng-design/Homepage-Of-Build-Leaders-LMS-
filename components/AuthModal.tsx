import React, { useState, useEffect } from 'react';
import { X, User, Users, Shield, Heart, Mail, Lock, ArrowRight, Check, Loader2, KeyRound, ArrowLeft, MailCheck } from 'lucide-react';
import { UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'register' | 'forgot-password' | 'change-password' | 'accept-invite';
  inviteToken?: string;
  onClose: () => void;
  onAuthenticate: (user: any) => void;
  switchMode: (mode: 'signin' | 'register' | 'forgot-password' | 'change-password' | 'accept-invite') => void;
  currentUser?: any;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, mode, onClose, onAuthenticate, switchMode, inviteToken, currentUser 
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); // For change pass
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Invite Logic
  const [inviteData, setInviteData] = useState<any>(null);

  // Reset state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setRegistrationSuccess(false);
      if (mode === 'accept-invite' && inviteToken) {
         validateToken(inviteToken);
      }
    }
  }, [isOpen, mode, inviteToken]);

  const validateToken = async (token: string) => {
    setIsLoading(true);
    try {
      const data = await authService.validateInvite(token);
      setInviteData(data);
      setEmail(data.email);
    } catch (error: any) {
      setFeedback({ msg: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const user = await authService.login(email, password);
        onAuthenticate(user);
        onClose();
      } 
      else if (mode === 'register') {
        if (!selectedRole) {
          setFeedback({ msg: "Please select a role", type: 'error' });
          setIsLoading(false);
          return;
        }
        await authService.register(name, email, password, selectedRole);
        setRegistrationSuccess(true);
      }
      else if (mode === 'accept-invite' && inviteToken) {
        if (!name || !password) throw new Error("Please fill all fields");
        const user = await authService.acceptInvite(inviteToken, name, password);
        onAuthenticate(user);
        onClose();
      }
      else if (mode === 'change-password') {
        await authService.changePassword(currentUser, password, newPassword);
        setFeedback({ msg: 'Password changed successfully', type: 'success' });
        setTimeout(onClose, 1500);
      }
      else if (mode === 'forgot-password') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setFeedback({ msg: 'Reset instructions sent to your email.', type: 'success' });
      }
    } catch (error: any) {
      setFeedback({ msg: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    setFeedback(null);
    try {
      // If registering, pass the selected role.
      const user = await authService.loginWithSocial(provider, selectedRole || undefined);
      onAuthenticate(user);
      onClose();
    } catch (error: any) {
      setFeedback({ msg: error.message, type: 'error' });
    } finally {
      setSocialLoading(null);
    }
  };

  const roles = [
    { id: UserRole.STUDENT, label: 'Student', icon: User, desc: 'Learn, grow & compete', color: 'bg-blue-100 text-blue-600' },
    { id: UserRole.MENTOR, label: 'Mentor', icon: Users, desc: 'Guide your team', color: 'bg-indigo-100 text-indigo-600' },
    { id: UserRole.ADMIN, label: 'Admin', icon: Shield, desc: 'Manage system', color: 'bg-purple-100 text-purple-600' },
    { id: UserRole.PARENT, label: 'Parent', icon: Heart, desc: 'Track progress', color: 'bg-rose-100 text-rose-600' },
  ];

  const getHeaderTitle = () => {
    if (registrationSuccess) return 'Check Your Email';
    if (mode === 'forgot-password') return 'Reset Password';
    if (mode === 'change-password') return 'Security Settings';
    if (mode === 'accept-invite') return 'Welcome Aboard';
    return mode === 'signin' ? 'Welcome Back' : 'Join the Mission';
  };

  const getHeaderSubtitle = () => {
    if (registrationSuccess) return 'Verification required';
    if (mode === 'forgot-password') return 'We will send you instructions';
    if (mode === 'change-password') return 'Update your credentials';
    if (mode === 'accept-invite') return 'Complete your account setup';
    return mode === 'signin' ? 'Sign in to access your dashboard' : 'Create an account to get started';
  };

  // Shared styles for inputs and buttons to ensure consistency and bold visibility
  const inputClass = "w-full px-4 py-3 bg-white border-2 border-gray-900 rounded-xl focus:ring-4 focus:ring-royal-500/30 outline-none font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal";
  const labelClass = "text-sm font-bold text-gray-800 ml-1 mb-1 block";
  const buttonClass = "w-full bg-royal-800 hover:bg-royal-900 text-white font-bold py-4 rounded-xl shadow-xl border-2 border-royal-950 transition-all flex items-center justify-center gap-2 text-lg transform hover:-translate-y-0.5";
  const socialButtonClass = "w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-900 font-bold transition-all transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 border border-gray-200">
        
        {/* Header */}
        <div className="relative bg-royal-900 p-8 text-white overflow-hidden shrink-0">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <h2 className="text-3xl font-serif font-bold mb-2">
                  {getHeaderTitle()}
                </h2>
                <p className="text-royal-200 text-sm">
                  {getHeaderSubtitle()}
                </p>
             </div>
             <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
               <X size={20} />
             </button>
           </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-4 text-center text-sm font-bold ${feedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {feedback.msg}
          </div>
        )}

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-white custom-scrollbar">
          
          {/* REGISTRATION SUCCESS STATE */}
          {registrationSuccess ? (
             <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Verify your email address</h3>
                <p className="text-gray-600 text-lg">
                  We've sent a verification link to <span className="font-bold text-gray-900">{email}</span>. 
                  Please check your inbox (and spam folder) to complete your registration.
                </p>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 text-left">
                  <strong>Simulated Action:</strong> Since this is a demo, check your browser console (F12) for the generated verification link.
                </div>
                <button 
                  onClick={() => {
                    setRegistrationSuccess(false);
                    switchMode('signin');
                  }}
                  className={buttonClass}
                >
                  Return to Sign In
                </button>
             </div>
          ) : (
            <>
              {/* CHANGE PASSWORD MODE */}
              {mode === 'change-password' && (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className={labelClass}>Current Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Old Password"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder="New Secure Password"
                      />
                      <p className="text-xs text-gray-500 ml-1 mt-1 font-semibold">Must be at least 8 characters</p>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={buttonClass}
                    >
                      {isLoading && <Loader2 className="animate-spin" size={24} />}
                      Update Password
                    </button>
                 </form>
              )}

              {/* FORGOT PASSWORD MODE */}
              {mode === 'forgot-password' && (
                 <div className="space-y-6">
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={inputClass}
                              placeholder="you@example.com"
                            />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={buttonClass}
                        >
                          {isLoading && <Loader2 className="animate-spin" size={24} />}
                          Send Reset Instructions
                        </button>
                        <button 
                          type="button"
                          onClick={() => switchMode('signin')}
                          className="w-full text-gray-500 font-bold text-sm hover:text-royal-600 flex items-center justify-center gap-2"
                        >
                          <ArrowLeft size={16} /> Back to Sign In
                        </button>
                     </form>
                 </div>
              )}

              {/* ACCEPT INVITE MODE */}
              {mode === 'accept-invite' && (
                 <div className="space-y-6">
                   {feedback?.type === 'error' ? (
                     <div className="text-center py-4">
                       <p className="text-gray-500">Please check your link and try again.</p>
                     </div>
                   ) : (
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                          <p className="text-sm text-blue-800 font-medium">
                            You have been invited to join as <span className="font-bold">{inviteData?.role || 'User'}</span>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{email}</p>
                        </div>

                        <div>
                          <label className={labelClass}>Full Name</label>
                          <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className={inputClass}
                              placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                          <label className={labelClass}>Set Password</label>
                          <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={inputClass}
                              placeholder="Create a strong password"
                            />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={buttonClass}
                        >
                          {isLoading && <Loader2 className="animate-spin" size={24} />}
                          Complete Registration
                        </button>
                     </form>
                   )}
                 </div>
              )}

              {/* REGISTER: ROLE SELECTION MODE */}
              {mode === 'register' && !selectedRole && (
                 <div className="space-y-6">
                    {/* Role Selection Only - Social Buttons removed from here */}
                    <div className="grid grid-cols-2 gap-4">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className="relative flex flex-col items-start p-5 border-2 border-gray-200 rounded-2xl hover:border-royal-800 hover:shadow-lg transition-all group text-left bg-white"
                        >
                          <div className={`p-3 rounded-xl mb-3 ${role.color} group-hover:scale-110 transition-transform`}>
                            <role.icon size={24} />
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg">{role.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{role.desc}</p>
                        </button>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-100 text-center">
                      <span className="text-gray-500 text-sm">Already have an account? </span>
                      <button onClick={() => switchMode('signin')} className="text-royal-600 font-bold text-sm hover:underline">Sign in</button>
                    </div>
                 </div>
              )}

              {/* SIGN IN OR REGISTER FORM */}
              {(mode === 'signin' || (mode === 'register' && selectedRole)) && (
                <div className="space-y-6">
                  
                  {/* Back Button for Registration Mode */}
                  {mode === 'register' && (
                    <button 
                      type="button"
                      onClick={() => setSelectedRole(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-royal-800 font-bold mb-2 group transition-colors"
                    >
                       <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors border-2 border-transparent group-hover:border-gray-300">
                         <ArrowLeft size={20} />
                       </div>
                       <span>Change Role</span>
                    </button>
                  )}

                  {/* Social Buttons: Visible on Sign In AND Register (after role select) */}
                  <div className="grid gap-3">
                      <button 
                        onClick={() => handleSocialLogin('google')}
                        disabled={!!socialLoading}
                        className={`${socialButtonClass} bg-white text-gray-700 hover:bg-gray-50`}
                      >
                        {socialLoading === 'google' ? <Loader2 className="animate-spin" size={20} /> : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        )}
                        Continue with Google
                      </button>
                      
                      <button 
                        onClick={() => handleSocialLogin('apple')}
                        disabled={!!socialLoading}
                        className={`${socialButtonClass} bg-black text-white hover:bg-gray-800 border-black`}
                      >
                        {socialLoading === 'apple' ? <Loader2 className="animate-spin" size={20} /> : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.05 20.28c-.98.95-2.05 1.72-3.69 1.72-1.63 0-2.05-1-3.83-1-1.78 0-2.34 1-3.9 1-1.63 0-2.97-1.12-4.04-3.04-2.18-3.93-.5-9.62 3.75-9.62 1.74 0 2.84 1.15 3.77 1.15.93 0 2.65-1.4 4.47-1.4 1.5 0 2.63.78 3.35 1.87-2.95 1.76-2.45 6.09.43 7.32l-.32 1zM12.03 7.25c-.13-2.15 1.63-3.86 3.7-3.86.16 2.37-2.31 4.1-3.7 3.86z" />
                            </svg>
                        )}
                        Continue with Apple
                      </button>
                  </div>
                  
                  <div className="relative flex items-center justify-center py-2">
                    <div className="h-px bg-gray-200 w-full absolute"></div>
                    <span className="bg-white px-3 text-sm text-gray-500 relative z-10 font-medium">
                       {mode === 'signin' ? 'Or sign in with email' : 'Or continue with email'}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (
                       <div>
                          <label className={labelClass}>Full Name</label>
                          <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className={inputClass}
                              placeholder="e.g. David Smith"
                            />
                        </div>
                    )}

                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass}
                          placeholder="you@example.com"
                        />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={labelClass}>Password</label>
                        {mode === 'signin' && (
                          <button 
                            type="button" 
                            onClick={() => switchMode('forgot-password')}
                            className="text-xs text-royal-600 font-bold hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={inputClass}
                          placeholder="••••••••"
                        />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={buttonClass}
                    >
                      {isLoading && <Loader2 className="animate-spin" size={24} />}
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>

                    <div className="text-center text-sm pt-2">
                      {mode === 'signin' ? (
                        <>
                          <span className="text-gray-500">Don't have an account? </span>
                          <button type="button" onClick={() => switchMode('register')} className="text-royal-600 font-bold hover:underline">Register now</button>
                        </>
                      ) : (
                        <>
                           <span className="text-gray-500">Already a member? </span>
                           <button type="button" onClick={() => switchMode('signin')} className="text-royal-600 font-bold hover:underline">Sign in</button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;