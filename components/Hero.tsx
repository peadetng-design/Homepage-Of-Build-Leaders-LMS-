import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, Sparkles, Users, UserCheck, GraduationCap, ArrowRight, Library, Calendar, Globe, LayoutDashboard, Mail, Phone, MapPin, Share2 } from 'lucide-react';
import { User, HomepageContent } from '../types';
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
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[5%] animate-float">
            <div className="absolute inset-0 bg-blue-400 blur-[80px] opacity-20 rounded-full w-64 h-64"></div>
            <BookOpen size={140} strokeWidth={1} className="text-royal-200 relative z-10 opacity-60" />
          </div>
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 flex flex-col items-center">
          <div className="mb-8 flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-royal-50 to-white border border-royal-100 inline-flex items-center gap-2 shadow-sm">
               <span className="text-gold-500 text-xs">★</span>
               <span className="text-xs font-bold tracking-widest uppercase text-royal-800">{content.heroTagline}</span>
               <span className="text-gold-500 text-xs">★</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-10">
            <h1 className="cinzel text-4xl md:text-6xl font-bold leading-tight text-royal-900 drop-shadow-sm tracking-tight">
              {content.heroTitle}
            </h1>
            <p className="text-base md:text-xl text-orange-500 font-medium max-w-2xl mx-auto leading-relaxed animate-text-reveal">
              {content.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-12 sm:gap-16 justify-center items-center w-full relative">
            {currentUser ? (
               <button onClick={onNavigateToDashboard} className="group relative px-8 py-4 bg-royal-800 text-white font-bold rounded-full shadow-xl shadow-royal-900/20 transition-all transform hover:-translate-y-1 hover:shadow-2xl min-w-[220px] overflow-hidden border border-transparent">
                  <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <LayoutDashboard size={18} /> Go to Dashboard
                  </span>
               </button>
            ) : (
               <>
                <button onClick={onRegister} className="group relative px-8 py-4 bg-royal-800 text-white font-bold rounded-full shadow-xl shadow-royal-900/20 transition-all transform hover:-translate-y-1 hover:shadow-2xl min-w-[200px] overflow-hidden border border-transparent z-10">
                  <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {content.ctaButton} <ArrowRight size={18} />
                  </span>
                </button>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                   <div className="text-gold-400 animate-bounce duration-[2000ms]">
                      <Sparkles size={28} fill="currentColor" className="opacity-80 drop-shadow-sm" />
                   </div>
                </div>
                <button onClick={onSignIn} className="px-8 py-4 bg-white text-royal-600 font-bold rounded-full shadow-lg shadow-royal-500/10 hover:shadow-xl transition-all transform hover:-translate-y-1 min-w-[200px] border-2 border-royal-600 z-10">
                  Sign In
                </button>
               </>
            )}
          </div>
        </div>
      </div>

      {/* 2. INFORMATICS BAR */}
      <div className="w-full bg-royal-900 py-16 text-white relative z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Users size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <Users size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">{content.stats1Val}</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">{content.stats1Label}</p>
            </div>
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <UserCheck size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <UserCheck size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">{content.stats2Val}</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">{content.stats2Label}</p>
            </div>
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <GraduationCap size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <GraduationCap size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">{content.stats3Val}</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">{content.stats3Label}</p>
            </div>
        </div>
      </div>

      {/* 3. CTA STRIP */}
      {!currentUser && (
        <div className="w-full bg-gold-500 py-8 px-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm">
                   <Sparkles size={28} />
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-xl md:text-2xl leading-none">{content.ctaHeading}</h3>
                   <p className="text-gold-100 text-sm mt-1">{content.ctaSubheading}</p>
                 </div>
               </div>
               <button onClick={onRegister} className="px-8 py-3 bg-white text-gold-600 font-bold rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2 transform hover:scale-105">
                 {content.ctaButton} <ArrowRight size={18} />
               </button>
           </div>
        </div>
      )}

      {/* 4. CONTENT PANELS */}
      <div className="w-full bg-gray-50 py-24">
         <div className="max-w-7xl mx-auto px-6 space-y-32">
            
            {/* About Us */}
            <section id="about" className="scroll-mt-24">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                 <div className="w-full lg:w-1/2">
                    <span className="text-royal-600 font-bold uppercase tracking-widest text-xs mb-3 block">{content.aboutMission}</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 leading-tight">{content.aboutHeading}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">{content.aboutBody}</p>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-royal-500 rounded-2xl shadow-lg border-b-8 border-r-4 border-royal-800 hover:shadow-xl hover:-translate-y-1 transition-all group">
                          <h4 className="font-bold text-white text-lg mb-1 group-hover:scale-105 transition-transform origin-left">{content.knowledgeTitle}</h4>
                          <p className="text-sm text-royal-100">{content.knowledgeDesc}</p>
                       </div>
                       <div className="p-6 bg-gold-500 rounded-2xl shadow-lg border-b-8 border-r-4 border-gold-600 hover:shadow-xl hover:-translate-y-1 transition-all group">
                          <h4 className="font-bold text-white text-lg mb-1 group-hover:scale-105 transition-transform origin-left">{content.communityTitle}</h4>
                          <p className="text-sm text-white/90">{content.communityDesc}</p>
                       </div>
                    </div>
                 </div>
                 <div className="w-full lg:w-1/2 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-royal-600 to-indigo-400 rounded-[2rem] transform rotate-3 opacity-10"></div>
                    <div className="relative bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100">
                       <Globe className="text-royal-50 absolute top-4 right-4" size={180} />
                       <div className="relative z-10">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6">{content.whyBblHeading}</h3>
                          <ul className="space-y-6">
                            {[content.whyBblItem1, content.whyBblItem2, content.whyBblItem3, content.whyBblItem4].filter(Boolean).map((item, i) => (
                              <li key={i} className="flex items-start gap-4">
                                <div className="mt-1 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shadow-sm">✓</div>
                                <span className="text-gray-700 text-lg">{item}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* Resources */}
            <section id="resources" className="scroll-mt-24">
               <div className="text-center mb-16 max-w-3xl mx-auto">
                  <span className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-3 block">{content.resourcesHeading}</span>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">{content.resourcesTitle}</h2>
                  <p className="text-gray-500 text-lg">{content.resourcesSubtitle}</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: content.feature1Title, icon: BookOpen, desc: content.feature1Desc, buttonText: content.feature1Button, theme: "royal" },
                    { title: content.feature2Title, icon: Library, desc: content.feature2Desc, buttonText: content.feature2Button, theme: "gold" },
                    { title: content.feature3Title, icon: Flame, desc: content.feature3Desc, buttonText: content.feature3Button, theme: "royal" },
                  ].map((resource, idx) => {
                    const isRoyal = resource.theme === 'royal';
                    return (
                      <div key={idx} className={`p-8 rounded-3xl shadow-lg border-b-8 transition-all group duration-300 hover:shadow-2xl hover:-translate-y-2 ${isRoyal ? 'bg-royal-800 border-royal-900' : 'bg-gradient-to-br from-gold-400 to-gold-600 border-gold-700'}`}>
                         <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-inner">
                           <resource.icon size={32} strokeWidth={2} />
                         </div>
                         <h3 className={`text-2xl font-bold mb-3 tracking-wide text-white`}>{resource.title}</h3>
                         <p className={`mb-8 leading-relaxed font-medium text-white/95`}>{resource.desc}</p>
                         <span className={`font-bold text-sm group-hover:translate-x-2 transition-transform cursor-pointer flex items-center gap-2 text-white`}>
                           {resource.buttonText} <ArrowRight size={16} />
                         </span>
                      </div>
                    );
                  })}
               </div>
            </section>

            {/* News */}
            <section id="news" className="scroll-mt-24">
               <div className="bg-royal-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-royal-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 translate-y-1/4 -translate-x-1/4"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                       <div>
                         <span className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-3 block">{content.newsTagline}</span>
                         <h2 className="text-4xl font-serif font-bold">{content.newsHeading}</h2>
                       </div>
                       <button className="text-white border border-white/30 px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-sm font-semibold backdrop-blur-sm">View Archive</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4 mb-6">
                             <span className="px-3 py-1 bg-gold-500 text-white text-xs font-bold rounded-full shadow-lg shadow-gold-900/20">{content.news1Tag}</span>
                             <span className="text-blue-200 text-sm flex items-center gap-2"><Calendar size={14}/> {content.news1Date}</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 group-hover:text-gold-300 transition-colors">{content.news1Title}</h3>
                          <p className="text-blue-100 text-base leading-relaxed">{content.news1Content}</p>
                       </div>
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4 mb-6">
                             <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-900/20">{content.news2Tag}</span>
                             <span className="text-blue-200 text-sm flex items-center gap-2"><Calendar size={14}/> {content.news2Date}</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 group-hover:text-gold-300 transition-colors">{content.news2Title}</h3>
                          <p className="text-blue-100 text-base leading-relaxed">{content.news2Content}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </section>
         </div>
      </div>

      <footer className="bg-white py-16 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-lg">
                      <rect width="40" height="40" rx="10" fill="url(#footerLogoGradient)" />
                      <path d="M12 7 L20 3 L28 7" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11 L20 7 L28 11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 15 L20 11 L28 15" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="20" cy="21" r="3.5" stroke="white" strokeWidth="3" />
                      <path d="M10 35C10 30 15 27 20 27C25 27 30 30 30 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="footerLogoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#4338ca" /><stop offset="1" stopColor="#312e81" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="cinzel font-bold text-xl text-royal-900 tracking-wide">Build Biblical Leaders</span>
                  </div>
                  <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">{content.footerTagline}</p>
                  <div className="flex items-center gap-4">
                     <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Connect:</span>
                     <div className="flex gap-3">
                        {content.footerSocials.split(',').map((soc, i) => (
                           <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-xs font-bold hover:bg-royal-50 hover:text-royal-600 cursor-pointer transition-colors">{soc.trim()}</span>
                        ))}
                     </div>
                  </div>
               </div>
               
               <div>
                  <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-6">{content.footerContactHeading}</h4>
                  <ul className="space-y-4">
                     <li className="flex items-center gap-3 text-gray-600 hover:text-royal-600 transition-colors">
                        <Mail size={16} className="text-indigo-400" /><a href={`mailto:${content.footerEmail}`} className="text-sm font-medium">{content.footerEmail}</a>
                     </li>
                     <li className="flex items-center gap-3 text-gray-600"><Phone size={16} className="text-indigo-400" /><span className="text-sm font-medium">{content.footerPhone}</span></li>
                     <li className="flex items-start gap-3 text-gray-600"><MapPin size={16} className="text-indigo-400 mt-0.5" /><span className="text-sm font-medium leading-snug">{content.footerAddress}</span></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-6">{content.footerQuickInfoHeading}</h4>
                  <ul className="space-y-3">
                     {content.footerQuickInfoItems.split(',').map((item, idx) => (
                        <li key={idx} className="text-gray-500 text-sm font-medium hover:text-royal-600 cursor-pointer transition-colors">{item.trim()}</li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-xs font-bold">
               <p>{content.footerCopyright}</p>
               <div className="flex gap-8">
                  <span className="hover:text-royal-600 cursor-pointer">{content.footerPrivacyText}</span>
                  <span className="hover:text-royal-600 cursor-pointer">{content.footerTermsText}</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Hero;