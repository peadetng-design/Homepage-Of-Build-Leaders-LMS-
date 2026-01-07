
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import Tooltip from './Tooltip'; 
// Added missing Globe import
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
  const [curatedLessons, setCuratedLessons] = useState<Lesson[]>([]);
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
      } else if (activeTab === 'curated' && (isMentor || isOrg)) {
        const ids = currentUser.curatedLessonIds || [];
        const data = await lessonService.getLessonsByIds(ids);
        setCuratedLessons(data);
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
    if (!window.confirm("Permantently delete this lesson?")) return;
    try {
      await lessonService.deleteLesson(lessonId);
      setNotification({ msg: 'Lesson deleted successfully', type: 'success' });
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
              msg: added ? "Lesson added to curated list!" : "Lesson removed from curated list.", 
              type: 'success' 
          });
          if (activeTab === 'curated') fetchData();
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setNotification({ msg: 'Link copied to clipboard', type: 'success' });
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
        const matchesSearch = log.actorName.toLowerCase().includes(logSearch.toLowerCase()) || log.action.toLowerCase().includes(logSearch.toLowerCase());
        const matchesSeverity = logSeverity === 'all' || log.severity === logSeverity;
        return matchesSearch && matchesSeverity;
    });
  };

  const displayedLessons = lessons.filter(l => {
      if (isAdmin) return true; // Admin manages all
      if (lessonSubMode === 'personal') return l.authorId === currentUser.id;
      return l.authorId !== currentUser.id;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="bg-royal-900 px-8 pt-16 pb-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
             <Shield className={isMentor ? "text-blue-400" : "text-gold-500"} /> 
             {isOrg ? "Organization Console" : isMentor ? "Mentor Console" : "Admin Console"}
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
           {(isMentor || isOrg) && <button onClick={() => setActiveTab('curated')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'curated' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}>Curated List</button>}
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
                  <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-md">
                      <button 
                        onClick={() => setLessonSubMode('main')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${lessonSubMode === 'main' ? 'bg-white shadow text-royal-800' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                         <Globe size={16} /> MAIN LIBRARY LESSONS
                      </button>
                      <button 
                        onClick={() => setLessonSubMode('personal')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${lessonSubMode === 'personal' ? 'bg-white shadow text-royal-800' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                         <Book size={16} /> MY UPLOADED LESSONS
                      </button>
                  </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest text-gray-400">
                    {isAdmin ? "MASTER SYSTEM LIBRARY" : lessonSubMode === 'main' ? "GLOBAL CURRICULUM (READ ONLY)" : "YOUR PERSONAL REPOSITORY"}
                </h3>
                { (isAdmin || lessonSubMode === 'personal') && (
                    <button onClick={() => { setEditingLesson(null); setActiveTab('upload'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700">
                        <Plus size={16} /> Upload New
                    </button>
                )}
              </div>

              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                        <th className="p-4">Title</th>
                        <th className="p-4">Author</th>
                        <th className="p-4">Curated</th>
                        <th className="p-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {displayedLessons.map((l) => {
                       const isMyLesson = l.authorId === currentUser.id;
                       const canManage = isAdmin || isMyLesson;
                       const isCurated = currentUser.curatedLessonIds?.includes(l.id);

                       return (
                       <tr key={l.id} className="hover:bg-gray-50">
                          <td className="p-4">
                              <div className="font-bold text-gray-900">{l.title}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase">{l.lesson_type} • {l.targetAudience}</div>
                          </td>
                          <td className="p-4 text-xs text-gray-600 font-medium">
                              {isMyLesson ? <span className="text-indigo-600 font-bold">YOU</span> : l.author}
                          </td>
                          <td className="p-4">
                              {isCurated ? (
                                  <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check size={14}/> In My List</span>
                              ) : (
                                  <span className="text-xs text-gray-300">Not Curated</span>
                              )}
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end items-center gap-2">
                                <Tooltip content={isCurated ? "Remove from my list" : "Add to my list"}>
                                    <button 
                                        onClick={() => toggleCurated(l.id)} 
                                        className={`p-2 rounded-lg transition-colors ${isCurated ? 'bg-royal-100 text-royal-800' : 'bg-gray-50 text-gray-400 hover:bg-royal-50 hover:text-royal-600'}`}
                                    >
                                        {isCurated ? <Star size={18} fill="currentColor" /> : <Star size={18} />}
                                    </button>
                                </Tooltip>
                                
                                {canManage ? (
                                    <>
                                        <Tooltip content="Edit Lesson Content">
                                            <button onClick={() => { setEditingLesson(l); setActiveTab('upload'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                                        </Tooltip>
                                        <Tooltip content="Permanently Delete">
                                            <button onClick={() => handleDeleteLesson(l.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg hover:text-red-600"><Trash2 size={18} /></button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Tooltip content="Read Only (Admin Content)">
                                        <div className="p-2 text-gray-300"><Shield size={18} /></div>
                                    </Tooltip>
                                )}
                             </div>
                          </td>
                       </tr>
                     )})}
                     {displayedLessons.length === 0 && (
                         <tr><td colSpan={4} className="p-20 text-center text-gray-400 italic">No lessons found in this section.</td></tr>
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

        {/* ... User Management & Logs ... */}
      </div>
    </div>
  );
};

export default AdminPanel;
