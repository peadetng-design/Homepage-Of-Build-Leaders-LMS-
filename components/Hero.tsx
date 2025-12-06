import React from 'react';
import { BookOpen, Flame, Sun, Sparkles, Users, UserCheck, GraduationCap, ArrowRight, Library, Calendar, Globe } from 'lucide-react';

interface HeroProps {
  onRegister: () => void;
  onSignIn: () => void;
}

const Hero: React.FC<HeroProps> = ({ onRegister, onSignIn }) => {
  return (
    <div className="w-full bg-white text-gray-900 overflow-x-hidden">
      
      {/* 1. HERO SECTION (Above the fold) */}
      <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-white">
        
        {/* Background Animated Elements - Redesigned for Visibility */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          
          {/* Top Left - Book Group */}
          <div className="absolute top-[10%] left-[5%] animate-float">
            <div className="absolute inset-0 bg-blue-400 blur-[80px] opacity-20 rounded-full w-64 h-64"></div>
            <BookOpen size={140} strokeWidth={1} className="text-royal-200 relative z-10 opacity-60" />
          </div>

          {/* Top Right - Flame Group */}
          <div className="absolute top-[15%] right-[10%] animate-float-delayed">
            <div className="absolute inset-0 bg-gold-400 blur-[80px] opacity-20 rounded-full w-56 h-56"></div>
             <Flame size={120} strokeWidth={1} className="text-gold-300 relative z-10 opacity-60" />
          </div>

          {/* Bottom Center - Sun/Light Group */}
          <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 animate-pulse-slow">
             <div className="absolute inset-0 bg-royal-300 blur-[100px] opacity-10 rounded-full w-[600px] h-[300px] -translate-x-1/4"></div>
             <Sun size={300} strokeWidth={0.5} className="text-royal-100 opacity-40" />
          </div>

          {/* Floating Particles */}
          <div className="absolute top-1/3 left-1/3 text-gold-200 animate-bounce duration-[3000ms]">
            <Sparkles size={24} />
          </div>
          <div className="absolute bottom-1/3 right-1/4 text-royal-200 animate-bounce duration-[4000ms]">
            <Sparkles size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl px-6 flex flex-col items-center">
          
          <div className="mb-8 flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-royal-50 to-white border border-royal-100 inline-flex items-center gap-2 shadow-sm animate-fade-in-up">
               <span className="text-gold-500 text-xs">★</span>
               <span className="text-xs font-bold tracking-widest uppercase text-royal-800">The #1 Bible Quiz Platform</span>
               <span className="text-gold-500 text-xs">★</span>
            </div>
          </div>

          {/* Tighter Spacing Group */}
          <div className="flex flex-col gap-2 mb-10">
            <h1 className="cinzel text-4xl md:text-6xl font-bold leading-tight text-royal-900 drop-shadow-sm tracking-tight">
              Build Biblical Leaders
            </h1>

            <p className="text-base md:text-xl text-orange-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Empowering the next generation through interactive study, community competition, and spiritual growth.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full">
            <button
              onClick={onRegister}
              className="group relative px-8 py-4 bg-royal-700 text-white font-bold rounded-full shadow-xl shadow-royal-200 transition-all transform hover:-translate-y-1 hover:shadow-2xl min-w-[200px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full"></div>
              <span className="relative flex items-center justify-center gap-2">
                Get Started <ArrowRight size={18} />
              </span>
            </button>
            <button
              onClick={onSignIn}
              className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 min-w-[200px] hover:text-royal-700 hover:border-royal-100"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* 2. INFORMATICS BAR (Clickable) */}
      <div className="w-full bg-royal-900 py-16 text-white relative z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Users size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <Users size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">24</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">Active Groups</p>
            </div>
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <UserCheck size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <UserCheck size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">24</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">Dedicated Mentors</p>
            </div>
            <div className="group cursor-pointer p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:transform hover:-translate-y-2 text-center backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <GraduationCap size={80} />
               </div>
               <div className="mb-4 text-gold-400 group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
                 <GraduationCap size={40} />
               </div>
               <h3 className="text-5xl font-bold font-serif mb-2 relative z-10">210</h3>
               <p className="text-blue-200 text-sm uppercase tracking-wider font-semibold relative z-10">Engaged Students</p>
            </div>
        </div>
      </div>

      {/* 3. CTA STRIP */}
      <div className="w-full bg-gold-500 py-8 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm">
                 <Sparkles size={28} />
               </div>
               <div>
                 <h3 className="text-white font-bold text-xl md:text-2xl leading-none">Start your Leadership Group</h3>
                 <p className="text-gold-100 text-sm mt-1">Join the movement of discipleship today.</p>
               </div>
             </div>
             <button 
               onClick={onRegister}
               className="px-8 py-3 bg-white text-gold-600 font-bold rounded-full shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2 transform hover:scale-105"
             >
               Register Group Now <ArrowRight size={18} />
             </button>
         </div>
      </div>

      {/* 4. CONTENT PANELS (About, Resources, News) */}
      <div className="w-full bg-gray-50 py-24">
         <div className="max-w-7xl mx-auto px-6 space-y-32">
            
            {/* About Us */}
            <section id="about" className="scroll-mt-24">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                 <div className="w-full lg:w-1/2">
                    <span className="text-royal-600 font-bold uppercase tracking-widest text-xs mb-3 block">Our Mission</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 leading-tight">Raising Up the <span className="text-royal-600">Next Generation</span></h2>
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                      Build Biblical Leaders is more than just a quiz platform. It is a comprehensive discipleship ecosystem designed to immerse students in the Word of God. 
                      We believe that hiding God's word in young hearts creates a foundation for lifelong leadership.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-white rounded-2xl shadow-sm border-l-4 border-royal-500 hover:shadow-md transition-shadow">
                          <h4 className="font-bold text-gray-800 text-lg mb-1">Knowledge</h4>
                          <p className="text-sm text-gray-500">Deep biblical literacy & understanding</p>
                       </div>
                       <div className="p-6 bg-white rounded-2xl shadow-sm border-l-4 border-gold-500 hover:shadow-md transition-shadow">
                          <h4 className="font-bold text-gray-800 text-lg mb-1">Community</h4>
                          <p className="text-sm text-gray-500">Faith-based connection & growth</p>
                       </div>
                    </div>
                 </div>
                 <div className="w-full lg:w-1/2 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-royal-600 to-indigo-400 rounded-[2rem] transform rotate-3 opacity-10"></div>
                    <div className="relative bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100">
                       <Globe className="text-royal-50 absolute top-4 right-4" size={180} />
                       <div className="relative z-10">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why BBL?</h3>
                          <ul className="space-y-6">
                            {[
                              "Structured memorization plans",
                              "Real-time competition & leaderboards",
                              "Role-based tools for Mentors & Parents",
                              "District & Regional tournament support"
                            ].map((item, i) => (
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
                  <span className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-3 block">Study Materials</span>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">Equipping the Saints</h2>
                  <p className="text-gray-500 text-lg">Everything you need to succeed in your quizzing journey, from printable flashcards to AI-generated practice tests.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { title: "Study Guides", icon: BookOpen, desc: "Comprehensive chapter-by-chapter breakdowns and commentaries." },
                    { title: "Flashcards", icon: Library, desc: "Digital and printable sets optimized for spaced repetition." },
                    { title: "Quiz Generator", icon: Flame, desc: "AI-powered custom quizzes to target your weak areas." },
                  ].map((resource, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group duration-300">
                       <div className="w-16 h-16 bg-royal-50 rounded-2xl flex items-center justify-center text-royal-600 mb-8 group-hover:scale-110 transition-transform group-hover:bg-royal-600 group-hover:text-white shadow-inner">
                         <resource.icon size={32} />
                       </div>
                       <h3 className="text-2xl font-bold text-gray-900 mb-3">{resource.title}</h3>
                       <p className="text-gray-500 mb-6 leading-relaxed">{resource.desc}</p>
                       <span className="text-royal-600 font-bold text-sm group-hover:translate-x-2 transition-transform cursor-pointer flex items-center gap-2">
                         Access Now <ArrowRight size={16} />
                       </span>
                    </div>
                  ))}
               </div>
            </section>

            {/* News / Updates */}
            <section id="news" className="scroll-mt-24">
               <div className="bg-royal-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-royal-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 translate-y-1/4 -translate-x-1/4"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                       <div>
                         <span className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-3 block">Latest Updates</span>
                         <h2 className="text-4xl font-serif font-bold">News & Announcements</h2>
                       </div>
                       <button className="text-white border border-white/30 px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-sm font-semibold backdrop-blur-sm">
                         View Archive
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4 mb-6">
                             <span className="px-3 py-1 bg-gold-500 text-white text-xs font-bold rounded-full shadow-lg shadow-gold-900/20">Tournament</span>
                             <span className="text-blue-200 text-sm flex items-center gap-2"><Calendar size={14}/> Oct 15, 2023</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 group-hover:text-gold-300 transition-colors">Fall District Finals Registration Open</h3>
                          <p className="text-blue-100 text-base leading-relaxed">
                             Team registration for the upcoming district finals at First Baptist Church is now live. Ensure all student rosters are updated by Sept 30th.
                          </p>
                       </div>
                       <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4 mb-6">
                             <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-900/20">New Feature</span>
                             <span className="text-blue-200 text-sm flex items-center gap-2"><Calendar size={14}/> Sep 28, 2023</span>
                          </div>
                          <h3 className="text-2xl font-bold mb-3 group-hover:text-gold-300 transition-colors">AI-Powered Study Buddy Launched</h3>
                          <p className="text-blue-100 text-base leading-relaxed">
                             We've integrated Gemini AI to generate infinite practice questions tailored to your specific study material. Try it out in the Student Dashboard!
                          </p>
                       </div>
                    </div>
                  </div>
               </div>
            </section>

         </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-royal-800 rounded flex items-center justify-center text-white font-serif font-bold">B</div>
               <span className="font-bold text-gray-900">Build Biblical Leaders</span>
            </div>
            <p className="text-gray-400 text-sm">© 2023 Build Biblical Leaders. All rights reserved.</p>
         </div>
      </footer>

    </div>
  );
};

export default Hero;