
import React, { useState, useEffect } from 'react';
import { User, UserRole, ChatChannel } from '../types';
import { authService } from '../services/authService';
import { MessageSquare, Plus, Hash, Users, Globe, Building2, UserPlus, X, Loader2 } from 'lucide-react';
import Tooltip from './Tooltip';

interface ChatPanelProps {
  currentUser: User;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser }) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Creation Form State
  const [newChannelName, setNewChannelName] = useState('');
  const [createType, setCreateType] = useState<string>(''); // Determines the "preset" logic
  
  useEffect(() => {
    loadChannels();
  }, [currentUser]);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getUserChannels(currentUser);
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createType) return;

    // Map the dropdown selection to the specific business logic from the prompt
    let config: Partial<ChatChannel> = { includeRoles: [] };
    let name = newChannelName;

    // ADMIN LOGIC
    if (currentUser.role === UserRole.ADMIN) {
        if (createType === 'all_orgs') {
            config = { includeRoles: [UserRole.ORGANIZATION] };
            name = name || "All Organizations";
        } else if (createType === 'mentors_orgs') {
            config = { includeRoles: [UserRole.MENTOR, UserRole.ORGANIZATION] };
            name = name || "Mentors & Orgs";
        } else if (createType === 'all_mentors') {
            config = { includeRoles: [UserRole.MENTOR] };
            name = name || "All Mentors";
        } else if (createType === 'mentors_students') {
            // "Mentors with their own students ONLY" -> In Admin context, creating a global channel for all mentors + students
            config = { includeRoles: [UserRole.MENTOR], includeStudentsOfMentors: true };
            name = name || "Global Classroom";
        } else if (createType === 'collective') {
            // Every user
            config = { includeRoles: [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR, UserRole.STUDENT, UserRole.PARENT] };
            name = name || "Global Collective";
        }
    }
    // ORGANIZATION LOGIC
    else if (currentUser.role === UserRole.ORGANIZATION) {
        if (createType === 'my_mentors') {
            config = { includeRoles: [UserRole.MENTOR] };
            name = name || "My Staff";
        } else if (createType === 'mentors_students') {
            config = { includeRoles: [UserRole.MENTOR], includeStudentsOfMentors: true };
            name = name || "Org Classroom";
        } else if (createType === 'collective') {
            config = { includeRoles: [UserRole.MENTOR, UserRole.STUDENT] }; // Implied Org Scope in backend
            name = name || "Org Collective";
        }
    }
    // MENTOR LOGIC
    else if (currentUser.role === UserRole.MENTOR) {
        if (createType === 'my_class') {
            config = { includeRoles: [UserRole.STUDENT] }; // Implied Class Scope in backend
            name = name || "My Class";
        }
    }

    try {
        await authService.createChatChannel(currentUser, name, "Group Chat", config);
        setShowCreateModal(false);
        setNewChannelName('');
        setCreateType('');
        loadChannels();
    } catch (e) {
        alert("Failed to create channel");
    }
  };

  const getRocketChatUrl = (channelName: string) => {
      // Simulation: Point to a demo or general channel. In production, this would use the Channel ID/Token.
      // We sanitize the name for the URL simulation
      const safeName = channelName.toLowerCase().replace(/\s+/g, '-');
      // Using open.rocket.chat/channel/general as a visual placeholder or just a generic demo URL
      return `https://open.rocket.chat/channel/${safeName}`; // This likely won't auth, so visual placeholder is safer
  };

  // Helper to render the specific options per role
  const renderCreationOptions = () => {
      if (currentUser.role === UserRole.ADMIN) {
          return (
              <>
                <option value="all_orgs">All Organizations</option>
                <option value="mentors_orgs">All Mentors & Organizations</option>
                <option value="all_mentors">All Mentors Only</option>
                <option value="mentors_students">Mentors + Students (Global)</option>
                <option value="collective">Everyone (Collective)</option>
              </>
          );
      }
      if (currentUser.role === UserRole.ORGANIZATION) {
          return (
              <>
                <option value="my_mentors">My Mentors Only</option>
                <option value="mentors_students">Mentors + Students (My Org)</option>
                <option value="collective">Collective (Everyone in Org)</option>
              </>
          );
      }
      if (currentUser.role === UserRole.MENTOR) {
          return <option value="my_class">My Class Group</option>;
      }
      return null;
  };

  const canCreate = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR].includes(currentUser.role);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <MessageSquare size={20} className="text-royal-600"/> Channels
                </h3>
                {canCreate && (
                    <Tooltip content="Create a new group chat.">
                        <button onClick={() => setShowCreateModal(true)} className="p-2 bg-royal-100 text-royal-700 rounded-lg hover:bg-royal-200 transition-colors">
                            <Plus size={18} />
                        </button>
                    </Tooltip>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : channels.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">No channels yet.</div>
                ) : (
                    channels.map(ch => (
                        <button 
                            key={ch.id}
                            onClick={() => setActiveChannel(ch)}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${activeChannel?.id === ch.id ? 'bg-white shadow text-royal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Hash size={16} className="text-gray-400" />
                            <span className="truncate">{ch.name}</span>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-white">
            {activeChannel ? (
                <>
                    <div className="h-14 border-b border-gray-200 flex items-center px-6 bg-white shrink-0">
                        <Hash size={20} className="text-gray-400 mr-2" />
                        <h2 className="font-bold text-gray-800">{activeChannel.name}</h2>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Rocket.Chat Integration</span>
                    </div>
                    {/* Simulated Rocket.Chat Embed */}
                    <div className="flex-1 bg-gray-100 relative">
                        <iframe 
                            src={getRocketChatUrl(activeChannel.name)} // This is a placeholder behavior
                            className="w-full h-full border-0"
                            title="Rocket Chat Embed"
                        />
                        {/* Overlay for demo purposes since actual embedding requires a real server */}
                        <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                             <div className="bg-white/90 p-4 rounded-xl shadow-lg border border-gray-200 text-center max-w-sm">
                                 <p className="font-bold text-gray-800 mb-2">Simulated Chat Environment</p>
                                 <p className="text-xs text-gray-500">
                                     In a production environment, this area would load the authenticated Rocket.Chat room for <strong>#{activeChannel.name}</strong> via Single Sign-On (SSO).
                                 </p>
                             </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={64} className="mb-4 opacity-20" />
                    <p>Select a channel to start chatting</p>
                </div>
            )}
        </div>

        {/* CREATE MODAL */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-royal-900 p-6 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Create Group Chat</h3>
                        <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
                    </div>
                    <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Group Type</label>
                            <select 
                                value={createType} 
                                onChange={(e) => setCreateType(e.target.value)}
                                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-royal-500 bg-white"
                                required
                            >
                                <option value="" disabled>Select a group type...</option>
                                {renderCreationOptions()}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Channel Name (Optional)</label>
                            <input 
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. Leadership Team 2024"
                                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-royal-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">If left blank, a default name will be used.</p>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-royal-600 text-white font-bold py-3 rounded-xl hover:bg-royal-700 transition-colors">
                                Create Channel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default ChatPanel;
