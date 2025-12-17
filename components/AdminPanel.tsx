
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import Tooltip from './Tooltip'; // Import Tooltip
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
  
  // Use prop if provided, otherwise internal state
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
  
  // State for Editing
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STUDENT);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  // Logs Filter State
  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

  // Determine Permissions
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isMentor = currentUser.role === UserRole.MENTOR;
  const isOrg = currentUser.role === UserRole.ORGANIZATION;
  
  // Broader Permission for User Management (Requests per prompt)
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
        // Fetch only lessons in the user's curated list
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
      fetchData(); // Refresh list
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
            // Simulation of email sending
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`%c[EMAIL SIMULATION] To: ${inviteEmail}\nSubject: You are invited to join Build Biblical Leaders\nBody: Hello! You have been invited to join as a ${inviteRole}. Click here to register: ${link}`, "color: #4f46e5; font-weight: bold;");
            setNotification({ msg: `Invite email sent to ${inviteEmail}!`, type: 'success' });
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
      if (!window.confirm("Revoke this invite? The link will no longer work.")) return;
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
              msg: added ? "Lesson added to your curated list!" : "Lesson removed from your curated list.", 
              type: 'success' 
          });
          // Refresh curated list if in that view
          if (activeTab === 'curated') fetchData();
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setNotification({ msg: 'Link copied to clipboard', type: 'success' });
  };

  // --- LOG FILTERING & EXPORT ---
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
      {/* Header */}
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
                <Tooltip content="View and manage all registered user accounts." className="text-gold-400">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                  >
                    Manage Users
                  </button>
                </Tooltip>
                <Tooltip content="Create and manage invitation links for new members." className="text-gold-400">
                  <button 
                    onClick={() => setActiveTab('invites')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'invites' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                  >
                    Invites
                  </button>
                </Tooltip>
             </>
           )}
           <Tooltip content="Upload, edit, and organize educational content." className="text-gold-400">
             <button 
               onClick={() => setActiveTab('lessons')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'lessons' ? 'bg-gold-500 text-white shadow-lg' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
             >
               MANAGE LESSONS
             </button>
           </Tooltip>
           {(isMentor || isOrg) && (
               <Tooltip content="Manage the list of lessons your group sees." className="text-gold-400">
                 <button 
                  onClick={() => setActiveTab('curated')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'curated' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Curated List
                </button>
               </Tooltip>
           )}
           {isMentor && (
               <Tooltip content="Review pending requests from students to join your group." className="text-gold-400">
                 <button 
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Join Requests
                </button>
               </Tooltip>
           )}
           {isAdmin && (
             <Tooltip content="View detailed system activity logs for security and auditing." className="text-gold-400">
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

      {/* Notification */}
      {notification && (
        <div className={`p-3 text-center text-sm font-bold flex justify-between items-center px-6 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        
        {/* USERS TAB (Admin, Org, Mentor) */}
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
              <Tooltip content="Refresh the user list.">
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
                          disabled={!canEdit} // Cannot change root admin role or self
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
                            <Tooltip content="Permanently delete this user account.">
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-50"
                                title="Delete User"
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

        {/* INVITES TAB (Admin, Org, Mentor) */}
        {activeTab === 'invites' && canManageUsers && (
          <div className="space-y-8">
             {/* 1. Create Invite Form */}
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
                          <Tooltip content="Create a unique registration link to share with the new user." className="flex-1">
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2">
                              <Link size={18} /> Generate Link
                            </button>
                          </Tooltip>
                          
                          <Tooltip content="Generate a link and automatically send it to the recipient via email." className="flex-1">
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
                            <p className="text-sm text-green-700 mb-3">
                              Send this link to the user. It will expire in 72 hours.
                            </p>
                            <div className="flex items-center gap-2">
                               <input 
                                 readOnly 
                                 value={generatedLink} 
                                 className="flex-1 bg-white border border-green-200 text-sm p-2 rounded text-gray-600"
                               />
                               <Tooltip content="Copy link to clipboard.">
                                 <button 
                                  onClick={copyToClipboard}
                                  className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors"
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

             {/* 2. Pending Invites List */}
             <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                   <span>Pending Invites</span>
                   <Tooltip content="Refresh the invites list.">
                     <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><RefreshCw size={18} /></button>
                   </Tooltip>
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
                               <td className="p-4 font-bold text-gray-800">{invite.email}</td>
                               <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{invite.role}</span></td>
                               <td className="p-4 text-sm text-gray-500">{invite.invitedBy}</td>
                               <td className="p-4 text-sm text-gray-500">{new Date(invite.createdAt).toLocaleDateString()}</td>
                               <td className="p-4 text-right">
                                  <Tooltip content="Cancel this invitation. The link will become invalid.">
                                    <button 
                                      onClick={() => handleDeleteInvite(invite.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Revoke Invite"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                  </Tooltip>
                               </td>
                            </tr>
                         ))}
                         {pendingInvites.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No pending invites found.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* LOGS TAB (Admin Only) */}
        {activeTab === 'logs' && isAdmin && (
           <div className="space-y-6">
              
              {/* Filter Bar */}
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
                              className="w-full pl-9 p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-royal-500 outline-none"
                          />
                      </div>
                  </div>
                  <div className="w-[150px]">
                       <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Filter size={12}/> Severity</label>
                       <select 
                           value={logSeverity} 
                           onChange={(e) => setLogSeverity(e.target.value as any)}
                           className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-royal-500 outline-none bg-white"
                       >
                           <option value="all">All Levels</option>
                           <option value="info">Info</option>
                           <option value="warning">Warning</option>
                           <option value="critical">Critical</option>
                       </select>
                  </div>
                  <div className="w-[140px]">
                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Start Date</label>
                      <input 
                          type="date" 
                          value={logStartDate}
                          onChange={(e) => setLogStartDate(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                  </div>
                  <div className="w-[140px]">
                      <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
                      <input 
                          type="date" 
                          value={logEndDate}
                          onChange={(e) => setLogEndDate(e.target.value)}
                          className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                  </div>
              </div>

              {/* Header & Export */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-gray-700">System Audit Trail</h3>
                   <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{getFilteredLogs().length} Events</span>
                </div>
                <Tooltip content="Download the current log view as a CSV file.">
                  <button 
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                      <Download size={16} /> Export CSV
                  </button>
                </Tooltip>
              </div>
              
              {/* Logs List */}
              <div className="border rounded-xl overflow-hidden shadow-sm">
                {getFilteredLogs().length === 0 ? (
                  <div className="p-12 text-center text-gray-400 bg-gray-50">
                      <div className="mb-2"><Search size={32} className="mx-auto opacity-30"/></div>
                      No logs found matching your filters.
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar bg-white">
                    {getFilteredLogs().map(log => (
                      <div key={log.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-4 text-sm transition-colors group">
                         <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${log.severity === 'critical' ? 'bg-red-500 shadow-sm shadow-red-200' : log.severity === 'warning' ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-blue-400'}`}></div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                               <span className="font-bold text-gray-900 group-hover:text-royal-800 transition-colors">{log.action}</span>
                               <span className="text-gray-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-600 mb-1 break-words">{log.details}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1"><Users size={10}/> {log.actorName}</span>
                                <span className="font-mono opacity-50 text-[10px]">ID: {log.actorId.slice(0,8)}...</span>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        )}

        {/* REQUESTS TAB (Mentor Only) */}
        {activeTab === 'requests' && isMentor && (
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 mb-4">Pending Class Join Requests</h3>
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 border border-dashed border-gray-300 rounded-xl">
                        No pending requests. Share your class code to invite students.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        {req.studentName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{req.studentName}</p>
                                        <p className="text-xs text-gray-500">Requested: {new Date(req.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Tooltip content="Approve this student to join your class.">
                                      <button 
                                        onClick={() => handleRequestResponse(req.id, 'accepted')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold text-sm"
                                      >
                                          <UserCheck size={16} /> Accept
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Deny this request.">
                                      <button 
                                        onClick={() => handleRequestResponse(req.id, 'rejected')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold text-sm"
                                      >
                                          <UserX size={16} /> Reject
                                      </button>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* UPLOAD LESSON TAB (Admin or Mentor) */}
        {activeTab === 'upload' && (
           <LessonUpload 
             currentUser={currentUser}
             initialData={editingLesson || undefined}
             onSuccess={() => {
                setNotification({ msg: editingLesson ? "Lesson updated successfully!" : "Lesson published successfully!", type: 'success' });
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

        {/* CURATED LIST TAB (Mentor or Org) */}
        {activeTab === 'curated' && (isMentor || isOrg) && (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                       <ListPlus size={20} className="text-purple-500" /> 
                       Your Curated Lesson List
                    </h3>
                    <Tooltip content="Refresh your curated list.">
                       <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} /></button>
                    </Tooltip>
                </div>
                
                {curatedLessons.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="mb-4 inline-flex p-4 bg-white rounded-full shadow-sm"><ListPlus size={32} className="text-purple-300"/></div>
                        <h4 className="font-bold text-gray-700 text-lg mb-1">Your list is empty.</h4>
                        <p className="text-gray-500 text-sm">Go to the "Manage Lessons" tab and click the <ListPlus size={14} className="inline"/> icon to add lessons for your group.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {curatedLessons.map(lesson => (
                            <div key={lesson.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors">
                                <div>
                                    <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                                    <p className="text-xs text-gray-500">{lesson.category} • {lesson.author}</p>
                                </div>
                                <Tooltip content="Remove from curated list.">
                                    <button 
                                      onClick={() => toggleCurated(lesson.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* LESSONS LIST TAB (Admin or Mentor) */}
        {activeTab === 'lessons' && (
           <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search lessons..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-500"
                  />
                </div>
                <div className="flex gap-2">
                   <Tooltip content="Create a new lesson from scratch or upload a file.">
                     <button onClick={() => { setEditingLesson(null); setActiveTab('upload'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-sm">
                        <Plus size={16} /> Add New
                     </button>
                   </Tooltip>
                   <Tooltip content="Refresh the lessons list.">
                     <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} /></button>
                   </Tooltip>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Author</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {lessons.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">No lessons found. Upload one to get started.</td></tr>
                     ) : (
                        lessons.map((lesson) => {
                           // Logic: Mentor can only edit their own. Everyone sees everything.
                           // Admin can edit all. Org can edit their own.
                           const canEdit = isAdmin || (lesson.author === currentUser.name);
                           const isCurated = currentUser.curatedLessonIds?.includes(lesson.id);
                           
                           return (
                             <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                   <div className="font-bold text-gray-900">{lesson.title}</div>
                                   <div className="text-xs text-gray-400 flex items-center gap-1">
                                      <Eye size={10} /> {lesson.views} views
                                   </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                   <span className="px-2 py-1 bg-gray-100 rounded text-xs">{lesson.category}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{lesson.author}</td>
                                <td className="p-4">
                                   <span className={`px-2 py-1 rounded-full text-xs font-bold ${lesson.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {lesson.status}
                                   </span>
                                </td>
                                <td className="p-4 text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      {/* Mentor/Org "Pick" Action */}
                                      {(isMentor || isOrg) && (
                                         <Tooltip content={isCurated ? "Remove from your curated list." : "Add to your curated list for students."}>
                                            <button 
                                              onClick={() => toggleCurated(lesson.id)}
                                              className={`p-2 rounded transition-colors ${isCurated ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                                            >
                                              {isCurated ? <Check size={16} /> : <ListPlus size={16} />}
                                            </button>
                                          </Tooltip>
                                      )}

                                      {/* Edit Action (Conditional) */}
                                      {canEdit ? (
                                        <Tooltip content="Edit this lesson's content and settings.">
                                          <button 
                                            onClick={() => {
                                              setEditingLesson(lesson);
                                              setActiveTab('upload');
                                            }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                        </Tooltip>
                                      ) : (
                                        <Tooltip content="You cannot edit lessons created by others.">
                                          <button className="p-2 text-gray-300 cursor-not-allowed" title="Read Only"><Edit2 size={16} /></button>
                                        </Tooltip>
                                      )}
                                   </div>
                                </td>
                             </tr>
                           );
                        })
                     )}
                  </tbody>
                </table>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
