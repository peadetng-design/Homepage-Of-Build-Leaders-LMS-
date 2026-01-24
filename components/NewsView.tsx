import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { lessonService } from '../services/lessonService';
import { Newspaper, Calendar, User, Megaphone, ArrowLeft, RefreshCcw } from 'lucide-react';

const NewsView: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
      setIsLoading(true);
      const data = await lessonService.getNews();
      setNews(data);
      setIsLoading(false);
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Announcement': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Event': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'Update': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-royal-900 rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border-b-[10px] border-black">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Megaphone size={180} className="rotate-12" /></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <h2 className="text-4xl font-serif font-black uppercase tracking-tighter mb-4">NEWS & ANNOUNCEMENTS PORTAL</h2>
                    <p className="text-orange-50 text-lg font-medium opacity-90 italic">Live broadcast of global events, tournament schedules, and platform synchronization updates.</p>
                </div>
                <button onClick={fetchNews} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 shadow-lg active:scale-95">
                    <RefreshCcw size={28} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        {news.length === 0 ? (
            <div className="text-center py-32 text-gray-300 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 shadow-inner">
                <Newspaper size={80} className="mx-auto mb-6 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm">Waiting for News Broadcasts...</p>
            </div>
        ) : (
            <div className="grid gap-10">
                {news.map(item => (
                    <div key={item.id} className="bg-white p-10 rounded-[2.5rem] border-2 border-gray-50 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row gap-10 relative overflow-hidden group">
                        <div className="md:w-56 shrink-0 flex flex-col justify-center text-center border-r-4 border-gray-50 pr-10">
                            <span className="text-6xl font-black text-gray-100 mb-2 group-hover:text-orange-100 transition-colors duration-500">{new Date(item.date).getDate()}</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-4">{new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${getCategoryColor(item.category)}`}>
                                {item.category}
                            </span>
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-3xl font-serif font-black text-gray-950 mb-6 leading-tight group-hover:text-royal-700 transition-colors">{item.title}</h3>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-wrap font-medium opacity-90">{item.content}</p>
                            <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                                <div className="w-8 h-8 bg-royal-100 rounded-full flex items-center justify-center text-royal-600 font-black text-xs shadow-inner">
                                    {item.author.charAt(0)}
                                </div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Broadcast by <span className="text-royal-600">{item.author}</span> • VERIFIED UPDATE
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Megaphone size={120} /></div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default NewsView;