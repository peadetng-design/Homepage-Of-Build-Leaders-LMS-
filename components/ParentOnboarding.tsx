
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { Heart, UserPlus, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface ParentOnboardingProps {
  user: User;
  onLinkSuccess: () => void;
}

const ParentOnboarding: React.FC<ParentOnboardingProps> = ({ user, onLinkSuccess }) => {
  const [studentEmail, setStudentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.linkParentToStudent(user, studentEmail);
      onLinkSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
       <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
           {/* Header Area */}
           <div className="bg-royal-900 p-10 text-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="relative z-10">
                   <div className="w-20 h-20 bg-gold-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-500/20">
                      <Heart size={40} fill="currentColor" />
                   </div>
                   <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Connect Your Child</h1>
                   <p className="text-royal-200 text-lg">
                      Complete your parent account setup to view progress.
                   </p>
               </div>
           </div>

           {/* Content Area */}
           <div className="p-10">
               <div className="max-w-md mx-auto">
                   
                   <p className="text-gray-600 text-center mb-8">
                      Please enter your child's registered email address to link your accounts. 
                      This ensures you have secure access to their learning journey.
                   </p>

                   {error && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold text-center border border-red-100">
                          {error}
                      </div>
                   )}

                   <form onSubmit={handleSubmit} className="space-y-6">
                       <div>
                           <label className="block text-sm font-bold text-gray-800 uppercase mb-2 ml-1">Student Email Address</label>
                           <input 
                              type="email" 
                              required
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-royal-500 focus:ring-4 focus:ring-royal-500/10 outline-none text-lg text-gray-900 placeholder-gray-400"
                              placeholder="student@example.com"
                           />
                       </div>

                       {/* CONSPICUOUS GOLD BUTTON */}
                       <button 
                         type="submit"
                         disabled={isLoading}
                         className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-5 rounded-xl text-xl shadow-xl shadow-gold-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                       >
                          {isLoading ? (
                              <Loader2 className="animate-spin" size={24} />
                          ) : (
                              <>
                                <UserPlus size={24} />
                                LINK STUDENT
                              </>
                          )}
                       </button>
                   </form>

                   <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
                      <p>Don't have the details? Ask your child for their registered email.</p>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};

export default ParentOnboarding;
