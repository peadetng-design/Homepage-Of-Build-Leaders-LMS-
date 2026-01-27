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
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid, Award, BadgeCheck, ChevronDown, Clock, Newspaper, Calendar, Target, Zap, PieChart, Layers, Sparkles, LayoutDashboard, Mail as MailIcon, X, Languages, Moon, Sun, Monitor, Eye, ShieldCheck, Database, ZapOff, RefreshCcw, Bell, Trees, Waves, Flower2, Sunrise, ShieldCheck as ShieldIcon, Link as LinkIcon
} from 'lucide-react';

// Fix: Defined DropdownOption interface for menu navigation items
interface DropdownOption {
  label: string;
  icon: any;
  action: () => void;
  color: string;
  glowColor: string;
  hoverBg: string;
}

// Fix: Defined formatDigitalTime utility function for formatting activity duration
const formatDigitalTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

// Fix: Defined ConsoleDropdown component for dashboard action menus
const ConsoleDropdown: React.FC<{ label: string; items: DropdownOption[]; direction: 'up' | 'down'; primaryColorClass: string }> = ({ label, items, direction, primaryColorClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative inline-block text-left w-full sm:w-auto">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl border-b-4 ${primaryColorClass} w-full sm:w-auto`}
            >
                {label} <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-full sm:w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[50] animate-in fade-in zoom-in-95 duration-200`}>
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => { item.action(); setIsOpen(false); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs font-black uppercase tracking-widest transition-all ${item.hoverBg} group`}
                        >
                            <div className={`p-2 rounded-lg ${item.color} shadow-lg transition-transform group-hover:scale-110`} style={{ boxShadow: `0 4px 10px ${item.glowColor}40` }}>
                                <item.icon size={16} />
                            </div>
                            <span className="text-gray-700">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Fix: Defined ScrollReveal wrapper for entrance animations
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
        {children}
    </div>
);

// Fix: Defined MiniPieChart for stats visualization
const MiniPieChart: React.FC<{ percent: number; color: string; bgColor: string }> = ({ percent, color, bgColor }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    return (
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10 -rotate-90">
                <circle cx="20" cy="20" r={radius} fill="transparent" stroke={bgColor} strokeWidth="4" />
                <circle cx="20" cy="20" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
            </svg>
            <span className="absolute text-[8px] font-black text-gray-900">{percent}%</span>
        </div>
    );
};

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
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stats, setStats] = useState({ modulesCompleted: 0, totalModules: 0, totalTime: 0, avgScore: 0, lastLessonScore: "0/0", lastLessonTime: 0 });
  const [childCerts, setChildCerts] = useState<Certificate[]>([]);
  const [childSummary, setChildSummary] = useState<any>(null);
  const [theme, setTheme] = useState(localStorage.getItem('bbl_theme') || 'royal');

  useEffect(() => { setInternalView(initialView); }, [initialView]);
  
  useEffect(() => {
    // Add global listener for internal curriculum navigation
    const handleInternalNav = (e: any) => {
        if (e.detail?.lessonId) {
            setSelectedLessonId(e.detail.lessonId);
        }
    };
    window.addEventListener('bbl_lesson_navigate', handleInternalNav);
    return () => window.removeEventListener('bbl_lesson_navigate', handleInternalNav);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-parchment', 'theme-contrast', 'theme-emerald', 'theme-ocean', 'theme-rose', 'theme-amber');
    if (theme !== 'royal') root.classList.add(`theme-${theme}`);
    localStorage.setItem('bbl_theme', theme);
  }, [theme]);

  useEffect(() => {
    authService.getRecentMessages(user, 4).then(setRecentChats);
    lessonService.getNews().then(items => { const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); setRecentNews(sorted.slice(0, 2)); });
    lessonService.getStudentSummary(user.id).then(setStats);
    if (user.role === UserRole.PARENT && user.linkedStudentId) { lessonService.getUserCertificates(user.linkedStudentId).then(setChildCerts); lessonService.getStudentSummary(user.linkedStudentId).then(setChildSummary); }
  }, [user]);

  const renderHomeDashboard = () => {
    const isStudent = user.role === UserRole.STUDENT; const isParent = user.role === UserRole.PARENT; const canManageContent = [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.ORGANIZATION].includes(user.role); const firstName = user.name.split(' ')[0];
    const personalItems: DropdownOption[] = [{ label: "TAKE/RESUME COURSE", icon: Play, action: () => setInternalView('lessons'), color: "bg-indigo-600 text-white", glowColor: "#4f46e5", hoverBg: "hover:bg-indigo-50" }];
    if (canManageContent) personalItems.push({ label: "UPLOAD CONTENT", icon: Upload, action: () => setInternalView('upload'), color: "bg-emerald-500 text-white", glowColor: "#10b981", hoverBg: "hover:bg-emerald-50" });
    personalItems.push({ label: "PERFORMANCE", icon: Trophy, action: () => setInternalView('performance-report'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" }, { label: "MY LIST", icon: Bookmark, action: () => setInternalView('curated'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" }, { label: "MY CERTIFICATES", icon: BadgeCheck, action: () => setInternalView('certificates'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" });
    const groupItems: DropdownOption[] = []; if (canManageContent) groupItems.push({ label: "REQUESTS", icon: UserPlus, action: () => setInternalView('requests'), color: "bg-amber-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-amber-50" });
    groupItems.push({ label: "MEMBERS", icon: Users, action: () => setInternalView('users'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" }, { label: "INVITES", icon: Mail, action: () => setInternalView('invites'), color: "bg-blue-600 text-white", glowColor: "#2563eb", hoverBg: "hover:bg-blue-50" }, { label: "ANALYTICS", icon: BarChart3, action: () => setInternalView('performance-report'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" }, { label: "CURRICULUM", icon: LayoutGrid, action: () => setInternalView('lessons'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" });
    if (canManageContent || isParent) groupItems.push({ label: "AUDIT LOGS", icon: History, action: () => setInternalView('logs'), color: "bg-slate-600 text-white", glowColor: "#475569", hoverBg: "hover:bg-slate-50" });
    const completionPercent = stats.totalModules > 0 ? Math.round((stats.modulesCompleted / stats.totalModules) * 100) : 0;
    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
          <div className="bg-white p-5 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 lg:max-w-[70%] lg:mx-auto"><div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10 text-center md:text-left"><div className="relative group/avatar"><button onClick={() => setInternalView('edit-profile')} className="w-16 h-16 md:w-24 md:h-24 rounded-3xl md:rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black shadow-2xl ring-6 md:ring-8 ring-royal-50/50 overflow-hidden relative">{user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <UserCircle size={48} className="md:w-16 md:h-16" />}<div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center"><Camera size={24} className="text-white" /></div></button></div><div><h1 className="text-xl md:text-4xl font-serif font-black text-gray-900 tracking-tight leading-tight uppercase">WELCOME BACK, <span className="text-royal-700">{firstName}</span></h1><div className="flex items-center gap-2 md:gap-3 mt-2"><div className="flex items-center gap-2 px-3 py-1.5 bg-royal-950 text-white rounded-xl shadow-xl border border-white/10"><Sparkles size={20} className="text-gold-400 animate-pulse" /><span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{user.role.replace('_', ' ')}</span></div></div></div></div><button onClick={() => setInternalView('edit-profile')} className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 shadow-2xl transition-all transform hover:-translate-y-1 border-b-[4px] border-indigo-900 uppercase"><Edit3 size={18} /> EDIT PROFILE</button></div>
          <div className="flex flex-col gap-6 md:gap-10 relative"><div className="bg-gradient-to-br from-indigo-700 via-royal-800 to-royal-900 rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 shadow-[0_30px_80px_-20px_rgba(30,27,75,0.4)] relative border-b-[10px] border-indigo-950 w-full lg:max-w-[60%] lg:mx-auto"><div className="flex flex-col relative z-10 gap-3"><div className="flex items-center gap-2.5"><div className="p-2 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-2xl"><UserCircle size={24} /></div><h3 className="font-serif font-black text-white uppercase text-base md:text-2xl tracking-[0.15em]">Personal Console</h3></div><p className="text-indigo-50 text-[10px] md:text-base font-medium opacity-90 italic">Your inner sanctuary for growth. Track transformations, curate your library, and verify achievements.</p><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={personalItems} direction="up" primaryColorClass="bg-indigo-600 hover:bg-indigo-500 border-indigo-900 shadow-indigo-950/60" /></div></div></div>{!isStudent && (<div className={`bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 border-t-[10px] ${isParent ? 'border-indigo-400' : 'border-gold-500'} shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] relative w-full lg:max-w-[60%] lg:mx-auto`}><div className="flex flex-col relative z-10 gap-3"><div className="flex items-center gap-2.5"><div className="p-2 bg-white/5 text-gold-400 rounded-xl border border-white/10 backdrop-blur-2xl">{isParent ? <Heart size={24} className="text-rose-400"/> : <Users size={24}/>}</div><h3 className="font-serif font-black text-white uppercase text-base md:text-2xl tracking-[0.15em]">{isParent ? "My Child's Console" : "Group Console"}</h3></div><p className="text-amber-50 text-[10px] md:text-base font-medium opacity-90 italic">{isParent ? "Oversee spiritual foundations. Audit logs, track modules, and manage credentials." : "Command center for community oversight. Manage invites, validate requests, and analyze performance."}</p><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={groupItems} direction="down" primaryColorClass={isParent ? "bg-indigo-500 hover:bg-indigo-400 border-indigo-900 shadow-black/70" : "bg-gold-500 hover:bg-gold-400 border-gold-800 shadow-black/70"} /></div></div></div>)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-14 relative z-0 lg:max-w-[90%] lg:mx-auto">
              <div className="lg:col-span-2 space-y-8 md:space-y-14">
                  {isParent && childCerts.length > 0 && (<div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-4 border-indigo-50 shadow-xl relative overflow-hidden animate-in fade-in"><div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-indigo-50"><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><ShieldIcon size={28} /></div><div><h3 className="font-serif font-black text-gray-900 text-2xl uppercase tracking-tighter">Child's Credentials</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Shareable & Verified Portfolios</p></div></div>{childSummary && (<div className="mb-8 p-6 bg-indigo-50/30 rounded-3xl border-2 border-indigo-100/50 flex flex-wrap gap-8 items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 bg-white rounded-2xl shadow-sm"><Layers className="text-indigo-600"/></div><div><p className="text-sm font-black text-indigo-900 uppercase">Modules: {childSummary.modulesCompleted}/{childSummary.totalModules}</p><div className="w-24 h-1.5 bg-indigo-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-indigo-600" style={{width: `${(childSummary.modulesCompleted/childSummary.totalModules)*100}%`}}></div></div></div></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Accuracy</p><p className="text-lg font-black text-indigo-900">{childSummary.avgScore}%</p></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Spent</p><p className="text-lg font-black text-indigo-900">{formatDigitalTime(childSummary.totalTime)}</p></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Lesson</p><p className="text-lg font-black text-indigo-900">{childSummary.lastLessonScore}</p></div></div>)}<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{childCerts.map(cert => (<div key={cert.id} className="bg-gray-50/50 p-6 rounded-3xl border-2 border-transparent hover:border-indigo-200 transition-all group"><div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold shadow-inner"><BadgeCheck size={24} /></div><span className="text-[9px] font-mono text-gray-400 bg-white px-2 py-1 rounded border border-gray-100 uppercase">{cert.uniqueCode}</span></div><h4 className="font-black text-gray-900 text-lg leading-tight mb-2">{cert.moduleTitle}</h4><p className="text-gray-500 text-xs font-medium mb-6">Earned on {new Date(cert.issueDate).toLocaleDateString()}</p><div className="pt-4 border-t border-indigo-100/50 flex flex-col gap-2"><a href={`${window.location.origin}?verify_cert=${cert.uniqueCode}`} className="w-full py-3 bg-white text-indigo-600 border-2 border-indigo-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"><LinkIcon size={14} /> Verification Link</a></div></div>))}</div></div>)}
                  <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-gray-50 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] relative overflow-hidden group"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b-4 border-royal-50 pb-6 gap-4"><div className="flex items-center gap-2.5 md:gap-4"><div className="p-2 bg-royal-900 text-gold-400 rounded-2xl shadow-xl"><Newspaper size={24} /></div><h3 className="font-serif font-black text-gray-900 text-lg md:text-3xl uppercase tracking-tighter">News & Updates</h3></div><button onClick={() => setInternalView('news')} className="px-6 py-2.5 bg-royal-800 hover:bg-royal-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl border-b-4 border-royal-950 flex items-center gap-2">VIEW ARCHIVE <ArrowRight size={14} /></button></div><div className="space-y-8">{recentNews.length > 0 ? recentNews.map(item => (<div key={item.id} className="relative pl-10 border-l-4 border-royal-100 hover:border-royal-600 transition-colors group/news"><div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-white border-4 border-royal-100 group-hover/news:border-royal-600 transition-all"></div><div className="flex flex-col md:flex-row justify-between items-center mb-3 gap-2"><span className="px-3 py-1 bg-royal-50 text-royal-700 text-[9px] font-black rounded-full uppercase tracking-widest">{item.category}</span><div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase"><span><Calendar size={12}/> {new Date(item.date).toLocaleDateString()}</span></div></div><h4 className="font-serif font-black text-xl md:text-2xl text-gray-900 leading-tight group-hover/news:text-royal-600">{item.title}</h4><p className="mt-2 text-gray-500 text-sm md:text-base font-medium line-clamp-1 opacity-80">{item.content}</p></div>)) : <div className="text-center py-10 opacity-40 italic">Waiting for system updates...</div>}</div></div>
                  <div className="p-3 md:p-4 bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-royal-100 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] flex flex-col gap-3 group relative overflow-hidden"><div className="flex flex-col md:flex-row items-center gap-4 relative z-10"><div className="p-3 bg-royal-900 rounded-[1.4rem] text-gold-400 shrink-0 shadow-2xl border-b-[5px] border-royal-950"><Activity size={22}/></div><div className="text-center md:text-left flex-1"><h4 className="font-serif font-black text-gray-950 text-base md:text-xl uppercase tracking-tighter">Performance Intelligence</h4><div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1"><p className="text-[10px] md:text-xs text-gray-500 font-bold opacity-80">Track your path to leadership mastery with real-time analytics.</p><button onClick={() => setInternalView('performance-report')} className="px-7 py-2.5 bg-royal-800 hover:bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 border-b-2 border-royal-950 flex items-center gap-1.5">FULL REPORT <ArrowRight size={14} /></button></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100"><ScrollReveal className="lg:col-span-2" delay={100}><div className="space-y-2 bg-white p-2.5 rounded-2xl border-4 border-indigo-400 shadow-sm group/stat hover:border-indigo-600 transition-all"><div className="flex justify-between items-start"><div className="flex items-center gap-2.5"><div className="p-2 bg-royal-100 text-royal-700 rounded-lg group-hover/stat:bg-royal-600 group-hover/stat:text-white transition-colors shadow-sm"><Layers size={16} /></div><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none">NUMBER OF MODULES</h5><p className="text-[9px] font-bold text-gray-400 truncate max-w-[80px]">{stats.modulesCompleted} Mastered</p></div></div><span className="text-xl font-black text-royal-950 leading-none">{completionPercent}%</span></div><div className="h-2.5 w-full bg-gray-50 rounded-full border border-royal-50 overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-royal-600 to-royal-400 rounded-full transition-all duration-1000" style={{ width: `${completionPercent}%` }} /></div></div></ScrollReveal><ScrollReveal delay={200}><div className="bg-white p-2.5 rounded-2xl border-4 border-gold-400 flex items-center gap-2.5 shadow-sm group/stat hover:border-gold-600 transition-all h-full"><div className="p-2 bg-gold-50 text-gold-600 rounded-lg group-hover/stat:bg-gold-500 group-hover/stat:text-white transition-colors shadow-sm shrink-0"><Clock size={16} /></div><div className="min-w-0"><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">TOTAL TIME SPENT</h5><span className="text-xl font-black text-royal-950 leading-none">{formatDigitalTime(stats.totalTime)}</span></div></div></ScrollReveal><ScrollReveal delay={300}><div className="bg-white p-2.5 rounded-2xl border-4 border-royal-500 flex items-center gap-2.5 shadow-sm group/stat hover:border-royal-700 transition-all h-full"><div className="min-w-0 flex items-center gap-1.5"><MiniPieChart percent={stats.avgScore} color="#4f46e5" bgColor="#e0e7ff" /><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">AVERAGE TOTAL SCORE</h5><span className="text-xl font-black text-royal-950 leading-none">{stats.avgScore}%</span></div></div></div></ScrollReveal></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><ScrollReveal delay={400} className="w-full"><div className="flex items-center gap-2.5 p-2.5 bg-white border-4 border-amber-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group/time"><div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover/time:bg-amber-500 group-hover/time:text-white transition-colors shadow-sm"><Award size={20} /></div><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">MOST RECENT LESSON SCORE</h5><p className="text-lg md:text-xl font-black text-gray-900 leading-none">{stats.lastLessonScore}</p></div></div></ScrollReveal><ScrollReveal delay={500} className="w-full"><div className="flex items-center gap-2.5 p-2.5 bg-white border-4 border-emerald-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all group/time"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover/time:bg-emerald-500 group-hover/time:text-white transition-colors shadow-sm"><History size={20} /></div><div><h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">MOST RECENT LESSON DURATION</h5><p className="text-lg md:text-xl font-black text-gray-900 leading-none">{formatDigitalTime(stats.lastLessonTime)}</p></div></div></ScrollReveal></div></div>
              </div>
              <div className="space-y-8 md:space-y-14"><div className="bg-white rounded-[2.5rem] p-6 md:p-8 border-2 border-gray-50 shadow-2xl"><h3 className="font-serif font-black text-gray-900 text-base md:text-2xl uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><div className="p-2 bg-royal-900 text-white rounded-2xl shadow-lg"><MessageSquare size={22} /></div> RECENT CHATS</h3><div className="space-y-6">{recentChats.map(m => (<div key={m.id} className="p-4 rounded-3xl bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-royal-100 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setInternalView('chat')}><div className="flex gap-4 items-start"><div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center font-black text-royal-700 border border-royal-100 shrink-0 shadow-sm relative group-hover:scale-110 transition-transform">{m.senderName.charAt(0)}<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div></div><div className="min-w-0 flex-1"><div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-black text-royal-600 uppercase tracking-widest">{m.senderName}</span><span className="text-[9px] font-bold text-gray-400"><Clock size={10} /> {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-sm md:text-base font-serif font-black text-royal-950 leading-snug line-clamp-2 tracking-tight">"{m.text}"</p></div></div></div>))}</div><button onClick={() => setInternalView('chat')} className="w-full mt-10 py-5 bg-royal-900 text-white text-[10px] font-black rounded-[1.5rem] hover:bg-black uppercase tracking-[0.3em] transition-all shadow-2xl border-b-[5px] border-black">OPEN CHATS APP</button></div></div>
          </div>
          <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />
      </div>
    );
  };

  const renderView = () => {
    if (selectedLessonId) return <LessonViewWrapper lessonId={selectedLessonId} user={user} onBack={() => setSelectedLessonId(null)} />;
    switch (internalView) {
      case 'upload': return <LessonUpload currentUser={user} onSuccess={() => setInternalView('dashboard')} onCancel={() => setInternalView('dashboard')} />;
      case 'admin': case 'users': case 'requests': case 'logs': case 'invites': case 'curated': case 'news': case 'resources':
        return <AdminPanel currentUser={user} activeTab={internalView === 'dashboard' ? 'users' : internalView as any} onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'org-panel': case 'staff': return <OrganizationPanel currentUser={user} />;
      case 'lessons': case 'progress': return <StudentPanel currentUser={user} activeTab="lessons" onTakeLesson={setSelectedLessonId} />;
      case 'group' : case 'assignments': return <AdminPanel currentUser={user} activeTab={internalView === 'group' ? 'requests' : 'lessons'} onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'resources': return <ResourceView />;
      case 'news': return <NewsView />;
      case 'chat': return <ChatPanel currentUser={user} />;
      case 'certificates': return <CertificatesPanel currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'performance-report': return <PerformanceReport currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'profile': return <ProfileView user={user} completedCount={stats.modulesCompleted} onEdit={() => setInternalView('edit-profile')} />;
      case 'edit-profile': return <EditProfileView user={user} onUpdate={(u: User) => { onUpdateUser(u); setInternalView('profile'); }} onCancel={() => setInternalView('profile')} />;
      case 'settings': return <SettingsView user={user} currentTheme={theme} onThemeChange={setTheme} onChangePassword={onChangePasswordClick || (() => {})} />;
      case 'dashboard': default: return renderHomeDashboard();
    }
  };

  return (<div className="max-w-7xl mx-auto space-y-4 md:space-y-8 relative"><FrontendEngineerBadge />{renderView()}</div>);
};

// Fix: Defined ProfileView component used in Dashboard navigation
const ProfileView = ({ user, completedCount, onEdit }: any) => (
    <div className="bg-white p-12 rounded-[2.5rem] border-2 border-gray-100 shadow-xl max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black shadow-2xl border-4 border-gold-500 overflow-hidden">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <UserCircle size={64} />}
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-serif font-black text-gray-900 uppercase tracking-tight">{user.name}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-1">{user.email}</p>
            </div>
            <div className="flex gap-4">
                <div className="px-4 py-2 bg-royal-50 text-royal-700 rounded-xl font-black text-[10px] uppercase tracking-widest border border-royal-100 shadow-sm">{user.role}</div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 shadow-sm">{completedCount} Modules Mastered</div>
            </div>
        </div>
        <button onClick={onEdit} className="w-full py-4 bg-royal-800 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm border-b-4 border-black">
            <Edit3 size={18} /> EDIT PROFILE IDENTITY
        </button>
    </div>
);

// Fix: Defined EditProfileView component used for modifying user profile
const EditProfileView = ({ user, onUpdate, onCancel }: any) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatarUrl || '');
    return (
        <div className="bg-white p-12 rounded-[2.5rem] border-2 border-gray-100 shadow-xl max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter text-center">Modify Profile Signature</h2>
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Full Legal Name</label>
                    <input className="w-full p-4 bg-gray-50 border-4 border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-900" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Avatar Image URL</label>
                    <input className="w-full p-4 bg-gray-50 border-4 border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-gray-900" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." />
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={onCancel} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Discard Changes</button>
                <button onClick={() => onUpdate({ ...user, name, avatarUrl: avatar })} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl border-b-4 border-indigo-900 uppercase tracking-widest text-xs">Verify & Update</button>
            </div>
        </div>
    );
};

// Fix: Defined SettingsView component used for system configuration
const SettingsView = ({ user, currentTheme, onThemeChange, onChangePassword }: any) => (
    <div className="bg-white p-12 rounded-[2.5rem] border-2 border-gray-100 shadow-xl max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
        <div className="flex items-center gap-6 border-b-4 border-gray-50 pb-8">
            <div className="p-4 bg-royal-900 text-gold-400 rounded-3xl shadow-xl"><Settings size={32} /></div>
            <div>
                <h2 className="text-3xl font-serif font-black text-gray-900 uppercase tracking-tighter">System Configuration</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">Matrix Atmosphere & Security Settings</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2"><Sun size={16} /> Visual Atmosphere</h3>
                <div className="grid grid-cols-2 gap-3">
                    {['royal', 'midnight', 'parchment', 'emerald', 'ocean', 'rose', 'amber'].map(t => (
                        <button key={t} onClick={() => onThemeChange(t)} className={`p-4 rounded-2xl border-4 transition-all font-black text-[10px] uppercase tracking-widest ${currentTheme === t ? 'bg-royal-900 text-white border-royal-950 shadow-xl scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-royal-100'}`}>{t}</button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-6">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2"><Shield size={16} /> Access Security</h3>
                <div className="p-6 bg-royal-50 rounded-[2rem] border-2 border-royal-100">
                    <p className="text-xs text-royal-700 font-bold leading-relaxed mb-6">Updating your matrix password regularly ensures registry integrity.</p>
                    <button onClick={onChangePassword} className="w-full py-4 bg-white text-royal-900 font-black rounded-xl border-2 border-royal-200 hover:bg-royal-100 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest shadow-sm">
                        <Key size={16} /> Change Security Key
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const LessonViewWrapper = ({ lessonId, user, onBack }: any) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => { lessonService.getLessonById(lessonId).then(l => setLesson(l || null)); }, [lessonId]);
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal-600" size={48} /></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;