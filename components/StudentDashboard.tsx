
import React, { useMemo } from 'react';
import { UserProgress, PrepositionItem } from '../types';
import { ActivityLogger } from '../utils/ActivityLogger';
import { ALL_PREPOSITIONS } from '../constants';
import { motion } from 'framer-motion';

interface StudentDashboardProps {
  progress: UserProgress;
  logger: ActivityLogger;
  currentLevelTitle?: string;
  onStartDeepDive: (preposition: PrepositionItem) => void;
  numericGameLevel: number;
  setNumericGameLevel: (level: number) => void;
  humorLevel: number;
  setHumorLevel: (level: number) => void;
  humorLabel: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  progress, 
  currentLevelTitle, 
  onStartDeepDive,
  numericGameLevel,
  setNumericGameLevel,
  humorLevel,
  setHumorLevel,
  humorLabel
}) => {
  
  const prepositionOfTheDay = useMemo(() => {
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    return ALL_PREPOSITIONS[dayIndex % ALL_PREPOSITIONS.length];
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* TOP ROW: COCKPIT HEADER (Difficulty | Tone | Streak) */}
        <div className="w-full bg-dark-accent-1 rounded-20px border border-white/10 p-1 shadow-2xl relative overflow-hidden group">
            
            {/* Inner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1 bg-[#1a1b23] rounded-[18px] overflow-hidden">

                {/* 1. DIFFICULTY CONTROL (Cols 5) */}
                <div className="md:col-span-5 bg-dark-accent-1 p-8 relative flex flex-col justify-between hover:bg-[#25262e] transition-colors group/rank">
                    
                    <div className="flex justify-between items-start mb-4">
                         <h3 className="text-gray-400 text-lg font-black uppercase tracking-widest flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-[#EF6035]/10 text-[#EF6035] border border-[#EF6035]/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            DIFFICULTY
                        </h3>
                        <div className="text-right">
                            <span className="block text-5xl font-black text-[#EF6035] font-display leading-none drop-shadow-lg">{numericGameLevel}</span>
                        </div>
                    </div>
                    
                    <div className="mb-2">
                        <span className="block text-right text-base text-white font-bold uppercase tracking-wide opacity-80 mb-4">
                            {currentLevelTitle}
                        </span>
                        
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider w-14 text-right">Novice</span>
                            <div className="relative h-4 bg-gray-800 rounded-full flex-1 border border-white/5">
                                 <div 
                                    className="absolute top-0 left-0 h-full bg-[#EF6035] rounded-full shadow-[0_0_15px_rgba(239,96,53,0.4)] transition-all duration-100" 
                                    style={{ width: `${(numericGameLevel / 36) * 100}%` }}
                                 ></div>
                                 <input
                                    type="range" min="1" max="36" step="1"
                                    value={numericGameLevel}
                                    onChange={(e) => setNumericGameLevel(parseInt(e.target.value, 10))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider w-14">Legend</span>
                        </div>
                    </div>
                </div>

                {/* 2. TONE CONTROL (Cols 5) */}
                <div className="md:col-span-5 bg-dark-accent-1 p-8 relative flex flex-col justify-between hover:bg-[#25262e] transition-colors group/tone border-t md:border-t-0 md:border-l border-white/5">
                    
                    <div className="flex justify-between items-start mb-4">
                         <h3 className="text-gray-400 text-lg font-black uppercase tracking-widest flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </span>
                            AI TONE
                        </h3>
                         <div className="text-right">
                             <span className="block text-4xl font-black text-purple-500 font-display leading-none drop-shadow-lg">{humorLabel}</span>
                        </div>
                    </div>

                    <div className="mb-2">
                         <span className="block text-right text-base text-white font-bold uppercase tracking-wide opacity-80 mb-4">
                            Sentence Personality
                        </span>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider w-14 text-right">Professional</span>
                            <div className="relative h-4 bg-gray-800 rounded-full flex-1 border border-white/5">
                                 <div 
                                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-100" 
                                    style={{ width: `${(humorLevel / 10) * 100}%` }}
                                 ></div>
                                 <input
                                    type="range" min="0" max="10" step="1"
                                    value={humorLevel}
                                    onChange={(e) => setHumorLevel(parseInt(e.target.value, 10))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider w-14">Playful</span>
                        </div>
                    </div>
                </div>

                {/* 3. STREAK (Cols 2) */}
                <div className="md:col-span-2 bg-dark-accent-1 p-4 relative flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/5 bg-[#1a1b23]">
                     <span className="text-gray-500 text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                        Streak
                     </span>
                     <motion.div 
                        key={progress.currentStreak}
                        animate={{ scale: [1, 1.2, 1], color: ['#fff', '#EF6035', '#fff'] }}
                        className="text-6xl font-black text-white font-display leading-none drop-shadow-xl"
                     >
                        {progress.currentStreak}
                     </motion.div>
                </div>

            </div>
        </div>

        {/* SECOND ROW: TWO SMALL ARRAYS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            
            {/* LEFT: THE BEYOND (Daily Gem) */}
            <motion.button 
                onClick={() => onStartDeepDive(prepositionOfTheDay)}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="w-full text-left bg-gradient-to-br from-[#2e1065] to-[#1e1b4b] rounded-20px border border-white/10 shadow-2xl p-8 relative overflow-hidden group min-h-[240px] flex flex-col justify-between"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        
                        {/* Animated Neon Border Capsule - SMOOTH LIQUID MOTION */}
                        <div className="relative group/gem">
                            {/* Blurred Glow Background */}
                            <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full blur-md opacity-70 animate-[spin_3s_linear_infinite]" />
                            {/* Solid Background Block */}
                            <div className="relative px-4 py-1.5 rounded-full bg-[#1e1b4b] text-white border border-white/10 z-10">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                                    Daily Gem
                                </span>
                            </div>
                        </div>
                        
                        <span className="text-purple-300 text-sm font-bold uppercase tracking-wide">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
                        </span>
                    </div>
                    
                    <h3 className="text-5xl md:text-6xl font-black text-white font-display tracking-tight mb-3 drop-shadow-lg">
                        {prepositionOfTheDay.preposition}
                    </h3>
                     <p className="text-purple-200/90 text-xl italic leading-tight max-w-sm font-medium">
                        "{prepositionOfTheDay.exampleSentence}"
                    </p>
                </div>

                <div className="relative z-10 mt-6 flex items-center gap-2 text-[#EF6035] font-black text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                    Start Deep Dive
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
                
                {/* Purple Gradient Decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 pointer-events-none mix-blend-screen"></div>
            </motion.button>

            {/* RIGHT: PLACEHELD */}
            <div className="w-full bg-dark-accent-1 rounded-20px border border-white/10 shadow-xl p-8 min-h-[240px] flex flex-col items-center justify-center relative overflow-hidden opacity-50 border-dashed border-2">
                 <span className="text-gray-500 font-bold uppercase tracking-[0.2em] text-sm">
                    Coming Soon
                 </span>
            </div>

        </div>

    </div>
  );
};

export default StudentDashboard;
