
import React, { useState, useEffect } from 'react';
import { Lesson, User, UserRole } from '../types';
import { lessonService } from '../services/lessonService';
import { BookOpen, Search, Filter, Play, Clock, ArrowRight, Book } from 'lucide-react';

interface LessonBrowserProps {
  currentUser: User;
  onLessonSelect: (lessonId: string) => void;
  onClose: () => void;
}

const LessonBrowser: React.FC<LessonBrowserProps> = ({ currentUser, onLessonSelect, onClose }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, [currentUser]);

  useEffect(() => {
    filterLessons();
  }, [searchTerm, categoryFilter, lessons]);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const allLessons = await lessonService.getLessons();
      // Filter lessons relevant to the user's role + 'All'
      const roleSpecificLessons = allLessons.filter(l => {
          // Admin sees all
          if (currentUser.role === UserRole.ADMIN) return true;
          
          // Match 'All' or specific role
          if (l.targetAudience === 'All') return true;
          if (l.targetAudience === currentUser.role) return true;
          
          return false;
      });
      setLessons(roleSpecificLessons);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLessons = () => {
    let result = lessons;

    if (searchTerm) {
      result = result.filter(l => 
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter(l => l.lesson_type === categoryFilter);
    }

    setFilteredLessons(result);
  };

  const getRoleBadge = (target: string) => {
      switch(target) {
          case 'Mentor': return 'bg-indigo-100 text-indigo-700';
          case 'Organization': return 'bg-slate-100 text-slate-700';
          case 'Parent': return 'bg-rose-100 text-rose-700';
          default: return 'bg-blue-100 text-blue-700';
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
       <div className="bg-royal-900 p-8 text-white flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-serif font-bold flex items-center gap-3">
               <BookOpen className="text-gold-500" size={32} /> Lesson Library
            </h2>
            <p className="text-royal-200 mt-2">
               Curated content specifically for <span className="font-bold text-white capitalize">{currentUser.role.toLowerCase()}s</span>.
            </p>
          </div>
          <button onClick={onClose} className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-lg transition-colors text-sm">
             Close Library
          </button>
       </div>

       <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                 type="text" 
                 placeholder="Search by title or topic..." 
                 className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-royal-500 outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2 overflow-x-auto">
               <Filter size={20} className="text-gray-400 mr-2" />
               {['All', 'Bible', 'Leadership', 'Mixed'].map(type => (
                  <button
                    key={type}
                    onClick={() => setCategoryFilter(type)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${categoryFilter === type ? 'bg-royal-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {type}
                  </button>
               ))}
           </div>
       </div>

       <div className="p-8 flex-1 bg-gray-50/30 overflow-y-auto">
          {isLoading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600"></div></div>
          ) : filteredLessons.length === 0 ? (
             <div className="text-center py-20 text-gray-400">
                <Book size={48} className="mx-auto mb-4 opacity-30" />
                <p>No lessons found matching your criteria.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map(lesson => (
                   <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full">
                      <div className="p-6 flex-1">
                         <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getRoleBadge(lesson.targetAudience)}`}>
                               For {lesson.targetAudience}
                            </span>
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                               <Clock size={12} /> 15 min
                            </span>
                         </div>
                         <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-royal-600 transition-colors">
                            {lesson.title}
                         </h3>
                         <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                            {lesson.description || `Study on ${lesson.book} ${lesson.chapter}`}
                         </p>
                         
                         <div className="flex gap-2 mb-4">
                             {lesson.sections.some(s => s.type === 'note') && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1"><Book size={12}/> Notes</span>
                             )}
                             {lesson.sections.some(s => s.type === 'quiz_group') && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1"><Search size={12}/> Quiz</span>
                             )}
                         </div>
                      </div>
                      
                      <div className="p-4 border-t border-gray-50 mt-auto">
                         <button 
                           onClick={() => onLessonSelect(lesson.id)}
                           className="w-full py-3 bg-royal-50 text-royal-700 font-bold rounded-lg hover:bg-royal-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                         >
                            <Play size={18} fill="currentColor" /> Take Lesson
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

export default LessonBrowser;
