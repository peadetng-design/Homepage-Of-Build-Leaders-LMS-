
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { lessonService } from '../services/lessonService';
import { Newspaper, Calendar, User, Megaphone } from 'lucide-react';

const NewsView: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    lessonService.getNews().then(setNews);
  }, []);

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Announcement': return 'bg-orange-100 text-orange-700';
          case 'Event': return 'bg-purple-100 text-purple-700';
          case 'Update': return 'bg-blue-100 text-blue-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={120} /></div>
            <h2 className="text-3xl font-serif font-bold mb-2 relative z-10">News & Announcements</h2>
            <p className="text-orange-50 relative z-10">Stay updated with the latest events, tournaments, and platform updates.</p>
        </div>

        {news.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Newspaper size={48} className="mx-auto mb-4 opacity-30" />
                <p>No news posted yet.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {news.map(item => (
                    <div key={item.id} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                        <div className="md:w-48 flex-shrink-0 flex flex-col justify-center text-center border-r border-gray-100 pr-6">
                            <span className="text-4xl font-bold text-gray-300 mb-1">{new Date(item.date).getDate()}</span>
                            <span className="text-sm font-bold text-gray-500 uppercase">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                            <span className={`mt-3 px-2 py-1 rounded text-xs font-bold ${getCategoryColor(item.category)}`}>
                                {item.category}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{item.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <User size={12} /> Posted by <span className="font-bold text-gray-500">{item.author}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default NewsView;
