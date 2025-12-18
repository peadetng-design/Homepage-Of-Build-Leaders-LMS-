
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import Tooltip from './Tooltip'; 
import { 
  Users, UserPlus, Shield, Activity, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X,
  BookOpen, FileText, Edit2, Eye, Plus, Upload, ListPlus, UserCheck, UserX, Trash2,
  Download, Filter, Calendar, List, Send, Loader2
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
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
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

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STUDENT);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

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
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await authService.deleteUser(currentUser, userId);
      setNotification({ msg: 'User deleted successfully', type: 'success' });
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
      if (!isSendingMail) {
        setNotification({ msg: 'Invite created! Share the link below.', type: 'success' });
      }
      fetchData(); 
      return link;
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
      return null;
    }
  };

  const handleSendMailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
        setNotification({ msg: "Please enter an email address", type: 'error' });
        return;
    }
    setIsSendingMail(true);
    setNotification(null);

    try {
        const link = await handleCreateInvite();
        if (link) {
            // Simulated Email Service
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`%c[EMAIL SERVICE] Sending to: ${inviteEmail}\nLink: ${link}`, "color: #4f46e5; font-weight: bold;");
            setNotification({ msg: `Invitation email sent to ${inviteEmail}!`, type: 'success' });
            setInviteEmail('');
            setGeneratedLink('');
        }
    } catch (err: any) {
        setNotification({ msg: err.message, type: 'error' });
    } finally {
        setIsSendingMail(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
      if (!window.confirm("Revoke this invite?")) return;
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
        const matchesSearch = 
            log.actorName.toLowerCase().includes(logSearch.toLowerCase()) || 
            log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.details.toLowerCase().includes(logSearch.toLowerCase());
        
        const matchesSeverity = logSeverity === 'all' || log.severity === logSeverity;

        let matchesDate = true;
        if (logStartDate) {
            matchesDate = matchesDate && new Date(log.timestamp) >= new Date(logStartDate);
        }
        if (logEndDate) {
            const end = new Date(logEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(log.timestamp) <= end;
        }

        return matchesSearch && matchesSeverity && matchesDate;
    });
  };

  const handleExportCSV = () => {
    const data = getFilteredLogs();
    if (data.length === 0) {
        setNotification({ msg: "No logs to export", type: 'error' });
        return;
    }
    
    const headers = ['Timestamp', 'Severity', 'Action', 'Actor Name', 'Actor ID', 'Details'];
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const cleanDetails = row.details.replace(/"/g, '""').replace(/\n/g, ' '); 
        const values = [
            `"${new Date(row.timestamp).toLocaleString()}"`,
            row.severity,
            `"${row.action}"`,
            `"${row.actorName}"`,
            row.actorId,
            `"${cleanDetails}"`
        ];
        csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setNotification({ msg: "Export started", type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      <div className="bg-royal-900 px-8 pt-16 pb-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
             <Shield className={isMentor ? "text-blue-400" : "text-gold-500"} /> 
             {isOrg ? "Organization Console" : isMentor ? "Mentor Console" : "Admin Console"}
           </h2>
           <p className="text-royal-200 text-sm mt-1">
             {isOrg ? "Manage your organization's users and content." : isMentor ? "Manage your students, lessons and invites." : "Security, User Management & System Logs"}
           </p>
           {isMentor && currentUser.classCode && (
               <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                   <span className="text-xs text-royal-200 uppercase font-bold">Your Class Code:</span>
                   <span className="font-mono font-bold text-gold-400 tracking-wider text-lg">{currentUser.classCode}</span>
               </div>
           )}
        </div>
        <div className="flex flex-wrap gap-2">
           {canManageUsers && (
             <>
                <Tooltip content="Manage registered user accounts.">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                  >
                    Manage Users
                  </button>
                </Tooltip>
                <Tooltip content="Manage invitations.">
                  <button 
                    onClick={() => setActiveTab('invites')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'invites' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                  >
                    Invites
                  </button>
                </Tooltip>
             </>
           )}
           <Tooltip content="Manage educational content.">
             <button 
               onClick={() => setActiveTab('lessons')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'lessons' ? 'bg-gold-500 text-white shadow-lg' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
             >
               MANAGE LESSONS
             </button>
           </Tooltip>
           {(isMentor || isOrg) && (
               <Tooltip content="Your curated lesson list.">
                 <button 
                  onClick={() => setActiveTab('curated')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'curated' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Curated List
                </button>
               </Tooltip>
           )}
           {isMentor && (
               <Tooltip content="Review student requests.">
                 <button 
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Join Requests
                </button>
               </Tooltip>
           )}
           {isAdmin && (
             <Tooltip content="View system activity logs.">
               <button 
                 onClick={() => setActiveTab('logs')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
               >
                 Logs
               </button>
             </Tooltip>
           )}
        </div>
      </div>

      {notification && (
        <div className={`p-3 text-center text-sm font-bold flex justify-between items-center px-6 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      <div className="p-6">
        {activeTab === 'users' && canManageUsers && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-500"
                />
              </div>
              <Tooltip content="Refresh list.">
                <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} /></button>
              </Tooltip>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const isProtected = user.email === 'peadetng@gmail.com';
                    const isSelf = user.id === currentUser.id;
                    const canEdit = !isProtected && !isSelf;
                    
                    return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-royal-100 text-royal-700 flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.name} {isProtected && <span className="text-xs text-gold-600 bg-gold-50 px-1 rounded border border-gold-200">Root</span>}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          disabled={!canEdit}
                          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:ring-royal-500 focus:border-royal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {Object.values(UserRole).filter(r => r !== 'GUEST').map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Active
                        </span>
                      </td>
                      <td className="p-4 text-right">
                         {canEdit && (
                            <Tooltip content="Delete user.">
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </Tooltip>
                         )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invites' && canManageUsers && (
          <div className="space-y-8">
             <div className="max-w-2xl mx-auto">
                 <div className="bg-royal-50 p-6 rounded-xl border border-royal-100">
                    <h3 className="text-lg font-bold text-royal-900 mb-4 flex items-center gap-2">
                      <UserPlus size={20} /> Invite New User
                    </h3>
                    <form onSubmit={handleCreateInvite} className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                              <input 
                                type="email" 
                                required
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="w-full pl-9 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="colleague@example.com"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-1">Assign Role</label>
                            <select 
                              value={inviteRole}
                              onChange={e => setInviteRole(e.target.value as UserRole)}
                              className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                              <option value={UserRole.STUDENT}>Student</option>
                              <option value={UserRole.MENTOR}>Mentor</option>
                              <option value={UserRole.PARENT}>Parent</option>
                              <option value={UserRole.ORGANIZATION}>Organization</option>
                              {isAdmin && <option value={UserRole.ADMIN}>Admin</option>}
                            </select>
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Tooltip content="Create a unique link." className="flex-1">
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2">
                              <Link size={18} /> Generate Link
                            </button>
                          </Tooltip>
                          
                          <Tooltip content="Generate and email the link." className="flex-1">
                            <button 
                              onClick={handleSendMailInvite}
                              disabled={isSendingMail}
                              className="w-full bg-royal-800 text-white font-bold py-3 rounded-lg hover:bg-royal-950 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isSendingMail ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                              SEND MAIL INVITE
                            </button>
                          </Tooltip>
                       </div>
                    </form>
                 </div>

                 {generatedLink && !isSendingMail && (
                   <div className="bg-green-50 p-6 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-4 mt-4">
                      <div className="flex items-start gap-4">
                         <div className="bg-green-100 p-2 rounded-full text-green-600">
                           <Link size={24} />
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-green-800 mb-2">Invite Link Generated</h4>
                            <div className="flex items-center gap-2">
                               <input 
                                 readOnly 
                                 value={generatedLink} 
                                 className="flex-1 bg-white border border-green-200 text-sm p-2 rounded text-gray-600"
                               />
                               <Tooltip content="Copy to clipboard.">
                                 <button 
                                  onClick={copyToClipboard}
                                  className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                                 >
                                   <Copy size={18} />
                                 </button>
                               </Tooltip>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
             </div>

             <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                   <span>Pending Invites</span>
                   <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><RefreshCw size={18} /></button>
                </h3>
                
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                         <tr>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Invited By</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {pendingInvites.map(invite => (
                            <tr key={invite.id} className="hover:bg-gray-50">
                               <td className="p-4 font-bold text-gray-900">{invite.email}</td>
                               <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{invite.role}</span></td>
                               <td className="p-4 text-sm text-gray-500">{invite.invitedBy}</td>
                               <td className="p-4 text-sm text-gray-500">{new Date(invite.createdAt).toLocaleDateString()}</td>
                               <td className="p-4 text-right">
                                  <button onClick={() => handleDeleteInvite(invite.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                               </td>
                            </tr>
                         ))}
                         {pendingInvites.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No pending invites.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'logs' && isAdmin && (
           <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Search</label>
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                              type="text" 
                              placeholder="Action, User, or Details..." 
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                              className="w-full pl-9 p-2 rounded-lg border border-gray-300 text-sm outline-none"
                          />
                      </div>
                  </div>
                  <div className="w-[150px]">
                       <label className="block text-xs font-bold text-gray-500 mb-1">Severity</label>
                       <select 
                           value={logSeverity} 
                           onChange={(e) => setLogSeverity(e.target.value as any)}
                           className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white"
                       >
                           <option value="all">All</option>
                           <option value="info">Info</option>
                           <option value="warning">Warning</option>
                           <option value="critical">Critical</option>
                       </select>
                  </div>
                  <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 font-bold rounded-lg text-sm"><Download size={16} /> Export</button>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar bg-white">
                  {getFilteredLogs().map(log => (
                    <div key={log.id} className="p-4 border-b border-gray-100 flex items-start gap-4 text-sm">
                       <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${log.severity === 'critical' ? 'bg-red-500' : log.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`}></div>
                       <div className="flex-1">
                          <div className="flex justify-between mb-1">
                             <span className="font-bold text-gray-900">{log.action}</span>
                             <span className="text-gray-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-600">{log.details}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        )}

        {activeTab === 'requests' && isMentor && (
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700">Pending Class Join Requests</h3>
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 border border-dashed border-gray-300 rounded-xl">No requests.</div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                <p className="font-bold text-gray-900">{req.studentName}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRequestResponse(req.id, 'accepted')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-bold text-sm">Accept</button>
                                    <button onClick={() => handleRequestResponse(req.id, 'rejected')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-bold text-sm">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'lessons' && (
           <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Search lessons..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none" />
                </div>
                <button onClick={() => { setEditingLesson(null); setActiveTab('upload'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm"><Plus size={16} /> Add New</button>
              </div>

              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {lessons.map((lesson) => (
                       <tr key={lesson.id} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{lesson.title}</td>
                          <td className="p-4 text-xs text-gray-600">{lesson.category}</td>
                          <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{lesson.status}</span></td>
                          <td className="p-4 text-right">
                             <button onClick={() => toggleCurated(lesson.id)} className={`p-2 rounded ${currentUser.curatedLessonIds?.includes(lesson.id) ? 'text-purple-600' : 'text-gray-400'}`}><ListPlus size={16} /></button>
                             <button onClick={() => { setEditingLesson(lesson); setActiveTab('upload'); }} className="p-2 text-blue-500"><Edit2 size={16} /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {/* Missing 'upload' tab logic to show editor when Add New or Edit is clicked */}
        {activeTab === 'upload' && (
           <LessonUpload 
             currentUser={currentUser}
             initialData={editingLesson || undefined}
             onSuccess={() => {
                setEditingLesson(null);
                setActiveTab('lessons');
                fetchData();
             }}
             onCancel={() => {
                setEditingLesson(null);
                setActiveTab('lessons');
             }}
           />
        )}

        {activeTab === 'curated' && (isMentor || isOrg) && (
            <div className="grid gap-4">
                <h3 className="font-bold text-gray-700">Your Curated Lessons</h3>
                {curatedLessons.map(lesson => (
                    <div key={lesson.id} className="bg-white p-4 border rounded-xl flex justify-between items-center shadow-sm">
                        <p className="font-bold text-gray-900">{lesson.title}</p>
                        <button onClick={() => toggleCurated(lesson.id)} className="text-red-400 hover:text-red-600"><X size={18} /></button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
