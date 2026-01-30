import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest, Resource, NewsItem, Module, Certificate } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import StudentPanel from './StudentPanel';
import Tooltip from './Tooltip'; 
import CertificateGenerator from './CertificateGenerator';
import { 
  Users, UserPlus, Shield, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X,
  BookOpen, Edit2, Eye, Plus, Upload, ListPlus, Trash, Trash2,
  Download, List, Send, Loader2, Book, Star, Settings, Globe,
  Clock, History, FileText, CheckCircle, Activity, ChevronDown, Newspaper, Library, ArrowLeft, BarChart3, BadgeCheck, Zap, Trophy, TrendingUp, Layers, Award, Target, LayoutDashboard, Sparkles, Printer, MessageSquare, Megaphone
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onUpdateUser?: (user: User) => void;
  activeTab?: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'resources' | 'group-analytics' | 'news' | 'chat';
  onTabChange?: (tab: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'resources' | 'group-analytics' | 'news' | 'chat') => void;
  onBack?: () => void;
  isEmbedded?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, activeTab: propActiveTab, onTabChange, onBack, onUpdateUser, isEmbedded = false }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'resources' | 'group-analytics' | 'news' | 'chat'>('users');
  
  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = (tab: any) => {
    if (onTabChange) onTabChange(tab);
    else setInternalActiveTab(tab);
  };

  const [users, setUsers] = useState<User[]>([]);
  const [userSummaries, setUserSummaries] = useState<Record<string, any>>({});
  const [userLogsCount, setUserLogsCount] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Performance Insight State
  const [insightUser, setInsightUser] = useState<User | null>(null);
  const [insightData, setInsightData] = useState<any>(null);

  // Credential Modal State
  const [credentialUser, setCredentialUser] = useState<User | null>(null);
  const [eligibleModules, setEligibleModules] = useState<Module[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<Certificate[]>([]);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.CO_ADMIN;
  const isMentor = currentUser.role === UserRole.MENTOR;
  const isOrg = currentUser.role === UserRole.ORGANIZATION;
  const isParent = currentUser.role === UserRole.PARENT;
  const canManageUsers = isAdmin || isOrg || isMentor || isParent;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users' && canManageUsers) {
        const data = await authService.getAllUsers(currentUser);
        setUsers(data);
        
        const summaries: Record<string, any> = {};
        const logsCounts: Record<string, number> = {};
        const allLogs = await authService.getLogs(currentUser);

        for (const u of data) {
            summaries[u.id] = await lessonService.getStudentSummary(u.id);
            logsCounts[u.id] = allLogs.filter(l => l.actorId === u.id).length;
        }
        setUserSummaries(summaries);
        setUserLogsCount(logsCounts);

      } else if (activeTab === 'invites' && canManageUsers) {
        const invites = await authService.getInvites(currentUser);
        setPendingInvites(invites);
      } else if (activeTab === 'logs') {
        const data = await authService.getLogs(currentUser);
        setLogs(data);
      } else if (activeTab === 'lessons') {
        const data = await lessonService.getLessons(); 
        setLessons(data);
      } else if (activeTab === 'resources') {
        const data = await lessonService.getResources();
        setResources(data);
      } else if (activeTab === 'news') {
        const data = await lessonService.getNews();
        setNews(data);
      } else if (activeTab === 'requests' && (isMentor || isAdmin)) {
        const data = await authService.getJoinRequests(currentUser);
        setRequests(data);
      } else if (activeTab === 'group-analytics') {
          // Aggregate logic for the whole group
          const allUsers = await authService.getAllUsers(currentUser);
          const summaries: any[] = [];
          for (const u of allUsers) {
              summaries.push(await lessonService.getStudentSummary(u.id));
          }
          setInsightData(summaries);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInsights = async (user: User) => {
    setIsLoading(true);
    try {
        const summary = await lessonService.getStudentSummary(user.id);
        setInsightData(summary);
        setInsightUser(user);
    } finally {
        setIsLoading(false);
    }
  };

  const formatDigitalTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const handleDeleteUser = async (id: string) => {
      if (!window.confirm("Permanently delete this user?")) return;
      try {
        await authService.deleteUser(currentUser, id);
        setNotification({ msg: "User deleted successfully", type: 'success' });
        fetchData();
      } catch (err: any) {
        setNotification({ msg: err.message, type: 'error' });
      }
  };

  const handleRoleChange = async (targetId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(currentUser, targetId, newRole);
      setNotification({ msg: 'User role updated successfully', type: 'success' });
      fetchData();
    } catch (err: any) { setNotification({ msg: err.message, type: 'error' }); }
  };

  const labelClass = "text-[10px] font-black uppercase tracking-widest text-white text-center mt-2";

  return (
    <div className={`bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[700px] animate-in fade-in slide-in-from-bottom-4 ${isEmbedded ? 'mt-0' : ''}`}>
      <div className={`bg-royal-900 px-8 ${isEmbedded ? 'pt-10 pb-8' : 'pt-16 pb-12'} text-white flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b-8 border-gold-500`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
           <div className="flex items-center gap-4 md:gap-6">
              {!isEmbedded && onBack && (
                <button 
                  onClick={onBack}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 shadow-lg active:scale-95 group"
                >
                  <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                <Shield className={isMentor ? "text-blue-400" : isOrg ? "text-slate-300" : "text-gold-500"} size={40} /> 
              </div>
              <div>
                  <h2 className="text-3xl font-serif font-black flex items-center gap-3 tracking-tight">
                    {isAdmin ? "MASTER CONSOLE" : isOrg ? "MINISTRY HQ" : isMentor ? "MENTOR CENTER" : isParent ? "PARENTAL CONTROL" : "PERSONAL LIST"}
                  </h2>
                  <p className="text-royal-200 text-xs font-black uppercase tracking-[0.3em] mt-1 opacity-70">Authenticated Security Console</p>
              </div>
           </div>

           {/* STANDALONE ROUND BUTTONS (UPLOAD, MEMBERS, ANALYTICS) */}
           <div className="flex items-center gap-10">
              <div className="h-12 w-px bg-white/10 hidden md:block"></div>
              
              <div className="flex flex-col items-center">
                <Tooltip content="Upload curriculum content workbook.">
                    <button 
                    onClick={() => setActiveTab('upload')}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl border-b-4 active:scale-95 transform hover:-translate-y-1 ${activeTab === 'upload' ? 'bg-rose-600 border-rose-950 scale-110' : 'bg-rose-500/80 border-rose-800 hover:bg-rose-600'}`}
                    >
                    <Upload size={28} className="text-white" />
                    </button>
                </Tooltip>
                <span className={labelClass}>Upload</span>
              </div>

              <div className="flex flex-col items-center">
                <Tooltip content="Manage and view all registered members.">
                    <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl border-b-4 active:scale-95 transform hover:-translate-y-1 ${activeTab === 'users' ? 'bg-blue-600 border-blue-950 scale-110' : 'bg-blue-500/80 border-blue-800 hover:bg-blue-600'}`}
                    >
                    <Users size={28} className="text-white" />
                    </button>
                </Tooltip>
                <span className={labelClass}>Members</span>
              </div>

              <div className="flex flex-col items-center">
                <Tooltip content="Organization Performance Analysis">
                    <button 
                        onClick={() => setActiveTab('group-analytics')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl border-b-4 active:scale-95 transform hover:-translate-y-1 ${activeTab === 'group-analytics' ? 'bg-indigo-600 border-indigo-950 scale-110' : 'bg-indigo-500/80 border-indigo-800 hover:bg-indigo-600'}`}
                    >
                        <BarChart3 size={28} className="text-white" />
                    </button>
                </Tooltip>
                <span className={labelClass}>Analytics</span>
              </div>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-royal-950/50 p-2 rounded-2xl border border-white/10 backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full">
           {canManageUsers && (
             <>
                <button onClick={() => setActiveTab('chat')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Chats</button>
                <button onClick={() => setActiveTab('invites')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'invites' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Invites</button>
             </>
           )}
           <button onClick={() => setActiveTab('lessons')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'lessons' ? 'bg-gold-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Curriculum</button>
           <button onClick={() => setActiveTab('news')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'news' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>News</button>
           <button onClick={() => setActiveTab('resources')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'resources' ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Resources</button>
           <button onClick={() => setActiveTab('curated')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'curated' ? 'bg-purple-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>My List</button>
           {(isMentor || isAdmin) && <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Requests</button>}
           <button onClick={() => setActiveTab('logs')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Audit Logs</button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 text-center text-xs font-black flex justify-between items-center px-8 border-b transition-all animate-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          <span className="uppercase tracking-widest">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-full"><X size={16} strokeWidth={3} /></button>
        </div>
      )}

      <div className="p-8 bg-[#fdfdfd]">
        {activeTab === 'upload' && (
            <LessonUpload currentUser={currentUser} onSuccess={() => setActiveTab('lessons')} onCancel={() => setActiveTab('users')} />
        )}
        
        {activeTab === 'group-analytics' && (
            <div className="space-y-10 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Members', val: users.length, icon: Users, color: 'text-royal-600', bg: 'bg-royal-50' },
                        { label: 'Avg Group Score', val: '84%', icon: Target, color: 'text-gold-600', bg: 'bg-gold-50' },
                        { label: 'Course Progress', val: '62%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Certs Issued', val: issuedCerts.length, icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2rem] border-4 border-gray-50 shadow-sm flex items-center gap-6">
                            <div className={`p-4 ${card.bg} ${card.color} rounded-2xl shadow-inner`}><card.icon size={32}/></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                                <p className="text-3xl font-black text-gray-900">{card.val}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-royal-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={160} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <h3 className="text-3xl font-serif font-black uppercase tracking-tight">Organization Velocity</h3>
                            <p className="text-royal-300 font-bold mt-2 uppercase text-xs tracking-widest">Global engagement patterns across the network.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center min-w-[120px]">
                                <p className="text-2xl font-black text-gold-400">1.2k</p>
                                <p className="text-[9px] font-black uppercase text-royal-400">Total Hours</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center min-w-[120px]">
                                <p className="text-2xl font-black text-emerald-400">92%</p>
                                <p className="text-[9px] font-black uppercase text-royal-400">Engagement</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'news' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid gap-6">
                    {news.map(item => (
                        <div key={item.id} className="bg-white p-8 rounded-[2rem] border-2 border-gray-50 shadow-sm flex gap-6 hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 rounded-2xl bg-orange-50 flex flex-col items-center justify-center border-2 border-orange-100 shrink-0">
                                <span className="text-2xl font-black text-orange-600">{new Date(item.date).getDate()}</span>
                                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-0.5 bg-royal-900 text-white text-[8px] font-black rounded-full uppercase tracking-widest">{item.category}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{item.author}</span>
                                </div>
                                <h4 className="text-xl font-serif font-black text-gray-900 leading-tight mb-2 truncate">{item.title}</h4>
                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{item.content}</p>
                            </div>
                        </div>
                    ))}
                    {news.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-100">
                             <Megaphone size={48} className="mx-auto mb-4 text-gray-200" />
                             <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Recent Broadcasts</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'curated' && (
           <div className="space-y-6">
              <div className="mb-6 bg-purple-50 p-6 rounded-[2rem] border-4 border-purple-100 shadow-sm flex items-center gap-6 animate-in slide-in-from-top-4">
                 <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-xl"><LayoutDashboard size={32}/></div>
                 <div>
                    <h3 className="text-2xl font-serif font-black text-purple-900 uppercase tracking-tight leading-none">Curriculum Orchestration</h3>
                    <p className="text-purple-700 font-bold mt-1 text-sm">Rearrange modules below to customize the learning pathway for yourself and your linked members.</p>
                 </div>
              </div>
              <StudentPanel 
                currentUser={currentUser} 
                activeTab="lessons" 
                isManagementMode={true}
                onUpdateUser={onUpdateUser}
                onBack={onBack}
              />
           </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="overflow-x-auto border-2 border-gray-100 rounded-3xl shadow-lg bg-white overflow-visible">
                <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                          <th className="p-6">Member Identity</th>
                          <th className="p-6">Performance Matrix</th>
                          <th className="p-6">Logs Activity</th>
                          <th className="p-6">Access Level</th>
                          <th className="p-6 text-right">Analytics</th>
                          <th className="p-6 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-sm">
                      {users.map(u => {
                        const s = userSummaries[u.id];
                        return (
                          <tr key={u.id} className="hover:bg-royal-50/30 transition-all group">
                            <td className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-700 flex items-center justify-center font-black shadow-inner border border-royal-100 group-hover:scale-110 transition-transform">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 text-lg leading-tight">{u.name}</div>
                                        <div className="text-xs text-gray-400 font-medium">{u.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6">
                                {s ? (
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase leading-none mb-1">AVG TOTAL SCORE</p>
                                            <p className="text-sm font-black text-indigo-700">{s.avgScore}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase leading-none mb-1">MODULES</p>
                                            <p className="text-sm font-black text-gray-700">{s.modulesCompleted}/{s.totalModules}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase leading-none mb-1">TOTAL TIME</p>
                                            <p className="text-sm font-black text-gray-700">{formatDigitalTime(s.totalTime)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-24 h-4 bg-gray-100 rounded-full animate-pulse"></div>
                                )}
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg w-fit">
                                    <History size={12} className="text-gray-400" />
                                    <span className="text-xs font-black text-gray-600">{userLogsCount[u.id] || 0} Records</span>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="relative inline-block">
                                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} className="appearance-none bg-indigo-50 text-indigo-700 text-[10px] font-black px-6 py-2 rounded-xl border-2 border-indigo-100 outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase tracking-widest cursor-pointer shadow-sm pr-10">
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                        <ChevronDown size={14}/>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <button 
                                  onClick={() => handleOpenInsights(u)}
                                  className="px-6 py-2.5 bg-royal-800 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-all shadow-md flex items-center gap-2 ml-auto"
                                >
                                    <BarChart3 size={14} /> Full Analytics
                                </button>
                            </td>
                            <td className="p-6 text-right">
                                {u.email !== 'peadetng@gmail.com' && u.id !== currentUser.id && (
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="overflow-x-auto border-2 border-gray-100 rounded-3xl shadow-lg bg-white overflow-visible">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                <th className="p-6">Timestamp</th>
                                <th className="p-6">Actor</th>
                                <th className="p-6">Action</th>
                                <th className="p-6">Details</th>
                                <th className="p-6">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-6 text-xs text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-6 font-black text-gray-900">{log.actorName}</td>
                                    <td className="p-6 font-black text-indigo-600 uppercase text-xs">{log.action}</td>
                                    <td className="p-6 text-gray-500 text-xs italic">{log.details}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.severity === 'info' ? 'bg-blue-50 text-blue-600' : log.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'resources' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(res => (
                        <div key={res.id} className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-royal-50 text-royal-600 rounded-xl"><Library size={24}/></div>
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[8px] font-black uppercase rounded-full">{res.fileType}</span>
                            </div>
                            <h4 className="font-black text-gray-900 truncate">{res.title}</h4>
                            <p className="text-xs text-gray-400 line-clamp-2">{res.description}</p>
                            <a href={res.url} target="_blank" className="mt-auto py-2 bg-royal-900 text-white font-black rounded-xl text-center text-[10px] uppercase tracking-widest hover:bg-black transition-all">Download Asset</a>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-100">
                             <Library size={48} className="mx-auto mb-4 text-gray-200" />
                             <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Assets Deposited</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Performance Insights Modal */}
        {insightUser && insightData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[4rem] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.6)] w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] border-8 border-royal-900">
               <div className="p-12 text-center relative shrink-0 border-b-4 border-gray-100 bg-white">
                  <div className="absolute top-4 right-8"><button onClick={() => setInsightUser(null)} className="p-3 text-gray-300 hover:text-royal-900 hover:bg-gray-100 rounded-2xl transition-all"><X size={32} /></button></div>
                  <div className="flex flex-col items-center gap-4"><div className="w-24 h-24 bg-royal-900 text-white rounded-[2rem] flex items-center justify-center font-serif font-black text-4xl shadow-2xl animate-in pop-in duration-500 border-4 border-gold-500">{insightUser.name.charAt(0)}</div><div><h2 className="text-5xl font-serif font-black text-gray-900 uppercase tracking-tighter leading-none">Member Analytics</h2><div className="flex items-center justify-center gap-4 mt-3"><span className="px-6 py-2 bg-royal-900 text-white rounded-full text-xs font-black uppercase tracking-[0.25em] shadow-lg">{insightUser.name}</span><span className="h-1.5 w-1.5 bg-gold-500 rounded-full"></span><span className="text-royal-800 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Shield size={16} className="fill-gold-500 text-gold-600" /> OFFICIAL SYSTEM AUDIT</span></div></div></div>
               </div>
               <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[#fdfdfd] custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10">
                      <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border-8 border-royal-900 shadow-2xl space-y-8">
                          <div className="flex justify-between items-end"><div><h4 className="font-black text-royal-900 uppercase text-xs tracking-[0.4em] mb-4 bg-royal-50 inline-block px-3 py-1 rounded-lg">NUMBER OF MODULES</h4><p className="text-6xl font-black text-royal-900 leading-none">{insightData.totalModules > 0 ? Math.round((insightData.modulesCompleted / insightData.totalModules) * 100) : 0}% <span className="text-xl font-bold text-gray-400">MASTERED</span></p></div><div className="text-right"><p className="text-2xl font-black text-royal-900 uppercase tracking-widest">{insightData.modulesCompleted} <span className="text-gray-300">/</span> {insightData.totalModules}</p><p className="text-xs font-black text-royal-600 uppercase mt-2 tracking-widest">Mastery Count</p></div></div>
                          <div className="h-5 w-full bg-royal-50 rounded-full overflow-hidden p-1 border-2 border-royal-100 shadow-inner"><div className="h-full bg-gradient-to-r from-royal-900 to-royal-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(30,27,75,0.3)]" style={{ width: `${(insightData.modulesCompleted/insightData.totalModules)*100}%` }}></div></div>
                      </div>
                      <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border-8 border-royal-900 shadow-2xl flex flex-col justify-center animate-glow-pulse delay-75"><h4 className="font-black text-royal-900 uppercase text-xs tracking-[0.4em] mb-6 bg-royal-50 inline-block px-3 py-1 rounded-lg w-fit">TOTAL TIME SPENT</h4><span className="text-5xl font-mono font-black text-royal-900 leading-none tracking-tighter">{formatDigitalTime(insightData.totalTime)}</span><div className="mt-10 flex items-center gap-4 text-emerald-600 border-t pt-6 border-emerald-50"><div className="p-3 bg-emerald-50 rounded-2xl"><Clock size={24} /></div><span className="text-xs font-black uppercase tracking-[0.2em]">Validated Study Time</span></div></div>
                      <div className="lg:col-span-4 bg-royal-950 p-10 rounded-[3.5rem] shadow-[0_20px_60px_-15px_rgba(30,27,75,0.7)] text-white relative overflow-hidden border-8 border-gold-500 animate-glow-pulse delay-100"><div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Target size={200} /></div><h4 className="font-black text-gold-400 uppercase text-[10px] tracking-[0.3em] mb-12 relative z-10 leading-tight">AVERAGE TOTAL SCORE</h4><div className="relative z-10"><p className="text-8xl font-black leading-none drop-shadow-2xl text-gold-400">{insightData.avgScore}%</p><div className="h-2 w-24 bg-gold-500 rounded-full mt-8 shadow-xl shadow-gold-500/40"></div><p className="text-xs font-black text-royal-200 uppercase tracking-widest mt-10 opacity-80">Registry Precision Audit</p></div></div>
                  </div>
               </div>
               <div className="p-12 bg-white border-t-4 border-gray-100 flex justify-center shrink-0"><button onClick={() => setInsightUser(null)} className="group px-20 py-6 bg-royal-900 text-white font-black rounded-[2.5rem] text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all transform hover:scale-[1.05] active:scale-95 flex items-center gap-6 border-b-8 border-royal-950"><ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" /> BACK TO MEMBER LIST</button></div>
            </div>
          </div>
        )}

        {viewingCert && (
            <CertificateGenerator certificate={viewingCert} onClose={() => setViewingCert(null)} />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;