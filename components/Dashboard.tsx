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
  ArrowLeft, Settings, Globe, ClipboardList
} from 'lucide-react';

export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' 
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings' | 'upload' | 'performance-report';

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

  const renderHomeDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-royal-100 flex items-center justify-center text-royal-700 font-bold text-2xl shadow-inner">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Hello, <span className="text-royal-500">{user.name}</span></h1>
                    <p className="text-gray-500 mt-1 max-w-md line-clamp-1">{loadingVerse ? "Loading daily inspiration..." : `"${verse?.verse}"`}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <button onClick={() => setInternalView('upload')} className="flex items-center gap-2 px-5 py-3 bg-royal-800 text-white rounded-xl font-bold hover:bg-royal-900 shadow-lg shadow-royal-900/20 transition-all transform hover:-translate-y-0.5">
                    <Upload size={18} /> <span>UPLOAD CONTENT</span>
                </button>
                <button onClick={() => setInternalView('lessons')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all transform hover:-translate-y-0.5">
                    <Play size={18} fill="currentColor" /> <span>TAKE LESSONS</span>
                </button>
                <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-5 py-3 bg-gold-500 text-white rounded-xl font-bold hover:bg-gold-600 shadow-lg transition-all transform hover:-translate-y-0.5">
                    <Printer size={18} /> <span>PRINT / EXPORT</span>
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-8">
                <div className="bg-gradient-to-br from-royal-900 to-royal-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10"><BookOpen size={150} /></div>
                    <h3 className="text-indigo-200 font-bold uppercase text-xs tracking-widest mb-4">Verse of the Day</h3>
                    <p className="text-2xl md:text-3xl font-serif leading-relaxed mb-4">"{verse?.verse}"</p>
                    <div className="flex justify-between items-end">
                        <span className="text-gold-400 font-bold text-lg">{verse?.reference}</span>
                        <span className="text-sm text-indigo-200 italic max-w-[60%] text-right">{verse?.reflection}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Overall Mastery" value="84%" subtitle="+5% this week" icon={Trophy} color="gold" type="ring" progress={84} />
                    <StatCard title="Lessons Complete" value="12" subtitle="3 pending" icon={CheckCircle} color="green" type="ring" progress={65} />
                </div>
            </div>
            <div className="lg:w-1/3 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-xs font-bold bg-gold-100 text-gold-700 px-2 py-1 rounded-full uppercase">Quick Quiz</span>
                        <span className="text-xs text-gray-400">AI Generated</span>
                    </div>
                    {quizQuestion && (
                        <>
                            <h4 className="font-bold text-gray-800 mb-4">{quizQuestion.question}</h4>
                            <div className="space-y-2">
                                {quizQuestion.options?.map((opt: any, i: number) => (
                                    <button key={i} disabled={quizState !== 'idle'} onClick={() => handleQuizAnswer(opt)} className={`w-full text-left p-4 rounded-xl text-sm font-medium transition-all ${quizState === 'idle' ? 'bg-gray-50 hover:bg-royal-50' : opt === quizQuestion.answer ? 'bg-green-100 text-green-700 border-green-200' : 'opacity-50'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-royal-600" /> Recent Chats</h3>
                    <div className="space-y-4">
                        {recentChats.map(m => (
                            <div key={m.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-royal-600">{m.senderName.charAt(0)}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-900 truncate">{m.senderName}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{m.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />
    </div>
  );

  const renderView = () => {
    if (selectedLessonId) return <LessonViewWrapper lessonId={selectedLessonId} user={user} onBack={() => setSelectedLessonId(null)} />;

    switch (internalView) {
      case 'upload':
        return <LessonUpload currentUser={user} onSuccess={() => setInternalView('lessons')} onCancel={() => setInternalView('dashboard')} />;
      case 'admin':
      case 'users':
        return <AdminPanel currentUser={user} activeTab={internalView === 'users' ? 'users' : 'logs'} />;
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
        return <AdminPanel currentUser={user} activeTab={internalView === 'group' ? 'requests' : 'lessons'} />;
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
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif font-bold mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <button onClick={onChangePasswordClick} className="w-full py-4 bg-royal-800 text-white font-bold rounded-xl shadow-lg">Change Password</button>
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
  
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-royal-600" /></div>;
  return <LessonView lesson={lesson} currentUser={user} onBack={onBack} />;
};

export default Dashboard;