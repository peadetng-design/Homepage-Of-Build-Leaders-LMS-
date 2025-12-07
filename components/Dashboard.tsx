
import React, { useEffect, useState } from 'react';
import { UserRole, User } from '../types';
import { getDailyVerse, getAIQuizQuestion } from '../services/geminiService';
import AdminPanel from './AdminPanel';
import StudentPanel from './StudentPanel';
import ParentOnboarding from './ParentOnboarding';
import {
  BookOpen, Star, Trophy, Clock, Calendar, ArrowUpRight,
  TrendingUp, Activity, CheckCircle, Play,
  Users, Shield, Heart, FileText, AlertCircle, BarChart3, Lock, Upload, List, UserPlus, Search
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onChangePasswordClick?: () => void;
}

// Color mapping for safe Tailwind class usage
const colorVariants: Record<string, { bg: string, text: string, light: string, border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100' },
  green: { bg: 'bg-green-100', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-100' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-100' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-100' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-100' },
  red: { bg: 'bg-red-100', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-100' },
};

const Dashboard: React.FC<DashboardProps> = ({ user, onChangePasswordClick }) => {
  const [dailyVerse, setDailyVerse] = useState<{ verse: string; reference: string; reflection: string } | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [quizQuestion, setQuizQuestion] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  
  // Admin View State
  const [adminActiveTab, setAdminActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload'>('users');
  
  // Mentor View State
  const [mentorActiveTab, setMentorActiveTab] = useState<'lessons' | 'upload' | 'requests'>('lessons');

  // Student View State
  const [studentActiveTab, setStudentActiveTab] = useState<'join' | 'browse' | 'lessons' | null>(null);

  // If Admin and in Admin view, we show the Panel
  const isAdminView = user.role === UserRole.ADMIN;
  const isMentorView = user.role === UserRole.MENTOR;
  const isStudentView = user.role === UserRole.STUDENT;
  const isParentView = user.role === UserRole.PARENT;

  // --- PARENT ONBOARDING CHECK ---
  // If user is a Parent but hasn't linked a student yet, BLOCK the dashboard with the onboarding screen.
  if (isParentView && !user.linkedStudentId) {
    return (
       <ParentOnboarding 
         user={user} 
         onLinkSuccess={() => window.location.reload()} 
       />
    );
  }

  useEffect(() => {
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
  }, [user.role]);

  const handleQuizAnswer = (option: string) => {
    if(!quizQuestion) return;
    if (option === quizQuestion.answer) {
      setQuizState('correct');
    } else {
      setQuizState('incorrect');
    }
  };

  const getRoleContent = () => {
    switch(user.role) {
      case UserRole.ADMIN:
        return {
          welcomeMsg: "Overview of system performance and district activities.",
          stats: [
            { title: "Total Users", value: "2,450", subtitle: "+120 this week", icon: Users, color: "blue" },
            { title: "Active Groups", value: "85", subtitle: "5 pending", icon: Shield, color: "indigo" },
            { title: "Question Bank", value: "15k+", subtitle: "+500 new", icon: BookOpen, color: "purple" },
            { title: "System Health", value: "99.9%", subtitle: "All systems go", icon: Activity, color: "green" },
          ],
          featured: {
            label: "Administrative Action",
            title: "District Tournament Setup",
            description: "The Fall District Finals are approaching. Configure brackets, assign judges, and open registration.",
            buttonText: "Manage Tournament",
            icon: Trophy,
            bgGradient: "from-slate-900 to-slate-700"
          },
          recentTitle: "System Alerts & Registrations",
          recentItems: [
            { id: 1, title: "New Group Request: Grace Baptist", meta: "Pending Approval", type: "alert", icon: AlertCircle, iconColor: "text-amber-500", bg: "bg-amber-50" },
            { id: 2, title: "Server Load Warning", meta: "Resolved 2h ago", type: "info", icon: Activity, iconColor: "text-blue-500", bg: "bg-blue-50" },
            { id: 3, title: "Content Flag: Question #4023", meta: "Needs Review", type: "warning", icon: Shield, iconColor: "text-red-500", bg: "bg-red-50" },
          ]
        };
      case UserRole.MENTOR:
        return {
          welcomeMsg: "Track your team's spiritual growth and quiz performance.",
          stats: [
            { title: "My Students", value: "14", subtitle: "Full Attendance", icon: Users, color: "blue" },
            { title: "Team Avg", value: "88%", subtitle: "Top 10%", icon: BarChart3, color: "green" },
            { title: "Assignments", value: "3", subtitle: "Due Friday", icon: FileText, color: "orange" },
            { title: "Next Meet", value: "Wed", subtitle: "6:00 PM", icon: Calendar, color: "purple" },
          ],
          featured: {
             label: "Team Focus",
             title: "Review: The Beatitudes",
             description: "7 students scored below 70% on the last module. We've prepared a remedial group study session template for you.",
             buttonText: "Assign Study Session",
             icon: Users,
             bgGradient: "from-indigo-900 to-purple-800"
          },
          recentTitle: "Student Activity",
          recentItems: [
            { id: 1, title: "Sarah submitted 'John Ch 4'", meta: "Score: 95% • Excellent", type: "success", icon: CheckCircle, iconColor: "text-green-500", bg: "bg-green-50" },
            { id: 2, title: "Mike completed daily streak", meta: "7 Days in a row", type: "info", icon: Star, iconColor: "text-amber-500", bg: "bg-amber-50" },
            { id: 3, title: "Group Message: Study time", meta: "2h ago", type: "info", icon: FileText, iconColor: "text-blue-500", bg: "bg-blue-50" },
          ]
        };
      case UserRole.PARENT:
        return {
          welcomeMsg: "Stay updated with your child's journey in the Word.",
          stats: [
             { title: "Child's Score", value: "920", subtitle: "Top of class", icon: Star, color: "yellow" },
             { title: "Completion", value: "85%", subtitle: "On track", icon: CheckCircle, color: "green" },
             { title: "Study Time", value: "4h", subtitle: "This week", icon: Clock, color: "blue" },
             { title: "Next Quiz", value: "Fri", subtitle: "John Ch 5", icon: Calendar, color: "indigo" },
          ],
           featured: {
             label: "Parent Insight",
             title: "Weekly Progress Report",
             description: "Your child has shown excellent improvement in memorization. View the detailed breakdown of their recent quiz performance.",
             buttonText: "View Full Report",
             icon: Heart,
             bgGradient: "from-emerald-800 to-teal-700"
          },
          recentTitle: "Recent Achievements",
          recentItems: [
             { id: 1, title: "Earned Badge: 'Early Riser'", meta: "Yesterday", type: "success", icon: Trophy, iconColor: "text-amber-500", bg: "bg-amber-50" },
             { id: 2, title: "Completed: Parables Quiz", meta: "Score: 100%", type: "success", icon: Star, iconColor: "text-yellow-500", bg: "bg-yellow-50" },
             { id: 3, title: "Practice Session", meta: "20 mins", type: "info", icon: Clock, iconColor: "text-blue-500", bg: "bg-blue-50" },
          ]
        };
      default: // STUDENT
        return {
           welcomeMsg: "Here is what is happening in your workspace today.",
           stats: [
             { title: "Weekly Score", value: "980", subtitle: "+12%", icon: Trophy, color: "amber" },
             { title: "Modules Done", value: "12", subtitle: "+2", icon: CheckCircle, color: "blue" },
             { title: "Study Hours", value: "24.5", subtitle: "+1.5h", icon: Clock, color: "indigo" },
             { title: "Group Rank", value: "#3", subtitle: "Top 5%", icon: Star, color: "purple" },
           ],
           featured: {
              label: "Priority",
              title: "The Gospel of John: Chapter 4",
              description: "Your group is scheduled to complete this module by Friday. You have completed 2/5 lessons.",
              buttonText: "Continue Quiz",
              icon: BookOpen,
              bgGradient: "from-royal-900 to-royal-700"
           },
           recentTitle: "Recent Lessons",
           recentItems: [
              { id: 1, title: "The Parables of Jesus", meta: "15 min • Intermediate", type: "lesson", icon: BookOpen, iconColor: "text-blue-600", bg: "bg-blue-50" },
              { id: 2, title: "Sermon on the Mount", meta: "20 min • Hard", type: "lesson", icon: BookOpen, iconColor: "text-blue-600", bg: "bg-blue-50" },
              { id: 3, title: "Intro to Genesis", meta: "10 min • Easy", type: "lesson", icon: BookOpen, iconColor: "text-blue-600", bg: "bg-blue-50" },
           ]
        };
    }
  };

  const roleContent = getRoleContent();

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
    const colors = colorVariants[color] || colorVariants.blue;
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

  const FeaturedIcon = roleContent.featured.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-500 mt-1">{roleContent.welcomeMsg}</p>
        </div>
        
        {/* Account Security Action */}
        <button 
          onClick={onChangePasswordClick}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Lock size={16} /> Change Password
        </button>
      </div>

      {/* ADMIN ACTIONS ROW */}
      {isAdminView && (
        <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-4">
           {/* Conspicuous Gold Upload Button */}
           <button 
             onClick={() => setAdminActiveTab('upload')}
             className="bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/30 font-bold px-8 py-4 rounded-xl flex items-center gap-3 transform hover:-translate-y-1 transition-all group"
           >
             <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Upload size={24} strokeWidth={3} />
             </div>
             <span className="text-lg">UPLOAD LESSON</span>
           </button>

           {/* Smaller Lessons Button */}
           <button 
             onClick={() => setAdminActiveTab('lessons')}
             className="bg-white border-2 border-gray-200 text-gray-600 hover:border-royal-600 hover:text-royal-600 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
           >
             <List size={20} />
             <span>Manage Lessons</span>
           </button>
        </div>
      )}

      {/* MENTOR ACTIONS ROW */}
      {isMentorView && (
        <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-4">
           {/* Conspicuous Gold Manage Lessons Button (Mentor Request) */}
           <button 
             onClick={() => setMentorActiveTab('lessons')}
             className="bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/30 font-bold px-8 py-4 rounded-xl flex items-center gap-3 transform hover:-translate-y-1 transition-all group"
           >
             <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <List size={24} strokeWidth={3} />
             </div>
             <div className="text-left">
               <span className="block text-lg leading-tight">MANAGE LESSONS</span>
               <span className="text-xs text-gold-100 font-normal">View & Curate</span>
             </div>
           </button>

           {/* Smaller Upload Lessons Button (Mentor Request) */}
           <button 
             onClick={() => setMentorActiveTab('upload')}
             className="bg-white border-2 border-gray-200 text-gray-600 hover:border-royal-600 hover:text-royal-600 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
           >
             <Upload size={20} />
             <span>Upload Lessons</span>
           </button>
           
           <button 
             onClick={() => setMentorActiveTab('requests')}
             className="bg-white border-2 border-gray-200 text-gray-600 hover:border-royal-600 hover:text-royal-600 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
           >
             <UserPlus size={20} />
             <span>Requests</span>
           </button>
        </div>
      )}

      {/* STUDENT ACTIONS ROW */}
      {isStudentView && (
        <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-4">
           {/* Conspicuous Gold Join Class Button */}
           <button 
             onClick={() => setStudentActiveTab('join')}
             className="bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/30 font-bold px-8 py-4 rounded-xl flex items-center gap-3 transform hover:-translate-y-1 transition-all group"
           >
             <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <UserPlus size={24} strokeWidth={3} />
             </div>
             <div className="text-left">
               <span className="block text-lg leading-tight">JOIN CLASS</span>
               <span className="text-xs text-gold-100 font-normal">Enter Code</span>
             </div>
           </button>

           {/* Smaller Browse Mentors Button */}
           <button 
             onClick={() => setStudentActiveTab('browse')}
             className="bg-white border-2 border-gray-200 text-gray-600 hover:border-royal-600 hover:text-royal-600 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
           >
             <Search size={20} />
             <span>Browse Mentors</span>
           </button>

           {/* Smaller View Lessons Button */}
           <button 
             onClick={() => setStudentActiveTab('lessons')}
             className="bg-white border-2 border-gray-200 text-gray-600 hover:border-royal-600 hover:text-royal-600 font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
           >
             <List size={20} />
             <span>View Lessons</span>
           </button>
        </div>
      )}

      {/* ADMIN PANEL INTEGRATION: Used by both Admin and Mentor */}
      {isAdminView && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <AdminPanel 
             currentUser={user} 
             activeTab={adminActiveTab} 
             onTabChange={setAdminActiveTab} 
           />
        </div>
      )}

      {isMentorView && mentorActiveTab && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <AdminPanel 
             currentUser={user} 
             activeTab={mentorActiveTab} 
             onTabChange={(tab) => setMentorActiveTab(tab as any)} 
           />
        </div>
      )}

      {/* STUDENT PANEL INTEGRATION */}
      {isStudentView && studentActiveTab && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <StudentPanel
             currentUser={user} 
             activeTab={studentActiveTab} 
           />
        </div>
      )}

      {/* Grid Layout (Existing Dashboard Components) */}
      <div className="grid grid-cols-12 gap-6">

        {/* Top Stats Row - Spans full width */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
           {roleContent.stats.map((stat, idx) => (
             <StatCard key={idx} {...stat} />
           ))}
        </div>

        {/* Main Content Area - Left 8 columns */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Featured Action Card */}
          <div className={`bg-gradient-to-r ${roleContent.featured.bgGradient} rounded-3xl p-8 text-white relative overflow-hidden shadow-xl`}>
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
              <FeaturedIcon size={200} />
            </div>
            <div className="relative z-10 max-w-lg">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                {roleContent.featured.label}
              </span>
              <h2 className="text-3xl font-serif font-bold mb-4 leading-tight">
                {roleContent.featured.title}
              </h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                {roleContent.featured.description}
              </p>
              <button className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-lg">
                <Play size={18} fill="currentColor" />
                {roleContent.featured.buttonText}
              </button>
            </div>
          </div>

          {/* Recent List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800">{roleContent.recentTitle}</h3>
                <button className="text-royal-600 text-sm font-semibold hover:underline">View All</button>
             </div>
             <div className="space-y-4">
                {roleContent.recentItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50 hover:border-gray-200 cursor-pointer group">
                      <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center ${item.iconColor} font-bold group-hover:brightness-95 transition-all`}>
                        <ItemIcon size={20} />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                           <span className="flex items-center gap-1">{item.meta}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <ArrowUpRight className="text-gray-300 group-hover:text-royal-600" size={20} />
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Right Sidebar - Right 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* AI Daily Verse Card */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative">
             <div className="flex items-center gap-2 mb-4 text-amber-700">
               <SparklesIcon />
               <h3 className="font-bold text-sm uppercase tracking-wide">Daily Wisdom</h3>
             </div>
             {loadingVerse ? (
               <div className="animate-pulse space-y-3">
                 <div className="h-4 bg-amber-200/50 rounded w-3/4"></div>
                 <div className="h-4 bg-amber-200/50 rounded w-1/2"></div>
               </div>
             ) : (
               dailyVerse && (
                 <>
                   <p className="font-serif text-xl font-medium text-gray-900 italic mb-3 leading-relaxed">
                     "{dailyVerse.verse}"
                   </p>
                   <p className="text-amber-700 font-bold text-sm mb-4">— {dailyVerse.reference}</p>
                   <div className="bg-white/60 p-3 rounded-lg text-sm text-gray-700 border border-amber-100/50">
                     <span className="font-semibold block mb-1 text-amber-800">Reflection:</span>
                     {dailyVerse.reflection}
                   </div>
                 </>
               )
             )}
          </div>

          {/* Quick AI Quiz Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               Quick Fire Question
             </h3>
             {quizQuestion && (
               <div>
                  <p className="text-gray-700 font-medium mb-4">{quizQuestion.question}</p>
                  <div className="space-y-2">
                    {quizQuestion.options.map((opt, idx) => {
                      const isCorrect = opt === quizQuestion.answer;
                      let btnClass = "w-full text-left p-3 rounded-lg text-sm font-medium border transition-all duration-200 ";
                      if (quizState === 'idle') {
                        btnClass += "border-gray-200 hover:border-royal-300 hover:bg-royal-50 text-gray-600";
                      } else if (quizState === 'correct' && isCorrect) {
                        btnClass += "border-green-500 bg-green-50 text-green-700";
                      } else if (quizState === 'incorrect' && !isCorrect) {
                        btnClass += "border-gray-200 opacity-50";
                      } else if (quizState === 'incorrect' && isCorrect) {
                         // Show correct answer even if they got it wrong
                         btnClass += "border-green-500 bg-green-50 text-green-700";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizState !== 'idle'}
                          onClick={() => handleQuizAnswer(opt)}
                          className={btnClass}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizState !== 'idle' && (
                    <div className={`mt-4 text-center text-sm font-bold ${quizState === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                      {quizState === 'correct' ? 'Correct! Well done.' : 'Incorrect. Try again tomorrow!'}
                    </div>
                  )}
               </div>
             )}
          </div>

          {/* Calendar Widget (Static) */}
           <div className="bg-indigo-900 text-white rounded-2xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-indigo-300 text-xs font-bold uppercase">Next Event</span>
                    <h3 className="font-bold text-lg">District Finals</h3>
                  </div>
                  <Calendar className="text-indigo-300" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-center min-w-[50px]">
                    <span className="block text-xl font-bold">15</span>
                    <span className="text-xs text-indigo-200">OCT</span>
                  </div>
                  <div className="text-sm text-indigo-100">
                    <p>First Baptist Church</p>
                    <p>09:00 AM</p>
                  </div>
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-700 rounded-full opacity-50"></div>
           </div>

        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
  </svg>
);

export default Dashboard;
