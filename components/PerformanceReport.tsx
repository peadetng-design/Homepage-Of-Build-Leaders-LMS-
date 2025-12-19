
import React, { useEffect, useState } from 'react';
import { User, Lesson } from '../types';
import { lessonService } from '../services/lessonService';
import { ArrowLeft, Clock, History, BarChart2, CheckCircle, BookOpen } from 'lucide-react';

interface PerformanceReportProps {
  currentUser: User;
  onBack: () => void;
}

interface LessonStats {
  lessonId: string;
  title: string;
  lessonType: string;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeSpent: number;
  attemptsCount: number;
  isCompleted: boolean;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ currentUser, onBack }) => {
  const [stats, setStats] = useState<LessonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
    setIsLoading(true);
    try {
      const allLessons = await lessonService.getLessons();
      const statsPromises = allLessons.map(async (lesson) => {
        const timeSpent = await lessonService.getQuizTimer(currentUser.id, lesson.id);
        const history = await lessonService.getAttempts(currentUser.id, lesson.id);
        
        const attemptMap: Record<string, string> = {};
        let correctCount = 0;
        
        history.forEach(h => { attemptMap[h.quizId] = h.selectedOptionId; });
        Object.keys(attemptMap).forEach(qId => {
            const lastAttemptForQ = history.filter(h => h.quizId === qId).pop();
            if (lastAttemptForQ && lastAttemptForQ.isCorrect) correctCount++;
        });

        const totalQuestions = lesson.sections.reduce((acc, sec) => acc + (sec.quizzes?.length || 0), 0);
        const questionsAnswered = Object.keys(attemptMap).length;
        const attemptsCount = history.length;

        return {
          lessonId: lesson.id,
          title: lesson.title,
          lessonType: lesson.lesson_type,
          totalQuestions,
          questionsAnswered,
          correctAnswers: correctCount,
          timeSpent,
          attemptsCount,
          isCompleted: questionsAnswered === totalQuestions && totalQuestions > 0
        };
      });

      const results = await Promise.all(statsPromises);
      const startedLessons = results.filter(s => s.questionsAnswered > 0 || s.timeSpent > 0);
      setStats(startedLessons);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in duration-300">
      
      <div className="bg-royal-900 text-white p-8 rounded-b-3xl shadow-xl mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                 <ArrowLeft size={24} />
              </button>
              <div>
                 <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
                    <BarChart2 className="text-gold-500" size={32} /> My Performance Scores
                 </h1>
                 <p className="text-indigo-200 mt-1">Detailed analytics of your learning journey</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="text-center px-6 py-2 bg-white/5 rounded-xl border border-white/10">
                 <div className="text-2xl font-bold text-gold-400">{stats.length}</div>
                 <div className="text-xs text-indigo-200 uppercase tracking-wider">Lessons Started</div>
              </div>
              <div className="text-center px-6 py-2 bg-white/5 rounded-xl border border-white/10">
                 <div className="text-2xl font-bold text-green-400">{stats.filter(s => s.isCompleted).length}</div>
                 <div className="text-xs text-indigo-200 uppercase tracking-wider">Completed</div>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
         {isLoading ? (
            <div className="text-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
               <p className="text-gray-500">Calculating performance metrics...</p>
            </div>
         ) : stats.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
               <h3 className="text-xl font-bold text-gray-700">No Data Yet</h3>
               <p className="text-gray-500 mt-2">Start taking lessons to see your performance stats here.</p>
               <button onClick={onBack} className="mt-6 px-6 py-3 bg-royal-600 text-white font-bold rounded-xl hover:bg-royal-700 shadow-lg">
                  Go to Dashboard
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {stats.map((stat) => (
                  <div key={stat.lessonId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                     
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded mb-2 uppercase tracking-wide">{stat.lessonType}</span>
                           <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem]">{stat.title}</h3>
                        </div>
                        {stat.isCompleted && <CheckCircle size={24} className="text-green-500 flex-shrink-0" />}
                     </div>

                     <div className="flex justify-around items-center mb-6 py-4 bg-gray-50 rounded-xl border border-gray-50 group-hover:border-gray-100 transition-colors">
                        
                        <div className="flex flex-col items-center">
                           <div className="relative w-20 h-20 mb-2">
                              <svg className="w-full h-full transform -rotate-90">
                                 <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                                 <circle 
                                    cx="40" cy="40" r="32" 
                                    stroke={stat.correctAnswers === stat.totalQuestions && stat.totalQuestions > 0 ? "#22c55e" : "#eab308"} 
                                    strokeWidth="6" fill="none" 
                                    strokeDasharray={201} 
                                    strokeDashoffset={201 - (201 * (stat.totalQuestions > 0 ? stat.correctAnswers / stat.totalQuestions : 0))} 
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                 />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center flex-col">
                                 <span className="text-sm font-bold text-gray-900">{stat.correctAnswers}/{stat.totalQuestions}</span>
                              </div>
                           </div>
                           <span className="text-xs font-bold text-gray-400 uppercase">Score</span>
                        </div>

                        <div className="w-px h-16 bg-gray-200"></div>

                        <div className="flex flex-col items-center">
                           <div className="relative w-20 h-20 mb-2">
                              <svg className="w-full h-full transform -rotate-90">
                                 <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                                 <circle 
                                    cx="40" cy="40" r="32" 
                                    stroke="#6366f1" 
                                    strokeWidth="6" fill="none" 
                                    strokeDasharray={201} 
                                    strokeDashoffset={201 - (201 * ((stat.timeSpent % 60) / 60))} 
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear"
                                 />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-sm font-bold text-indigo-600 font-mono">{formatTime(stat.timeSpent)}</span>
                              </div>
                           </div>
                           <span className="text-xs font-bold text-gray-400 uppercase">Time</span>
                        </div>

                     </div>

                     <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                           <span className="text-gray-500">Progress</span>
                           <span className="text-royal-600">{Math.round((stat.questionsAnswered / (stat.totalQuestions || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-royal-500 rounded-full transition-all duration-1000"
                              style={{ width: `${(stat.questionsAnswered / (stat.totalQuestions || 1)) * 100}%` }}
                           ></div>
                        </div>
                     </div>

                     <div className="flex items-center justify-end">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold shadow-sm">
                           <History size={12} />
                           {stat.attemptsCount} Interactions
                        </div>
                     </div>

                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default PerformanceReport;
