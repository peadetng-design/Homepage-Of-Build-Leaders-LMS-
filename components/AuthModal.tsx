import React, { useState, useEffect } from 'react';
import { X, User, Users, Shield, Heart, Mail, Lock, ArrowRight, Check, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'register' | 'forgot-password';
  onClose: () => void;
  onAuthenticate: (role: UserRole, name: string) => void;
  switchMode: (mode: 'signin' | 'register' | 'forgot-password') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onAuthenticate, switchMode }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Reset state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setResetSent(false);
      // Don't clear email/name/pass purely on mode switch to keep UX smooth if they switch back and forth,
      // but if closed, they should be cleared. For now, we keep them persistent during the session.
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot-password') {
      setIsLoading(true);
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResetSent(true);
      setIsLoading(false);
      return;
    }

    if (mode === 'register' && !selectedRole) return;
    
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onAuthenticate(selectedRole || UserRole.STUDENT, name || 'User');
    setIsLoading(false);
    onClose();
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    // Simulate Google Auth popup and network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onAuthenticate(selectedRole || UserRole.STUDENT, "Google User");
    setIsLoading(false);
    onClose();
  };

  const handleAppleAuth = async () => {
    setIsLoading(true);
    // Simulate Apple Auth popup and network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onAuthenticate(selectedRole || UserRole.STUDENT, "Apple User");
    setIsLoading(false);
    onClose();
  };

  const roles = [
    { id: UserRole.STUDENT, label: 'Student', icon: User, desc: 'Learn, grow & compete', color: 'bg-blue-100 text-blue-600' },
    { id: UserRole.MENTOR, label: 'Mentor', icon: Users, desc: 'Guide your team', color: 'bg-indigo-100 text-indigo-600' },
    { id: UserRole.ADMIN, label: 'Admin', icon: Shield, desc: 'Manage system', color: 'bg-purple-100 text-purple-600' },
    { id: UserRole.PARENT, label: 'Parent', icon: Heart, desc: 'Track progress', color: 'bg-rose-100 text-rose-600' },
  ];

  const getHeaderTitle = () => {
    if (mode === 'forgot-password') return 'Reset Password';
    return mode === 'signin' ? 'Welcome Back' : 'Join the Mission';
  };

  const getHeaderSubtitle = () => {
    if (mode === 'forgot-password') return 'We will send you instructions';
    return mode === 'signin' ? 'Sign in to access your dashboard' : 'Create an account to get started';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header with Pattern */}
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

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-white custom-scrollbar">
          
          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot-password' && (
             <div className="space-y-6">
               {resetSent ? (
                 <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                       <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h3>
                    <p className="text-gray-500 mb-8">
                      We have sent password reset instructions to <br/>
                      <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                    <button 
                       onClick={() => switchMode('signin')}
                       className="w-full bg-royal-600 hover:bg-royal-700 text-white font-bold py-3.5 rounded-xl transition-colors"
                    >
                      Back to Sign In
                    </button>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-royal-500 transition-colors" size={20} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400 disabled:opacity-70"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-royal-600 hover:bg-royal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-royal-500/30 transition-all transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isLoading && <Loader2 className="animate-spin" size={20} />}
                      Send Reset Instructions
                    </button>

                    <button 
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="w-full text-gray-500 font-bold text-sm hover:text-royal-600 flex items-center justify-center gap-2 transition-colors py-2"
                    >
                      <ArrowLeft size={16} /> Back to Sign In
                    </button>
                 </form>
               )}
             </div>
          )}

          {/* REGISTER: ROLE SELECTION MODE */}
          {mode === 'register' && !selectedRole && (
             <div className="space-y-6">
                <div className="text-center">
                   <h3 className="text-lg font-bold text-gray-900">Select your Role</h3>
                   <p className="text-sm text-gray-500">Choose how you will use the platform</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className="relative flex flex-col items-start p-5 border border-gray-200 rounded-2xl hover:border-royal-500 hover:shadow-lg transition-all group text-left bg-gray-50/50 hover:bg-white"
                    >
                      <div className={`p-3 rounded-xl mb-3 ${role.color} group-hover:scale-110 transition-transform`}>
                        <role.icon size={24} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{role.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{role.desc}</p>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-royal-600">
                        <ArrowRight size={18} />
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-gray-100 text-center">
                  <span className="text-gray-500 text-sm">Already have an account? </span>
                  <button onClick={() => switchMode('signin')} className="text-royal-600 font-bold text-sm hover:underline">Sign in</button>
                </div>
             </div>
          )}

          {/* SIGN IN OR REGISTER: FORM MODE */}
          {(mode === 'signin' || (mode === 'register' && selectedRole)) && (
            <div className="space-y-6">
               {mode === 'register' && (
                <div className="mb-2">
                   <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="text-xs text-gray-400 hover:text-royal-600 flex items-center gap-1 mb-4 font-medium uppercase tracking-wide"
                   >
                     <ArrowRight className="rotate-180" size={12} /> Change Role
                   </button>
                   <div className="bg-royal-50 p-4 rounded-xl flex items-center justify-between border border-royal-100">
                      <div className="flex items-center gap-3">
                         <div className="bg-royal-100 p-2 rounded-lg text-royal-700">
                            <User size={20} />
                         </div>
                         <div>
                           <span className="block text-xs text-royal-600 font-bold uppercase tracking-wider">Registering as</span>
                           <span className="font-bold text-royal-900 text-lg">{selectedRole}</span>
                         </div>
                      </div>
                      <Check className="text-royal-500" size={20} />
                   </div>
                </div>
              )}

              {/* Social Auth Buttons */}
              <div className="space-y-3">
                <button 
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading ? (
                     <Loader2 className="animate-spin text-gray-400" size={20} />
                  ) : (
                     <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>{mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
                </button>

                <button 
                  type="button"
                  onClick={handleAppleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading ? (
                     <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.65-1.02 2.68.12 4.19 1.76 4.67 2.49-3.92 2.15-3.32 7.02 1.35 8.92-.7 1.63-1.68 3.25-3.02 4.67l-1.73-2.83zm-3.23-14.7c.6-1.55 2.11-2.58 3.8-2.58.12 1.55-1.29 3.09-2.5 3.65-1.02.48-2.3.17-2.92-1.38 1.05 0 1.62.31 1.62.31z" />
                     </svg>
                  )}
                  <span>{mode === 'signin' ? 'Continue with Apple' : 'Sign up with Apple'}</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                  <div className="border-t border-gray-200 w-full absolute"></div>
                  <span className="bg-white px-3 text-xs text-gray-400 font-bold relative z-10 uppercase tracking-widest">Or continue with email</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === 'register' && (
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-royal-500 transition-colors" size={20} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400 disabled:opacity-70"
                          placeholder="e.g. David Smith"
                        />
                      </div>
                    </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-royal-500 transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400 disabled:opacity-70"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
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
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-royal-500 transition-colors" size={20} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-royal-500/20 focus:border-royal-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400 disabled:opacity-70"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-royal-600 hover:bg-royal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-royal-500/30 transition-all transform hover:-translate-y-0.5 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading && <Loader2 className="animate-spin" size={20} />}
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
        </div>
      </div>
    </div>
  );
};

export default AuthModal;