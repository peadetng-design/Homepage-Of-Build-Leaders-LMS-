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
import CertificatesPanel from './CertificatesPanel'; 
import {
  BookOpen, Trophy, Activity, CheckCircle, 
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star, UserPlus, List, BarChart3, MessageSquare, Hash, ArrowRight, UserCircle, Camera, Save, Loader2,
  ArrowLeft, Settings, Globe, ClipboardList
} from 'lucide-react';

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
              {question.options.map((opt: string, i: number) => (
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
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-royal-500" /> New Chats
            </h3>
            <button onClick={onGoToChat} className="text-xs font-bold text-royal-600 hover:underline">View All</button>
        </div>
        <div className="space-y-4">
            {messages.length === 0 ? (
                <div className="py-4 text-center text-gray-400 text-sm italic">No recent messages.</div>
            ) : (
                messages.map(msg => (
                    <div key={msg.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-royal-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <Hash size={12} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate">Global Collective</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-royal-600 font-bold text-xs shrink-0 border border-gray-100">
                                {msg.senderName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-gray-900 leading-none">{msg.senderName}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
        <button 
            onClick={onGoToChat}
            className="w-full mt-6 py-2.5 bg-royal-50 text-royal-700 font-bold rounded-xl text-xs hover:bg-royal-100 transition-colors flex items-center justify-center gap-2"
        >
            Open Messaging Hub <ArrowRight size={14} />
        </button>
    </div>
);

// VIEW STATE ENUM
type DashboardView = 'dashboard' | 'lesson-browser' | 'lesson-view' | 'upload' | 'parent-onboarding' | 'manage-lessons' | 'manage-users' | 'resources' | 'news' | 'performance-report' | 'chat' | 'certificates' | 'settings' | 'view-logs';

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onChangePasswordClick, initialView }) => {
  const [currentView, setCurrentView] = useState<DashboardView>(
      (initialView === 'resources' || initialView === 'news' || initialView === 'chat' || initialView === 'certificates' || initialView === 'settings') ? initialView : 'dashboard'
  );
  
  const [dailyVerse, setDailyVerse] = useState<{ verse: string; reference: string; reflection: string } | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [quizQuestion, setQuizQuestion] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showExportModal, setShowExportModal] = useState(false);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  
  // Profile Customization State
  const [profileName, setProfileName] = useState(user.name);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // View State
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated'>('users');
  const [mentorActiveTab, setMentorActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated'>('lessons');
  const [studentActiveTab, setStudentActiveTab] = useState<'join' | 'browse' | 'lessons'>('lessons');
  const [orgSubTab, setOrgSubTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated'>('users');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null); 
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const isAdminView = user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
  const isMentorView = user.role === UserRole.MENTOR;
  const isStudentView = user.role === UserRole.STUDENT;
  const isParentView = user.role === UserRole.PARENT;
  const isOrgView = user.role === UserRole.ORGANIZATION;

  useEffect(() => {
    if (isParentView && !user.linkedStudentId && currentView !== 'parent-onboarding') {
       setCurrentView('parent-onboarding');
    }

    const fetchContent = async () => {
      try {
        const verse = await getDailyVerse();
        setDailyVerse(verse);
        const quiz = await getAIQuizQuestion();
        setQuizQuestion(quiz);
        const msgs = await authService.getRecentMessages(user, 2);
        setRecentMessages(msgs);
      } finally {
        setLoadingVerse(false);
      }
    };
    fetchContent();
  }, [isParentView, user.linkedStudentId, user.role]);

  const handleQuizAnswer = (option: string) => {
    if (!quizQuestion) return;
    setQuizState(option === quizQuestion.answer ? 'correct' : 'incorrect');
  };

  const startLesson = async (lessonId: string) => {
     try {
        const lesson = await lessonService.getLessonById(lessonId);
        if(lesson) {
            setActiveLesson(lesson);
            setCurrentView('lesson-view');
        }
     } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUpdatingProfile(true);
      setProfileSuccess(false);
      try {
          const updated = await authService.updateProfile(user.id, { name: profileName });
          onUpdateUser(updated);
          setProfileSuccess(true);
          setTimeout(() => setProfileSuccess(false), 3000);
      } catch (e) {
          alert("Failed to update profile");
      } finally {
          setIsUpdatingProfile(false);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              if (ev.target?.result) {
                  const updated = await authService.updateProfile(user.id, { avatarUrl: ev.target.result as string });
                  onUpdateUser(updated);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleManageLessons = () => {
    if (isOrgView) {
        setOrgSubTab('lessons');
        setCurrentView('manage-lessons');
    } else if (isStudentView) {
        setCurrentView('manage-lessons');
        setAdminActiveTab('lessons'); // Reuses AdminPanel for curation
    } else {
        setCurrentView('dashboard');
        if (isAdminView) setAdminActiveTab('lessons');
        if (isMentorView) setMentorActiveTab('lessons');
    }
  };

  const handleViewCuratedLessons = () => {
    if (isOrgView) {
        setOrgSubTab('curated'); 
        setCurrentView('manage-lessons');
    } else {
        setCurrentView('dashboard');
        if (isMentorView) setMentorActiveTab('curated');
    }
  };

  const handleManageUsers = () => {
      if (isOrgView) {
          setOrgSubTab('users'); 
          setCurrentView('manage-users');
      }
      if (isMentorView) setMentorActiveTab('users');
  };

  const handleViewLogs = () => {
      setCurrentView('view-logs');
      if (isAdminView) setAdminActiveTab('logs');
      if (isMentorView) setMentorActiveTab('logs');
      if (isOrgView) setOrgSubTab('logs');
  };

  if (currentView === 'settings') {
      return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-royal-900 p-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-royal-800 flex items-center justify-center">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={80} className="text-white/20" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-gold-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-gold-600 transition-colors">
                                <Camera size={20} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-bold">{user.name}</h2>
                            <p className="text-royal-200 mt-1 uppercase tracking-widest font-bold text-xs">{user.role} Profile</p>
                        </div>
                    </div>
                </div>

                <div className="p-12">
                    <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-lg">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Public Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Display Name</label>
                                    <input 
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-royal-500 outline-none transition-all font-bold text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Address (Read Only)</label>
                                    <input 
                                        readOnly
                                        value={user.email}
                                        className="w-full p-4 bg-gray-100 border-2 border-gray-100 rounded-2xl text-gray-400 font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {profileSuccess && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 font-bold animate-in slide-in-from-top-2">
                                <CheckCircle size={20} /> Profile Updated Successfully!
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="flex-1 bg-royal-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-royal-900/20 hover:bg-royal-900 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                {isUpdatingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Profile Changes
                            </button>
                            {onChangePasswordClick && (
                                <button 
                                    type="button" 
                                    onClick={onChangePasswordClick}
                                    className="px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Security Settings
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <button onClick={() => setCurrentView('dashboard')} className="mt-8 text-gray-400 font-bold hover:text-royal-600 transition-colors flex items-center gap-2 mx-auto">
                <ArrowLeft size={18} /> Back to Dashboard
            </button>
        </div>
      );
  }

  if (currentView === 'certificates') {
      return (
          <div className="animate-in fade-in duration-300 p-4 md:p-8">
              <CertificatesPanel currentUser={user} onBack={() => setCurrentView('dashboard')} />
          </div>
      );
  }

  if (currentView === 'chat') {
      return (
          <div className="animate-in fade-in duration-300">
              <ChatPanel currentUser={user} />
          </div>
      );
  }

  if (currentView === 'performance-report') {
      return <PerformanceReport currentUser={user} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'resources') return <div className="p-4 md:p-8 animate-in fade-in duration-300"><ResourceView /></div>;
  if (currentView === 'news') return <div className="p-4 md:p-8 animate-in fade-in duration-300"><NewsView /></div>;

  if (currentView === 'lesson-view' && activeLesson) {
    return (
      <LessonView 
        lesson={activeLesson} 
        currentUser={user} 
        onBack={() => {
            setActiveLesson(null);
            setCurrentView('dashboard');
        }} 
      />
    );
  }

  if (currentView === 'lesson-browser') {
    return (
      <LessonBrowser 
        currentUser={user}
        onLessonSelect={(id) => { startLesson(id); }}
        onClose={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'upload') {
      return (
        <LessonUpload 
            currentUser={user}
            initialData={editingLesson || undefined}
            onSuccess={() => {
                setEditingLesson(null);
                setCurrentView('dashboard');
                if (isOrgView) {
                    setOrgSubTab('lessons');
                    setCurrentView('manage-lessons'); 
                } else if (isAdminView) {
                    setAdminActiveTab('lessons');
                } else if (isMentorView) {
                    setMentorActiveTab('lessons');
                }
            }}
            onCancel={() => {
                setEditingLesson(null);
                setCurrentView('dashboard');
            }}
        />
      );
  }

  if (currentView === 'parent-onboarding') {
    return (
      <ParentOnboarding 
        user={user} 
        onLinkSuccess={() => { window.location.reload(); }} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header with Title and Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover shadow-md ring-4 ring-royal-50" />
          ) : (
              <div className="w-16 h-16 rounded-2xl bg-royal-100 flex items-center justify-center text-royal-700 font-bold text-2xl shadow-inner">
                  {user.name.charAt(0)}
              </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
                Hello, <span className="text-royal-500">{user.name}</span>
            </h1>
            <p className="text-gray-500 mt-1 max-w-md line-clamp-1">
                {loadingVerse ? "Loading daily inspiration..." : `"${dailyVerse?.verse}"`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
           {!isStudentView && (
              <Tooltip content={isAdminView ? "Upload Lessons, Resources, or News." : "Upload Excel files or use the Manual Builder."}>
                <button 
                  onClick={() => { setEditingLesson(null); setCurrentView('upload'); }}
                  className="flex items-center gap-2 px-5 py-3 bg-royal-800 text-white rounded-xl font-bold hover:bg-royal-900 shadow-lg shadow-royal-900/20 transition-all transform hover:-translate-y-0.5"
                >
                  <Upload size={18} /> 
                  <span>{isAdminView ? 'UPLOAD CONTENT' : 'UPLOAD LESSONS'}</span>
                </button>
              </Tooltip>
           )}

           {isOrgView && (
              <Tooltip content="Manage student enrollment, invite new mentors, and view organization roster.">
                <button 
                  onClick={handleManageUsers}
                  className={`flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 ${currentView === 'manage-users' ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  <UserPlus size={18} /> 
                  <span>MANAGE USERS</span>
                </button>
              </Tooltip>
           )}

           <Tooltip content="Edit, delete, or curate existing lessons in your library.">
                <button 
                  onClick={handleManageLessons}
                  className={`flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 ${currentView === 'manage-lessons' && (isOrgView ? orgSubTab === 'lessons' : true) ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  <Edit3 size={18} /> 
                  <span>MANAGE LESSONS</span>
                </button>
           </Tooltip>

           {(isMentorView || isOrgView) && (
              <Tooltip content="Manage the specific list of lessons visible to your group.">
                <button 
                  onClick={handleViewCuratedLessons}
                  className={`flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all transform hover:-translate-y-0.5 ${((isMentorView && mentorActiveTab === 'curated') || (isOrgView && orgSubTab === 'curated')) ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <List size={18} /> 
                  <span>VIEW CURATED LESSONS</span>
                </button>
              </Tooltip>
           )}

           <Tooltip content="View detailed reports of all your lesson attempts and scores.">
             <button 
                  onClick={() => setCurrentView('performance-report')}
                  className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all transform hover:-translate-y-0.5"
             >
                  <BarChart3 size={18} /> 
                  <span>MY PERFORMANCE SCORES</span>
             </button>
           </Tooltip>

           <Tooltip content="Browse the full lesson library and start interactive study sessions.">
             <button 
                  onClick={() => setCurrentView('lesson-browser')}
                  className="flex items-center gap-2 px-5 py-3 bg-royal-500 text-white rounded-xl font-bold hover:bg-royal-800 shadow-lg shadow-royal-500/30 transition-all transform hover:-translate-y-0.5"
             >
                  <Play size={18} fill="currentColor" /> 
                  <span>TAKE LESSONS</span>
             </button>
           </Tooltip>
           
           <Tooltip content="Download performance reports and unattempted lessons as PDF or Text files.">
             <button 
               onClick={() => setShowExportModal(true)}
               className="flex items-center gap-2 px-5 py-3 bg-gold-500 text-white rounded-xl font-bold hover:bg-gold-600 shadow-lg shadow-gold-500/30 transition-all transform hover:-translate-y-0.5"
             >
                <Printer size={18} /> 
                <span>PRINT / EXPORT</span>
             </button>
           </Tooltip>

           <Tooltip content="View your activity trail and system events.">
             <button 
               onClick={handleViewLogs}
               className={`flex items-center gap-2 px-5 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-700/30 transition-all transform hover:-translate-y-0.5 ${currentView === 'view-logs' ? 'ring-2 ring-slate-400' : ''}`}
             >
                <ClipboardList size={18} /> 
                <span>VIEW LOGS</span>
             </button>
           </Tooltip>

           <Tooltip content="Update your profile and account settings.">
             <button onClick={() => setCurrentView('settings')} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
               <Settings size={20} />
             </button>
           </Tooltip>
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />

      {/* DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               {/* Stats Row */}
               {isAdminView && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Users" value="2,405" subtitle="12% growth" icon={Users} color="blue" />
                    <StatCard title="Active Lessons" value="142" subtitle="5 new this week" icon={BookOpen} color="purple" />
                    <StatCard title="System Health" value="100%" subtitle="All systems operational" icon={Activity} color="green" />
                  </div>
               )}
               {isMentorView && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard type="ring" title="Group Accuracy" value="92%" subtitle="Top 5% Rank" icon={Trophy} color="gold" progress={92} />
                    <StatCard type="ring" title="Completion Rate" value="85%" subtitle="Assignments" icon={CheckCircle} color="green" progress={85} />
                    <StatCard title="My Students" value="24" subtitle="Active Learners" icon={Users} color="indigo" />
                  </div>
               )}
               {isStudentView && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard type="ring" title="Overall Accuracy" value="94%" subtitle="Last 5 Quizzes" icon={CheckCircle} color="green" progress={94} />
                    <StatCard type="ring" title="Course Completion" value="12%" subtitle="Lessons Done" icon={BookOpen} color="blue" progress={12} />
                    <StatCard title="My Points" value="1,250" subtitle="Rank #5" icon={Trophy} color="gold" />
                  </div>
               )}

               {/* Panels */}
               {currentView === 'view-logs' && (
                   <AdminPanel currentUser={user} activeTab="logs" onTabChange={(tab: any) => { if (tab !== 'logs') setCurrentView('dashboard'); }} />
               )}
               {currentView === 'manage-lessons' && (
                   <AdminPanel currentUser={user} activeTab="lessons" onTabChange={(tab: any) => { if (tab !== 'lessons' && tab !== 'upload' && tab !== 'logs') setCurrentView('dashboard'); }} />
               )}
               {isAdminView && currentView !== 'manage-lessons' && currentView !== 'view-logs' && (
                   <AdminPanel currentUser={user} activeTab={adminActiveTab} onTabChange={setAdminActiveTab} />
               )}
               {isMentorView && currentView !== 'manage-lessons' && currentView !== 'view-logs' && (
                   <AdminPanel currentUser={user} activeTab={mentorActiveTab} onTabChange={(tab: any) => setMentorActiveTab(tab)} />
               )}
               {isOrgView && currentView !== 'manage-lessons' && currentView !== 'view-logs' && (
                   currentView === 'manage-users' ? (
                        <AdminPanel currentUser={user} activeTab={orgSubTab} onTabChange={(tab) => { if (tab === 'users' || tab === 'invites' || tab === 'logs') setOrgSubTab(tab); else setCurrentView('dashboard'); }} />
                   ) : (
                        <OrganizationPanel currentUser={user} />
                   )
               )}
               {isStudentView && currentView !== 'manage-lessons' && currentView !== 'view-logs' && (
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                       <div className="flex border-b border-gray-100">
                          <button onClick={() => setStudentActiveTab('lessons')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'lessons' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>VIEW LESSONS</button>
                          <button onClick={() => setStudentActiveTab('join')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'join' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>JOIN CLASS</button>
                          <button onClick={() => setStudentActiveTab('browse')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'browse' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>FIND MENTOR</button>
                       </div>
                       <StudentPanel currentUser={user} activeTab={studentActiveTab} onTakeLesson={startLesson} />
                   </div>
               )}
               {isParentView && currentView !== 'manage-lessons' && currentView !== 'view-logs' && (
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Child Progress Report</h3>
                        <p className="text-gray-500">Detailed analytics for your linked student will appear here.</p>
                    </div>
               )}
            </div>

            <div className="space-y-6">
               <RecentChatsWidget messages={recentMessages} onGoToChat={() => setCurrentView('chat')} />
               <DailyVerseCard verse={dailyVerse} loading={loadingVerse} />
               <AIQuizCard question={quizQuestion} state={quizState} onAnswer={handleQuizAnswer} />
            </div>
         </div>
    </div>
  );
};

export default Dashboard;