
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
  ArrowLeft, Settings, Globe, ClipboardList, Shield, Key, History
} from 'lucide-react';

export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' 
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings' | 'upload' | 'performance-report' | 'requests' | 'logs';

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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
        <CircularProgress percentage={progress || 0} color={color} size={70} icon={Icon} />
        <div>
          <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className={`text-xs font-bold mt-1 ${colors.text}`}>{subtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
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

  const renderHomeDashboard = () => {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
    const isMentor = user.role === UserRole.MENTOR;
    const isOrg = user.role === UserRole.ORGANIZATION;
    const isParent = user.role === UserRole.PARENT;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-royal-50 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50"></div>
              <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-royal-600 to-indigo-800 flex items-center justify-center text-white font-black text-3xl shadow-2xl border-4 border-white">
                      {user.name.charAt(0)}
                  </div>
                  <div>
                      <div className="flex items-center gap-3">
                          <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 leading-none">Welcome, <span className="text-royal-600">{user.name.split(' ')[0]}</span></h1>
                          <span className="px-3 py-1 bg-royal-50 text-royal-700 text-[10px] font-black rounded-full border border-royal-100 uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
                      </div>
                      <p className="text-gray-500 mt-2 max-w-md line-clamp-1 italic font-medium">{loadingVerse ? "Loading daily inspiration..." : `"${verse?.verse}"`}</p>
                  </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full xl:w-auto relative z-10">
                  <button onClick={() => setInternalView('performance-report')} className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 border-indigo-900">
                      <BarChart3 size={18} /> <span>PERFORMANCE REPORT</span>
                  </button>
                  {isAdmin && (
                    <button onClick={() => setInternalView('users')} className="flex items-center gap-2 px-6 py-4 bg-royal-800 text-white rounded-2xl font-black hover:bg-royal-950 shadow-lg shadow-royal-800/20 transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 border-royal-950">
                        <Users size={18} /> <span>MANAGE USERS</span>
                    </button>
                  )}
                  {isMentor && (
                    <button onClick={() => setInternalView('group')} className="flex items-center gap-2 px-6 py-4 bg-royal-800 text-white rounded-2xl font-black hover:bg-royal-950 shadow-lg shadow-royal-800/20 transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 border-royal-950">
                        <Users size={18} /> <span>MY GROUP</span>
                    </button>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => setInternalView('lessons')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 text-left group">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Play size={24} fill="currentColor"/></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</p><h4 className="font-black text-gray-900">Take Lessons</h4></div>
              </button>
              {(isAdmin || isMentor || isOrg) && (
                <button onClick={() => setInternalView('upload')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 text-left group">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Upload size={24}/></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Management</p><h4 className="font-black text-gray-900">Upload Content</h4></div>
                </button>
              )}
              {(isAdmin || isMentor) && (
                <button onClick={() => setInternalView('requests')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 text-left group">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><UserPlus size={24}/></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</p><h4 className="font-black text-gray-900">Pending Requests</h4></div>
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setInternalView('logs')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 text-left group">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><History size={24}/></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security</p><h4 className="font-black text-gray-900">Audit Logs</h4></div>
                </button>
              )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3 space-y-8">
                  <div className="bg-gradient-to-br from-royal-950 to-royal-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-b-8 border-gold-500">
                      <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 pointer-events-none"><BookOpen size={300} /></div>
                      <h3 className="text-gold-400 font-black uppercase text-xs tracking-[0.4em] mb-6">Verse of the Day</h3>
                      <p className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-8">"{verse?.verse}"</p>
                      <div className="flex justify-between items-end border-t border-white/10 pt-8">
                          <div>
                              <span className="text-gold-400 font-black text-xl tracking-tighter uppercase">{verse?.reference}</span>
                              <div className="h-1 w-12 bg-gold-500 mt-1 rounded-full"></div>
                          </div>
                          <span className="text-sm text-indigo-200 italic max-w-[60%] text-right leading-relaxed font-medium">"{verse?.reflection}"</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <StatCard title="Overall Mastery" value="84%" subtitle="+5% this week" icon={Trophy} color="gold" type="ring" progress={84} />
                      <StatCard title="Lessons Complete" value="12" subtitle="3 pending" icon={CheckCircle} color="green" type="ring" progress={65} />
                  </div>
              </div>
              <div className="lg:w-1/3 space-y-8">
                  <div className="bg-white rounded-[2rem] p-8 border-2 border-gray-50 shadow-xl">
                      <div className="flex justify-between items-start mb-8">
                          <div className="p-2 bg-gold-100 rounded-lg"><Star size={20} className="text-gold-600" fill="currentColor"/></div>
                          <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase">AI Study Hub</span>
                      </div>
                      {quizQuestion && (
                          <div className="space-y-6">
                              <h4 className="font-black text-gray-900 text-xl leading-snug">{quizQuestion.question}</h4>
                              <div className="space-y-2">
                                  {quizQuestion.options?.map((opt: any, i: number) => (
                                      <button key={i} disabled={quizState !== 'idle'} onClick={() => handleQuizAnswer(opt)} className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all border-2 ${quizState === 'idle' ? 'bg-gray-50 border-transparent hover:border-royal-300 hover:bg-white' : opt === quizQuestion.answer ? 'bg-green-50 border-green-500 text-green-700' : 'opacity-40 border-transparent'}`}>
                                          {opt}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="bg-white rounded-[2rem] p-8 border-2 border-gray-50 shadow-xl">
                      <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><MessageSquare size={18} className="text-royal-600" /> RECENT TEAM INTEL</h3>
                      <div className="space-y-6">
                          {recentChats.map(m => (
                              <div key={m.id} className="flex gap-4 group cursor-pointer" onClick={() => setInternalView('chat')}>
                                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-sm text-royal-600 border-2 border-transparent group-hover:border-royal-500 transition-all">{m.senderName.charAt(0)}</div>
                                  <div className="min-w-0 flex-1">
                                      <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{m.senderName}</p>
                                      <p className="text-xs text-gray-500 truncate mt-0.5 leading-relaxed">{m.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setInternalView('chat')} className="w-full mt-8 py-3 bg-royal-50 text-royal-800 text-xs font-black rounded-xl hover:bg-royal-100 uppercase tracking-widest transition-all">Open Comms Hub</button>
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
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-gray-50 max-w-2xl mx-auto">
            <h2 className="text-3xl font-serif font-black mb-8 border-b-4 border-royal-50 pb-4">Profile Settings</h2>
            <div className="space-y-6">
                <div className="p-6 bg-royal-50 rounded-2xl border-2 border-royal-100">
                    <p className="text-xs font-black text-royal-800 uppercase tracking-widest mb-1">Security</p>
                    <p className="text-sm text-royal-600 mb-4">Manage your credentials and access tokens.</p>
                    <button onClick={onChangePasswordClick} className="w-full py-4 bg-royal-800 text-white font-black rounded-xl shadow-lg shadow-royal-900/20 hover:bg-royal-950 transition-all flex items-center justify-center gap-2 border-b-4 border-royal-950">
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
    <div className="max-w-7xl mx-auto space-y-8 relative">
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
