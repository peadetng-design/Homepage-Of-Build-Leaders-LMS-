import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import Tooltip from './Tooltip'; 
import { 
  Users, UserPlus, Shield, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X,
  BookOpen, Edit2, Eye, Plus, Upload, ListPlus, Trash2,
  Download, List, Send, Loader2, Book, Star, Settings, Globe
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  activeTab?: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated';
  onTabChange?: (tab: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, activeTab: propActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests' | 'curated'>('users');
  
  const activeTab = propActiveTab || internalActiveTab;
  const setActiveTab = (tab: any) => {
    if (onTabChange) onTabChange(tab);
    else setInternalActiveTab(tab);
  };

  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonSubMode, setLessonSubMode] = useState<'main' | 'personal'>('main');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STUDENT);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  const isAdmin = currentUser.role === UserRole.ADMIN;
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
      } else if (activeTab === 'logs' && isAdmin) {
        const data = await authService.getLogs(currentUser);
        setLogs(data);
      } else if (activeTab === 'lessons') {
        const data = await lessonService.getLessons(); 
        setLessons(data);
      } else if (activeTab === 'requests' && isMentor) {
        const data = await authService.getJoinRequests(currentUser);
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await authService.deleteUser(currentUser, userId);
      setNotification({ msg: 'User deleted successfully', type: 'success' });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Permanently delete this lesson from the system? This action cannot be undone.")) return;
    try {
      await lessonService.deleteLesson(lessonId);
      setNotification({ msg: 'Lesson permanently deleted from library', type: 'success' });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const toggleCurated = async (lessonId: string) => {
      try {
          const added = await authService.toggleCuratedLesson(currentUser, lessonId);
          setNotification({ 
              msg: added ? "Lesson added to your personal list!" : "Lesson removed from your personal list.", 
              type: 'success' 
          });
          // Note: Curation doesn't delete the lesson, just toggles user association
          fetchData();
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const displayedLessons = lessons.filter(l => {
      if (isAdmin) return true; // Admin sees all management options
      if (lessonSubMode === 'personal') return l.authorId === currentUser.id;
      return l.authorId !== currentUser.id;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="bg-royal-900 px-8 pt-16 pb-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
             <Shield className={isMentor ? "text-blue-400" : isOrg ? "text-slate-400" : "text-gold-500"} /> 
             {isAdmin ? "Admin Console" : isOrg ? "Organization Console" : isMentor ? "Mentor Console" : "Personal Library Manager"}
           </h2>
           <p className="text-royal-200 text-sm mt-1">Manage users, content, and system oversight.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {canManageUsers && (
             <>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>Users</button>
                <button onClick={() => setActiveTab('invites')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'invites' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>Invites</button>
             </>
           )}
           <button onClick={() => setActiveTab('lessons')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'lessons' ? 'bg-gold-500 text-white shadow-lg' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>MANAGE LESSONS</button>
           {isMentor && <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>Requests</button>}
           {isAdmin && <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>Logs</button>}
        </div>
      </div>

      {notification && (
        <div className={`p-3 text-center text-sm font-bold flex justify-between items-center px-6 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      <div className="p-6">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="p-4"><span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{u.role}</span></td>
                      <td className="p-4 text-sm text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td className="p-4 text-right">
                         {u.email !== 'peadetng@gmail.com' && u.id !== currentUser.id && (
                            <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'lessons' && (
           <div className="space-y-6">
              {!isAdmin && (
                  <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-2xl border-2 border-gray-200 shadow-sm">
                      <button 
                        onClick={() => setLessonSubMode('main')}
                        className={`flex-1 py-4 px-6 rounded-lg text-sm font-black flex items-center justify-center gap-3 transition-all ${lessonSubMode === 'main' ? 'bg-royal-800 shadow-xl text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                      >
                         <Globe size={18} /> MAIN LIBRARY LESSONS
                      </button>
                      <button 
                        onClick={() => setLessonSubMode('personal')}
                        className={`flex-1 py-4 px-6 rounded-lg text-sm font-black flex items-center justify-center gap-3 transition-all ${lessonSubMode === 'personal' ? 'bg-royal-800 shadow-xl text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                      >
                         <Book size={18} /> MY UPLOADED LESSONS
                      </button>
                  </div>
              )}

              <div className="flex justify-between items-center mb-4 pt-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${lessonSubMode === 'main' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {lessonSubMode === 'main' ? <Globe size={20}/> : <Book size={20}/>}
                    </div>
                    <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">
                        {isAdmin ? "MASTER SYSTEM LIBRARY" : lessonSubMode === 'main' ? "GLOBAL CURRICULUM (CURATE ONLY)" : "YOUR PERSONAL REPOSITORY"}
                    </h3>
                </div>
                { (isAdmin || lessonSubMode === 'personal') && (
                    <button onClick={() => { setEditingLesson(null); setActiveTab('upload'); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all">
                        <Plus size={18} /> Upload New
                    </button>
                )}
              </div>

              <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xl">
                <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50 border-b-2 border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <th className="p-6">Title & Context</th>
                        <th className="p-6">Authorship</th>
                        <th className="p-6">Personal Standing</th>
                        <th className="p-6 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                     {displayedLessons.map((l) => {
                       const isMyLesson = l.authorId === currentUser.id;
                       const canManage = isAdmin || isMyLesson;
                       const isCurated = currentUser.curatedLessonIds?.includes(l.id);

                       return (
                       <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-6">
                              <div className="font-black text-gray-900 text-lg">{l.title}</div>
                              <div className="flex gap-2 mt-2">
                                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-black uppercase tracking-tighter">{l.lesson_type}</span>
                                  <span className="text-[10px] px-2 py-0.5 bg-royal-50 rounded text-royal-600 font-black uppercase tracking-tighter">{l.targetAudience}</span>
                              </div>
                          </td>
                          <td className="p-6 text-sm text-gray-600">
                              {isMyLesson ? (
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-black text-xs border border-emerald-100">SELF-UPLOADED</span>
                              ) : (
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">{l.author.charAt(0)}</div>
                                      <span className="font-bold text-gray-800">{l.author}</span>
                                  </div>
                              )}
                          </td>
                          <td className="p-6">
                              {isCurated ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-xs font-black border border-gold-100">
                                      <Star size={12} fill="currentColor"/> IN MY LIBRARY
                                  </div>
                              ) : (
                                  <span className="text-xs text-gray-300 font-black uppercase tracking-widest italic">Not Curated</span>
                              )}
                          </td>
                          <td className="p-6 text-right">
                             <div className="flex justify-end items-center gap-3">
                                <Tooltip content={isCurated ? "Remove from my personal list" : "Add to my personal list"}>
                                    <button 
                                        onClick={() => toggleCurated(l.id)} 
                                        className={`p-3 rounded-xl transition-all shadow-sm ${isCurated ? 'bg-gold-500 text-white ring-4 ring-gold-100 scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-royal-600'}`}
                                    >
                                        {isCurated ? <X size={20} /> : <Plus size={20} />}
                                    </button>
                                </Tooltip>
                                
                                {canManage ? (
                                    <>
                                        <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                        <Tooltip content="Edit Personal Content">
                                            <button onClick={() => { setEditingLesson(l); setActiveTab('upload'); }} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200"><Edit2 size={20} /></button>
                                        </Tooltip>
                                        <Tooltip content="PERMANENT System Delete">
                                            <button onClick={() => handleDeleteLesson(l.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"><Trash2 size={20} /></button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Tooltip content="Main Library Content (Read Only)">
                                        <div className="p-3 text-gray-200 bg-gray-50 rounded-xl"><Shield size={20} /></div>
                                    </Tooltip>
                                )}
                             </div>
                          </td>
                       </tr>
                     )})}
                     {displayedLessons.length === 0 && (
                         <tr><td colSpan={4} className="p-24 text-center">
                            <div className="max-w-xs mx-auto text-gray-400">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-black text-sm uppercase tracking-widest">No lessons identified</p>
                                <p className="text-xs mt-1 italic">Start by curating lessons from the global curriculum or upload your own.</p>
                            </div>
                         </td></tr>
                     )}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {activeTab === 'upload' && (
           <LessonUpload 
             currentUser={currentUser}
             initialData={editingLesson || undefined}
             onSuccess={() => { setEditingLesson(null); setActiveTab('lessons'); fetchData(); }}
             onCancel={() => { setEditingLesson(null); setActiveTab('lessons'); }}
           />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;