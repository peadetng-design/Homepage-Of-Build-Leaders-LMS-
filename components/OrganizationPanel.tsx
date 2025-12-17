
import React, { useState, useEffect } from 'react';
import { User, UserRole, Invite } from '../types';
import { authService } from '../services/authService';
// Added Plus to the lucide-react imports to fix the error on line 229
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

  // Actions
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
            console.log(`%c[EMAIL SIMULATION] To: ${inviteEmail}\nSubject: Org Invite\nBody: ${link}`, "color: #4f46e5;");
            setNotification({ msg: `Invite email sent to ${inviteEmail}!`, type: 'success' });
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
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await authService.deleteUser(currentUser, userId);
      setNotification({ msg: "User removed from organization.", type: 'success' });
      fetchMembers();
    } catch (err: any) {
      setNotification({ msg: err.message, type: 'error' });
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setNotification({ msg: 'Invite link copied!', type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
      
      {/* Executive Header */}
      <div className="bg-slate-900 text-white p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Building2 size={24} />
                </div>
                <h2 className="text-3xl font-serif font-bold">{currentUser.name}</h2>
             </div>
             <p className="text-slate-400 text-sm">Organization Management Console</p>
             <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                   <Shield size={14} className="text-indigo-400" /> Org Code: <span className="font-mono font-bold text-white tracking-widest">{currentUser.organizationCode}</span>
                </span>
                <span className="text-slate-500">Share this code with existing mentors to link them.</span>
             </div>
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
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">+12%</span>
                   </div>
                   <h3 className="text-3xl font-bold text-gray-900">{students.length}</h3>
                   <p className="text-gray-500 text-sm">Total Students</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><UserCheck size={24} /></div>
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">Active</span>
                   </div>
                   <h3 className="text-3xl font-bold text-gray-900">{mentors.length}</h3>
                   <p className="text-gray-500 text-sm">Mentors / Staff</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart3 size={24} /></div>
                   </div>
                   <h3 className="text-3xl font-bold text-gray-900">84%</h3>
                   <p className="text-gray-500 text-sm">Avg. Organization Score</p>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                   {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                            {i === 1 ? 'JD' : i === 2 ? 'SM' : 'RK'}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">New student joined Mentor Sarah's Group</p>
                            <p className="text-xs text-gray-400">2 hours ago</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* MENTORS TAB */}
        {activeTab === 'mentors' && (
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-xl text-gray-800">Staff Management</h3>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                   <div className="relative flex-1 md:flex-none md:min-w-[200px]">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input 
                        type="email"
                        placeholder="Enter email to invite..." 
                        className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm"
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
                   <button 
                     onClick={() => setShowAddMentor(!showAddMentor)}
                     className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 text-sm"
                   >
                     <Plus size={18} /> Direct Add
                   </button>
                </div>
             </div>

             {inviteLink && (
               <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2 text-indigo-800 text-sm overflow-hidden text-ellipsis mr-4">
                    <Link size={14} /> <span className="truncate">{inviteLink}</span>
                  </div>
                  <button onClick={copyInvite} className="text-indigo-600 font-bold text-sm flex items-center gap-1"><Copy size={16}/> Copy</button>
               </div>
             )}

             {showAddMentor && (
               <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-gray-800 mb-4">Create New Mentor Account</h4>
                  <form onSubmit={handleCreateMentor} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <input required placeholder="Full Name" className="p-3 border rounded-lg" value={newMentorData.name} onChange={e => setNewMentorData({...newMentorData, name: e.target.value})} />
                     <input required type="email" placeholder="Email Address" className="p-3 border rounded-lg" value={newMentorData.email} onChange={e => setNewMentorData({...newMentorData, email: e.target.value})} />
                     <input required type="password" placeholder="Password" className="p-3 border rounded-lg" value={newMentorData.password} onChange={e => setNewMentorData({...newMentorData, password: e.target.value})} />
                     <div className="md:col-span-3 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddMentor(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg">Create Account</button>
                     </div>
                  </form>
               </div>
             )}

             <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                      <tr>
                         <th className="p-4">Name</th>
                         <th className="p-4">Email</th>
                         <th className="p-4">Class Code</th>
                         <th className="p-4">Students</th>
                         <th className="p-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {mentors.map(m => {
                         const studentCount = students.filter(s => s.mentorId === m.id).length;
                         return (
                           <tr key={m.id} className="hover:bg-gray-50">
                              <td className="p-4 font-bold text-gray-900">{m.name}</td>
                              <td className="p-4 text-gray-600">{m.email}</td>
                              <td className="p-4 font-mono text-indigo-600">{m.classCode}</td>
                              <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{studentCount}</span></td>
                              <td className="p-4 text-right">
                                 <button onClick={() => handleDeleteUser(m.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                              </td>
                           </tr>
                         );
                      })}
                      {mentors.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No mentors found.</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-bold text-xl text-gray-800">Student Directory</h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                    <input placeholder="Search students..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                       <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Assigned Mentor</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {students.map(s => {
                          const mentorName = mentors.find(m => m.id === s.mentorId)?.name || 'Unknown';
                          return (
                            <tr key={s.id} className="hover:bg-gray-50">
                               <td className="p-4 font-bold text-gray-900">{s.name}</td>
                               <td className="p-4 text-gray-600">{s.email}</td>
                               <td className="p-4 text-sm"><span className="text-indigo-600 font-medium">{mentorName}</span></td>
                               <td className="p-4 text-right">
                                  <button onClick={() => handleDeleteUser(s.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                               </td>
                            </tr>
                          );
                       })}
                       {students.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No students found.</td></tr>}
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
