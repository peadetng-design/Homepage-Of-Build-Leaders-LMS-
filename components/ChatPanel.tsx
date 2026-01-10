
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, ChatChannel, ChatMessage, ChatAttachment } from '../types';
import { authService } from '../services/authService';
import { MessageSquare, Plus, Hash, Users, Globe, Building2, UserPlus, X, Loader2, Send, Shield, User as UserIcon, Edit2, Check, FileText, Download, Image as ImageIcon, Clock } from 'lucide-react';
import Tooltip from './Tooltip';

interface ChatPanelProps {
  currentUser: User;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser }) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editing Channel State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Attachment State
  const [selectedFile, setSelectedFile] = useState<ChatAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Creation Form State
  const [newChannelName, setNewChannelName] = useState('');
  const [createType, setCreateType] = useState<string>(''); 
  
  useEffect(() => {
    loadChannels();
  }, [currentUser.role]); 

  useEffect(() => {
    if (activeChannel) {
        loadMessages(activeChannel.id);
        setIsEditingName(false); // Reset edit state when switching
        
        // Polling for simulation of real-time (every 3s)
        const interval = setInterval(() => loadMessages(activeChannel.id), 3000);
        return () => clearInterval(interval);
    }
  }, [activeChannel]);

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getUserChannels(currentUser);
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      } else if (activeChannel) {
        // Sync active channel name if it changed
        const refreshed = data.find(c => c.id === activeChannel.id);
        if (refreshed) setActiveChannel(refreshed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
      const data = await authService.getChannelMessages(channelId);
      setMessages(data);
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              setSelectedFile({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: ev.target.result as string
              });
          }
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!newMessage.trim() && !selectedFile) || !activeChannel) return;

      const text = newMessage;
      const attachment = selectedFile || undefined;
      
      setNewMessage(''); 
      setSelectedFile(null);

      await authService.sendMessage(currentUser, activeChannel.id, text, attachment);
      loadMessages(activeChannel.id);
  };

  const handleSaveChannelName = async () => {
      if (!activeChannel || !editedName.trim()) return;
      try {
          await authService.updateChannelName(currentUser, activeChannel.id, editedName);
          setIsEditingName(false);
          loadChannels();
      } catch (e) {
          alert("Failed to update channel name");
      }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createType) return;

    let config: Partial<ChatChannel> = { includeRoles: [] };
    let name = newChannelName;

    if (currentUser.role === UserRole.ADMIN) {
        if (createType === 'all_orgs') { config = { includeRoles: [UserRole.ORGANIZATION] }; name = name || "All Organizations"; }
        else if (createType === 'mentors_orgs') { config = { includeRoles: [UserRole.MENTOR, UserRole.ORGANIZATION] }; name = name || "Mentors & Orgs"; }
        else if (createType === 'all_mentors') { config = { includeRoles: [UserRole.MENTOR] }; name = name || "All Mentors"; }
        else if (createType === 'mentors_students') { config = { includeRoles: [UserRole.MENTOR], includeStudentsOfMentors: true }; name = name || "Global Classroom"; }
        else if (createType === 'collective') { config = { includeRoles: [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR, UserRole.STUDENT, UserRole.PARENT] }; name = name || "Global Collective"; }
    }
    else if (currentUser.role === UserRole.ORGANIZATION) {
        if (createType === 'my_mentors') { config = { includeRoles: [UserRole.MENTOR] }; name = name || "My Staff"; }
        else if (createType === 'mentors_students') { config = { includeRoles: [UserRole.MENTOR], includeStudentsOfMentors: true }; name = name || "Org Classroom"; }
        else if (createType === 'collective') { config = { includeRoles: [UserRole.MENTOR, UserRole.STUDENT] }; name = name || "Org Collective"; }
    }
    else if (currentUser.role === UserRole.MENTOR) {
        if (createType === 'my_class') { config = { includeRoles: [UserRole.STUDENT] }; name = name || "My Class"; }
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
  const isCreator = activeChannel?.creatorId === currentUser.id || currentUser.role === UserRole.ADMIN;

  const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in duration-300">
        
        {/* Sidebar */}
        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
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
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : channels.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">No channels yet.</div>
                ) : (
                    channels.map(ch => (
                        <button 
                            key={ch.id}
                            onClick={() => setActiveChannel(ch)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all ${activeChannel?.id === ch.id ? 'bg-white shadow-md text-royal-700 ring-1 ring-royal-100 scale-[1.02]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <div className={`p-1.5 rounded-md ${activeChannel?.id === ch.id ? 'bg-royal-50' : 'bg-gray-200'}`}>
                                <Hash size={14} className={activeChannel?.id === ch.id ? 'text-royal-600' : 'text-gray-500'} />
                            </div>
                            <span className="truncate flex-1">{ch.name}</span>
                            {ch.scope === 'global' && <Globe size={12} className="text-gray-300" />}
                        </button>
                    ))
                )}
            </div>

            {/* Current User Role Footer */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-3">
                    {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full shadow-md object-cover border border-gray-100" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                            {currentUser.name.charAt(0)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                        <p className="text-[10px] font-bold text-royal-600 uppercase tracking-widest">{currentUser.role}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
            {activeChannel ? (
                <>
                    {/* Channel Header */}
                    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10 shadow-sm">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-royal-50 rounded-lg text-royal-600 shrink-0">
                                <Hash size={20} />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input 
                                            autoFocus
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveChannelName()}
                                            className="font-bold text-gray-800 leading-none bg-gray-50 border-b-2 border-royal-500 outline-none px-1 py-1 w-full max-w-xs"
                                        />
                                        <button onClick={handleSaveChannelName} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={18}/></button>
                                        <button onClick={() => setIsEditingName(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="font-bold text-gray-800 leading-none truncate">{activeChannel.name}</h2>
                                        {isCreator && (
                                            <button 
                                                onClick={() => { setEditedName(activeChannel.name); setIsEditingName(true); }}
                                                className="p-1.5 text-gray-300 hover:text-royal-500 hover:bg-royal-50 rounded-md transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        <UserIcon size={12} />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap uppercase tracking-widest">Secure Collective</span>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8faff] custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <div className="p-6 bg-white rounded-full shadow-sm">
                                    <MessageSquare size={48} className="opacity-10" />
                                </div>
                                <p className="text-sm font-medium">No messages in this channel yet.</p>
                                <p className="text-xs">Start the conversation below!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isSelf = msg.senderId === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                        <div className={`flex gap-3 max-w-[80%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isSelf && (
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-royal-600 font-bold border border-gray-100 shrink-0 overflow-hidden">
                                                    {msg.senderName.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                {!isSelf && (
                                                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                                                        <span className="text-xs font-black text-royal-600 uppercase tracking-widest">{msg.senderName}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{msg.senderRole}</span>
                                                    </div>
                                                )}
                                                <div 
                                                    className={`p-5 rounded-[2rem] shadow-md ${isSelf 
                                                        ? 'bg-royal-900 text-white rounded-tr-none' 
                                                        : 'bg-white text-royal-950 rounded-tl-none border border-royal-50'}`}
                                                >
                                                    {/* Mature, Prominent Chat Text */}
                                                    <p className="font-serif font-black text-sm md:text-base leading-snug tracking-tight">
                                                        {msg.text}
                                                    </p>

                                                    {msg.attachment && (
                                                        <div className={`mt-4 p-3 rounded-xl border flex flex-col gap-2 ${isSelf ? 'bg-royal-950/50 border-royal-800' : 'bg-gray-50 border-gray-100'}`}>
                                                            {msg.attachment.type.startsWith('image/') ? (
                                                                <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachment?.data)} />
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${isSelf ? 'bg-royal-800' : 'bg-white shadow-sm'}`}>
                                                                        <FileText size={24} className={isSelf ? 'text-royal-100' : 'text-royal-500'} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-xs font-bold truncate ${isSelf ? 'text-white' : 'text-gray-900'}`}>{msg.attachment.name}</p>
                                                                        <p className={`text-[10px] font-medium ${isSelf ? 'text-royal-300' : 'text-gray-400'}`}>{formatFileSize(msg.attachment.size)}</p>
                                                                    </div>
                                                                    <a href={msg.attachment.data} download={msg.attachment.name} className={`p-2 rounded-lg transition-colors ${isSelf ? 'hover:bg-royal-800 text-royal-200' : 'hover:bg-gray-200 text-gray-500'}`}>
                                                                        <Download size={18} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-[9px] font-bold text-gray-400 mt-1.5 flex items-center gap-1.5 ${isSelf ? 'flex-row-reverse mr-2' : 'ml-2'}`}>
                                                    <Clock size={10} />
                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="opacity-60">•</span>
                                                    <span>{new Date(msg.timestamp).toLocaleDateString([], { weekday: 'short' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        {/* File Preview */}
                        {selectedFile && (
                            <div className="mb-4 p-4 bg-royal-50 rounded-2xl border border-royal-100 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-royal-600 border border-royal-100">
                                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-royal-900 truncate max-w-xs">{selectedFile.name}</p>
                                        <p className="text-xs text-royal-500 font-medium">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-royal-100 rounded-full text-royal-400 hover:text-royal-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange}
                            />
                            <div className="relative flex-1 group">
                                <input 
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={selectedFile ? "Add a comment..." : `Type your message here...`}
                                    className="w-full pl-6 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-royal-500 focus:ring-4 focus:ring-royal-500/10 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                                    <Tooltip content="Attach a file or image">
                                        <button type="button" onClick={handleFileClick} className="hover:text-royal-500 transition-colors p-1"><Plus size={20} /></button>
                                    </Tooltip>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={!newMessage.trim() && !selectedFile}
                                className="p-4 bg-royal-800 text-white rounded-2xl shadow-xl shadow-royal-900/20 hover:bg-royal-900 disabled:opacity-50 disabled:grayscale transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                <Send size={24} />
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#f8faff]">
                    <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                        <MessageSquare size={48} className="text-royal-100" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Your Communication Hub</h3>
                    <p className="max-w-xs text-center text-sm mt-2 leading-relaxed">Select a channel from the left to engage with your mentors, students, or organization staff.</p>
                </div>
            )}
        </div>

        {/* CREATE MODAL */}
        {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-royal-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                                <Plus className="text-gold-500" size={28} /> New Channel
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>
                    <form onSubmit={handleCreateChannel} className="p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Group Type</label>
                            <select 
                                value={createType} 
                                onChange={(e) => setCreateType(e.target.value)}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-royal-500 transition-all font-bold text-gray-800"
                                required
                            >
                                <option value="" disabled>Select communication scope...</option>
                                {renderCreationOptions()}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Channel Display Name</label>
                            <input 
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. Leadership Team 2024"
                                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-royal-500 transition-all font-bold text-gray-800 placeholder-gray-400"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 italic px-1">Tip: Keep names short and descriptive for better team clarity.</p>
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-royal-800 text-white font-bold py-5 rounded-2xl shadow-xl shadow-royal-900/20 hover:bg-royal-900 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                                <Shield size={20} className="text-gold-500" />
                                Securely Create Channel
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
