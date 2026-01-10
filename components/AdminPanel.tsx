
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest, Resource, NewsItem } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import Tooltip from './Tooltip'; 
import { 
  Users, UserPlus, Shield, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X,
  BookOpen, Edit2, Eye, Plus, Upload, ListPlus, Trash, Trash2,
  Download, List, Send, Loader2, Book, Star, Settings, Globe,
  Clock, FileText, CheckCircle, Activity, ChevronDown, Newspaper, Library, ArrowLeft
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  activeTab?: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'news' | 'resources';
  onTabChange?: (tab: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'news' | 'resources') => void;
  onBack?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, activeTab: propActiveTab, onTabChange, onBack }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated' | 'news' | 'resources'>('users');
  const [curatedSubTab, setCuratedSubTab] = useState<'modules' | 'resources'>('modules');

  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = (tab: any) => {
    if (onTabChange) onTabChange(tab);
    else setInternalActiveTab(tab);
  };

  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [editingContent, setEditingContent] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.CO_ADMIN;
  const isMentor = currentUser.role === UserRole.MENTOR;
  const isOrg = currentUser.role === UserRole.ORGANIZATION;
  const canManageUsers = isAdmin || isOrg || isMentor;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users' && canManageUsers) {
        const data = await authService.getAllUsers(currentUser);
        setUsers(data);
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
      } else if (activeTab === 'curated') {
        const ids = currentUser.curatedLessonIds || [];
        const lData = await lessonService.getLessonsByIds(ids);
        setLessons(lData);
        const rData = await lessonService.getResources();
        setResources(rData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (content: any) => {
      setEditingContent(content);
      setShowUploadModal(true);
  };

  const handleDeleteNews = async (id: string) => {
      if (!window.confirm("Permanently delete this news item?")) return;
      await lessonService.deleteNews(id, currentUser);
      setNotification({ msg: "News item deleted", type: 'success' });
      fetchData();
  };

  const handleDeleteResource = async (id: string) => {
      if (!window.confirm("Permanently delete this resource?")) return;
      await lessonService.deleteResource(id, currentUser);
      setNotification({ msg: "Resource deleted", type: 'success' });
      fetchData();
  };

  const handleDeleteLesson = async (id: string) => {
      if (!window.confirm("Permanently delete this lesson?")) return;
      await lessonService.deleteLesson(id);
      setNotification({ msg: "Lesson deleted", type: 'success' });
      fetchData();
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

  const getContentType = () => {
      if (activeTab === 'lessons') return 'lesson';
      if (activeTab === 'news') return 'news';
      if (activeTab === 'resources') return 'resource';
      return 'lesson';
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[700px] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-royal-900 px-8 pt-16 pb-12 text-white flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b-8 border-gold-500">
        <div className="flex items-center gap-6">
           {onBack && (
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
                {isAdmin ? "MASTER CONSOLE" : isOrg ? "MINISTRY HQ" : isMentor ? "MENTOR CENTER" : "PERSONAL LIST"}
              </h2>
              <p className="text-royal-200 text-xs font-black uppercase tracking-[0.3em] mt-1 opacity-70">Authenticated Security Console</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-royal-950/50 p-2 rounded-2xl border border-white/10 backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full">
           {canManageUsers && (
             <>
                <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Users</button>
                <button onClick={() => setActiveTab('invites')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'invites' ? 'bg-white text-royal-900 shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Invites</button>
             </>
           )}
           <button onClick={() => setActiveTab('lessons')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'lessons' ? 'bg-gold-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Curriculum</button>
           {isAdmin && (
               <>
                <button onClick={() => setActiveTab('news')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'news' ? 'bg-orange-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>News</button>
                <button onClick={() => setActiveTab('resources')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'resources' ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'bg-transparent text-royal-200 hover:bg-white/5 hover:text-white'}`}>Resources</button>
               </>
           )}
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
        
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="overflow-x-auto border-2 border-gray-100 rounded-3xl shadow-lg bg-white">
                <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]"><th className="p-6">User Identity</th><th className="p-6">Access Level</th><th className="p-6">System Heartbeat</th><th className="p-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-sm">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-royal-50/30 transition-all group">
                          <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-700 flex items-center justify-center font-black shadow-inner border border-royal-100 group-hover:scale-110 transition-transform">{u.name.charAt(0)}</div><div><div className="font-black text-gray-900 text-lg leading-tight">{u.name}</div><div className="text-xs text-gray-400 font-medium">{u.email}</div></div></div></td>
                          <td className="p-6"><div className="relative inline-block"><select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} className="appearance-none bg-indigo-50 text-indigo-700 text-[10px] font-black px-6 py-2 rounded-xl border-2 border-indigo-100 outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase tracking-widest cursor-pointer shadow-sm pr-10">{Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400"><ChevronDown size={14}/></div></div></td>
                          <td className="p-6 text-xs text-gray-500 font-mono">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A'}</td>
                          <td className="p-6 text-right">{u.email !== 'peadetng@gmail.com' && u.id !== currentUser.id && (<button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>)}</td>
                        </tr>
                      ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {/* NEWS TAB (Admin Only) */}
        {activeTab === 'news' && (
           <div className="space-y-6">
              <div className="grid gap-4">
                  {news.map(item => (
                      <div key={item.id} className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] flex justify-between items-center shadow-md hover:border-orange-200 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[1.5rem] flex items-center justify-center"><Newspaper size={32}/></div>
                            <div>
                               <h4 className="font-black text-gray-900 text-xl">{item.title}</h4>
                               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category} • {new Date(item.date).toLocaleString()}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)} className="p-3 bg-gray-50 text-gray-500 hover:bg-royal-600 hover:text-white rounded-xl transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => handleDeleteNews(item.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                         </div>
                      </div>
                  ))}
                  {news.length === 0 && <div className="text-center py-20 text-gray-400">No news posted yet.</div>}
              </div>
           </div>
        )}

        {/* RESOURCES TAB (Admin Only) */}
        {activeTab === 'resources' && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resources.map(res => (
                      <div key={res.id} className="bg-white border-2 border-gray-100 p-6 rounded-[2rem] flex justify-between items-center shadow-md hover:border-emerald-200 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Library size={28}/></div>
                            <div>
                               <h4 className="font-black text-gray-900 text-lg leading-tight">{res.title}</h4>
                               <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{res.fileType} • {res.size}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleEdit(res)} className="p-3 bg-gray-50 text-gray-500 hover:bg-royal-600 hover:text-white rounded-xl transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => handleDeleteResource(res.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={18}/></button>
                         </div>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {/* CURATED TAB (MY LIST) - Dual Toggle Added */}
        {activeTab === 'curated' && (
          <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-center">
                  <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner">
                      <button onClick={() => setCuratedSubTab('modules')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${curatedSubTab === 'modules' ? 'bg-purple-600 shadow-xl text-white' : 'text-gray-500'}`}><BookOpen size={18}/> Curated Modules</button>
                      <button onClick={() => setCuratedSubTab('resources')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${curatedSubTab === 'resources' ? 'bg-emerald-600 shadow-xl text-white' : 'text-gray-500'}`}><Library size={18}/> Other Resources</button>
                  </div>
              </div>

              {curatedSubTab === 'modules' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {lessons.map(l => (
                          <div key={l.id} className="bg-white border-2 border-gray-100 p-6 rounded-[2.5rem] shadow-lg hover:shadow-xl transition-all">
                              <span className="px-3 py-1 bg-royal-50 text-royal-600 text-[10px] font-black rounded-full uppercase mb-4 inline-block">{l.lesson_type}</span>
                              <h4 className="text-xl font-black text-gray-900 mb-2 leading-tight">{l.title}</h4>
                              <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{l.description}</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(l)} className="flex-1 py-3 bg-royal-800 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all">CONTINUE</button>
                                <button className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                              </div>
                          </div>
                      ))}
                      {lessons.length === 0 && <div className="col-span-3 text-center py-20 text-gray-400 bg-gray-50 border-4 border-dashed rounded-[3rem]">No modules curated in your list yet.</div>}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {resources.map(res => (
                          <div key={res.id} className="bg-white border-2 border-emerald-100 p-8 rounded-[2.5rem] shadow-lg hover:shadow-emerald-900/10 transition-all flex flex-col items-center text-center">
                              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner"><Library size={40}/></div>
                              <h4 className="text-xl font-black text-gray-900 mb-2">{res.title}</h4>
                              <p className="text-gray-500 text-sm mb-6 line-clamp-2">{res.description}</p>
                              <div className="flex items-center gap-3 w-full">
                                  <a href={res.url} download className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all border-b-4 border-emerald-800"><Download size={16}/> DOWNLOAD ({res.size})</a>
                              </div>
                          </div>
                      ))}
                      {resources.length === 0 && <div className="col-span-3 text-center py-20 text-gray-400">No public resources available for download currently.</div>}
                  </div>
              )}
          </div>
        )}

        {/* AUDIT LOGS & OTHER TABS - Reusing existing logic... */}
        {activeTab === 'lessons' && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map(l => (
                   <div key={l.id} className="bg-white border-2 border-gray-100 p-6 rounded-[2.5rem] shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                         <span className="px-3 py-1 bg-royal-50 text-royal-600 text-[10px] font-black rounded-full uppercase">{l.lesson_type}</span>
                         <div className="flex gap-1">
                            <button onClick={() => handleEdit(l)} className="p-2 bg-gray-50 text-gray-400 hover:text-royal-600 rounded-lg transition-all"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteLesson(l.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 mb-1">{l.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{l.author}</p>
                   </div>
                ))}
              </div>
           </div>
        )}
      </div>

      {showUploadModal && (
          <LessonUpload 
            currentUser={currentUser} 
            onSuccess={() => { setShowUploadModal(false); setEditingContent(null); fetchData(); }} 
            onCancel={() => { setShowUploadModal(false); setEditingContent(null); }} 
            initialData={editingContent}
            initialContentType={getContentType() as any}
          />
      )}
    </div>
  );
};

export default AdminPanel;
