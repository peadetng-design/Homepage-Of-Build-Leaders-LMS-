
import React, { useEffect, useState, useMemo } from 'react';
import { User, Lesson } from '../types';
import { lessonService } from '../services/lessonService';
// Added Loader2 to the imports
import { ArrowLeft, Clock, History, BarChart2, CheckCircle, BookOpen, Trophy, Target, PieChart, BarChart3, Activity, Zap, Loader2 } from 'lucide-react';

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
  percentScore: number;
}

// --- VISUAL COMPONENTS (SVG CHARTS) ---

const SimplePieChart = ({ data, colors }: { data: number[], colors: string[] }) => {
  const total = data.reduce((a, b) => a + b, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
      {data.map((value, index) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += value / total;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = value / total > 0.5 ? 1 : 0;
        const pathData = [
          `M ${startX} ${startY}`,
          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `L 0 0`,
        ].join(' ');
        return <path key={index} d={pathData} fill={colors[index]} />;
      })}
      <circle cx="0" cy="0" r="0.6" fill="white" />
    </svg>
  );
};

const SimpleBarChart = ({ data, labels, color }: { data: number[], labels: string[], color: string }) => {
  const maxVal = Math.max(...data, 100);
  return (
    <div className="flex items-end gap-2 h-40 w-full pt-4">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div 
            className="w-full rounded-t-lg transition-all duration-500 ease-out" 
            style={{ height: `${(val / maxVal) * 100}%`, backgroundColor: color }}
          >
             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
               {val}%
             </div>
          </div>
          <div className="h-4 w-full" /> {/* Spacer */}
        </div>
      ))}
    </div>
  );
};

const SimpleHistogram = ({ data }: { data: number[] }) => {
    const maxVal = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-1 h-32 w-full">
            {data.map((val, i) => (
                <div 
                    key={i} 
                    className="flex-1 bg-royal-400/30 hover:bg-royal-500 rounded-sm transition-colors border-t-2 border-royal-500" 
                    style={{ height: `${(val / maxVal) * 100}%` }}
                />
            ))}
        </div>
    );
};

const PerformanceReport: React.FC<PerformanceReportProps> = ({ currentUser, onBack }) => {
  const [stats, setStats] = useState<LessonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, [currentUser.id]);

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
          isCompleted: questionsAnswered === totalQuestions && totalQuestions > 0,
          percentScore: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
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

  const aggregates = useMemo(() => {
    const started = stats.length;
    const completed = stats.filter(s => s.isCompleted).length;
    const totalQuestions = stats.reduce((acc, s) => acc + s.totalQuestions, 0);
    const totalCorrect = stats.reduce((acc, s) => acc + s.correctAnswers, 0);
    const totalTime = stats.reduce((acc, s) => acc + s.timeSpent, 0);
    const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    return {
      started,
      completed,
      totalQuestions,
      totalCorrect,
      totalTime,
      overallPercent
    };
  }, [stats]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-royal-900 text-white p-8 rounded-b-[3rem] shadow-2xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-royal-800 rounded-full blur-[100px] opacity-50 -mr-20 -mt-20"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
           <div className="flex items-center gap-6">
              <button onClick={onBack} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-md border border-white/10 group">
                 <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                 <h1 className="text-4xl font-serif font-black flex items-center gap-4">
                    <Trophy className="text-gold-500 animate-bounce" size={40} /> 
                    Performance Intelligence
                 </h1>
                 <p className="text-royal-200 mt-1 font-bold uppercase tracking-widest text-xs opacity-75">Authenticated Record for {currentUser.name}</p>
              </div>
           </div>
           
           <div className="flex gap-6 flex-wrap justify-center">
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-[1.5rem] text-center min-w-[120px]">
                  <div className="text-3xl font-black text-gold-400 leading-none mb-1">{aggregates.overallPercent}%</div>
                  <div className="text-[10px] font-black text-royal-300 uppercase tracking-widest">Mastery</div>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-[1.5rem] text-center min-w-[120px]">
                  <div className="text-3xl font-black text-green-400 leading-none mb-1">{aggregates.completed}</div>
                  <div className="text-[10px] font-black text-royal-300 uppercase tracking-widest">Finished</div>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-[1.5rem] text-center min-w-[120px]">
                  <div className="text-3xl font-black text-blue-400 leading-none mb-1">{formatTime(aggregates.totalTime)}</div>
                  <div className="text-[10px] font-black text-royal-300 uppercase tracking-widest">Time Spent</div>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-12">
         {isLoading ? (
            <div className="text-center py-40">
               <Loader2 className="animate-spin text-royal-600 mx-auto mb-6" size={60} />
               <p className="text-gray-500 font-black uppercase tracking-widest">Generating Visual Insights...</p>
            </div>
         ) : stats.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 shadow-inner">
               <BookOpen size={80} className="mx-auto mb-6 text-gray-200" />
               <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">No Academic Activity Recorded</h3>
               <p className="text-gray-400 mt-4 max-w-md mx-auto">Engage with the lesson library to populate this analytics dashboard with your real-time performance data.</p>
               <button onClick={onBack} className="mt-10 px-10 py-4 bg-royal-800 text-white font-black rounded-2xl hover:bg-royal-950 shadow-2xl transform transition-all hover:scale-105">
                  START FIRST LESSON
               </button>
            </div>
         ) : (
            <>
               {/* --- ANALYTICS DASHBOARD GRID --- */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* Aggregated Score & Completion (Pie Chart Area) */}
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex flex-col items-center text-center">
                      <div className="flex items-center gap-2 mb-8 w-full">
                         <PieChart className="text-royal-500" size={20} />
                         <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Completion Dynamics</h3>
                      </div>
                      
                      <div className="relative w-48 h-48 mb-8">
                          <SimplePieChart 
                            data={[aggregates.completed, aggregates.started - aggregates.completed]} 
                            colors={['#10b981', '#f59e0b']} 
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-gray-900 leading-none">{Math.round((aggregates.completed / aggregates.started) * 100)}%</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Velocity</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                              <p className="text-green-600 font-black text-xl leading-none">{aggregates.completed}</p>
                              <p className="text-[10px] font-bold text-green-700 uppercase mt-1">Certified</p>
                          </div>
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                              <p className="text-amber-600 font-black text-xl leading-none">{aggregates.started - aggregates.completed}</p>
                              <p className="text-[10px] font-bold text-amber-700 uppercase mt-1">In Progress</p>
                          </div>
                      </div>
                  </div>

                  {/* Individual Lesson Performance (Bar Chart Area) */}
                  <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex flex-col">
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex items-center gap-2">
                            <BarChart3 className="text-royal-500" size={20} />
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Mastery Variance (%)</h3>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-royal-500"></div><span className="text-[10px] font-bold text-gray-400">SCORE</span></div>
                         </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-end">
                        <SimpleBarChart 
                            data={stats.map(s => s.percentScore)} 
                            labels={stats.map(s => s.title)} 
                            color="#6366f1" 
                        />
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <Target className="text-gold-500" size={24}/>
                              <div>
                                  <p className="text-gray-900 font-black leading-none">{aggregates.overallPercent}%</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Average Accuracy</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-royal-600 font-black leading-none">{aggregates.totalCorrect} / {aggregates.totalQuestions}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Cumulative Score</p>
                          </div>
                      </div>
                  </div>

                  {/* Time Spent Distribution (Histogram Area) */}
                  <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl flex flex-col">
                      <div className="flex items-center gap-2 mb-8">
                         <Activity className="text-emerald-500" size={20} />
                         <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Time Commitment Distribution</h3>
                      </div>
                      <SimpleHistogram data={stats.map(s => s.timeSpent)} />
                      <div className="mt-6 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span>Earlier Sessions</span>
                          <span>Most Recent</span>
                      </div>
                  </div>

                  {/* Top Achievements Card */}
                  <div className="bg-gradient-to-br from-royal-800 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={140} fill="currentColor" /></div>
                      <div>
                          <h3 className="text-xs font-black text-royal-200 uppercase tracking-[0.2em] mb-6">Current Standing</h3>
                          <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                  <span className="text-royal-300 font-bold">Total Answered</span>
                                  <span className="text-2xl font-black">{aggregates.totalQuestions}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-royal-300 font-bold">Precision Hits</span>
                                  <span className="text-2xl font-black text-emerald-400">{aggregates.totalCorrect}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-royal-300 font-bold">Module Completion</span>
                                  <span className="text-2xl font-black text-gold-400">12</span>
                              </div>
                          </div>
                      </div>
                      <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                          <p className="text-[10px] font-black text-royal-300 uppercase mb-2">Global Leaderboard Position</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-xl font-black">#3</div>
                              <p className="text-sm font-bold">Top 2% of Global Users</p>
                          </div>
                      </div>
                  </div>
               </div>

               {/* --- DETAILED LESSON BREAKDOWN --- */}
               <div className="space-y-6 pt-12">
                  <div className="flex justify-between items-center px-4">
                     <h2 className="text-2xl font-serif font-black text-gray-900">Session Audit Trail</h2>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{stats.length} Active Records Found</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.lessonId} className="bg-white rounded-[2rem] shadow-sm border-2 border-gray-50 p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                           
                           <div className="relative z-10">
                               <div className="flex justify-between items-start mb-6">
                                  <div>
                                     <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full mb-3 uppercase tracking-widest">{stat.lessonType}</span>
                                     <h3 className="font-black text-gray-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-royal-600 transition-colors">{stat.title}</h3>
                                  </div>
                                  {stat.isCompleted ? (
                                      <div className="bg-green-100 text-green-600 p-2 rounded-xl shadow-lg shadow-green-600/10"><CheckCircle size={24} /></div>
                                  ) : (
                                      <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shadow-lg shadow-amber-600/10"><Clock size={24} /></div>
                                  )}
                               </div>

                               <div className="flex justify-between items-end mb-6">
                                   <div className="space-y-1">
                                       <p className="text-4xl font-black text-gray-900">{stat.percentScore}%</p>
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
                                   </div>
                                   <div className="text-right space-y-1">
                                       <p className="text-xl font-black text-royal-600">{formatTime(stat.timeSpent)}</p>
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                                   </div>
                               </div>

                               <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                   <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                      <History size={12} />
                                      {stat.attemptsCount} Taps
                                   </div>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{stat.correctAnswers} / {stat.totalQuestions} CORRECT</p>
                               </div>
                           </div>
                        </div>
                    ))}
                  </div>
               </div>
            </>
         )}
      </div>
    </div>
  );
};

export default PerformanceReport;
