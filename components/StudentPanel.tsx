import React, { useState, useEffect } from 'react';
import { User, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { Search, UserPlus, BookOpen, Check, X, Shield, ListPlus, Eye, Users, Play, Clock } from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  activeTab: 'join' | 'browse' | 'lessons';
  onTakeLesson?: (lessonId: string) => void;
}

// --- NEW COMPONENT: LINEAR PROGRESS BAR ---
const ProgressBar = ({ progress, label }: { progress: number, label?: string }) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-bold mb-1">
          <span className="text-gray-500">{label}</span>
          <span className={progress === 100 ? "text-green-600" : "text-gray-400"}>{progress}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-royal-500'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

const StudentPanel: React.FC<StudentPanelProps> = ({ currentUser, activeTab, onTakeLesson }) => {
  const [classCode, setClassCode] = useState('');
  const [mentors, setMentors] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'browse') {
        const data = await authService.getAllMentors();
        setMentors(data);
      } else if (activeTab === 'lessons') {
        const data = await authService.getLessons();
        setLessons(data);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classCode.length < 6) {
        setNotification({ msg: "Code must be 6 characters", type: 'error' });
        return;
    }
    try {
        await authService.joinClass(currentUser, classCode);
        setNotification({ msg: "Successfully joined class!", type: 'success' });
        setClassCode('');
        // Force refresh user in parent would be ideal, but for now notification is enough
    } catch (err: any) {
        setNotification({ msg: err.message, type: 'error' });
    }
  };

  const handleRequestJoin = async (mentorId: string) => {
    try {
        await authService.requestJoinMentor(currentUser, mentorId);
        setNotification({ msg: "Request sent successfully!", type: 'success' });
    } catch (err: any) {
        setNotification({ msg: err.message, type: 'error' });
    }
  };

  const addToMyList = (lessonTitle: string) => {
     setNotification({ msg: `"${lessonTitle}" added to your curated list!`, type: 'success' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      {/* Header */}
      <div className="bg-royal-900 p-6 text-white">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
          <BookOpen className="text-gold-500" /> Student Portal
        </h2>
        <p className="text-indigo-200 text-sm mt-1">
          {activeTab === 'join' && "Enter a code to join a specific mentor's group."}
          {activeTab === 'browse' && "Find a mentor to guide your studies."}
          {activeTab === 'lessons' && "Browse available study materials."}
        </p>
      </div>

       {/* Notification */}
       {notification && (
        <div className={`p-3 text-center text-sm font-bold flex justify-between items-center px-6 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      <div className="p-6">
        {/* JOIN CLASS TAB */}
        {activeTab === 'join' && (
            <div className="max-w-md mx-auto text-center py-12">
               <div className="w-20 h-20 bg-royal-100 text-royal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus size={40} />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Join a Class</h3>
               <p className="text-gray-500 mb-8">Enter the 6-digit code provided by your Mentor.</p>
               
               <form onSubmit={handleJoinClass} className="space-y-4">
                  <input 
                    type="text" 
                    value={classCode}
                    onChange={e => setClassCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full text-center text-4xl font-mono tracking-widest border-2 border-gray-200 rounded-xl p-4 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/20 outline-none uppercase placeholder-gray-300"
                    placeholder="XYZ123"
                  />
                  <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
                     Join Class Now
                  </button>
               </form>
            </div>
        )}

        {/* BROWSE MENTORS TAB */}
        {activeTab === 'browse' && (
            <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name..." 
                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-royal-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map(mentor => (
                        <div key={mentor.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 rounded-full bg-royal-100 text-royal-800 flex items-center justify-center font-bold text-lg">
                                     {mentor.name.charAt(0)}
                                   </div>
                                   <div>
                                     <h4 className="font-bold text-gray-900">{mentor.name}</h4>
                                     <p className="text-xs text-gray-500">Mentor</p>
                                   </div>
                                </div>
                                <Shield size={20} className="text-gray-300" />
                            </div>
                            <button 
                               onClick={() => handleRequestJoin(mentor.id)}
                               className="w-full py-2 border-2 border-royal-500 text-royal-500 font-bold rounded-lg hover:bg-royal-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <UserPlus size={18} /> Request to Join
                            </button>
                        </div>
                    ))}
                    {mentors.length === 0 && !isLoading && (
                        <div className="col-span-3 text-center py-12 text-gray-400">No mentors found.</div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW LESSONS TAB */}
        {activeTab === 'lessons' && (
            <div>
                 <div className="mb-6 flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Search lessons..." 
                        className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-royal-500"
                    />
                 </div>
                 <div className="border border-gray-200 rounded-xl overflow-hidden">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-4 w-1/3">Title</th>
                                <th className="p-4 w-1/6">Category</th>
                                <th className="p-4 w-1/4">Progress</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {lessons.map((lesson, idx) => {
                                // SIMULATED PROGRESS FOR DEMO UI: 
                                // In a real app, calculate based on attempts
                                // Randomly assigning some progress for visual variety
                                const simulatedProgress = idx % 3 === 0 ? 100 : idx % 2 === 0 ? 45 : 0;
                                const statusLabel = simulatedProgress === 100 ? 'Completed' : simulatedProgress > 0 ? 'In Progress' : 'Not Started';

                                return (
                                <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{lesson.title}</div>
                                        <div className="text-xs text-gray-400">{lesson.author}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded">{lesson.category}</span></td>
                                    <td className="p-4">
                                        <ProgressBar progress={simulatedProgress} label={statusLabel} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {onTakeLesson && (
                                                <button 
                                                    onClick={() => onTakeLesson(lesson.id)}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${simulatedProgress === 100 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-royal-500 text-white hover:bg-royal-800'}`}
                                                    title={simulatedProgress === 100 ? "Review Lesson" : "Start Lesson"}
                                                >
                                                    {simulatedProgress === 100 ? <Check size={14} /> : <Play size={14} fill="currentColor" />} 
                                                    {simulatedProgress === 100 ? 'Review' : simulatedProgress > 0 ? 'Resume' : 'Start'}
                                                </button>
                                            )}
                                            <button 
                                            onClick={() => addToMyList(lesson.title)}
                                            className="p-1.5 text-gray-400 hover:text-royal-500 hover:bg-royal-50 rounded-lg tooltip" 
                                            title="Add to My List"
                                            >
                                                <ListPlus size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                     </table>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StudentPanel;