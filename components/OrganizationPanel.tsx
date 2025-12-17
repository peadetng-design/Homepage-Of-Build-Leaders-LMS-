
import React, { useState, useEffect } from 'react';
import { User, UserRole, Invite } from '../types';
import { authService } from '../services/authService';
import { 
  Users, UserPlus, Trash2, Mail, Copy, Check, BarChart3, 
  Settings, Search, Shield, Building2, UserCheck, RefreshCw, X, Send, Loader2, Link, Plus
} from 'lucide-react';

interface OrganizationPanelProps {
  currentUser: User;
}

const OrganizationPanel: React.FC<OrganizationPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mentors' | 'students' | 'settings'>('overview');
  const [mentors, setMentors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const [showAddMentor, setShowAddMentor] = useState(false);
  const [newMentorData, setNewMentorData] = useState({ name: '', email: '', password: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { mentors: m, students: s } = await authService.getOrganizationMembers(currentUser.id);
      setMentors(m);
      setStudents(s);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createMentorDirectly(currentUser, newMentorData.name, newMentorData.email, newMentorData.password);
      setNotification({ msg: 'Mentor created successfully.', type: 'success' });
      setShowAddMentor(false);
      setNewMentorData({ name: '', email: '', password: '' });
      fetchMembers();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const email = inviteEmail || `invite_${Date.now()}@temp.com`;
      const token = await authService.createInvite(currentUser, email, UserRole.MENTOR);
      const link = `${window.location.origin}?invite=${token}`;
      setInviteLink(link);
      return link;
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
      return null;
    }
  };

  const handleSendMailInvite = async () => {
    if (!inviteEmail) {
        setNotification({ msg: "Please enter an email address", type: 'error' });
        return;
    }
    setIsSendingMail(true);
    try {
        const link = await handleGenerateInvite();
        if (link) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log(`%c[ORG EMAIL] To: ${inviteEmail}\nInvitation: ${link}`, "color: #4f46e5;");
            setNotification({ msg: `Invitation email sent to ${inviteEmail}!`, type: 'success' });
            setInviteEmail('');
            setInviteLink('');
        }
    } catch (err: any) {
        setNotification({ msg: err.message, type: 'error' });
    } finally {
        setIsSendingMail(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await authService.deleteUser(currentUser, userId);
      setNotification({ msg: "Removed successfully.", type: 'success' });
      fetchMembers();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setNotification({ msg: 'Invite copied!', type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
      <div className="bg-slate-900 text-white p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 rounded-lg"><Building2 size={24} /></div>
                <h2 className="text-3xl font-serif font-bold">{currentUser.name}</h2>
             </div>
             <p className="text-slate-400 text-sm">Org Code: <span className="font-mono text-white">{currentUser.organizationCode}</span></p>
          </div>
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
             {['overview', 'mentors', 'students', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-2 rounded-md text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab}
                </button>
             ))}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-3 text-center text-sm font-bold flex justify-between items-center px-6 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      <div className="p-8 flex-1 bg-slate-50">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-3xl font-bold text-gray-900">{students.length}</h3>
                <p className="text-gray-500 text-sm">Students</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-3xl font-bold text-gray-900">{mentors.length}</h3>
                <p className="text-gray-500 text-sm">Mentors</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-3xl font-bold text-gray-900">84%</h3>
                <p className="text-gray-500 text-sm">Average Score</p>
             </div>
          </div>
        )}

        {activeTab === 'mentors' && (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-xl text-gray-800">Staff Management</h3>
                <div className="flex gap-2">
                   <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input 
                        type="email"
                        placeholder="Invite by email..." 
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={handleSendMailInvite}
                     disabled={isSendingMail || !inviteEmail}
                     className="px-4 py-2 bg-royal-800 text-white rounded-lg font-bold hover:bg-royal-950 flex items-center gap-2 text-sm disabled:opacity-50"
                   >
                     {isSendingMail ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} SEND MAIL INVITE
                   </button>
                   <button onClick={() => setShowAddMentor(!showAddMentor)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm"><Plus size={18} /> Add</button>
                </div>
             </div>

             {inviteLink && (
               <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center justify-between">
                  <span className="truncate text-xs font-mono">{inviteLink}</span>
                  <button onClick={copyInvite} className="text-indigo-600 font-bold text-sm ml-4">Copy</button>
               </div>
             )}

             {showAddMentor && (
               <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-in fade-in">
                  <form onSubmit={handleCreateMentor} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <input required placeholder="Name" className="p-2 border rounded-lg" value={newMentorData.name} onChange={e => setNewMentorData({...newMentorData, name: e.target.value})} />
                     <input required type="email" placeholder="Email" className="p-2 border rounded-lg" value={newMentorData.email} onChange={e => setNewMentorData({...newMentorData, email: e.target.value})} />
                     <input required type="password" placeholder="Password" className="p-2 border rounded-lg" value={newMentorData.password} onChange={e => setNewMentorData({...newMentorData, password: e.target.value})} />
                     <button type="submit" className="bg-indigo-600 text-white font-bold rounded-lg px-4">Create</button>
                  </form>
               </div>
             )}

             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                      <tr>
                         <th className="p-4">Name</th>
                         <th className="p-4">Email</th>
                         <th className="p-4 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {mentors.map(m => (
                         <tr key={m.id}>
                            <td className="p-4 font-bold text-gray-900">{m.name}</td>
                            <td className="p-4 text-gray-600">{m.email}</td>
                            <td className="p-4 text-right">
                               <button onClick={() => handleDeleteUser(m.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'students' && (
           <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                       <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {students.map(s => (
                          <tr key={s.id}>
                             <td className="p-4 font-bold text-gray-900">{s.name}</td>
                             <td className="p-4 text-gray-600">{s.email}</td>
                             <td className="p-4 text-right">
                                <button onClick={() => handleDeleteUser(s.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationPanel;
