
import React, { useState, useEffect } from 'react';
import { X, User, Users, Shield, Heart, Mail, Lock, ArrowRight, Check, Loader2, KeyRound, ArrowLeft, MailCheck, Building2 } from 'lucide-react';
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
  const [newPassword, setNewPassword] = useState(''); 
  const [name, setName] = useState('');
  // New State for Org Code
  const [orgCode, setOrgCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

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
        // Pass orgCode if provided (specifically for Mentors)
        await authService.register(name, email, password, selectedRole, orgCode);
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
    { id: UserRole.ORGANIZATION, label: 'Organization', icon: Building2, desc: 'Manage ministry', color: 'bg-slate-100 text-slate-700' },
    { id: UserRole.PARENT, label: 'Parent', icon: Heart, desc: 'Track progress', color: 'bg-rose-100 text-rose-600' },
    { id: UserRole.ADMIN, label: 'System Admin', icon: Shield, desc: 'Platform control', color: 'bg-purple-100 text-purple-600' },
  ];

  const getHeaderTitle = () => {
    if (registrationSuccess) return 'Check Your Email';
    if (mode === 'forgot-password') return 'Reset Password';
    if (mode === 'change-password') return 'Security Settings';
    if (mode === 'accept-invite') return 'Welcome Aboard';
    return mode === 'signin' ? 'Welcome Back' : 'Join the Mission';
  };

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-gray-900 rounded-xl focus:ring-4 focus:ring-royal-500/30 outline-none font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal";
  const labelClass = "text-sm font-bold text-gray-800 ml-1 mb-1 block";
  const buttonClass = "w-full bg-royal-800 hover:bg-royal-900 text-white font-bold py-4 rounded-xl shadow-xl border-2 border-royal-950 transition-all flex items-center justify-center gap-2 text-lg transform hover:-translate-y-0.5";
  const socialButtonClass = "w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-900 font-bold transition-all transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 border border-gray-200">
        
        <div className="relative bg-royal-900 p-8 text-white overflow-hidden shrink-0">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <h2 className="text-3xl font-serif font-bold mb-2">
                  {getHeaderTitle()}
                </h2>
                <p className="text-royal-200 text-sm">
                  {mode === 'signin' ? 'Sign in to access your dashboard' : 'Create an account to get started'}
                </p>
             </div>
             <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
               <X size={20} />
             </button>
           </div>
        </div>

        {feedback && (
          <div className={`p-4 text-center text-sm font-bold ${feedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {feedback.msg}
          </div>
        )}

        <div className="p-8 overflow-y-auto bg-white custom-scrollbar">
          
          {registrationSuccess ? (
             <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MailCheck size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Verify your email address</h3>
                <p className="text-gray-600 text-lg">
                  We've sent a verification link to <span className="font-bold text-gray-900">{email}</span>. 
                </p>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 text-left">
                  <strong>Simulated Action:</strong> Check browser console (F12) for the verification link.
                </div>
                <button onClick={() => { setRegistrationSuccess(false); switchMode('signin'); }} className={buttonClass}>
                  Return to Sign In
                </button>
             </div>
          ) : (
            <>
              {/* CHANGE PASSWORD & FORGOT PASSWORD (Existing code...) */}
              {mode === 'change-password' && (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className={labelClass}>Current Password</label>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Old Password" />
                    </div>
                    <div>
                      <label className={labelClass}>New Password</label>
                      <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="New Secure Password" />
                    </div>
                    <button type="submit" disabled={isLoading} className={buttonClass}>
                      {isLoading && <Loader2 className="animate-spin" size={24} />} Update Password
                    </button>
                 </form>
              )}

              {mode === 'forgot-password' && (
                 <div className="space-y-6">
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                        </div>
                        <button type="submit" disabled={isLoading} className={buttonClass}>
                          {isLoading && <Loader2 className="animate-spin" size={24} />} Send Reset Instructions
                        </button>
                        <button type="button" onClick={() => switchMode('signin')} className="w-full text-gray-500 font-bold text-sm hover:text-royal-600 flex items-center justify-center gap-2">
                          <ArrowLeft size={16} /> Back to Sign In
                        </button>
                     </form>
                 </div>
              )}

              {/* ACCEPT INVITE */}
              {mode === 'accept-invite' && (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                      <p className="text-sm text-blue-800 font-medium">Invited as <span className="font-bold">{inviteData?.role}</span></p>
                      <p className="text-xs text-blue-600 mt-1">{email}</p>
                    </div>
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. John Doe" />
                    </div>
                    <div>
                      <label className={labelClass}>Set Password</label>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Create password" />
                    </div>
                    <button type="submit" disabled={isLoading} className={buttonClass}>
                      {isLoading && <Loader2 className="animate-spin" size={24} />} Complete Registration
                    </button>
                 </form>
              )}

              {/* REGISTER ROLE SELECTION */}
              {mode === 'register' && !selectedRole && (
                 <div className="space-y-6">
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

              {/* SIGN IN / REGISTER FORM */}
              {(mode === 'signin' || (mode === 'register' && selectedRole)) && (
                <div className="space-y-6">
                  {mode === 'register' && (
                    <button type="button" onClick={() => setSelectedRole(null)} className="flex items-center gap-2 text-gray-500 hover:text-royal-800 font-bold mb-2 group transition-colors">
                       <ArrowLeft size={20} /> Change Role
                    </button>
                  )}

                  <div className="grid gap-3">
                      <button onClick={() => handleSocialLogin('google')} disabled={!!socialLoading} className={`${socialButtonClass} bg-white text-gray-700 hover:bg-gray-50`}>
                        {socialLoading === 'google' ? <Loader2 className="animate-spin" size={20} /> : <span className="font-bold text-blue-500">G</span>} Continue with Google
                      </button>
                      <button onClick={() => handleSocialLogin('apple')} disabled={!!socialLoading} className={`${socialButtonClass} bg-black text-white hover:bg-gray-800 border-black`}>
                        {socialLoading === 'apple' ? <Loader2 className="animate-spin" size={20} /> : <span className="font-bold"></span>} Continue with Apple
                      </button>
                  </div>
                  
                  <div className="relative flex items-center justify-center py-2">
                    <div className="h-px bg-gray-200 w-full absolute"></div>
                    <span className="bg-white px-3 text-sm text-gray-500 relative z-10 font-medium">Or continue with email</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (
                       <>
                         <div>
                            <label className={labelClass}>Full Name</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. David Smith" />
                          </div>
                          
                          {/* ORG CODE INPUT FOR MENTORS */}
                          {selectedRole === UserRole.MENTOR && (
                              <div>
                                <label className={labelClass}>Organization Code (Optional)</label>
                                <input 
                                  type="text" 
                                  value={orgCode} 
                                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())} 
                                  className={inputClass} 
                                  placeholder="e.g. ORG777 (If applicable)" 
                                />
                                <p className="text-xs text-gray-500 mt-1 ml-1">Connect directly to your Church/School organization</p>
                              </div>
                          )}
                       </>
                    )}

                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={labelClass}>Password</label>
                        {mode === 'signin' && (
                          <button type="button" onClick={() => switchMode('forgot-password')} className="text-xs text-royal-600 font-bold hover:underline">Forgot Password?</button>
                        )}
                      </div>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={isLoading} className={buttonClass}>
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
