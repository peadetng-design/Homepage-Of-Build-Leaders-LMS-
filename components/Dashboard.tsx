
import React, { useEffect, useState } from 'react';
import { UserRole, User, Lesson, ChatMessage } from '../types';
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
  BookOpen, Trophy, Activity, CheckCircle, 
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star, UserPlus, List, BarChart3, MessageSquare, Hash, ArrowRight, UserCircle, Camera, Save, Loader2,
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid
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

const colorVariants: Record<string, { bg: string, text: string, light: string, border: string, stroke: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100', stroke: '#2563eb' },
  green: { bg: 'bg-green-100', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-100', stroke: '#16a34a' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100', stroke: '#9333ea' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100', stroke: '#4f46e5' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-100', stroke: '#ca8a04' },
};

const CircularProgress = ({ percentage, color, size = 80, strokeWidth = 8, icon: Icon }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const variants = colorVariants[color] || colorVariants.blue;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variants.stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
        {Icon ? <Icon size={20} className={variants.text} /> : `${percentage}%`}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, type = 'card', progress }: any) => {
  const colors = colorVariants[color] || colorVariants.blue;

  if (type === 'ring') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 w-full">
        <CircularProgress percentage={progress || 0} color={color} size={70} icon={Icon} />
        <div className="min-w-0">
          <h3 className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-1 truncate">{title}</h3>
          <div className="text-2xl font-black text-gray-900">{value}</div>
          <div className={`text-[10px] font-black mt-1 ${colors.text} truncate`}>{subtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group w-full">
      <div className={`absolute top-0 right-0 w-24 h-24 ${colors.light} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4`}>
          <Icon size={24} />
        </div>
        <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          <span className="text-xs text-green-500 font-medium mb-1.5 flex items-center">
            <TrendingUp size={12} className="mr-0.5" /> {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView = 'dashboard' }) => {
  const [internalView, setInternalView] = useState<DashboardView>(initialView);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [verse, setVerse] = useState<any>(null);
  const [quizQuestion, setQuizQuestion] = useState<any>(null);
  const [quizState, setQuizState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setInternalView(initialView);
  }, [initialView]);

  useEffect(() => {
    getDailyVerse().then(setVerse).finally(() => setLoadingVerse(false));
    getAIQuizQuestion().then(setQuizQuestion);
    authService.getRecentMessages(user, 3).then(setRecentChats);
  }, [user]);

  const handleQuizAnswer = (answer: string) => {
    if (quizState !== 'idle') return;
    if (answer === quizQuestion.answer) setQuizState('correct');
    else setQuizState('incorrect');
  };

  // Helper for "Bordered White Font" styling
  const getOutlinedTextStyle = (outlineColor: string) => ({
    textShadow: `
      2px 2px 0px ${outlineColor},
      -2px -2px 0px ${outlineColor},
      2px -2px 0px ${outlineColor},
      -2px 2px 0px ${outlineColor},
      2px 0px 0px ${outlineColor},
      -2px 0px 0px ${outlineColor},
      0px 2px 0px ${outlineColor},
      0px -2px 0px ${outlineColor}
    `
  });

  const renderHomeDashboard = () => {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
    const isMentor = user.role === UserRole.MENTOR;
    const isOrg = user.role === UserRole.ORGANIZATION;
    const canManageGroup = isAdmin || isMentor || isOrg;

    return (
      <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          {/* Welcome Header */}
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-royal-50/20 to-transparent pointer-events-none"></div>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10 text-center md:text-left">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black text-3xl md:text-4xl shadow-2xl ring-4 md:ring-8 ring-royal-50">
                      {user.name.charAt(0)}
                  </div>
                  <div>
                      <h1 className="text-2xl md:text-4xl font-serif font-black text-gray-900 tracking-tight leading-none">
                        Shalom, <span className="text-royal-700">{user.name.split(' ')[0]}</span>
                      </h1>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-royal-900 text-white rounded-lg shadow-md shrink-0">
                             <Shield size={12} className="text-gold-400" />
                             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="relative z-10 w-full md:w-auto">
                  <button 
                    onClick={() => setInternalView('performance-report')} 
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs md:text-sm hover:bg-indigo-700 shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                      <Activity size={18} /> ANALYTICS
                  </button>
              </div>
          </div>

          {/* MATURE ACTION CONSOLES - STACKED VERTICALLY - OPTIMIZED FOR MOBILE LABELS UNDER ICONS */}
          <div className="flex flex-col gap-8 md:gap-10">
              
              {/* PERSONAL CONSOLE - TOP POSITION */}
              <div className="bg-gradient-to-br from-indigo-700 via-royal-800 to-royal-900 rounded-3xl p-6 md:p-10 shadow-xl relative group overflow-hidden border-b-8 border-indigo-950 w-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  
                  <div className="flex justify-between items-center mb-8 md:mb-10 relative z-10">
                      <div className="flex items-center gap-3 md:gap-4">
                          <div className="p-2 md:p-3 bg-white/10 text-white rounded-xl border border-white/20 shadow-lg backdrop-blur-md">
                            <UserCircle size={20} className="md:w-7 md:h-7"/>
                          </div>
                          <h3 className="font-serif font-black text-white uppercase text-xs md:text-lg tracking-widest">Personal Console</h3>
                      </div>
                      <div className="h-px flex-1 mx-4 md:mx-6 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
                      <button onClick={() => setInternalView('lessons')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-white/95 text-indigo-950 rounded-2xl font-black text-[10px] md:text-xs hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-lg text-center">
                          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-colors shrink-0">
                            <Play size={24} className="md:w-6 md:h-6" fill="currentColor"/>
                          </div>
                          <span className="leading-tight">TAKE LESSONS</span>
                      </button>
                      
                      {(isAdmin || isMentor || isOrg) && (
                        <button onClick={() => setInternalView('upload')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-white/95 text-emerald-950 rounded-2xl font-black text-[10px] md:text-xs hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-lg text-center">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-colors shrink-0">
                              <Upload size={24} className="md:w-6 md:h-6"/>
                            </div>
                            <span className="leading-tight">UPLOAD CONTENT</span>
                        </button>
                      )}

                      <button onClick={() => setInternalView('performance-report')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-white/95 text-royal-950 rounded-2xl font-black text-[10px] md:text-xs hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-lg text-center">
                          <div className="p-3 bg-royal-100 text-royal-600 rounded-xl shadow-inner group-hover/btn:bg-royal-500 group-hover/btn:text-white transition-colors shrink-0">
                            <Trophy size={24} className="md:w-6 md:h-6"/>
                          </div>
                          <span className="leading-tight">MY PERFORMANCE</span>
                      </button>

                      <button onClick={() => setInternalView('curated')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-white/95 text-purple-950 rounded-2xl font-black text-[10px] md:text-xs hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-lg text-center">
                          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shadow-inner group-hover/btn:bg-purple-500 group-hover/btn:text-white transition-colors shrink-0">
                            <Bookmark size={24} className="md:w-6 md:h-6" fill="currentColor"/>
                          </div>
                          <span className="leading-tight">MY LIST</span>
                      </button>
                  </div>
              </div>

              {/* GROUP CONSOLE - BELOW PERSONAL CONSOLE - OPTIMIZED LABELS UNDER ICONS */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-3xl p-6 md:p-10 border-t-4 border-gold-500 shadow-xl relative overflow-hidden group w-full">
                  <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center mb-8 md:mb-10 relative z-10">
                      <div className="flex items-center gap-3 md:gap-4">
                          <div className="p-2 md:p-3 bg-white/5 text-gold-400 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
                            <Users size={20} className="md:w-7 md:h-7"/>
                          </div>
                          <h3 className="font-serif font-black text-white uppercase text-xs md:text-lg tracking-widest">Group Console</h3>
                      </div>
                      <div className="h-px flex-1 mx-4 md:mx-6 bg-gradient-to-r from-gold-500/20 to-transparent"></div>
                  </div>

                  {canManageGroup ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5 relative z-10">
                        {(isAdmin || isMentor) && (
                            <button onClick={() => setInternalView('requests')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl group-hover/btn:bg-amber-500 group-hover/btn:text-white transition-all shrink-0">
                                    <UserPlus size={22}/>
                                </div>
                                <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#92400e')}>REQUESTS</span>
                            </button>
                        )}
                        
                        <button onClick={() => setInternalView('users')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                            <div className="p-3 bg-royal-500/10 text-royal-600 rounded-xl group-hover/btn:bg-royal-600 group-hover/btn:text-white transition-all shrink-0">
                                <Users size={22}/>
                            </div>
                            <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#1e1b4b')}>USERS</span>
                        </button>

                        <button onClick={() => setInternalView('invites')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all shrink-0">
                                <Mail size={22}/>
                            </div>
                            <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#1e3a8a')}>INVITES</span>
                        </button>

                        <button onClick={() => setInternalView('performance-report')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                            <div className="p-3 bg-gold-500/10 text-gold-600 rounded-xl group-hover/btn:bg-gold-500 group-hover/btn:text-white transition-all shrink-0">
                                <BarChart3 size={22}/>
                            </div>
                            <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#b45309')}>ANALYTICS</span>
                        </button>

                        <button onClick={() => setInternalView('lessons')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-all shrink-0">
                                <LayoutGrid size={22}/>
                            </div>
                            <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#581c87')}>CURRICULUM</span>
                        </button>

                        {isAdmin && (
                            <button onClick={() => setInternalView('logs')} className="group/btn flex flex-col items-center justify-center gap-3 p-4 bg-gold-50/95 text-slate-950 rounded-2xl hover:bg-white transition-all duration-300 shadow-lg border border-gold-200 text-center">
                                <div className="p-3 bg-slate-500/10 text-slate-600 rounded-xl group-hover/btn:bg-slate-600 group-hover/btn:text-white transition-all shrink-0">
                                    <History size={22}/>
                                </div>
                                <span className="text-white font-black text-[9px] md:text-[11px] leading-tight" style={getOutlinedTextStyle('#0f172a')}>AUDIT LOGS</span>
                            </button>
                        )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <Shield size={32} className="text-white/20 mb-3" />
                        <h4 className="text-white font-bold tracking-widest text-[10px] uppercase">Staff Console Protected</h4>
                        <p className="text-royal-300 text-[10px] font-medium mt-1 max-w-[180px] mx-auto opacity-70">Management tools are active for verified mentors.</p>
                    </div>
                  )}
              </div>
          </div>

          {/* LOWER CONTENT GRID - STATS AND COMMS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              <div className="lg:col-span-2 space-y-8 md:gap-10">
                  {/* Mastery Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
                      <StatCard title="Overall Mastery" value="84%" subtitle="+5% this week" icon={Trophy} color="gold" type="ring" progress={84} />
                      <StatCard title="Course Velocity" value="12" subtitle="3 pending modules" icon={CheckCircle} color="green" type="ring" progress={65} />
                  </div>
                  
                  {/* Learning Path */}
                  <div className="p-8 bg-white rounded-3xl border-2 border-gray-50 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                      <div className="p-4 bg-royal-50 rounded-2xl text-royal-600 shrink-0">
                          <Globe size={32}/>
                      </div>
                      <div className="text-center sm:text-left">
                          <h4 className="font-serif font-black text-gray-900 text-lg uppercase tracking-tight">Active Learning Path</h4>
                          <p className="text-sm text-gray-500 font-medium">Continue from where you left off in your biblical leadership journey.</p>
                      </div>
                  </div>
              </div>

              {/* Sidebars - Comms Hub Only */}
              <div className="space-y-8 md:space-y-10">
                  {/* Comms Hub */}
                  <div className="bg-white rounded-3xl p-6 md:p-10 border-2 border-gray-50 shadow-xl">
                      <h3 className="font-serif font-black text-gray-900 text-[10px] md:text-sm uppercase tracking-widest mb-6 md:mb-10 flex items-center gap-3 md:gap-4">
                        <MessageSquare size={18} className="text-royal-600" /> RECENT INTEL
                      </h3>
                      <div className="space-y-6 md:space-y-8">
                          {recentChats.map(m => (
                              <div key={m.id} className="flex gap-4 md:gap-5 group cursor-pointer" onClick={() => setInternalView('chat')}>
                                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-royal-50 flex items-center justify-center font-black text-sm md:text-lg text-royal-700 border-2 border-transparent group-hover:border-royal-500 transition-all shrink-0">
                                    {m.senderName.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                      <p className="text-[10px] md:text-sm font-black text-gray-900 truncate uppercase tracking-tight">{m.senderName}</p>
                                      <p className="text-[10px] md:text-sm text-gray-500 truncate mt-1 font-medium leading-relaxed">{m.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setInternalView('chat')} className="w-full mt-6 md:mt-10 py-3 md:py-4 bg-royal-900 text-white text-[8px] md:text-[10px] font-black rounded-xl md:rounded-[1.5rem] hover:bg-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-royal-900/20 transform hover:-translate-y-1">OPEN COMMS HUB</button>
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
      case 'upload':
        return <LessonUpload currentUser={user} onSuccess={() => setInternalView('lessons')} onCancel={() => setInternalView('dashboard')} />;
      case 'admin':
      case 'users':
      case 'requests':
      case 'logs':
      case 'invites':
      case 'curated':
        return <AdminPanel 
            currentUser={user} 
            activeTab={internalView === 'dashboard' ? 'users' : internalView as any} 
            onTabChange={(tab: any) => setInternalView(tab)}
        />;
      case 'org-panel':
      case 'staff':
        return <OrganizationPanel currentUser={user} />;
      case 'lessons':
      case 'progress':
        return user.role === UserRole.STUDENT 
          ? <StudentPanel currentUser={user} activeTab={internalView === 'lessons' ? 'lessons' : 'browse'} onTakeLesson={setSelectedLessonId} />
          : <AdminPanel currentUser={user} activeTab="lessons" onTabChange={(tab: any) => setInternalView(tab)} />;
      case 'group':
      case 'assignments':
        return <AdminPanel currentUser={user} activeTab={internalView === 'group' ? 'requests' : 'lessons'} onTabChange={(tab: any) => setInternalView(tab)} />;
      case 'resources':
        return <ResourceView />;
      case 'news':
        return <NewsView />;
      case 'chat':
        return <ChatPanel currentUser={user} />;
      case 'certificates':
        return <CertificatesPanel currentUser={user} />;
      case 'performance-report':
        return <PerformanceReport currentUser={user} onBack={() => setInternalView('dashboard')} />;
      case 'settings':
        return (
          <div className="bg-white p-6 md:p-12 rounded-2xl md:rounded-[3rem] shadow-xl border-2 border-gray-50 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-black mb-6 md:mb-8 border-b-4 border-royal-50 pb-4">Profile Settings</h2>
            <div className="space-y-6">
                <div className="p-4 md:p-6 bg-royal-50 rounded-xl md:rounded-2xl border-2 border-royal-100">
                    <p className="text-[10px] md:text-xs font-black text-royal-800 uppercase tracking-widest mb-1">Security</p>
                    <p className="text-xs md:text-sm text-royal-600 mb-4">Manage your credentials and access tokens.</p>
                    <button onClick={onChangePasswordClick} className="w-full py-3 md:py-4 bg-royal-800 text-white font-black rounded-lg md:rounded-xl shadow-lg shadow-royal-900/20 hover:bg-royal-950 transition-all flex items-center justify-center gap-2 border-b-4 border-royal-950 text-xs md:text-base">
                        <Key size={18}/> CHANGE SYSTEM PASSWORD
                    </button>
                </div>
            </div>
          </div>
        );
      case 'dashboard':
      default:
        return renderHomeDashboard();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative">
      <FrontendEngineerBadge />
      {renderView()}
    </div>
  );
};

const LessonViewWrapper = ({ lessonId, user, onBack }: any) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  useEffect(() => {
    lessonService.getLessonById(lessonId).then(l => setLesson(l || null));
  }, [lessonId]);
  
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal-600" size={48} /></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;
