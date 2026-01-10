
import React, { useEffect, useState, useRef } from 'react';
import { UserRole, User, Lesson, ChatMessage, NewsItem, Module, StudentAttempt } from '../types';
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
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid, Award, BadgeCheck, ChevronDown, Clock, Newspaper, Calendar, Target, Zap, PieChart, Layers, Sparkles, LayoutDashboard
} from 'lucide-react';

export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' 
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings' | 'upload' | 'performance-report' | 'requests' | 'logs' | 'invites' | 'curated';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onChangePasswordClick?: () => void;
  initialView?: DashboardView;
}

// Utility component for scroll-triggered "Brighten & Move" animations
// Ensured components are STABLE and VISIBLE initially but GROW "Bigger and Bolder"
const ScrollReveal = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-1000 ease-out transform ${isVisible 
        ? 'opacity-100 translate-y-0 scale-100 filter brightness-110 contrast-125 saturate-125' 
        : 'opacity-100 translate-y-4 scale-95 filter brightness-100 contrast-100'}`}
    >
      {children}
    </div>
  );
};

// Utility SVG Components for metrics
const MiniPieChart = ({ percent, color, bgColor }: { percent: number, color: string, bgColor: string }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="20" cy="20" r={radius} stroke={bgColor} strokeWidth="3" fill="none" />
        <circle cx="20" cy="20" r={radius} stroke={color} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="absolute text-[8px] font-black" style={{ color }}>{Math.round(percent)}%</span>
    </div>
  );
};

const ConsoleDropdown = ({ 
  label, 
  items, 
  primaryColorClass,
  direction = 'down'
}: { 
  label: string, 
  items: DropdownOption[], 
  primaryColorClass: string,
  direction?: 'up' | 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={handleToggle}
        className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs md:text-sm tracking-[0.3em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl border-b-[8px] ${primaryColorClass} text-white uppercase group overflow-hidden relative z-[101]`}
      >
        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 ease-in-out -skew-x-12 -translate-x-full pointer-events-none"></div>
        <span className="relative z-10">{label}</span>
        <ChevronDown size={18} className={`relative z-10 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[140] bg-transparent cursor-default" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
      )}
      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[16rem] md:w-[20rem] bg-white rounded-[2.2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-gray-100 p-2.5 md:p-3 z-[150] animate-in fade-in zoom-in-95 duration-300 ${direction === 'up' ? 'bottom-full mb-4 origin-bottom slide-in-from-bottom-4' : 'top-full mt-4 origin-top slide-in-from-top-4'}`}>
          <div className="flex flex-col gap-1 md:gap-1.5">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); item.action(); setIsOpen(false); }}
                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[1.4rem] md:rounded-[1.6rem] transition-all duration-300 group/item hover:scale-[1.03] ${item.hoverBg} text-left active:scale-95`}
              >
                <div className={`p-2 md:p-2.5 rounded-xl shadow-lg transition-all duration-500 ${item.color} group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(0,0,0,0.2)]`} style={{ filter: `drop-shadow(0 0 8px ${item.glowColor}90)` }}><item.icon size={16} className="md:w-[18px] md:h-[18px] transition-transform duration-500 group-hover/item:rotate-[12deg]" /></div>
                <div className="flex flex-col"><span className="font-black text-[10px] md:text-sm uppercase tracking-[0.1em] text-gray-700 group-hover/item:text-gray-950 transition-colors leading-tight">{item.label}</span><div className="h-0.5 w-0 group-hover/item:w-full transition-all duration-500 rounded-full mt-0.5" style={{ backgroundColor: item.glowColor }}></div></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownOption {
  label: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
  glowColor: string;
  hoverBg: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView = 'dashboard' }) => {
  const [internalView, setInternalView] = useState<DashboardView>(initialView);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Performance Metrics State
  const [learningMetrics, setLearningMetrics] = useState<{
    lastLesson: Lesson | null;
    lastModuleProgress: number;
    lastLessonTime: number;
    lastModuleTime: number;
    completedModulesCount: number;
    totalModulesCount: number;
    lastLessonScore: number;
  }>({
    lastLesson: null,
    lastModuleProgress: 0,
    lastLessonTime: 0,
    lastModuleTime: 0,
    completedModulesCount: 0,
    totalModulesCount: 1,
    lastLessonScore: 0
  });

  useEffect(() => { setInternalView(initialView); }, [initialView]);

  useEffect(() => {
    authService.getRecentMessages(user, 4).then(setRecentChats);
    lessonService.getNews().then(items => {
        const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentNews(sorted.slice(0, 2));
    });
    calculateLearningPath();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        if (ev.target?.result) {
            const base64 = ev.target.result as string;
            try {
                const updatedUser = await authService.updateProfile(user.id, { avatarUrl: base64 });
                onUpdateUser(updatedUser);
            } catch (err) {
                console.error("Avatar upload failed", err);
            }
        }
    };
    reader.readAsDataURL(file);
  };

  const calculateLearningPath = async () => {
    const allLessons = await lessonService.getLessons();
    const allModules = await lessonService.getModules();
    
    // Find last lesson user interacted with (by attempts or timer)
    let lastLId = null;
    const history = localStorage.getItem('bbl_db_attempts') ? JSON.parse(localStorage.getItem('bbl_db_attempts')!) : [];
    const userHistory = history.filter((h: StudentAttempt) => h.studentId === user.id).sort((a: any, b: any) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
    
    if (userHistory.length > 0) {
      lastLId = userHistory[0].lessonId;
    } else {
      // Fallback: check timers
      const timers = localStorage.getItem('bbl_db_timers') ? JSON.parse(localStorage.getItem('bbl_db_timers')!) : {};
      const userTimers = Object.entries(timers).filter(([k]) => k.startsWith(user.id)).sort((a: any, b: any) => b[1] - a[1]);
      if (userTimers.length > 0) lastLId = userTimers[0][0].split('_')[1];
    }

    if (lastLId) {
      const lastLesson = allLessons.find(l => l.id === lastLId);
      if (lastLesson) {
        const progress = await lessonService.getModuleProgress(user.id, lastLesson.moduleId);
        const lastLessonTime = await lessonService.getQuizTimer(user.id, lastLesson.id);
        
        // Module time sum
        const moduleLessons = allLessons.filter(l => l.moduleId === lastLesson.moduleId);
        let modTime = 0;
        for(const ml of moduleLessons) modTime += await lessonService.getQuizTimer(user.id, ml.id);

        // Completed modules
        let completedCount = 0;
        for(const m of allModules) {
          const mProg = await lessonService.getModuleProgress(user.id, m.id);
          if (mProg.completed >= mProg.total && mProg.total > 0) completedCount++;
        }

        // Score performance of last lesson
        const lastLessonAttempts = userHistory.filter((h: any) => h.lessonId === lastLId);
        const uniqueQInLastLesson = lastLesson.sections.reduce((acc, s) => acc + (s.quizzes?.length || 0), 0);
        const uniqueCorrect = new Set(lastLessonAttempts.filter((a: any) => a.isCorrect).map((a: any) => a.quizId)).size;
        const scorePerc = uniqueQInLastLesson > 0 ? (uniqueCorrect / uniqueQInLastLesson) * 100 : 0;

        setLearningMetrics({
          lastLesson,
          lastModuleProgress: Math.round((progress.completed / progress.total) * 100) || 0,
          lastLessonTime,
          lastModuleTime: modTime,
          completedModulesCount: completedCount,
          totalModulesCount: allModules.length || 1,
          lastLessonScore: scorePerc
        });
      }
    } else if (allLessons.length > 0) {
      // First timer - use first lesson available
      setLearningMetrics(prev => ({ ...prev, lastLesson: allLessons[0], totalModulesCount: allModules.length }));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderHomeDashboard = () => {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
    const isMentor = user.role === UserRole.MENTOR;
    const isOrg = user.role === UserRole.ORGANIZATION;
    const isStudent = user.role === UserRole.STUDENT;
    const isParent = user.role === UserRole.PARENT;
    const canManageContent = isAdmin || isMentor || isOrg;
    const firstName = user.name.split(' ')[0];

    const personalItems: DropdownOption[] = [
      { label: "TAKE LESSONS", icon: Play, action: () => setInternalView('lessons'), color: "bg-indigo-600 text-white", glowColor: "#4f46e5", hoverBg: "hover:bg-indigo-50" },
    ];
    if (canManageContent) {
      personalItems.push({ label: "UPLOAD CONTENT", icon: Upload, action: () => setInternalView('upload'), color: "bg-emerald-500 text-white", glowColor: "#10b981", hoverBg: "hover:bg-emerald-50" });
    }
    personalItems.push(
      { label: "PERFORMANCE", icon: Trophy, action: () => setInternalView('performance-report'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" },
      { label: "MY LIST", icon: Bookmark, action: () => setInternalView('curated'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" },
      { label: "MY CERTIFICATES", icon: BadgeCheck, action: () => setInternalView('certificates'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" }
    );

    const groupItems: DropdownOption[] = [];
    if (canManageContent) { groupItems.push({ label: "REQUESTS", icon: UserPlus, action: () => setInternalView('requests'), color: "bg-amber-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-amber-50" }); }
    groupItems.push(
      { label: "MEMBERS", icon: Users, action: () => setInternalView('users'), color: "bg-indigo-700 text-white", glowColor: "#4338ca", hoverBg: "hover:bg-indigo-50" },
      { label: "INVITES", icon: Mail, action: () => setInternalView('invites'), color: "bg-blue-600 text-white", glowColor: "#2563eb", hoverBg: "hover:bg-blue-50" },
      { label: "ANALYTICS", icon: BarChart3, action: () => setInternalView('performance-report'), color: "bg-gold-500 text-white", glowColor: "#f59e0b", hoverBg: "hover:bg-yellow-50" },
      { label: "CURRICULUM", icon: LayoutGrid, action: () => setInternalView('lessons'), color: "bg-purple-600 text-white", glowColor: "#9333ea", hoverBg: "hover:bg-purple-50" }
    );
    if (canManageContent || isParent) { groupItems.push({ label: "AUDIT LOGS", icon: History, action: () => setInternalView('logs'), color: "bg-slate-600 text-white", glowColor: "#475569", hoverBg: "hover:bg-slate-50" }); }

    return (
      <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
          {/* Welcome Header */}
          <div className="bg-white p-5 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 lg:max-w-[70%] lg:mx-auto">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-royal-50/30 to-transparent pointer-events-none"></div>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 text-center md:text-left">
                  {/* (2) Customizable Profile Picture Icon */}
                  <div className="relative group/avatar">
                    <button 
                      onClick={handleAvatarClick}
                      className="w-16 h-16 md:w-24 md:h-24 rounded-3xl md:rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black text-2xl md:text-4xl shadow-2xl ring-6 md:ring-8 ring-royal-50/50 overflow-hidden relative"
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={48} className="md:w-16 md:h-16" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                  
                  <div>
                      {/* (1) WELCOME BACK [NAME] */}
                      <h1 className="text-xl md:text-4xl font-serif font-black text-gray-900 tracking-tight leading-tight uppercase">WELCOME BACK, <span className="text-royal-700">{firstName}</span></h1>
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-royal-950 text-white rounded-xl shadow-xl shrink-0 border border-white/10">
                          {/* (4) More befitting welcome icon + 100% size increase (12px -> 24px) */}
                          <Sparkles size={24} className="text-gold-400 animate-pulse" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{user.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                  </div>
              </div>
              <div className="relative z-10 w-full md:w-auto">
                {/* (3) ROLE DASHBOARD Label and Icon Update */}
                <button 
                  onClick={() => setInternalView('performance-report')} 
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 border-b-[4px] border-indigo-900 uppercase"
                >
                  <LayoutDashboard size={18} /> {user.role.replace('_', ' ')} DASHBOARD
                </button>
              </div>
          </div>

          {/* ACTION CONSOLES */}
          <div className="flex flex-col gap-6 md:gap-10 relative">
              <div className="bg-gradient-to-br from-indigo-700 via-royal-800 to-royal-900 rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 shadow-[0_30px_80px_-20px_rgba(30,27,75,0.4)] relative border-b-[10px] border-indigo-950 w-full lg:max-w-[60%] lg:mx-auto">
                  <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                  <div className="flex flex-col relative z-10 gap-4"><div className="flex items-center gap-4"><div className="p-3 bg-white/10 text-white rounded-xl border border-white/20 shadow-2xl backdrop-blur-2xl"><UserCircle size={28} /></div><h3 className="font-serif font-black text-white uppercase text-lg md:text-2xl tracking-[0.15em] drop-shadow-2xl">Personal Console</h3></div><div className="max-w-3xl"><p className="text-indigo-50 text-xs md:text-base font-medium leading-relaxed opacity-90 italic">Your inner sanctuary for growth. Track transformations, curate your library, and verify achievements.</p></div><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={personalItems} direction="up" primaryColorClass="bg-indigo-600 hover:bg-indigo-500 border-indigo-900 shadow-indigo-950/60" /></div></div>
              </div>
              {!isStudent && (
                <div className={`bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-[2.2rem] md:rounded-[2.8rem] p-5 md:p-8 border-t-[10px] ${isParent ? 'border-indigo-400' : 'border-gold-500'} shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] relative w-full lg:max-w-[60%] lg:mx-auto`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="flex flex-col relative z-10 gap-4"><div className="flex items-center gap-4"><div className="p-3 bg-white/5 text-gold-400 rounded-xl border border-white/10 shadow-2xl backdrop-blur-2xl">{isParent ? <Heart size={28} className="text-rose-400"/> : <Users size={28}/>}</div><h3 className="font-serif font-black text-white uppercase text-lg md:text-2xl tracking-[0.15em] drop-shadow-2xl">{isParent ? "My Child's Console" : "Group Console"}</h3></div><div className="max-w-3xl"><p className="text-amber-50 text-xs md:text-base font-medium leading-relaxed opacity-90 italic">{isParent ? "Oversee spiritual foundations. Audit logs, track modules, and manage their earned credentials." : "Command center for community oversight. Manage invites, validate requests, and analyze performance."}</p></div><div className="mt-2"><ConsoleDropdown label="CLICK HERE" items={groupItems} direction="down" primaryColorClass={isParent ? "bg-indigo-500 hover:bg-indigo-400 border-indigo-900 shadow-black/70" : "bg-gold-500 hover:bg-gold-400 border-gold-800 shadow-black/70"} /></div></div>
                </div>
              )}
          </div>

          {/* LOWER CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-14 relative z-0 lg:max-w-[90%] lg:mx-auto">
              <div className="lg:col-span-2 space-y-8 md:space-y-14">
                  {/* --- BEAUTIFUL BOLD NEWS PANEL --- */}
                  <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-gray-50 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]"><Newspaper size={200} /></div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b-4 border-royal-50 pb-6 gap-4">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-royal-900 text-gold-400 rounded-2xl shadow-xl"><Newspaper size={28} /></div>
                            <h3 className="font-serif font-black text-gray-900 text-xl md:text-3xl uppercase tracking-tighter">News & Updates</h3>
                         </div>
                         <button 
                            onClick={() => setInternalView('news')} 
                            className="px-6 py-2.5 bg-royal-800 hover:bg-royal-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-royal-900/20 flex items-center gap-2 transform hover:-translate-y-1 active:scale-95 border-b-4 border-royal-950"
                         >
                            VIEW ARCHIVE <ArrowRight size={14} strokeWidth={3} />
                         </button>
                      </div>
                      
                      <div className="space-y-8">
                         {recentNews.length > 0 ? recentNews.map(item => {
                             const d = new Date(item.date);
                             return (
                                 <div key={item.id} className="relative pl-10 border-l-4 border-royal-100 hover:border-royal-600 transition-colors group/news">
                                     <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-white border-4 border-royal-100 group-hover/news:border-royal-600 transition-all"></div>
                                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                                         <span className="px-3 py-1 bg-royal-50 text-royal-700 text-[9px] font-black rounded-full uppercase tracking-widest">{item.category}</span>
                                         <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase">
                                             <span className="flex items-center gap-1"><Calendar size={12}/> {d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                             <span className="flex items-center gap-1"><Clock size={12}/> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                         </div>
                                     </div>
                                     <h4 className="font-serif font-black text-xl md:text-2xl text-gray-900 leading-tight group-hover/news:text-royal-600 transition-colors">{item.title}</h4>
                                     <p className="mt-2 text-gray-500 text-sm md:text-base font-medium line-clamp-1 opacity-80">{item.content}</p>
                                 </div>
                             );
                         }) : (
                             <div className="text-center py-10 opacity-40 italic font-medium">Waiting for system updates...</div>
                         )}
                      </div>
                  </div>
                  
                  {/* --- REDESIGNED ACTIVE LEARNING PATH WITH INFORMATICS & ANIMATIONS (COMPACT HEIGHT) --- */}
                  <div className="p-3 md:p-4 bg-white rounded-[2rem] md:rounded-[2.5rem] border-4 border-royal-100 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] flex flex-col gap-3 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-royal-50/50 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 relative z-10">
                          <div className="p-2.5 md:p-3.5 bg-royal-900 rounded-[1.4rem] text-gold-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xl border-b-[5px] border-royal-950">
                             <Globe size={24} className="md:w-6 md:h-6"/>
                          </div>
                          <div className="text-center md:text-left flex-1">
                              <h4 className="font-serif font-black text-gray-950 text-base md:text-xl uppercase tracking-tighter">Active Learning Path</h4>
                              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <p className="text-[10px] md:text-xs text-gray-500 font-bold opacity-80">
                                  Continue from where you left off. Your next milestone is just a few minutes away.
                                </p>
                                <button 
                                  onClick={() => learningMetrics.lastLesson && setSelectedLessonId(learningMetrics.lastLesson.id)}
                                  className="px-7 py-2.5 bg-royal-800 hover:bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl border-b-2 border-royal-950 flex items-center gap-1.5"
                                >
                                  CONTINUE <ArrowRight size={14} />
                                </button>
                              </div>
                          </div>
                      </div>

                      {/* --- PERFORMANCE METRICS & STATISTICS TOOLS WITH ANIMATIONS --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 relative z-10">
                          {/* (a) Current Module Progress Bar */}
                          <ScrollReveal className="lg:col-span-2" delay={100}>
                            <div className="space-y-2 bg-white p-2.5 rounded-2xl border-4 border-indigo-400 shadow-sm group/stat hover:border-indigo-600 transition-all hover:shadow-xl hover:scale-[1.02]">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-royal-100 text-royal-700 rounded-lg group-hover/stat:bg-royal-600 group-hover/stat:text-white transition-colors shadow-sm"><Layers size={16} /></div>
                                        <div>
                                            <h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none">Current Module</h5>
                                            <p className="text-[9px] font-bold text-gray-400 truncate max-w-[80px]">{learningMetrics.lastLesson?.moduleId || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-royal-950 leading-none">{learningMetrics.lastModuleProgress}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-50 rounded-full border border-royal-50 overflow-hidden p-0.5">
                                    <div 
                                      className="h-full bg-gradient-to-r from-royal-600 to-royal-400 rounded-full transition-all duration-1000 shadow-sm"
                                      style={{ width: `${learningMetrics.lastModuleProgress}%` }}
                                    />
                                </div>
                            </div>
                          </ScrollReveal>

                          {/* (d) Modules Completed */}
                          <ScrollReveal delay={200}>
                            <div className="bg-white p-2.5 rounded-2xl border-4 border-gold-400 flex items-center gap-2.5 shadow-sm group/stat hover:border-gold-600 transition-all hover:shadow-xl hover:scale-[1.02] h-full">
                                <div className="p-2 bg-gold-50 text-gold-600 rounded-lg group-hover/stat:bg-gold-500 group-hover/stat:text-white transition-colors shadow-sm shrink-0"><Award size={16} /></div>
                                <div className="min-w-0">
                                    <h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Mastered</h5>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-royal-950 leading-none">{learningMetrics.completedModulesCount}</span>
                                        <span className="text-[10px] text-gray-300 font-bold">/ {learningMetrics.totalModulesCount}</span>
                                    </div>
                                </div>
                            </div>
                          </ScrollReveal>

                          {/* (e) Last Lesson Score Pie Chart */}
                          <ScrollReveal delay={300}>
                            <div className="bg-white p-2.5 rounded-2xl border-4 border-royal-500 flex items-center gap-2.5 shadow-sm group/stat hover:border-royal-700 transition-all hover:shadow-xl hover:scale-[1.02] h-full">
                                <div className="p-1 bg-royal-50 text-royal-600 rounded-lg group-hover/stat:bg-royal-600 group-hover/stat:text-white transition-colors shadow-sm shrink-0"><Target size={16} /></div>
                                <div className="min-w-0 flex items-center gap-1.5">
                                  <MiniPieChart percent={learningMetrics.lastLessonScore} color="#4f46e5" bgColor="#e0e7ff" />
                                  <div>
                                     <h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Precision</h5>
                                     <span className="text-xl font-black text-royal-950 leading-none">{Math.round(learningMetrics.lastLessonScore)}%</span>
                                  </div>
                                </div>
                            </div>
                          </ScrollReveal>
                      </div>

                      {/* (b) & (c) Time Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                          <ScrollReveal delay={400} className="w-full">
                            <div className="flex items-center gap-3 p-2.5 bg-white border-4 border-amber-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group/time">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover/time:bg-amber-500 group-hover/time:text-white transition-colors shadow-sm"><Clock size={20} /></div>
                                <div>
                                    <h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Last Lesson</h5>
                                    <p className="text-xl font-black text-gray-900 leading-none">{formatTime(learningMetrics.lastLessonTime)}</p>
                                </div>
                            </div>
                          </ScrollReveal>
                          <ScrollReveal delay={500} className="w-full">
                            <div className="flex items-center gap-3 p-2.5 bg-white border-4 border-emerald-400 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all group/time">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover/time:bg-emerald-500 group-hover/time:text-white transition-colors shadow-sm"><History size={20} /></div>
                                <div>
                                    <h5 className="text-[8px] font-black text-royal-600 uppercase tracking-widest leading-none mb-1">Total Effort</h5>
                                    <p className="text-xl font-black text-gray-900 leading-none">{formatTime(learningMetrics.lastModuleTime)}</p>
                                </div>
                            </div>
                          </ScrollReveal>
                      </div>
                  </div>
              </div>

              {/* Sidebars - Recent Chats Section */}
              <div className="space-y-8 md:space-y-14">
                  <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border-2 border-gray-50 shadow-2xl">
                      <h3 className="font-serif font-black text-gray-900 text-base md:text-2xl uppercase tracking-[0.3em] mb-8 flex items-center gap-5">
                        <div className="p-3 bg-royal-900 text-white rounded-2xl shadow-lg">
                            <MessageSquare size={26} />
                        </div> 
                        RECENT CHATS
                      </h3>
                      <div className="space-y-6">
                          {recentChats.map(m => {
                              const d = new Date(m.timestamp);
                              const dayName = d.toLocaleDateString([], { weekday: 'short' });
                              const dateString = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                              const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              return (
                                <div key={m.id} className="p-4 rounded-3xl bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-royal-100 hover:shadow-xl transition-all group cursor-pointer" onClick={() => setInternalView('chat')}>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center font-black text-xs md:text-xl text-royal-700 border border-royal-100 shrink-0 shadow-sm relative group-hover:scale-110 transition-transform">{m.senderName.charAt(0)}<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-black text-royal-600 uppercase tracking-[0.2em]">{m.senderName}</span><div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400"><Clock size={10} /> <span>{dayName} ({dateString})</span></div></div>
                                            <p className="text-sm md:text-base font-serif font-black text-royal-950 leading-snug line-clamp-2 tracking-tight">"{m.text}"</p>
                                            <div className="mt-2 flex items-center justify-between"><span className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-black text-gray-500 uppercase">{timeString}</span><span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-royal-500 uppercase tracking-widest flex items-center gap-1">Open <ArrowRight size={10}/></span></div>
                                        </div>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                      <button onClick={() => setInternalView('chat')} className="w-full mt-10 py-5 bg-royal-900 text-white text-[10px] font-black rounded-[1.5rem] hover:bg-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-royal-900/30 transform hover:-translate-y-1 active:scale-95 border-b-[5px] border-black">OPEN CHATS APP</button>
                  </div>
              </div>
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
      case 'lessons': case 'progress': return user.role === UserRole.STUDENT ? <StudentPanel currentUser={user} activeTab={internalView === 'lessons' ? 'lessons' : 'browse'} onTakeLesson={setSelectedLessonId} /> : <AdminPanel currentUser={user} activeTab="lessons" onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'group' : case 'assignments': return <AdminPanel currentUser={user} activeTab={internalView === 'group' ? 'requests' : 'lessons'} onTabChange={(tab: any) => setInternalView(tab)} onBack={() => setInternalView('dashboard')} />;
      case 'resources': return <ResourceView />;
      case 'news': return <NewsView />;
      case 'chat': return <ChatPanel currentUser={user} />;
      case 'certificates': return <CertificatesPanel currentUser={user} />;
      case 'performance-report': return <PerformanceReport currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'settings': return (<div className="bg-white p-6 md:p-12 rounded-2xl md:rounded-[3rem] shadow-xl border-2 border-gray-50 max-w-2xl mx-auto"><h2 className="text-2xl md:text-3xl font-serif font-black mb-6 md:mb-8 border-b-4 border-royal-50 pb-4">Profile Settings</h2><div className="space-y-6"><div className="p-4 md:p-6 bg-royal-50 rounded-xl md:rounded-2xl border-2 border-royal-100"><p className="text-[10px] md:text-xs font-black text-royal-800 uppercase tracking-widest mb-1">Security</p><p className="text-xs md:text-sm text-royal-600 mb-4">Manage your credentials and access tokens.</p><button onClick={onChangePasswordClick} className="w-full py-3 md:py-4 bg-royal-800 text-white font-black rounded-lg md:rounded-xl shadow-lg shadow-royal-900/20 hover:bg-royal-950 transition-all flex items-center justify-center gap-2 border-b-4 border-royal-950 text-xs md:text-base"><Key size={18}/> CHANGE SYSTEM PASSWORD</button></div></div></div>);
      case 'dashboard': default: return renderHomeDashboard();
    }
  };

  return (<div className="max-w-7xl mx-auto space-y-4 md:space-y-8 relative"><FrontendEngineerBadge />{renderView()}</div>);
};

const LessonViewWrapper = ({ lessonId, user, onBack }: any) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => { lessonService.getLessonById(lessonId).then(l => setLesson(l || null)); }, [lessonId]);
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal-600" size={48} /></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;
