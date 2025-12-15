
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { Users, Loader2, X, CheckCircle, Shield } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onGroupCreated: (updatedUser: User) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, currentUser, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.createGroup(currentUser, groupName);
      onGroupCreated(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-royal-900 p-6 text-white relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gold-500 rounded-lg shadow-lg">
                    <Users size={24} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-serif font-bold">Start a Group</h2>
                    <p className="text-royal-200 text-xs">Become a Mentor & Lead</p>
                 </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
           </div>
        </div>

        <div className="p-6">
           <p className="text-gray-600 mb-6 text-sm leading-relaxed">
             Create a new learning group to invite students, track their progress, and mentor them in their biblical journey. 
             You will be assigned as the <strong>Mentor</strong> of this group.
           </p>
           
           {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-4 flex items-center gap-2">
               <Shield size={16} /> {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Group Name</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-royal-500 focus:ring-4 focus:ring-royal-500/10 outline-none font-bold text-gray-800 placeholder-gray-300"
                  placeholder="e.g. Wednesday Night Youth"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                   <CheckCircle size={16} /> What happens next?
                 </h4>
                 <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Your account role upgrades to <strong>Mentor</strong></li>
                    <li>You receive a unique <strong>Class Code</strong></li>
                    <li>You unlock the <strong>Mentor Dashboard</strong></li>
                 </ul>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !groupName.trim()}
                className="w-full bg-royal-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-royal-900 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Users size={20} />}
                Create My Group
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
