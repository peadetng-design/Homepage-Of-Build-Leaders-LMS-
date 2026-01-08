
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

// Fix: Defined the DashboardView type
export type DashboardView = 
  | 'dashboard' | 'home' | 'resources' | 'news' | 'chat' | 'certificates' 
  | 'lessons' | 'progress' | 'group' | 'assignments' | 'admin' | 'users' 
  | 'org-panel' | 'staff' | 'child-progress' | 'settings';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onChangePasswordClick?: () => void;
  initialView?: DashboardView;
}

// Color mapping
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
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
      <Tooltip content={`View detailed analytics for ${title}`}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-6 cursor-default">
          <CircularProgress percentage={progress || 0} color={color} size={70} icon={Icon} />
          <div>
            <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className={`text-xs font-bold mt-1 ${colors.text}`}>{subtitle}</div>
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={`Overview statistic for ${title}`}>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group cursor-default">
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
    </Tooltip>
  );
};

const DailyVerseCard = ({ verse, loading }: any) => (
  <div className="bg-gradient-to-br from-royal-900 to-royal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
    <div className="absolute top-0 right-0 opacity-10"><BookOpen size={100} /></div>
    <h3 className="text-indigo-200 font-bold uppercase text-xs tracking-widest mb-4">Verse of the Day</h3>
    {loading ? (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
        <div className="h-4 bg-white/20 rounded w-1/2"></div>
      </div>
    ) : (
      <>
        <p className="text-xl md:text-2xl font-serif leading-relaxed mb-4">"{verse?.verse}"</p>
        <div className="flex justify-between items-end">
          <span className="text-gold-400 font-bold">{verse?.reference}</span>
          <span className="text-xs text-indigo-200 italic max-w-[60%] text-right">{verse?.reflection}</span>
        </div>
      </>
    )}
  </div>
);

const AIQuizCard = ({ question, state, onAnswer }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
     <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold bg-gold-100 text-gold-700 px-2 py-1 rounded-full uppercase">Quick Quiz</span>
        <span className="text-xs text-gray-400">AI Generated</span>
     </div>
     {!question ? (
        <div className="text-center py-8 text-gray-400">Loading challenge...</div>
     ) : (
        <>
           <h4 className="font-bold text-gray-800 mb-4">{question.question}</h4>
           <div className="space-y-2">
              {question.options?.map((opt: string, i: number) => (
                 <button 
                   key={i}
                   disabled={state !== 'idle'}
                   onClick={() => onAnswer(opt)}
                   className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all
                     ${state === 'idle' 
                        ? 'bg-gray-50 hover:bg-royal-50 hover:text-royal-800' 
                        : state === 'correct' && opt === question.answer 
                           ? 'bg-green-100 text-green-700 border border-green-200'
                           : state === 'incorrect' && opt === question.answer
                              ? 'bg-green-100 text-green-700' 
                              : 'opacity-50'
                     }
                   `}
                 >
                   {opt}
                 </button>
              ))}
           </div>
           {state !== 'idle' && (
              <div className={`mt-4 text-center text-sm font-bold ${state === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                 {state === 'correct' ? 'Correct! Well done.' : 'Keep studying!'}
              </div>
           )}
        </>
     )}
  </div>
);

const RecentChatsWidget = ({ messages, onGoToChat }: { messages: ChatMessage[], onGoToChat: () => void }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} className="text-royal-600" /> Recent Activity
            </h3>
            <button onClick={onGoToChat} className="text-royal-600 text-[10px] font-black hover:underline">View All</button>
        </div>
        <div className="space-y-4">
            {messages.length === 0 ? (
                <p className="text-center py-4 text-xs text-gray-400 italic">No recent messages.</p>
            ) : (
                messages.map(m => (
                    <div key={m.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0">
                            {m.senderName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-900 text-xs truncate">{m.senderName}</span>
                                <span className="text-[9px] text-gray-400">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{m.text}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// Fix: Completed the Dashboard component implementation and added default export
const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView = 'dashboard' }) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [verse, setVerse] = useState<any>(null);
  const [quizQuestion, setQuizQuestion] = useState<any>(null);
  const [quizState, setQuizState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [recentChats, setRecentChats] = useState<ChatMessage[]>([]);
  const [loadingVerse, setLoadingVerse] = useState(true);

  useEffect(() => {
    getDailyVerse().then(setVerse).finally(() => setLoadingVerse(false));
    getAIQuizQuestion().then(setQuizQuestion);
    authService.getRecentMessages(user, 3).then(setRecentChats);
  }, [user]);

  const handleQuizAnswer = (answer: string) => {
    if (quizState !== 'idle') return;
    if (answer === quizQuestion.answer) {
      setQuizState('correct');
    } else {
      setQuizState('incorrect');
    }
  };

  if (selectedLessonId) {
    const lesson = lessonService.getLessons().then(res => res.find(l => l.id === selectedLessonId));
    // Ideally we'd await here or use a better loader, but for simplicity:
    return (
      <div className="animate-in fade-in duration-300">
         <LessonViewWrapper lessonId={selectedLessonId} user={user} onBack={() => setSelectedLessonId(null)} />
      </div>
    );
  }

  const renderHomeDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-8">
                <DailyVerseCard verse={verse} loading={loadingVerse} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Overall Mastery" value="84%" subtitle="+5% this week" icon={Trophy} color="gold" type="ring" progress={84} />
                    <StatCard title="Lessons Complete" value="12" subtitle="3 pending" icon={CheckCircle} color="green" type="ring" progress={65} />
                </div>
            </div>
            <div className="lg:w-1/3 space-y-6">
                <AIQuizCard question={quizQuestion} state={quizState} onAnswer={handleQuizAnswer} />
                <RecentChatsWidget messages={recentChats} onGoToChat={() => {}} />
            </div>
        </div>
    </div>
  );

  const renderView = () => {
    switch (initialView) {
      case 'admin':
      case 'users':
        return <AdminPanel currentUser={user} activeTab={initialView === 'users' ? 'users' : 'logs'} />;
      case 'org-panel':
      case 'staff':
        return <OrganizationPanel currentUser={user} />;
      case 'lessons':
      case 'progress':
        return user.role === UserRole.STUDENT 
          ? <StudentPanel currentUser={user} activeTab={initialView === 'lessons' ? 'lessons' : 'browse'} onTakeLesson={setSelectedLessonId} />
          : <AdminPanel currentUser={user} activeTab="lessons" />;
      case 'group':
      case 'assignments':
        return <AdminPanel currentUser={user} activeTab={initialView === 'group' ? 'requests' : 'lessons'} />;
      case 'resources':
        return <ResourceView />;
      case 'news':
        return <NewsView />;
      case 'chat':
        return <ChatPanel currentUser={user} />;
      case 'certificates':
        return <CertificatesPanel currentUser={user} />;
      case 'settings':
        return (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-serif font-bold mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <button onClick={onChangePasswordClick} className="px-6 py-2 bg-royal-800 text-white font-bold rounded-lg">Change Password</button>
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
