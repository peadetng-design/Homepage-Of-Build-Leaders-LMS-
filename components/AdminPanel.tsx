
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import LessonUpload from './LessonUpload';
import { 
  Users, UserPlus, Shield, Activity, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X,
  BookOpen, FileText, Edit2, Eye, Plus, Upload, ListPlus, UserCheck, UserX
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  activeTab?: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests';
  onTabChange?: (tab: 'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, activeTab: propActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'users' | 'invites' | 'logs' | 'lessons' | 'upload' | 'requests'>('users');
  
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
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.ADMIN);
  const [generatedLink, setGeneratedLink] = useState('');

  // Determine Permissions
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isMentor = currentUser.role === UserRole.MENTOR;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users' && isAdmin) {
        const data = await authService.getAllUsers(currentUser);
        setUsers(data);
      } else if (activeTab === 'logs' && isAdmin) {
        const data = await authService.getLogs(currentUser);
        setLogs(data);
      } else if (activeTab === 'lessons') {
        const data = await lessonService.getLessons(); // Updated to use lessonService
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

  const handleRoleChange = async (targetId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(currentUser, targetId, newRole);
      setNotification({ msg: 'User role updated successfully', type: 'success' });
      fetchData();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await authService.createInvite(currentUser, inviteEmail, inviteRole);
      const link = `${window.location.origin}?invite=${token}`;
      setGeneratedLink(link);
      setNotification({ msg: 'Invite created! Share the link below.', type: 'success' });
      // In a real app, backend sends the email. Here we simulate it.
      console.log(`[SIMULATION] Email sent to ${inviteEmail} with link: ${link}`);
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const handleRequestResponse = async (reqId: string, status: 'accepted' | 'rejected') => {
      try {
          await authService.respondToRequest(reqId, status, currentUser);
          setNotification({ msg: `Request ${status}`, type: 'success' });
          fetchData(); // Refresh list
      } catch (err: any) {
          setNotification({ msg: err.message, type: 'error' });
      }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setNotification({ msg: 'Link copied to clipboard', type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      {/* Header */}
      <div className="bg-royal-900 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
             <Shield className={isMentor ? "text-blue-400" : "text-gold-500"} /> 
             {isMentor ? "Mentor Content Manager" : "Admin Console"}
           </h2>
           <p className="text-royal-200 text-sm mt-1">
             {isMentor ? "Manage Lessons & Team Resources" : "Security, User Management & System Logs"}
           </p>
           {isMentor && currentUser.classCode && (
               <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                   <span className="text-xs text-royal-200 uppercase font-bold">Your Class Code:</span>
                   <span className="font-mono font-bold text-gold-400 tracking-wider text-lg">{currentUser.classCode}</span>
               </div>
           )}
        </div>
        <div className="flex flex-wrap gap-2">
           {isAdmin && (
             <>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Users
                </button>
                <button 
                  onClick={() => setActiveTab('invites')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'invites' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
                >
                  Invites
                </button>
             </>
           )}
           <button 
             onClick={() => setActiveTab('lessons')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'lessons' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
           >
             Lessons
           </button>
           {isMentor && (
               <button 
               onClick={() => setActiveTab('requests')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
             >
               Requests
             </button>
           )}
           {isAdmin && (
             <button 
               onClick={() => setActiveTab('logs')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
             >
               Logs
             </button>
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
        
        {/* USERS TAB (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-4">
            {/* ... Existing Users Table ... */}
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-500"
                />
              </div>
              <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} /></button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-royal-100 text-royal-700 flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:ring-royal-500 focus:border-royal-500"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVITES TAB (Admin Only) */}
        {activeTab === 'invites' && isAdmin && (
          <div className="max-w-2xl mx-auto space-y-8">
             <div className="bg-royal-50 p-6 rounded-xl border border-royal-100">
                <h3 className="text-lg font-bold text-royal-900 mb-4 flex items-center gap-2">
                  <UserPlus size={20} /> Invite New User
                </h3>
                <form onSubmit={handleCreateInvite} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-royal-600 uppercase mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                          <input 
                            type="email" 
                            required
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="w-full pl-9 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-500 outline-none"
                            placeholder="colleague@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-royal-600 uppercase mb-1">Assign Role</label>
                        <select 
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as UserRole)}
                          className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-500 outline-none bg-white"
                        >
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.MENTOR}>Mentor</option>
                          <option value={UserRole.STUDENT}>Student</option>
                          <option value={UserRole.PARENT}>Parent</option>
                        </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-royal-600 text-white font-bold py-3 rounded-lg hover:bg-royal-700 transition-colors shadow-md">
                     Generate Invite Link
                   </button>
                </form>
             </div>

             {generatedLink && (
               <div className="bg-green-50 p-6 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-4">
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
                           <button 
                             onClick={copyToClipboard}
                             className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors"
                           >
                             <Copy size={18} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* LOGS TAB (Admin Only) */}
        {activeTab === 'logs' && isAdmin && (
           <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700">System Audit Trail</h3>
                <span className="text-xs text-gray-500">Last 50 events</span>
              </div>
              <div className="border rounded-xl overflow-hidden">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No logs recorded yet.</div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-4 text-sm">
                         <div className={`mt-1 w-2 h-2 rounded-full ${log.severity === 'critical' ? 'bg-red-500' : log.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`}></div>
                         <div className="flex-1">
                            <div className="flex justify-between">
                               <span className="font-bold text-gray-900">{log.action}</span>
                               <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{log.details}</p>
                            <p className="text-gray-400 text-xs mt-1">Actor: {log.actorName} (ID: ...{log.actorId.slice(-4)})</p>
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
                                    <button 
                                      onClick={() => handleRequestResponse(req.id, 'accepted')}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold text-sm"
                                    >
                                        <UserCheck size={16} /> Accept
                                    </button>
                                    <button 
                                      onClick={() => handleRequestResponse(req.id, 'rejected')}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold text-sm"
                                    >
                                        <UserX size={16} /> Reject
                                    </button>
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
             onSuccess={() => {
                setNotification({ msg: "Lesson published successfully!", type: 'success' });
                setActiveTab('lessons');
             }}
             onCancel={() => setActiveTab('lessons')}
           />
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
                   <button onClick={() => setActiveTab('upload')} className="flex items-center gap-2 px-4 py-2 bg-royal-600 text-white rounded-lg font-bold hover:bg-royal-700 transition-colors text-sm">
                      <Plus size={16} /> Add New
                   </button>
                   <button onClick={fetchData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} /></button>
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
                           const canEdit = isAdmin || (isMentor && lesson.author === currentUser.name);
                           
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
                                      {/* Mentor "Pick" Action */}
                                      {isMentor && (
                                         <button 
                                            onClick={() => setNotification({msg: "Lesson added to your curated list!", type: 'success'})}
                                            title="Add to My List"
                                            className="p-2 text-gold-500 hover:bg-gold-50 rounded"
                                          >
                                            <ListPlus size={16} />
                                          </button>
                                      )}

                                      {/* Edit Action (Conditional) */}
                                      {canEdit ? (
                                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                      ) : (
                                        <button className="p-2 text-gray-300 cursor-not-allowed" title="Read Only"><Edit2 size={16} /></button>
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
