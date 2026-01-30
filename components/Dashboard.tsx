import React, { useEffect, useState, useRef } from 'react';
import { UserRole, User, Lesson, ChatMessage, NewsItem, Module, StudentAttempt, Certificate } from '../types';
import { getDailyVerse, getAIQuizQuestion } from '../services/geminiService';
import { lessonService } from '../services/lessonService';
import { authService } from '../services/authService';
import AdminPanel from './AdminPanel';
import OrganizationPanel from './OrganizationPanel'; 
import LessonView from './LessonView'; 
import ParentOnboarding from './ParentOnboarding';
import ExportModal from './ExportModal';
import LessonBrowser from './LessonBrowser';
import LessonUpload from './LessonUpload';
import StudentPanel from './StudentPanel';
import Tooltip from './Tooltip'; 
import ResourceView from './ResourceView';
import NewsView from './NewsView';
import PerformanceReport from './PerformanceReport';
import ChatPanel from './ChatPanel';
import FrontendEngineerBadge from './FrontendEngineerBadge';
import CertificatesPanel from './CertificatesPanel'; 
import {
  BookOpen, Trophy, Activity, CheckCircle, Heart,
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star, UserPlus, List, BarChart3, MessageSquare, Hash, ArrowRight, UserCircle, Camera, Save, Loader2,
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid, Award, BadgeCheck, ChevronDown, Clock, Newspaper, Calendar, Target, Zap, PieChart, Layers, Sparkles, LayoutDashboard, Mail as MailIcon, X, Languages, Moon, Sun, Monitor, Eye, ShieldCheck, Database, ZapOff, RefreshCcw, Bell, Trees, Waves, Flower2, Sunrise, ShieldCheck as ShieldIcon, Link as LinkIcon, Gem, Compass, Library
} from 'lucide-react';

export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' | 'profile' | 'edit-profile'
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings' | 'upload' | 'performance-report' | 'requests' | 'logs' | 'invites' | 'curated';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onChangePasswordClick?: () => void;
  initialView?: DashboardView;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView = 'dashboard' }) => {
  const [internalView, setInternalView] = useState<DashboardView>(initialView);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [dailyQuiz, setDailyQuiz] = useState<any>(null);
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState({ modulesCompleted: 0, totalModules: 0, totalTime: 0, avgScore: 0, lastLessonScore: "0/0", lastLessonTime: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('bbl_theme') || 'royal');

  // Role-aware initial tab for the embedded Master Console
  const [adminTab, setAdminTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'resources' | 'group-analytics' | 'news' | 'chat'>(
    (user.role === UserRole.STUDENT || user.role === UserRole.PARENT) ? 'lessons' : 'users'
  );

  useEffect(() => { setInternalView(initialView); }, [initialView]);
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-parchment', 'theme-contrast', 'theme-emerald', 'theme-ocean', 'theme-rose', 'theme-amber');
    if (theme !== 'royal') root.classList.add(`theme-${theme}`);
    localStorage.setItem('bbl_theme', theme);
  }, [theme]);

  // FIX: ADJACENCY MATRIX GLOBAL NAVIGATION LISTENER
  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail?.lessonId) {
        setSelectedLessonId(e.detail.lessonId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('bbl_lesson_navigate', handleNavigate);
    return () => window.removeEventListener('bbl_lesson_navigate', handleNavigate);
  }, []);

  useEffect(() => {
    getDailyVerse().then(setDailyVerse);
    getAIQuizQuestion().then(setDailyQuiz);
    authService.getRecentMessages(user, 4).then(setRecentChats);
    lessonService.getNews().then(items => { 
        const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
        setRecentNews(sorted.slice(0, 3)); 
    });
    lessonService.getStudentSummary(user.id).then(setStats);
  }, [user]);

  const renderHomeDashboard = () => {
    const firstName = user.name.split(' ')[0];
    
    // Core Actions present for all users - Cleaned as per request
    const finalActions = [
      { label: 'TAKE/RESUME COURSE', icon: Play, view: 'lessons', color: 'bg-royal-800', shadow: 'shadow-royal-950/40' },
      { label: 'CURRICULUM', icon: BookOpen, view: 'lessons', color: 'bg-indigo-600', shadow: 'shadow-indigo-900/40' },
      { label: 'MY LIST', icon: Bookmark, view: 'curated', color: 'bg-purple-600', shadow: 'shadow-purple-900/40' },
      { label: 'ANALYTICS', icon: BarChart3, view: 'performance-report', color: 'bg-emerald-600', shadow: 'shadow-emerald-900/40' },
      { label: 'CREDENTIALS', icon: BadgeCheck, view: 'certificates', color: 'bg-gold-500', shadow: 'shadow-gold-600/40' },
    ];

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">
          
          {/* WELCOME SECTION */}
          <div className="relative bg-white pt-5 pb-5 md:pt-7 md:pb-7 px-8 md:px-12 rounded-[3.5rem] border-[12px] border-royal-700 shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col lg:flex-row items-center justify-between gap-10 animate-electric-glow overflow-hidden group">
             <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[rays_10s_linear_infinite] opacity-40"></div>
             </div>

             <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative z-10">
                <div className="relative group">
                  <button onClick={() => setInternalView('edit-profile')} className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black shadow-2xl border-b-8 border-black relative overflow-hidden group transition-all ring-4 ring-gold-500/30">
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" /> : <UserCircle size={64} />}
                  </button>
                </div>
                <div>
                   <h1 className="text-3xl md:text-5xl font-serif font-black text-royal-950 uppercase tracking-tighter leading-none">
                     WELCOME BACK, <span className="text-royal-600">{firstName.toUpperCase()}</span>
                   </h1>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                      <div className="flex items-center gap-3 px-6 py-2 bg-royal-900 text-white rounded-2xl shadow-xl border border-white/5">
                         <ShieldCheck size={18} className="text-gold-400" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">{user.role.replace('_', ' ')} RANK</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold text-xs">
                         Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* QUICK ACCESS ACTION CENTER - TRIMMED GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
             {finalActions.map((action, i) => (
                <button key={i} onClick={() => setInternalView(action.view as any)} className="bg-white p-8 rounded-[3rem] border-8 border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group text-center relative overflow-hidden">
                   <div className={`p-6 ${action.color} text-white rounded-[2rem] mb-6 shadow-2xl ${action.shadow} group-hover:scale-110 group-hover:rotate-6 transition-transform inline-block`}>
                      <action.icon size={36} />
                   </div>
                   <h3 className="font-black text-gray-900 uppercase tracking-[0.2em] text-xs leading-tight">{action.label}</h3>
                </button>
             ))}
          </div>

          {/* MASTER CONSOLE - Authenticated Security Console Panel */}
          <div className="relative animate-in slide-in-from-bottom-8 duration-1000">
             <AdminPanel 
               currentUser={user} 
               activeTab={adminTab} 
               onTabChange={(tab) => {
                 if (tab === 'chat') {
                   setInternalView('chat');
                 } else {
                   setAdminTab(tab);
                 }
               }} 
               isEmbedded={true}
               onUpdateUser={onUpdateUser}
             />
          </div>

          {/* BROADCASTS & CHAT MATRIX */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
             <div className="xl:col-span-2 bg-white p-12 rounded-[4rem] border-8 border-gray-50 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Newspaper size={200} /></div>
                <div className="flex justify-between items-center mb-12 border-b-4 border-gray-50 pb-6 relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl border-2 border-orange-100"><Newspaper size={28} /></div>
                      <h3 className="text-3xl font-serif font-black text-royal-950 uppercase tracking-tighter">Broadcasting Center</h3>
                   </div>
                   <button onClick={() => { setAdminTab('news'); }} className="px-8 py-3 bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-royal-900 hover:text-white transition-all shadow-md active:scale-95">Archives</button>
                </div>
                <div className="space-y-8 relative z-10">
                   {recentNews.length === 0 ? (
                      <div className="text-center py-10 text-gray-300 italic font-medium">No active broadcasts.</div>
                   ) : recentNews.map(item => (
                      <div key={item.id} className="flex gap-8 group/item cursor-pointer" onClick={() => { setAdminTab('news'); }}>
                         <div className="w-20 h-20 rounded-3xl bg-gray-50 flex flex-col items-center justify-center border-4 border-gray-100 shrink-0 group-hover/item:border-royal-200 group-hover/item:bg-white transition-all shadow-inner">
                            <span className="text-3xl font-black text-gray-400 group-hover/item:text-royal-600 transition-colors">{new Date(item.date).getDate()}</span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                         </div>
                         <div className="flex-1 border-b border-gray-50 pb-8 group-last:border-none">
                            <div className="flex items-center gap-3 mb-3">
                               <span className="px-3 py-1 bg-royal-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">{item.category}</span>
                            </div>
                            <h4 className="text-2xl font-serif font-black text-gray-900 group-hover/item:text-royal-600 transition-colors leading-tight mb-3">{item.title}</h4>
                            <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed opacity-80">{item.content}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-royal-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-b-[15px] border-black group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><MessageSquare size={180} /></div>
                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex items-center justify-between mb-10 border-b-2 border-white/10 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><MessageSquare size={28} /></div> 
                        <h3 className="text-2xl font-serif font-black uppercase tracking-tighter">Collective Chat</h3>
                      </div>
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-royal-900 bg-royal-700 flex items-center justify-center text-[10px] font-bold">U{i}</div>)}
                      </div>
                   </div>
                   <div className="space-y-8 mb-10 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                      {recentChats.map(m => (
                         <div key={m.id} className="flex gap-4 items-start cursor-pointer hover:translate-x-1 transition-transform" onClick={() => setInternalView('chat')}>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl text-royal-300 shrink-0 border border-white/5 shadow-inner">{m.senderName.charAt(0)}</div>
                            <div className="min-w-0 flex-1">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black text-gold-400 uppercase tracking-widest">{m.senderName}</span>
                                  <span className="text-[9px] font-bold text-royal-400 uppercase">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                               <p className="text-sm text-royal-50 line-clamp-2 leading-snug font-medium italic opacity-90">"{m.text}"</p>
                            </div>
                         </div>
                      ))}
                   </div>
                   <button onClick={() => setInternalView('chat')} className="mt-auto w-full py-6 bg-white text-royal-900 font-black rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/40 uppercase text-xs tracking-[0.4em] border-b-8 border-gray-200">Launch Messenger</button>
                </div>
             </div>
          </div>
          
          <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />
      </div>
    );
  };

  const renderView = () => {
    if (selectedLessonId) return <LessonViewWrapper key={selectedLessonId} lessonId={selectedLessonId} user={user} onBack={() => setSelectedLessonId(null)} />;
    switch (internalView) {
      case 'upload': return <LessonUpload currentUser={user} onSuccess={() => setInternalView('dashboard')} onCancel={() => setInternalView('dashboard')} />;
      case 'admin': case 'users': case 'requests': case 'logs': case 'invites': case 'curated': case 'news': case 'resources':
        return <AdminPanel currentUser={user} activeTab={internalView === 'admin' ? 'users' : internalView as any} onTabChange={(tab: any) => { if(tab === 'chat') setInternalView('chat'); else setInternalView(tab); }} onBack={() => setInternalView('dashboard')} />;
      case 'org-panel': case 'staff': return <OrganizationPanel currentUser={user} />;
      case 'lessons': case 'progress': return <StudentPanel currentUser={user} activeTab="lessons" onTakeLesson={setSelectedLessonId} onBack={() => setInternalView('dashboard')} />;
      case 'chat': return <ChatPanel currentUser={user} />;
      case 'certificates': return <CertificatesPanel currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'performance-report': return <PerformanceReport currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'profile': return <ProfileView user={user} completedCount={stats.modulesCompleted} onEdit={() => setInternalView('edit-profile')} />;
      case 'edit-profile': return <EditProfileView user={user} onUpdate={(u: User) => { onUpdateUser(u); setInternalView('profile'); }} onCancel={() => setInternalView('profile')} />;
      case 'settings': return <SettingsView user={user} currentTheme={theme} onThemeChange={setTheme} onChangePassword={onChangePasswordClick || (() => {})} />;
      case 'dashboard': default: return renderHomeDashboard();
    }
  };

  return (<div className="max-w-7xl mx-auto space-y-4 md:space-y-8 relative overflow-visible"><FrontendEngineerBadge />{renderView()}</div>);
};

const ProfileView = ({ user, completedCount, onEdit }: any) => (
    <div className="bg-white p-16 rounded-[4rem] border-8 border-gray-50 shadow-sm max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center">
            <div className="w-40 h-40 rounded-[3rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black text-6xl shadow-2xl border-b-[15px] border-black overflow-hidden mb-10 transform hover:scale-105 transition-transform duration-700">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <h2 className="text-5xl font-serif font-black text-royal-950 uppercase tracking-tighter leading-none">{user.name}</h2>
            <p className="text-gray-400 font-black uppercase tracking-[0.5em] text-xs mt-4">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-royal-50 p-8 rounded-[2.5rem] border-4 border-royal-100 text-center shadow-inner">
                <p className="text-[10px] font-black text-royal-400 uppercase tracking-[0.4em] mb-3">Identity Rank</p>
                <p className="font-black text-royal-900 uppercase text-lg">{user.role}</p>
            </div>
            <div className="bg-royal-50 p-8 rounded-[2.5rem] border-4 border-royal-100 text-center shadow-inner">
                <p className="text-[10px] font-black text-royal-400 uppercase tracking-[0.4em] mb-3">Mastery Units</p>
                <p className="font-black text-royal-900 text-lg">{completedCount} Modules</p>
            </div>
        </div>
        <button onClick={onEdit} className="w-full py-6 bg-royal-800 text-white font-black rounded-3xl hover:bg-black transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-sm border-b-[12px] border-black shadow-2xl active:scale-95">
            <Edit3 size={24} /> Edit Identity Signature
        </button>
    </div>
);

const EditProfileView = ({ user, onUpdate, onCancel }: any) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatarUrl || '');
    return (
        <div className="bg-white p-12 rounded-[4rem] border-8 border-gray-50 shadow-2xl max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-500">
            <div className="text-center">
               <h2 className="text-4xl font-serif font-black text-royal-950 uppercase tracking-tighter leading-none">Modify Identity</h2>
               <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mt-4">Update your registry metadata below</p>
            </div>
            <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] ml-2 block">Full Legal Name</label>
                    <input className="w-full p-6 bg-gray-50 border-4 border-gray-200 rounded-[2rem] focus:bg-white focus:border-royal-600 outline-none font-bold text-royal-950 text-xl transition-all shadow-sm" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] ml-2 block">Avatar Source (URL)</label>
                    <input className="w-full p-6 bg-gray-50 border-4 border-gray-200 rounded-[2rem] focus:bg-white focus:border-royal-600 outline-none font-bold text-royal-950 text-xl transition-all shadow-sm" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." />
                </div>
            </div>
            <div className="flex gap-6">
                <button onClick={onCancel} className="flex-1 py-6 bg-gray-100 text-gray-500 font-black rounded-3xl hover:bg-gray-200 transition-all uppercase tracking-[0.3em] text-xs active:scale-95">Discard Metadata</button>
                <button onClick={() => onUpdate({ ...user, name, avatarUrl: avatar })} className="flex-1 py-6 bg-royal-800 text-white font-black rounded-3xl hover:bg-black transition-all shadow-2xl border-b-8 border-royal-950 uppercase tracking-[0.3em] text-xs active:scale-95">Commit Updates</button>
            </div>
        </div>
    );
};

const SettingsView = ({ user, currentTheme, onThemeChange, onChangePassword }: any) => (
    <div className="bg-white p-12 rounded-[4rem] border-8 border-gray-50 shadow-sm max-w-5xl mx-auto space-y-16 animate-in fade-in duration-700">
        <div className="flex items-center gap-10 border-b-8 border-gray-50 pb-12">
            <div className="p-6 bg-royal-900 text-gold-400 rounded-[2.5rem] shadow-2xl border-b-8 border-black"><Settings size={48} /></div>
            <div>
                <h2 className="text-5xl font-serif font-black text-royal-950 uppercase tracking-tighter">System Configuration</h2>
                <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.6em] mt-4">Registry Atmosphere & Security Protocols</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-10">
                <h3 className="font-black text-gray-950 uppercase text-xs tracking-[0.5em] flex items-center gap-4"><Sun size={24} className="text-gold-500" /> Visual Atmosphere</h3>
                <div className="grid grid-cols-2 gap-4">
                    {['royal', 'midnight', 'parchment', 'emerald', 'ocean', 'rose', 'amber'].map(t => (
                        <button key={t} onClick={() => onThemeChange(t)} className={`py-5 rounded-2xl border-4 transition-all font-black text-[10px] uppercase tracking-widest ${currentTheme === t ? 'bg-royal-900 text-white border-black shadow-2xl scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-royal-200'}`}>{t}</button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-10">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-[0.5em] flex items-center gap-4"><Shield size={24} className="text-indigo-600" /> Security Protocol</h3>
                <div className="p-10 bg-royal-950 rounded-[3rem] border-b-[12px] border-black text-white space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Key size={80} /></div>
                    <p className="text-sm text-indigo-100 font-medium leading-relaxed italic opacity-80">Regularly rotating your cryptographic access key maintains session integrity.</p>
                    <button onClick={onChangePassword} className="w-full py-6 bg-white text-royal-900 font-black rounded-3xl hover:bg-gold-500 hover:text-white transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-[0.3em] shadow-xl transform active:scale-95">
                        <Key size={20} /> Rotate Access Key
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const LessonViewWrapper = ({ lessonId, user, onBack }: any) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => { lessonService.getLessonById(lessonId).then(l => setLesson(l || null)); }, [lessonId]);
  if (!lesson) return <div className="flex justify-center py-40"><div className="relative"><div className="w-24 h-24 rounded-full border-8 border-royal-50 border-t-royal-900 animate-spin"></div><Database className="absolute inset-0 m-auto text-royal-900 opacity-20" size={32}/></div></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;