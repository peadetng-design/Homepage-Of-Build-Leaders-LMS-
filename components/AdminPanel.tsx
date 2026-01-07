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
  Download, List, Send, Loader2, Book, Star, Settings, Globe,
  Clock, FileText, CheckCircle
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
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
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
      } else if (activeTab === 'curated') {
        const ids = currentUser.curatedLessonIds || [];
        const data = await lessonService.getLessonsByIds(ids);
        setLessons(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(currentUser, targetId, newRole);
      setNotification({ msg: 'User role updated successfully', type: 'success' });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

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

  const handleCreateInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const token = await authService.createInvite(currentUser, inviteEmail, inviteRole);
      const link = `${window.location.origin}?invite=${token}`;
      setGeneratedLink(link);
      setNotification({ msg: 'Invite created!', type: 'success' });
      fetchData(); 
      return link;
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
      return null;
    }
  };

  const handleSendMailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMail(true);
    try {
        const link = await handleCreateInvite();
        if (link) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setNotification({ msg: `Invitation email sent to ${inviteEmail}!`, type: 'success' });
            setInviteEmail('');
            setGeneratedLink('');
        }
    } finally {
        setIsSendingMail(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
      try {
          await authService.deleteInvite(currentUser, inviteId);
          setNotification({ msg: 'Invite revoked successfully', type: 'success' });
          fetchData();
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const handleRequestResponse = async (reqId: string, status: 'accepted' | 'rejected') => {
      try {
          await authService.respondToRequest(reqId, status, currentUser);
          setNotification({ msg: `Request ${status}`, type: 'success' });
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
          fetchData();
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
        const matchesSearch = log.actorName.toLowerCase().includes(logSearch.toLowerCase()) || log.action.toLowerCase().includes(logSearch.toLowerCase());
        const matchesSeverity = logSeverity === 'all' || log.severity === logSeverity;
        return matchesSearch && matchesSeverity;
    });
  };

  const displayedLessons = lessons.filter(l => {
      if (activeTab === 'curated') return true; 
      if (isAdmin) return true; 
      if (lessonSubMode === 'personal') return l.authorId === currentUser.id;
      return l.authorId !== currentUser.id;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      {/* Header with Navigation */}
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
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg uppercase tracking-widest text-xs">Directory Management</h3>
                <span className="bg-royal-50 text-royal-700 px-3 py-1 rounded-full text-xs font-bold">{users.length} Users Found</span>
             </div>
             <div className="overflow-x-auto border-2 border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-xs font-black text-gray-500 uppercase tracking-widest">
                        <th className="p-4">User Identity</th>
                        <th className="p-4">Role / Access</th>
                        <th className="p-4">Last Activity</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-royal-100 text-royal-700 flex items-center justify-center font-black">{u.name.charAt(0)}</div>
                                <div>
                                    <div className="font-bold text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </div>
                            </div>
                          </td>
                          <td className="p-4">
                             <select 
                               value={u.role}
                               onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                               className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-lg border-2 border-indigo-100 outline-none focus:border-indigo-500 transition-all"
                             >
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          </td>
                          <td className="p-4 text-sm text-gray-500 font-medium">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4 text-right">
                             {u.email !== 'peadetng@gmail.com' && u.id !== currentUser.id && (
                                <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {/* INVITES TAB */}
        {activeTab === 'invites' && (
          <div className="space-y-8 max-w-4xl mx-auto">
             <div className="bg-royal-50 p-8 rounded-[2rem] border-2 border-royal-100 shadow-inner">
                <h3 className="font-black text-royal-900 text-xl mb-6 flex items-center gap-2"><UserPlus /> Issue Security Credentials</h3>
                <form onSubmit={handleSendMailInvite} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-royal-600 uppercase mb-2 ml-1">Email Address</label>
                        <input type="email" required placeholder="recipient@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-royal-500 bg-white font-bold" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-royal-600 uppercase mb-2 ml-1">Assigned Role</label>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-royal-500 bg-white font-bold">
                            <option value={UserRole.STUDENT}>STUDENT</option>
                            <option value={UserRole.MENTOR}>MENTOR</option>
                            <option value={UserRole.PARENT}>PARENT</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={isSendingMail} className="w-full py-4 bg-royal-800 text-white font-black rounded-xl hover:bg-royal-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-royal-900/20">
                            {isSendingMail ? <Loader2 className="animate-spin" /> : <Send size={18}/>} SEND INVITE
                        </button>
                    </div>
                </form>
             </div>

             <div className="space-y-4">
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Pending Invitations ({pendingInvites.length})</h3>
                <div className="grid gap-3">
                   {pendingInvites.map(inv => (
                      <div key={inv.id} className="bg-white border-2 border-gray-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Mail /></div>
                            <div>
                                <div className="font-black text-gray-900">{inv.email}</div>
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Invited as {inv.role}</div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?invite=${inv.token}`); setNotification({msg: 'Link copied!', type: 'success'}); }} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 flex items-center gap-2"><Copy size={14}/> Copy Link</button>
                             <button onClick={() => handleDeleteInvite(inv.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X size={18}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && isAdmin && (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                   <input type="text" placeholder="Filter audit trail..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full pl-10 p-3 border-2 border-gray-100 rounded-xl" />
                </div>
                <div className="flex gap-2">
                   {['all', 'info', 'warning', 'critical'].map(sev => (
                      <button key={sev} onClick={() => setLogSeverity(sev as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${logSeverity === sev ? 'bg-royal-800 text-white' : 'bg-gray-100 text-gray-500'}`}>{sev}</button>
                   ))}
                </div>
             </div>
             <div className="bg-gray-950 rounded-2xl p-4 overflow-x-auto shadow-2xl border-4 border-royal-900">
                <table className="w-full text-left text-xs font-mono">
                   <thead>
                      <tr className="text-gray-500 border-b border-gray-800 uppercase tracking-tighter">
                         <th className="p-4">Timestamp</th>
                         <th className="p-4">Actor</th>
                         <th className="p-4">Action</th>
                         <th className="p-4">Details</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-900">
                      {getFilteredLogs().map(log => (
                         <tr key={log.id} className="text-gray-300 hover:bg-white/5 transition-colors">
                            <td className="p-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-4 text-royal-400 font-bold">{log.actorName}</td>
                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${log.severity === 'critical' ? 'bg-red-500 text-white' : log.severity === 'warning' ? 'bg-amber-500 text-black' : 'bg-green-500 text-white'}`}>{log.action}</span></td>
                            <td className="p-4 opacity-70">{log.details}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* REQUESTS TAB (Mentor Only) */}
        {activeTab === 'requests' && isMentor && (
            <div className="space-y-6 max-w-4xl mx-auto">
                <h3 className="font-black text-gray-900 text-xl flex items-center gap-3"><Users className="text-royal-500"/> Student Join Requests</h3>
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex justify-between items-center shadow-lg hover:border-royal-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-royal-100 text-royal-600 rounded-2xl flex items-center justify-center font-black text-xl">{req.studentName.charAt(0)}</div>
                                <div>
                                    <div className="font-black text-gray-900 text-lg">{req.studentName}</div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> {new Date(req.timestamp).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleRequestResponse(req.id, 'accepted')} className="px-6 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"><Check size={18}/> ACCEPT</button>
                                <button onClick={() => handleRequestResponse(req.id, 'rejected')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black hover:bg-red-50 hover:text-red-600 transition-all">DECLINE</button>
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-200">
                            <Users size={64} className="mx-auto text-gray-300 mb-4 opacity-30" />
                            <p className="font-black text-gray-400 uppercase tracking-widest">No pending requests</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* LESSONS TAB (Consolidated Management & Curation) */}
        {activeTab === 'lessons' && (
           <div className="space-y-6">
              {!isAdmin && (
                  <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-2xl border-2 border-gray-200 shadow-sm mb-6">
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

              <div className="flex justify-between items-center mb-4">
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

        {/* UPLOAD MODAL */}
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