import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, Sparkles, Users, UserCheck, GraduationCap, ArrowRight, Library, Calendar, Globe, LayoutDashboard, Star, Gem, CheckCircle } from 'lucide-react';
import { User, HomepageContent, UserRole } from '../types';
import { lessonService } from '../services/lessonService';

interface HeroProps {
  onRegister: () => void;
  onSignIn: () => void;
  currentUser?: User | null;
  onNavigateToDashboard?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onRegister, onSignIn, currentUser, onNavigateToDashboard }) => {
  const [content, setContent] = useState<HomepageContent | null>(null);

  useEffect(() => {
    lessonService.getHomepageContent().then(setContent);
  }, []);

  if (!content) return <div className="min-h-screen bg-white" />; 

  return (
    <div className="w-full bg-white text-gray-900 overflow-x-hidden">
      
      {/* 1. RESTORED BIBLE QUIZ HERO */}
      <div className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
        {/* Visual Atmosphere Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] animate-float">
            <div className="absolute inset-0 bg-royal-400 blur-[120px] opacity-10 rounded-full w-96 h-96"></div>
            <BookOpen size={180} strokeWidth={0.5} className="text-royal-100 relative z-10 opacity-40 rotate-12" />
          </div>
          <div className="absolute bottom-[10%] right-[10%] animate-float-delayed">
             <TrophyIcon size={120} strokeWidth={0.5} className="text-gold-200 opacity-30 -rotate-12" />
          </div>
        </div>

        <div className="relative z-10 text-center max-w-6xl px-6 flex flex-col items-center">
          <ScrollReveal delay={100}>
            <div className="mb-10 flex justify-center">
              <div className="px-6 py-2 rounded-full bg-royal-50 inline-flex items-center gap-3 shadow-sm border border-royal-100">
                 <Sparkles size={14} className="text-gold-500" />
                 <span className="text-[10px] font-black tracking-[0.4em] uppercase text-royal-800">{content.heroTagline}</span>
                 <Sparkles size={14} className="text-gold-500" />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col gap-4 mb-12">
              <h1 className="cinzel text-5xl md:text-8xl font-black leading-[1.1] text-royal-900 drop-shadow-sm tracking-tighter">
                {content.heroTitle}
              </h1>
              <div className="h-1.5 w-32 bg-gold-500 mx-auto rounded-full shadow-lg"></div>
              <p className="text-lg md:text-2xl text-gray-500 font-serif italic max-w-3xl mx-auto leading-relaxed mt-4">
                {content.heroSubtitle}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
              {currentUser ? (
                 <button onClick={onNavigateToDashboard} className="group relative px-12 py-6 bg-royal-800 text-white font-black rounded-3xl shadow-xl transition-all transform hover:-translate-y-2 min-w-[280px] overflow-hidden border-b-8 border-royal-950 uppercase text-sm tracking-[0.3em]">
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      <LayoutDashboard size={24} /> Enter Your Dashboard
                    </span>
                 </button>
              ) : (
                 <>
                  <button onClick={onRegister} className="group relative px-10 py-5 bg-royal-800 text-white font-black rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 min-w-[240px] overflow-hidden border-b-4 border-royal-950 uppercase text-xs tracking-widest">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Begin Your Study <ArrowRight size={18} />
                    </span>
                  </button>
                  <button onClick={onSignIn} className="px-10 py-5 bg-white text-royal-900 font-black rounded-2xl shadow-lg border-4 border-royal-900 hover:bg-royal-50 transition-all transform hover:-translate-y-1 min-w-[240px] uppercase text-xs tracking-widest">
                    Member Portal Login
                  </button>
                 </>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* 2. STATS SECTION */}
      <div className="w-full bg-royal-900 py-24 text-white relative z-20 shadow-[0_-50px_100px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { val: content.stats1Val, label: content.stats1Label, icon: Users, color: 'text-gold-400' },
              { val: content.stats2Val, label: content.stats2Label, icon: GraduationCap, color: 'text-blue-400' },
              { val: content.stats3Val, label: content.stats3Label, icon: Globe, color: 'text-emerald-400' }
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 200}>
                <div className="group p-10 rounded-[3rem] bg-white/5 hover:bg-white/10 border-2 border-white/5 transition-all hover:transform hover:-translate-y-3 text-center backdrop-blur-xl">
                   <div className={`mb-6 ${stat.color} group-hover:scale-110 transition-transform duration-500 inline-block relative z-10 p-4 bg-white/5 rounded-2xl`}>
                     <stat.icon size={48} />
                   </div>
                   <h3 className="text-6xl font-black font-serif mb-3 tracking-tighter">{stat.val}</h3>
                   <p className="text-royal-200 text-xs uppercase tracking-[0.4em] font-black">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
        </div>
      </div>

      {/* 3. ABOUT MISSION */}
      <div className="w-full bg-gray-50 py-32">
         <div className="max-w-7xl mx-auto px-6 space-y-40">
            <section id="about" className="scroll-mt-24">
              <div className="flex flex-col lg:flex-row items-center gap-24">
                 <div className="w-full lg:w-1/2">
                    <ScrollReveal>
                      <span className="text-royal-600 font-black uppercase tracking-[0.6em] text-[10px] mb-6 block px-4 py-1.5 bg-royal-50 rounded-full w-fit">{content.aboutMission}</span>
                      <h2 className="text-5xl md:text-7xl font-serif font-black text-gray-950 mb-10 leading-[1.1] tracking-tighter">{content.aboutHeading}</h2>
                      <p className="text-gray-600 text-xl leading-relaxed mb-12 font-medium">{content.aboutBody}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 hover:-translate-y-2 transition-all group">
                            <h4 className="font-black text-royal-900 text-xl mb-2 uppercase tracking-tight">{content.knowledgeTitle}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">{content.knowledgeDesc}</p>
                         </div>
                         <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 hover:-translate-y-2 transition-all group">
                            <h4 className="font-black text-royal-900 text-xl mb-2 uppercase tracking-tight">{content.communityTitle}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium">{content.communityDesc}</p>
                         </div>
                      </div>
                    </ScrollReveal>
                 </div>
                 <div className="w-full lg:w-1/2 relative">
                    <ScrollReveal delay={400}>
                      <div className="relative bg-royal-900 p-14 rounded-[4rem] shadow-2xl overflow-hidden">
                         <Globe className="text-white absolute -top-10 -right-10 opacity-5" size={320} />
                         <div className="relative z-10">
                            <h3 className="text-3xl font-serif font-black text-white mb-10 uppercase tracking-tighter border-b-4 border-white/10 pb-4">{content.whyBblHeading}</h3>
                            <ul className="space-y-8">
                              {[content.whyBblItem1, content.whyBblItem2, content.whyBblItem3, content.whyBblItem4].filter(Boolean).map((item, i) => (
                                <li key={i} className="flex items-center gap-6 group">
                                  <div className="shrink-0 w-10 h-10 rounded-2xl bg-gold-500 text-royal-900 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                                    <CheckCircle size={20} />
                                  </div>
                                  <span className="text-white/90 text-xl font-bold tracking-tight">{item}</span>
                                </li>
                              ))}
                            </ul>
                         </div>
                      </div>
                    </ScrollReveal>
                 </div>
              </div>
            </section>
         </div>
      </div>

      <footer className="bg-white py-24 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-20">
               <div className="col-span-1 lg:col-span-2">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-royal-900 rounded-2xl shadow-xl">
                      <Sparkles size={32} className="text-gold-500" />
                    </div>
                    <span className="cinzel font-black text-2xl text-royal-900 tracking-tighter">Build Biblical Leaders</span>
                  </div>
                  <p className="text-gray-500 text-lg max-w-lg mb-10 leading-relaxed font-medium italic opacity-80">{content.footerTagline}</p>
               </div>
               
               <div className="space-y-8">
                  <h4 className="font-black text-gray-950 uppercase text-xs tracking-[0.4em] border-l-4 border-gold-500 pl-4">Contact</h4>
                  <ul className="space-y-6">
                     <li className="flex items-center gap-4 text-gray-600 font-bold">
                        <a href={`mailto:${content.footerEmail}`} className="text-sm">{content.footerEmail}</a>
                     </li>
                  </ul>
               </div>

               <div className="space-y-8">
                  <h4 className="font-black text-gray-950 uppercase text-xs tracking-[0.4em] border-l-4 border-gold-500 pl-4">Quick Info</h4>
                  <ul className="grid grid-cols-1 gap-4">
                     {content.footerQuickInfoItems.split(',').map((item, idx) => (
                        <li key={idx} className="text-gray-500 text-sm font-bold hover:text-royal-600 cursor-pointer transition-colors flex items-center gap-3">
                           <ArrowRight size={14} className="text-gray-300" /> {item.trim()}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
               <p>{content.footerCopyright}</p>
               <div className="flex gap-12">
                  <span className="hover:text-royal-900 cursor-pointer transition-colors">{content.footerPrivacyText}</span>
                  <span className="hover:text-royal-900 cursor-pointer transition-colors">{content.footerTermsText}</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

const TrophyIcon = ({ size, className, strokeWidth }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.47 18.44 12 19 12 19s.53-.56 1.03-.79c.5-.23.97-.66.97-1.21v-2.34" />
        <path d="M12 14.66a5 5 0 0 1-5-5V2h10v7.66a5 5 0 0 1-5 5z" />
    </svg>
);

const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both" style={{ animationDelay: `${delay}ms` }}>
        {children}
    </div>
);

export default Hero;