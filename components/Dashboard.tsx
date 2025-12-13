import React, { useEffect, useState } from 'react';
import { UserRole, User, Lesson } from '../types';
import { getDailyVerse, getAIQuizQuestion } from '../services/geminiService';
import { lessonService } from '../services/lessonService';
import AdminPanel from './AdminPanel';
import OrganizationPanel from './OrganizationPanel'; 
import LessonView from './LessonView'; 
import ParentOnboarding from './ParentOnboarding';
import ExportModal from './ExportModal';
import LessonBrowser from './LessonBrowser';
import LessonUpload from './LessonUpload';
import StudentPanel from './StudentPanel';
import {
  BookOpen, Trophy, Activity, CheckCircle, 
  Users, Upload, Play, Printer, Lock, TrendingUp, Edit3, Star
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onChangePasswordClick?: () => void;
}

// Color mapping
const colorVariants: Record<string, { bg: string, text: string, light: string, border: string, stroke: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100', stroke: '#2563eb' },
  green: { bg: 'bg-green-100', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-100', stroke: '#16a34a' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100', stroke: '#9333ea' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100', stroke: '#4f46e5' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-100', stroke: '#ca8a04' },
};

// --- NEW COMPONENT: CIRCULAR PROGRESS ---
const CircularProgress = ({ percentage, color, size = 80, strokeWidth = 8, icon: Icon }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const variants = colorVariants[color] || colorVariants.blue;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        {/* Indicator */}
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
      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
        {Icon ? <Icon size={20} className={variants.text} /> : `${percentage}%`}
      </div>
    </div>
  );
};

// Helper Component: Updated StatCard to support Ring type
const StatCard = ({ title, value, subtitle, icon: Icon, color, type = 'card', progress }: any) => {
  const colors = colorVariants[color] || colorVariants.blue;

  if (type === 'ring') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-6">
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
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
                              ? 'bg-green-100 text-green-700' // Show correct answer if wrong
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

// VIEW STATE ENUM to prevent hook errors
type DashboardView = 'dashboard' | 'lesson-browser' | 'lesson-view' | 'upload' | 'parent-onboarding' | 'manage-lessons';

const Dashboard: React.FC<DashboardProps> = ({ user, onChangePasswordClick }) => {
  // 1. ALL STATE HOOKS
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  
  const [dailyVerse, setDailyVerse] = useState<{ verse: string; reference: string; reflection: string } | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [quizQuestion, setQuizQuestion] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Admin View State
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests'>('users');
  
  // Mentor View State
  const [mentorActiveTab, setMentorActiveTab] = useState<'lessons' | 'upload' | 'requests'>('lessons');

  // Student View State
  const [studentActiveTab, setStudentActiveTab] = useState<'join' | 'browse' | 'lessons'>('lessons');
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null); 

  // Derived Roles
  const isAdminView = user.role === UserRole.ADMIN;
  const isMentorView = user.role === UserRole.MENTOR;
  const isStudentView = user.role === UserRole.STUDENT;
  const isParentView = user.role === UserRole.PARENT;
  const isOrgView = user.role === UserRole.ORGANIZATION;

  // 2. EFFECTS
  useEffect(() => {
    // If we are NOT in parent view anymore but still stuck on onboarding, reset
    if (!isParentView && currentView === 'parent-onboarding') {
      setCurrentView('dashboard');
      return; 
    }

    // Check parent onboarding
    if (isParentView && !user.linkedStudentId) {
       setCurrentView('parent-onboarding');
    }

    const fetchContent = async () => {
      try {
        const verse = await getDailyVerse();
        setDailyVerse(verse);
        const quiz = await getAIQuizQuestion();
        setQuizQuestion(quiz);
      } finally {
        setLoadingVerse(false);
      }
    };
    fetchContent();
  }, [isParentView, user.linkedStudentId, user.role, currentView]);

  // 3. HANDLERS
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
     } catch (e) {
        console.error(e);
     }
  };

  const handleManageLessons = () => {
    if (isOrgView) {
        setCurrentView('manage-lessons');
    } else {
        // For Admin/Mentor, ensure they are on the dashboard view but switch the tab
        setCurrentView('dashboard');
        if (isAdminView) setAdminActiveTab('lessons');
        if (isMentorView) setMentorActiveTab('lessons');
    }
  };

  // 4. RENDER Logic based on currentView

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
        onLessonSelect={(id) => {
           startLesson(id);
        }}
        onClose={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'upload') {
      return (
        <LessonUpload 
            currentUser={user}
            onSuccess={() => {
                setCurrentView('dashboard');
                // Auto switch to manage view to see the new lesson
                if (isOrgView) {
                    setCurrentView('manage-lessons'); // Org logic
                } else if (isAdminView) {
                    setAdminActiveTab('lessons');
                } else if (isMentorView) {
                    setMentorActiveTab('lessons');
                }
            }}
            onCancel={() => setCurrentView('dashboard')}
        />
      );
  }

  if (currentView === 'parent-onboarding') {
    return (
      <ParentOnboarding 
        user={user} 
        onLinkSuccess={() => {
             window.location.reload();
        }} 
      />
    );
  }

  // DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header with Title and Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Hello, <span className="text-royal-500">{user.name}</span>
          </h1>
          <p className="text-gray-500 mt-1">
             {loadingVerse ? "Loading daily inspiration..." : `"${dailyVerse?.verse}"`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
           
           {/* UPLOAD LESSONS BUTTON (For Admin, Mentor, Parent, Org) - NOT Student */}
           {!isStudentView && (
              <button 
                onClick={() => setCurrentView('upload')}
                className="flex items-center gap-2 px-5 py-3 bg-royal-800 text-white rounded-xl font-bold hover:bg-royal-900 shadow-lg shadow-royal-900/20 transition-all transform hover:-translate-y-0.5"
              >
                 <Upload size={18} /> 
                 <span>UPLOAD LESSONS</span>
              </button>
           )}

           {/* MANAGE LESSONS BUTTON (For Admin, Mentor, Org) */}
           {(isAdminView || isMentorView || isOrgView) && (
              <button 
                onClick={handleManageLessons}
                className={`flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 ${currentView === 'manage-lessons' ? 'ring-2 ring-indigo-400' : ''}`}
              >
                 <Edit3 size={18} /> 
                 <span>MANAGE LESSONS</span>
              </button>
           )}

           {/* TAKE LESSONS BUTTON (For Everyone - Admin, Mentor, Student, Org, Parent) */}
           <button 
                onClick={() => setCurrentView('lesson-browser')}
                className="flex items-center gap-2 px-5 py-3 bg-royal-500 text-white rounded-xl font-bold hover:bg-royal-800 shadow-lg shadow-royal-500/30 transition-all transform hover:-translate-y-0.5"
           >
                <Play size={18} fill="currentColor" /> 
                <span>TAKE LESSONS</span>
           </button>
           
           {/* PRINT / EXPORT BUTTON (For All) */}
           <button 
             onClick={() => setShowExportModal(true)}
             className="flex items-center gap-2 px-5 py-3 bg-gold-500 text-white rounded-xl font-bold hover:bg-gold-600 shadow-lg shadow-gold-500/30 transition-all transform hover:-translate-y-0.5"
           >
              <Printer size={18} /> 
              <span>PRINT / EXPORT</span>
           </button>

           {onChangePasswordClick && (
             <button onClick={onChangePasswordClick} className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
               <Lock size={20} />
             </button>
           )}
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={user} />

      {/* ADMIN VIEW */}
      {isAdminView && (
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Total Users" value="2,405" subtitle="12% growth" icon={Users} color="blue" />
                 <StatCard title="Active Lessons" value="142" subtitle="5 new this week" icon={BookOpen} color="purple" />
                 <StatCard title="System Health" value="100%" subtitle="All systems operational" icon={Activity} color="green" />
               </div>
               <AdminPanel 
                 currentUser={user} 
                 activeTab={adminActiveTab} 
                 onTabChange={setAdminActiveTab} 
               />
            </div>
            <div className="space-y-6">
               <DailyVerseCard verse={dailyVerse} loading={loadingVerse} />
               <AIQuizCard question={quizQuestion} state={quizState} onAnswer={handleQuizAnswer} />
            </div>
         </div>
      )}

      {/* MENTOR VIEW */}
      {isMentorView && (
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard type="ring" title="Group Accuracy" value="92%" subtitle="Top 5% Rank" icon={Trophy} color="gold" progress={92} />
                 <StatCard type="ring" title="Completion Rate" value="85%" subtitle="Assignments" icon={CheckCircle} color="green" progress={85} />
                 <StatCard title="My Students" value="24" subtitle="Active Learners" icon={Users} color="indigo" />
               </div>
               <AdminPanel 
                 currentUser={user} 
                 activeTab={mentorActiveTab} 
                 onTabChange={(tab: any) => setMentorActiveTab(tab)} 
               />
            </div>
            <div className="space-y-6">
               <DailyVerseCard verse={dailyVerse} loading={loadingVerse} />
               <AIQuizCard question={quizQuestion} state={quizState} onAnswer={handleQuizAnswer} />
            </div>
         </div>
      )}

       {/* ORGANIZATION VIEW - DUAL MODE (Panel or Lessons) */}
       {isOrgView && (
          <div className="grid grid-cols-1 gap-8">
             {currentView === 'manage-lessons' ? (
                // Re-use AdminPanel for lesson management
                <AdminPanel 
                    currentUser={user} 
                    activeTab='lessons'
                    onTabChange={(tab) => {
                        // If they click something else, handle it or force 'lessons'
                        if (tab !== 'lessons' && tab !== 'upload') {
                            setCurrentView('dashboard'); // Return to Org Panel
                        }
                    }}
                />
             ) : (
                <OrganizationPanel currentUser={user} />
             )}
          </div>
       )}

      {/* PARENT VIEW */}
      {isParentView && (
          <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Linked Child" value="Demo Student" subtitle="Active" icon={Users} color="indigo" />
                 <StatCard type="ring" title="Recent Accuracy" value="95%" subtitle="Genesis Ch 1" icon={CheckCircle} color="green" progress={95} />
                 <StatCard title="Weekly Activity" value="4h 30m" subtitle="On Track" icon={Activity} color="blue" />
               </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                 <h3 className="font-bold text-gray-800 text-lg mb-2">Child Progress Report</h3>
                 <p className="text-gray-500">Detailed analytics for your linked student will appear here.</p>
              </div>
          </div>
      )}

      {/* STUDENT VIEW */}
      {isStudentView && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard type="ring" title="Overall Accuracy" value="94%" subtitle="Last 5 Quizzes" icon={CheckCircle} color="green" progress={94} />
                 <StatCard type="ring" title="Course Completion" value="12%" subtitle="Lessons Done" icon={BookOpen} color="blue" progress={12} />
                 <StatCard title="My Points" value="1,250" subtitle="Rank #5" icon={Trophy} color="gold" />
               </div>
               
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="flex border-b border-gray-100">
                      <button onClick={() => setStudentActiveTab('lessons')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'lessons' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>VIEW LESSONS</button>
                      <button onClick={() => setStudentActiveTab('join')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'join' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>JOIN CLASS</button>
                      <button onClick={() => setStudentActiveTab('browse')} className={`flex-1 py-4 font-bold text-sm ${studentActiveTab === 'browse' ? 'bg-royal-50 text-royal-800 border-b-2 border-royal-800' : 'text-gray-500 hover:bg-gray-50'}`}>FIND MENTOR</button>
                   </div>
                   <div className="p-0">
                      <StudentPanel 
                        currentUser={user} 
                        activeTab={studentActiveTab} 
                        onTakeLesson={startLesson}
                      />
                   </div>
               </div>
            </div>
            <div className="space-y-6">
               <DailyVerseCard verse={dailyVerse} loading={loadingVerse} />
               <AIQuizCard question={quizQuestion} state={quizState} onAnswer={handleQuizAnswer} />
            </div>
         </div>
      )}

    </div>
  );
};

export default Dashboard;