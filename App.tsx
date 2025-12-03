
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import PrepositionGame from './components/PrepositionGame';
import { GameLevel, PrepositionCategory, UserProgress, PrepositionItem } from './types';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';
import { getUserProgress, updateCurrentStreakInUserProgress } from './services/dbService';
import StudentDashboard from './components/StudentDashboard';
import CategorySelectionScreen from './components/CategorySelectionScreen';
import { AboutSection, FaqSection } from './components/InfoSections';
import LoginModal from './components/LoginModal';
import { ActivityLogger } from './utils/ActivityLogger';
import { LEVEL_TITLES, STUDENT_ROSTER } from './constants';

const pageVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 } 
  },
  exit: { 
    opacity: 0, 
    scale: 1.05, 
    transition: { duration: 0.2 } 
  }
};

function App() {
  const [numericGameLevel, setNumericGameLevel] = useState<number>(() => {
    const savedLevel = localStorage.getItem('prepositionPal_gameLevel');
    return savedLevel ? parseInt(savedLevel, 10) : 1; // Default to Level 1
  });
  const [humorLevel, setHumorLevel] = useState<number>(() => {
    const savedHumor = localStorage.getItem('prepositionPal_humorLevel');
    return savedHumor ? parseInt(savedHumor, 10) : 5; // Default to Casual
  });
  const [hasApiKeySelected, setHasApiKeySelected] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PrepositionCategory | null | undefined>(undefined);
  const [showInfoSection, setShowInfoSection] = useState<'none' | 'about' | 'faq'>('none');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  
  // Logger State
  const [studentId, setStudentId] = useState<string | null>(null);
  const loggerRef = useRef<ActivityLogger | null>(null);

  // Deep Dive State
  const [deepDivePreposition, setDeepDivePreposition] = useState<PrepositionItem | null>(null);

  // Init Logger function
  const handleLogin = (username: string) => {
    setStudentId(username);
    loggerRef.current = new ActivityLogger('preposition-pal-module', username);
    loggerRef.current.startSession();
    // AGGRESSIVE TRACKING: Log login
    loggerRef.current.startActivity('session_init', 'login', 'User Logged In');
    loggerRef.current.endActivity();
    // AGGRESSIVE TRACKING: Log Menu entry
    loggerRef.current.startActivity('navigation_menu', 'navigation', 'Main Menu');
  };

  // URL Parameter Check for Auto-Login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('studentId');
    if (idParam) {
      const student = STUDENT_ROSTER.find(s => s.id === idParam);
      if (student) {
        console.log(`Auto-login via URL for: ${student.username}`);
        handleLogin(student.username);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('prepositionPal_gameLevel', numericGameLevel.toString());
    // AGGRESSIVE TRACKING: Log settings change
    if (loggerRef.current) {
        loggerRef.current.addMetadata('settings_change_level', numericGameLevel);
    }
  }, [numericGameLevel]);

  useEffect(() => {
    localStorage.setItem('prepositionPal_humorLevel', humorLevel.toString());
    // AGGRESSIVE TRACKING: Log settings change
    if (loggerRef.current) {
        loggerRef.current.addMetadata('settings_change_humor', humorLevel);
    }
  }, [humorLevel]);

  // Maps 1-36 (Creative Levels) to 1-10 (Pedagogical Levels for AI)
  const getGameLevelFromNumeric = (value: number): GameLevel => {
    // Determine pedagogical tier based on the 36-step ladder
    // Approximately 3.6 creative levels per pedagogical level
    const pedagogicalTier = Math.min(10, Math.ceil(value / 3.6));

    const levels = [
      GameLevel.Level_1, GameLevel.Level_2, 
      GameLevel.Level_3, GameLevel.Level_4, 
      GameLevel.Level_5, GameLevel.Level_6, 
      GameLevel.Level_7, GameLevel.Level_8, 
      GameLevel.Level_9, GameLevel.Level_10
    ];
    return levels[pedagogicalTier - 1] || GameLevel.Level_1;
  };

  const getHumorLabel = (level: number): string => {
    if (level <= 2) return 'Professional';
    if (level <= 5) return 'Casual';
    if (level <= 8) return 'Energetic';
    return 'Playful';
  };
  
  // Get creative title for current level
  const currentLevelTitle = LEVEL_TITLES[Math.min(numericGameLevel - 1, LEVEL_TITLES.length - 1)] || "Novice I";

  const gameLevel = getGameLevelFromNumeric(numericGameLevel);
  const humorLabel = getHumorLabel(humorLevel);
  
  const checkApiKey = useCallback(async () => {
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKeySelected(selected);
      } else {
        setHasApiKeySelected(true);
        console.warn('window.aistudio.hasSelectedApiKey is not available. Assuming API key is pre-configured.');
      }
    } catch (error) {
      console.error('Error checking API key selection status:', error);
      setHasApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Load user progress whenever we are in the menu
  useEffect(() => {
      if (selectedCategory === undefined) {
          getUserProgress().then(setUserProgress).catch(console.error);
      }
  }, [selectedCategory]);

  const handleSelectApiKey = async () => {
    // AGGRESSIVE TRACKING
    if (loggerRef.current) loggerRef.current.addMetadata('api_key_selection', 'initiated');
    
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasApiKeySelected(true);
        setTimeout(checkApiKey, 1000); 
      } else {
        alert('API key selection tool not available. Please ensure your API key is set in the environment.');
        setHasApiKeySelected(false);
      }
    } catch (error) {
      console.error('Error opening API key selection dialog:', error);
      setHasApiKeySelected(false);
    }
  };

  // Modified handleGameEnd to accept the final streak from PrepositionGame
  const handleGameEnd = async (finalGameSessionStreak?: number) => {
    // AGGRESSIVE TRACKING
    if (loggerRef.current) {
        loggerRef.current.endActivity(); // End game activity
        loggerRef.current.startActivity('navigation_menu', 'navigation', 'Returned to Menu');
    }
    
    // Update the current streak in IndexedDB if provided by the game session
    if (finalGameSessionStreak !== undefined && userProgress) {
        await updateCurrentStreakInUserProgress(finalGameSessionStreak);
        // Force refresh user progress in state to update dashboard
        getUserProgress().then(setUserProgress).catch(console.error);
    }
    setSelectedCategory(undefined);
    setDeepDivePreposition(null); // Clear deep dive
  };
  
  const handleBackToMenu = () => {
      // AGGRESSIVE TRACKING
      if (loggerRef.current) {
        loggerRef.current.endActivity(); // End whatever section we were in
        loggerRef.current.startActivity('navigation_menu', 'navigation', 'Returned to Menu');
      }
      setSelectedCategory(undefined);
      setShowInfoSection('none');
      setDeepDivePreposition(null); // Clear deep dive
  };

  const handleCategorySelect = (category: PrepositionCategory | null) => {
      setSelectedCategory(category);
      // AGGRESSIVE TRACKING
      if (loggerRef.current) {
          loggerRef.current.endActivity(); 
          loggerRef.current.startActivity(`game_session_${Date.now()}`, 'drill', `Game: ${category || 'All Categories'}`);
          loggerRef.current.addMetadata('selected_category', category || 'ALL');
          loggerRef.current.addMetadata('selected_level', gameLevel);
      }
  };

  const handleStartDeepDive = (preposition: PrepositionItem) => {
    setDeepDivePreposition(preposition);
    if (loggerRef.current) {
        loggerRef.current.endActivity();
        loggerRef.current.startActivity(`deep_dive_${preposition.preposition}`, 'drill', `Deep Dive: ${preposition.preposition}`);
    }
  };

  const renderCategorySelectionAndSettings = () => {
    let contentKey = "main-menu";
    let content = null;

    if (showInfoSection === 'about') {
      contentKey = "about";
      content = <AboutSection onBack={handleBackToMenu} />;
      // AGGRESSIVE TRACKING
      if (loggerRef.current && loggerRef.current.currentActivity?.activity_description !== 'Viewing About') {
         loggerRef.current.startActivity('view_about', 'reading', 'Viewing About');
      }
    } else if (showInfoSection === 'faq') {
      contentKey = "faq";
      content = <FaqSection onBack={handleBackToMenu} />;
      // AGGRESSIVE TRACKING
      if (loggerRef.current && loggerRef.current.currentActivity?.activity_description !== 'Viewing FAQ') {
         loggerRef.current.startActivity('view_faq', 'reading', 'Viewing FAQ');
      }
    } else {
      content = (
        <motion.div 
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex flex-col items-center gap-8"
        >
          {/* --- USER DASHBOARD (Now includes Settings) --- */}
          {userProgress && loggerRef.current && (
              <StudentDashboard 
                progress={userProgress} 
                logger={loggerRef.current} 
                currentLevelTitle={currentLevelTitle} 
                onStartDeepDive={handleStartDeepDive}
                numericGameLevel={numericGameLevel}
                setNumericGameLevel={setNumericGameLevel}
                humorLevel={humorLevel}
                setHumorLevel={setHumorLevel}
                humorLabel={humorLabel}
              />
          )}
          
          {/* Encapsulated Training Module Section */}
          <div className="w-full max-w-6xl mx-auto mt-2 px-1">
             <div className="bg-dark-accent-1 rounded-20px border border-white/10 shadow-2xl p-6 md:p-10 relative overflow-hidden group">
                    {/* Background Texture inside the spin border area */}
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#2C2D35_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#EF6035]/20 p-3 rounded-xl border border-[#EF6035]/30">
                                    <svg className="w-8 h-8 text-[#EF6035]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wide font-display drop-shadow-lg">
                                        Training Modules
                                    </h2>
                                    <p className="text-gray-400 font-medium">Select a protocol to initiate simulation</p>
                                </div>
                            </div>
                            
                            <div className="hidden md:block">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF6035]/10 border border-[#EF6035]/20 text-[#EF6035] text-[15px] font-bold uppercase tracking-widest animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-[#EF6035]"></span>
                                    System Ready
                                </span>
                            </div>
                        </div>
                        
                        <CategorySelectionScreen 
                            onSelectCategory={handleCategorySelect} 
                        />
                    </div>
             </div>
          </div>

        </motion.div>
      );
    }
    
    return (
      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="w-full">
            {content}
        </motion.div>
      </AnimatePresence>
    )
  };

  const renderContent = () => {
    if (!studentId) {
        return <LoginModal onLogin={handleLogin} />;
    }

    if (hasApiKeySelected === null) {
      return <LoadingSpinner message="Checking API key status..." />;
    }

    if (hasApiKeySelected === false) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-dark-accent-1 backdrop-blur-xl rounded-20px shadow-2xl max-w-xl mx-auto border border-white/10"
        >
          <h2 className="text-4xl font-black text-[#EF6035] mb-6 font-display">Access Required</h2>
          <p className="text-xl text-gray-300 mb-10">
            Please select your Google Gemini API key to play.
          </p>
          <Button onClick={handleSelectApiKey} className="py-4 px-10 text-xl font-bold">
            Connect API Key
          </Button>
        </motion.div>
      );
    }

    const isMenuMode = selectedCategory === undefined && deepDivePreposition === null;

    return (
      <AnimatePresence mode="wait">
        {isMenuMode ? (
            <motion.div key="menu-container" className="w-full" exit={{opacity: 0, scale: 1.5, filter: "blur(10px)", transition: {duration: 0.5}}}>
                {renderCategorySelectionAndSettings()}
            </motion.div>
        ) : (
            <motion.div 
                key="game-container" 
                className="w-full h-full fixed inset-0 z-50" 
                initial={{opacity: 0, scale: 0.8}} 
                animate={{opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}} 
                exit={{opacity: 0, scale: 0.8}}
            >
                <PrepositionGame 
                    level={gameLevel} 
                    numericLevel={numericGameLevel}
                    humorLevel={humorLevel}
                    category={selectedCategory || null} // Null if deep dive or all
                    forcedPreposition={deepDivePreposition} // Pass the deep dive target
                    onApiKeyNeeded={handleSelectApiKey}
                    onGameEnd={handleGameEnd}
                    onUpdateLevel={setNumericGameLevel}
                    onUpdateHumor={setHumorLevel}
                    logger={loggerRef.current} 
                    initialCurrentStreak={userProgress?.currentStreak || 0}
                />
            </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 font-body overflow-hidden">
      <AnimatePresence>
        {selectedCategory === undefined && deepDivePreposition === null && studentId && (
          <motion.header 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full max-w-6xl mx-auto mb-8 flex justify-between items-end border-b border-white/10 pb-6 relative z-10"
          >
            <div onClick={handleBackToMenu} className="cursor-pointer group">
                <h1 className="text-5xl md:text-7xl font-black text-[#EF6035] font-display tracking-tighter group-hover:opacity-90 transition-opacity drop-shadow-lg">
                PrepositionPal
                </h1>
            </div>
            
            <nav className="hidden sm:flex gap-8 text-base font-bold text-gray-400">
                <button onClick={() => { handleBackToMenu(); setShowInfoSection('about'); }} className="hover:text-[#EF6035] transition-colors">About</button>
                <button onClick={() => { handleBackToMenu(); setShowInfoSection('faq'); }} className="hover:text-[#EF6035] transition-colors">FAQ</button>
            </nav>
          </motion.header>
        )}
      </AnimatePresence>
      
      <main className="flex-grow flex flex-col items-center w-full relative z-10">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
