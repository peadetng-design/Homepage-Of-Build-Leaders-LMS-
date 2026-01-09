
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
  BookOpen, Trophy, Activity, CheckCircle, Heart,
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star, UserPlus, List, BarChart3, MessageSquare, Hash, ArrowRight, UserCircle, Camera, Save, Loader2,
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History, Mail, Bookmark, Briefcase, LayoutGrid, Award, BadgeCheck
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

  // Fix: changed 'percentage' to 'progress' on line 84
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

  /**
   * Helper for "Thick Framed White Font" styling
   * Utilizing 16 shadow vectors for an ultra-bold 3px border effect
   */
  const getOutlinedTextStyle = (outlineColor: string) => ({
    textShadow: `
      3px 3px 0 ${outlineColor},
      -3px -3px 0 ${outlineColor},
      3px -3px 0 ${outlineColor},
      -3px 3px 0 ${outlineColor},
      3px 0 0 ${outlineColor},
      -3px 0 0 ${outlineColor},
      0 3px 0 ${outlineColor},
      0 -3px 0 ${outlineColor},
      1.5px 1.5px 0 ${outlineColor},
      -1.5px -1.5px 0 ${outlineColor},
      1.5px -1.5px 0 ${outlineColor},
      -1.5px 1.5px 0 ${outlineColor},
      1.5px 0 0 ${outlineColor},
      -1.5px 0 0 ${outlineColor},
      0 1.5px 0 ${outlineColor},
      0 -1.5px 0 ${outlineColor}
    `
  });

  const renderHomeDashboard = () => {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
    const isMentor = user.role === UserRole.MENTOR;
    const isOrg = user.role === UserRole.ORGANIZATION;
    const isParent = user.role === UserRole.PARENT;
    const isStudent = user.role === UserRole.STUDENT;
    
    const canManageGroup = isAdmin || isMentor || isOrg;

    return (
      <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          {/* Welcome Header */}
          <div className="bg-white p-4 md:p-10 rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-royal-50/20 to-transparent pointer-events-none"></div>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10 text-center md:text-left">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] bg-royal-900 flex items-center justify-center text-gold-400 font-serif font-black text-2xl md:text-4xl shadow-2xl ring-4 md:ring-8 ring-royal-50">
                      {user.name.charAt(0)}
                  </div>
                  <div>
                      <h1 className="text-xl md:text-4xl font-serif font-black text-gray-900 tracking-tight leading-none">
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
                      <Activity size={16} /> ANALYTICS
                  </button>
              </div>
          </div>

          {/* MATURE ACTION CONSOLES - STACKED VERTICALLY */}
          <div className="flex flex-col gap-6 md:gap-12">
              
              {/* PERSONAL CONSOLE */}
              <div className="bg-gradient-to-br from-indigo-700 via-royal-800 to-royal-900 rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-12 shadow-2xl relative group overflow-hidden border-b-8 border-indigo-950 w-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  
                  <div className="flex flex-col mb-6 md:mb-10 relative z-10 gap-0">
                      <div className="flex items-center gap-4 md:gap-6">
                          {/* Corrected vertical alignment for the icon to match the text baseline/center */}
                          <div className="p-3 md:p-5 bg-white/10 text-white rounded-2xl md:rounded-[1.5rem] border border-white/20 shadow-lg backdrop-blur-md relative -top-1 md:-top-3">
                            <UserCircle size={24} className="md:w-10 md:h-10"/>
                          </div>
                          <h3 className="font-serif font-black text-white uppercase text-lg md:text-4xl tracking-[0.1em] md:tracking-[0.2em] drop-shadow-lg">Personal Console</h3>
                      </div>
                      <p className="text-indigo-50 text-[11px] md:text-base font-medium max-w-3xl leading-relaxed animate-in fade-in slide-in-from-left duration-1000 delay-300 -mt-1 md:-mt-2 ml-1">
                        Your private sanctuary for spiritual and leadership growth—track your progress, master new lessons, and manage your personal achievements.
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 relative z-10">
                      <button onClick={() => setInternalView('lessons')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 md:p-6 bg-white/95 text-indigo-950 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-xl text-center min-h-[120px] md:min-h-[140px]">
                          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-colors shrink-0">
                            <Play size={20} className="md:w-8 h-8" fill="currentColor"/>
                          </div>
                          <span className="font-black text-[9px] md:text-sm uppercase tracking-widest leading-tight">Take Lessons</span>
                      </button>
                      
                      {(isAdmin || isMentor || isOrg) && (
                        <button onClick={() => setInternalView('upload')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 md:p-6 bg-white/95 text-emerald-950 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-xl text-center min-h-[120px] md:min-h-[140px]">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-colors shrink-0">
                              <Upload size={20} className="md:w-8 h-8"/>
                            </div>
                            <span className="font-black text-[9px] md:text-sm uppercase tracking-widest leading-tight">Upload Content</span>
                        </button>
                      )}

                      <button onClick={() => setInternalView('performance-report')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 md:p-6 bg-white/95 text-royal-950 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-xl text-center min-h-[120px] md:min-h-[140px]">
                          <div className="p-3 bg-royal-100 text-royal-600 rounded-xl shadow-inner group-hover/btn:bg-royal-500 group-hover/btn:text-white transition-colors shrink-0">
                            <Trophy size={20} className="md:w-8 h-8"/>
                          </div>
                          <span className="font-black text-[9px] md:text-sm uppercase tracking-widest leading-tight">Performance</span>
                      </button>

                      <button onClick={() => setInternalView('curated')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 md:p-6 bg-white/95 text-purple-950 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-xl text-center min-h-[120px] md:min-h-[140px]">
                          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shadow-inner group-hover/btn:bg-purple-500 group-hover/btn:text-white transition-colors shrink-0">
                            <Bookmark size={20} className="md:w-8 h-8" fill="currentColor"/>
                          </div>
                          <span className="font-black text-[9px] md:text-sm uppercase tracking-widest leading-tight">My List</span>
                      </button>

                      <button onClick={() => setInternalView('certificates')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 md:p-6 bg-white/95 text-gold-950 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-xl text-center min-h-[120px] md:min-h-[140px]">
                          <div className="p-3 bg-gold-100 text-gold-600 rounded-xl shadow-inner group-hover/btn:bg-gold-500 group-hover/btn:text-white transition-colors shrink-0">
                            <BadgeCheck size={20} className="md:w-8 h-8"/>
                          </div>
                          <span className="font-black text-[9px] md:text-sm uppercase tracking-widest leading-tight">My Certificates</span>
                      </button>
                  </div>
              </div>

              {/* ROLE-AWARE SECOND CONSOLE (Hidden for Students) */}
              {!isStudent && (
                <div className={`bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-12 border-t-8 ${isParent ? 'border-indigo-400' : 'border-gold-500'} shadow-2xl relative overflow-hidden group w-full`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"></div>
                    
                    <div className="flex flex-col mb-6 md:mb-10 relative z-10 gap-0">
                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Corrected vertical alignment for the icon to match the text baseline/center */}
                            <div className="p-3 md:p-5 bg-white/5 text-gold-400 rounded-2xl md:rounded-[1.5rem] border border-white/10 shadow-lg backdrop-blur-md relative -top-1 md:-top-3">
                              {isParent ? <Heart size={24} className="text-rose-400 md:w-10 h-10"/> : <Users size={24} className="md:w-10 h-10"/>}
                            </div>
                            <h3 className="font-serif font-black text-white uppercase text-lg md:text-4xl tracking-[0.1em] md:tracking-[0.2em] drop-shadow-lg">
                                {isParent ? "My Child's Console" : "Group Console"}
                            </h3>
                        </div>
                        <p className="text-amber-50 text-[11px] md:text-base font-medium max-w-3xl leading-relaxed animate-in fade-in slide-in-from-left duration-1000 delay-300 -mt-1 md:-mt-2 ml-1">
                            {isParent 
                                ? "Nurture their journey in the Word—a curated oversight of your child's lessons, activity logs, and earned credentials."
                                : "The command center for community leadership—oversee your team, manage member requests, and analyze collective growth."
                            }
                        </p>
                    </div>

                    {isParent ? (
                        /* PARENT CONSOLE BUTTONS */
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6 relative z-10">
                            <button onClick={() => setInternalView('performance-report')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-royal-500/20 text-royal-400 rounded-2xl group-hover/btn:bg-royal-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <BarChart3 size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#1e1b4b')}>Performance</span>
                            </button>
                            <button onClick={() => setInternalView('lessons')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <LayoutGrid size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#312e81')}>Lessons List</span>
                            </button>
                            <button onClick={() => setInternalView('logs')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-slate-500/20 text-slate-400 rounded-2xl group-hover/btn:bg-slate-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <History size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#0f172a')}>Audit Logs</span>
                            </button>
                            <button onClick={() => setInternalView('certificates')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-gold-500/20 text-gold-400 rounded-2xl group-hover/btn:bg-gold-500 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <Award size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#92400e')}>Certificates</span>
                            </button>
                        </div>
                    ) : (
                        /* STAFF/GROUP CONSOLE BUTTONS */
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 relative z-10">
                            {(isAdmin || isMentor || isOrg) && (
                                <button onClick={() => setInternalView('requests')} className="group/btn flex flex-col items-center justify-center gap-4 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl group-hover/btn:bg-amber-500 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                        <UserPlus size={20} className="md:w-7 h-7"/>
                                    </div>
                                    <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#78350f')}>Requests</span>
                                </button>
                            )}
                            
                            <button onClick={() => setInternalView('users')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-royal-500/20 text-royal-400 rounded-2xl group-hover/btn:bg-royal-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <Users size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#1e1b4b')}>Users</span>
                            </button>

                            <button onClick={() => setInternalView('invites')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <Mail size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#1e3a8a')}>Invites</span>
                            </button>

                            <button onClick={() => setInternalView('performance-report')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-gold-500/20 text-gold-400 rounded-2xl group-hover/btn:bg-gold-500 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <BarChart3 size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#92400e')}>Analytics</span>
                            </button>

                            <button onClick={() => setInternalView('lessons')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                    <LayoutGrid size={20} className="md:w-7 h-7"/>
                                </div>
                                <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#581c87')}>Curriculum</span>
                            </button>

                            {(isAdmin || isMentor || isOrg) && (
                                <button onClick={() => setInternalView('logs')} className="group/btn flex flex-col items-center justify-center gap-3 p-3 bg-royal-800/40 text-white rounded-2xl md:rounded-[2rem] hover:bg-royal-700/60 transition-all duration-300 shadow-xl border border-white/10 text-center min-h-[110px] md:min-h-[130px]">
                                    <div className="p-3 bg-slate-500/20 text-slate-400 rounded-2xl group-hover/btn:bg-slate-600 group-hover/btn:text-white transition-all shrink-0 shadow-lg">
                                        <History size={20} className="md:w-7 h-7"/>
                                    </div>
                                    <span className="text-white font-black text-[8px] md:text-[11px] leading-tight tracking-widest uppercase" style={getOutlinedTextStyle('#0f172a')}>Audit Logs</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
              )}
          </div>

          {/* LOWER CONTENT GRID - STATS AND COMMS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
              <div className="lg:col-span-2 space-y-6 md:space-y-12">
                  {/* Mastery Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10">
                      <StatCard title="Overall Mastery" value="84%" subtitle="+5% this week" icon={Trophy} color="gold" type="ring" progress={84} />
                      <StatCard title="Course Velocity" value="12" subtitle="3 pending modules" icon={CheckCircle} color="green" type="ring" progress={65} />
                  </div>
                  
                  {/* Learning Path */}
                  <div className="p-6 md:p-12 bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex flex-col sm:flex-row items-center gap-6 md:gap-8 group">
                      <div className="p-4 md:p-6 bg-royal-50 rounded-[1.5rem] md:rounded-[2rem] text-royal-600 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                          <Globe size={32} className="md:w-10 h-10"/>
                      </div>
                      <div className="text-center sm:text-left">
                          <h4 className="font-serif font-black text-gray-900 text-lg md:text-2xl uppercase tracking-tight">Active Learning Path</h4>
                          <p className="text-xs md:text-lg text-gray-500 font-medium mt-1">Continue from where you left off in your biblical leadership journey.</p>
                      </div>
                  </div>
              </div>

              {/* Sidebars - Comms Hub Only */}
              <div className="space-y-6 md:space-y-12">
                  <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-2 border-gray-50 shadow-xl">
                      <h3 className="font-serif font-black text-gray-900 text-[10px] md:text-sm uppercase tracking-[0.2em] mb-6 md:mb-8 flex items-center gap-4">
                        <MessageSquare size={18} className="text-royal-600" /> Recent Intel
                      </h3>
                      <div className="space-y-6 md:space-y-8">
                          {recentChats.map(m => (
                              <div key={m.id} className="flex gap-4 md:gap-6 group cursor-pointer" onClick={() => setInternalView('chat')}>
                                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-royal-50 flex items-center justify-center font-black text-sm md:text-2xl text-royal-700 border-2 border-transparent group-hover:border-royal-500 transition-all shrink-0 shadow-inner">
                                    {m.senderName.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                      <p className="text-[10px] md:text-sm font-black text-gray-900 truncate uppercase tracking-tight">{m.senderName}</p>
                                      <p className="text-[9px] md:text-sm text-gray-500 truncate mt-1 font-medium leading-relaxed">{m.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setInternalView('chat')} className="w-full mt-6 md:mt-10 py-3 md:py-5 bg-royal-900 text-white text-[9px] md:text-[10px] font-black rounded-xl md:rounded-[1.5rem] hover:bg-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-royal-900/20 transform hover:-translate-y-1 active:scale-95">Open Comms Hub</button>
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
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-8 relative">
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
