import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog, Invite } from '../types';
import { authService } from '../services/authService';
import { 
  Users, UserPlus, Shield, Activity, Search, Mail, 
  Link, Copy, Check, AlertTriangle, RefreshCw, X 
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.ADMIN);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await authService.getAllUsers(currentUser);
        setUsers(data);
      } else if (activeTab === 'logs') {
        const data = await authService.getLogs(currentUser);
        setLogs(data);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setNotification({ msg: 'Link copied to clipboard', type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      {/* Header */}
      <div className="bg-royal-900 p-6 text-white flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
             <Shield className="text-gold-500" /> Admin Console
           </h2>
           <p className="text-royal-200 text-sm mt-1">Security, User Management & System Logs</p>
        </div>
        <div className="flex gap-2">
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
           <button 
             onClick={() => setActiveTab('logs')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-royal-900' : 'bg-royal-800 text-royal-200 hover:bg-royal-700'}`}
           >
             Logs
           </button>
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
        
        {/* USERS TAB */}
        {activeTab === 'users' && (
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

        {/* INVITES TAB */}
        {activeTab === 'invites' && (
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

             <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start gap-3">
               <AlertTriangle className="text-amber-500 shrink-0" size={20} />
               <div className="text-sm text-amber-800">
                 <p className="font-bold">Security Note</p>
                 <p>Invited users will be required to set a strong password upon clicking the link. As an admin, ensure you are inviting to the correct email address.</p>
               </div>
             </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
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

      </div>
    </div>
  );
};

export default AdminPanel;