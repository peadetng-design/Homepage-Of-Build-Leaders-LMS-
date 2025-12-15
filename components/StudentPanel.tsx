
import React, { useState, useEffect } from 'react';
import { User, Lesson, JoinRequest } from '../types';
import { authService } from '../services/authService';
import { lessonService } from '../services/lessonService';
import Tooltip from './Tooltip'; // Import Tooltip
import { Search, UserPlus, BookOpen, Check, X, Shield, ListPlus, Eye, Users, Play, Clock, Star } from 'lucide-react';

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
  const [curatedLessons, setCuratedLessons] = useState<Lesson[]>([]);
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
        // Fetch all lessons
        const allData = await authService.getLessons();
        setLessons(allData);

        // Fetch curated lessons specifically for this student
        const curatedIds = await authService.getCuratedLessonIdsForStudent(currentUser);
        if (curatedIds.length > 0) {
            const curatedData = await lessonService.getLessonsByIds(curatedIds);
            setCuratedLessons(curatedData);
        }
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
         {/* Notification */}
         {notification && (
            <div className={`mb-6 p-4 rounded-xl flex justify-between items-center ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
               <span className="font-bold">{notification.msg}</span>
               <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={18}/></button>
            </div>
         )}

         {/* JOIN TAB */}
         {activeTab === 'join' && (
            <div className="max-w-md mx-auto py-12 text-center">
               <div className="w-20 h-20 bg-royal-100 text-royal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield size={40} />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Mentor Group</h2>
               <p className="text-gray-500 mb-8">Enter the 6-character class code provided by your mentor to join their leaderboard.</p>
               
               <form onSubmit={handleJoinClass} className="space-y-4">
                  <input 
                    type="text" 
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="ENTER CODE" 
                    className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] p-4 border-2 border-gray-200 rounded-xl focus:border-royal-500 outline-none uppercase placeholder:text-gray-300"
                  />
                  <Tooltip content="Submit the code to enroll in the mentor's class.">
                    <button 
                      type="submit" 
                      disabled={classCode.length < 6}
                      className="w-full bg-royal-600 text-white font-bold py-4 rounded-xl hover:bg-royal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-royal-600/20"
                    >
                      JOIN CLASS
                    </button>
                  </Tooltip>
               </form>
            </div>
         )}

         {/* BROWSE MENTORS TAB */}
         {activeTab === 'browse' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-xl">Find a Mentor</h3>
                  <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                     <input type="text" placeholder="Search mentors..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-royal-500 outline-none" />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentors.map(mentor => (
                     <div key={mentor.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow flex items-start justify-between">
                        <div className="flex gap-4">
                           <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                              {mentor.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">{mentor.name}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Users size={12} /> {mentor.organizationCode ? "Organization Staff" : "Independent Mentor"}
                              </p>
                           </div>
                        </div>
                        <Tooltip content="Send a request to join this mentor's group.">
                          <button 
                            onClick={() => handleRequestJoin(mentor.id)}
                            className="px-4 py-2 bg-gray-50 text-indigo-600 font-bold rounded-lg text-xs hover:bg-indigo-50 transition-colors flex items-center gap-1"
                          >
                            <UserPlus size={14} /> Request
                          </button>
                        </Tooltip>
                     </div>
                  ))}
                  {mentors.length === 0 && <div className="col-span-2 text-center py-10 text-gray-400">No mentors available publicly.</div>}
               </div>
            </div>
         )}

         {/* LESSONS LIST TAB */}
         {activeTab === 'lessons' && (
            <div className="space-y-8">
               
               {/* 1. Curated Lessons Section (If linked to Mentor/Org) */}
               {curatedLessons.length > 0 && (
                   <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Star size={120} /></div>
                       <div className="relative z-10">
                           <h3 className="font-bold text-purple-900 text-xl flex items-center gap-2 mb-4">
                               <Star className="text-gold-500 fill-current" /> Assigned by Your Group
                           </h3>
                           <div className="grid gap-3">
                               {curatedLessons.map(lesson => (
                                   <div key={lesson.id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                       <div>
                                           <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                                           <div className="flex gap-2 mt-1">
                                               <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">Assigned</span>
                                               <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} /> 15m</span>
                                           </div>
                                       </div>
                                       <button 
                                            onClick={() => onTakeLesson && onTakeLesson(lesson.id)}
                                            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-sm shadow-md"
                                       >
                                           Start
                                       </button>
                                   </div>
                               ))}
                           </div>
                       </div>
                   </div>
               )}

               <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-xl">All Assignments</h3>
                      <div className="text-sm text-gray-500 font-medium">
                         <span className="text-royal-600 font-bold">{lessons.length}</span> Lessons Available
                      </div>
                   </div>

                   <div className="space-y-4">
                      {lessons.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                             <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                             No lessons assigned yet.
                          </div>
                      ) : (
                          lessons.map(lesson => (
                             <div key={lesson.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-royal-200 transition-colors group">
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{lesson.lesson_type}</span>
                                       <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> 10m</span>
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-royal-600 transition-colors">{lesson.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                                 </div>
                                 
                                 <div className="w-full md:w-32 hidden md:block">
                                    {/* Simulated Progress */}
                                    <ProgressBar progress={Math.random() > 0.5 ? 100 : Math.floor(Math.random() * 80)} label="Progress" />
                                 </div>

                                 <div className="flex gap-2 w-full md:w-auto">
                                    <Tooltip content="Start learning this lesson now.">
                                      <button 
                                        onClick={() => onTakeLesson && onTakeLesson(lesson.id)}
                                        className="flex-1 md:flex-none px-6 py-2 bg-royal-600 text-white font-bold rounded-lg hover:bg-royal-700 shadow-md shadow-royal-600/20 transition-all flex items-center justify-center gap-2"
                                      >
                                        <Play size={16} fill="currentColor" /> Start
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="Add to your personal study list.">
                                      <button 
                                        onClick={() => addToMyList(lesson.title)}
                                        className="px-3 py-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-gold-500 transition-colors"
                                      >
                                        <ListPlus size={20} />
                                      </button>
                                    </Tooltip>
                                 </div>
                             </div>
                          ))
                      )}
                   </div>
               </div>
            </div>
         )}
    </div>
  );
};

export default StudentPanel;
