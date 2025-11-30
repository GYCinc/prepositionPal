import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import PrepositionGame from './components/PrepositionGame';
import { GameLevel, PrepositionCategory, UserProgress } from './types';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';
import { getUserProgress } from './services/dbService';
import StudentDashboard from './components/StudentDashboard';
import CategorySelectionScreen from './components/CategorySelectionScreen';
import GameSettingsControl from './components/GameSettingsControl';
import { AboutSection, FaqSection } from './components/InfoSections';

const pageVariants: Variants = {
  initial: { opacity: 1, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

function App() {
  const [numericGameLevel, setNumericGameLevel] = useState<number>(() => {
    const savedLevel = localStorage.getItem('prepositionPal_gameLevel');
    return savedLevel ? parseInt(savedLevel, 10) : 1; // Default to A1 (level 1)
  });
  const [humorLevel, setHumorLevel] = useState<number>(() => {
    const savedHumor = localStorage.getItem('prepositionPal_humorLevel');
    return savedHumor ? parseInt(savedHumor, 10) : 5; // Default to Amusing
  });
  const [hasApiKeySelected, setHasApiKeySelected] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PrepositionCategory | null | undefined>(
    undefined
  );
  const [showInfoSection, setShowInfoSection] = useState<'none' | 'about' | 'faq'>('none');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    localStorage.setItem('prepositionPal_gameLevel', numericGameLevel.toString());
  }, [numericGameLevel]);

  useEffect(() => {
    localStorage.setItem('prepositionPal_humorLevel', humorLevel.toString());
  }, [humorLevel]);

  // Maps 1-10 to the new granular levels
  const getGameLevelFromNumeric = (value: number): GameLevel => {
    const levels = [
      GameLevel.Level_1,
      GameLevel.Level_2,
      GameLevel.Level_3,
      GameLevel.Level_4,
      GameLevel.Level_5,
      GameLevel.Level_6,
      GameLevel.Level_7,
      GameLevel.Level_8,
      GameLevel.Level_9,
      GameLevel.Level_10,
    ];
    return levels[value - 1] || GameLevel.Level_1;
  };

  const getHumorLabel = (level: number): string => {
    if (level <= 1) return 'Serious';
    if (level <= 4) return 'Subtle';
    if (level <= 7) return 'Amusing';
    return 'Witty';
  };

  const gameLevel = getGameLevelFromNumeric(numericGameLevel);
  const humorLabel = getHumorLabel(humorLevel);

  const checkApiKey = useCallback(async () => {
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKeySelected(selected);
      } else {
        setHasApiKeySelected(true);
        console.warn(
          'window.aistudio.hasSelectedApiKey is not available. Assuming API key is pre-configured.'
        );
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
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasApiKeySelected(true);
        setTimeout(checkApiKey, 1000);
      } else {
        alert(
          'API key selection tool not available. Please ensure your API key is set in the environment.'
        );
        setHasApiKeySelected(false);
      }
    } catch (error) {
      console.error('Error opening API key selection dialog:', error);
      setHasApiKeySelected(false);
    }
  };

  const handleGameEnd = () => {
    setSelectedCategory(undefined);
  };

  const handleBackToMenu = () => {
    setSelectedCategory(undefined);
    setShowInfoSection('none');
  };

  const renderCategorySelectionAndSettings = () => {
    let contentKey = 'main-menu';
    let content = null;

    if (showInfoSection === 'about') {
      contentKey = 'about';
      content = <AboutSection onBack={handleBackToMenu} />;
    } else if (showInfoSection === 'faq') {
      contentKey = 'faq';
      content = <FaqSection onBack={handleBackToMenu} />;
    } else {
      content = (
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex flex-col items-center gap-8"
        >
          {/* --- USER DASHBOARD --- */}
          {userProgress && <StudentDashboard progress={userProgress} />}

          {/* Settings Bar - Extracted Component */}
          <GameSettingsControl
            gameLevel={gameLevel}
            numericGameLevel={numericGameLevel}
            setNumericGameLevel={setNumericGameLevel}
            humorLabel={humorLabel}
            humorLevel={humorLevel}
            setHumorLevel={setHumorLevel}
          />

          {/* Encapsulated Training Module Section */}
          <div className="w-full max-w-6xl mx-auto mt-8 px-1">
            <div className="relative p-[3px] rounded-3xl overflow-hidden group shadow-2xl">
              {/* Animated Gradient Border Layer */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EF6035] via-purple-600 to-[#EF6035] animate-gradient-x opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Inner Content Layer - Translucent to show Constellations */}
              <div className="relative bg-[#17181C]/90 backdrop-blur-md rounded-[21px] p-6 md:p-10 overflow-hidden">
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#2C2D35_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#EF6035]/20 p-3 rounded-xl border border-[#EF6035]/30">
                        <svg
                          className="w-8 h-8 text-[#EF6035]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-wide font-display drop-shadow-lg">
                          Training Modules
                        </h2>
                        <p className="text-gray-400 font-medium">
                          Select a protocol to initiate simulation
                        </p>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF6035]/10 border border-[#EF6035]/20 text-[#EF6035] text-xs font-bold uppercase tracking-widest animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#EF6035]"></span>
                        System Ready
                      </span>
                    </div>
                  </div>

                  <CategorySelectionScreen onSelectCategory={setSelectedCategory} />
                </div>
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
    );
  };

  const renderContent = () => {
    if (hasApiKeySelected === null) {
      return <LoadingSpinner message="Checking API key status..." />;
    }

    if (hasApiKeySelected === false) {
      return (
        <motion.div
          initial={{ opacity: 1, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-[#212229]/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-xl mx-auto border border-white/10"
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

    const isMenuMode = selectedCategory === undefined;

    return (
      <AnimatePresence mode="wait">
        {isMenuMode ? (
          <motion.div
            key="menu-container"
            className="w-full"
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)', transition: { duration: 0.5 } }}
          >
            {renderCategorySelectionAndSettings()}
          </motion.div>
        ) : (
          <motion.div
            key="game-container"
            className="w-full h-full fixed inset-0 z-50"
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <PrepositionGame
              level={gameLevel}
              numericLevel={numericGameLevel}
              humorLevel={humorLevel}
              category={selectedCategory}
              onApiKeyNeeded={handleSelectApiKey}
              onGameEnd={handleGameEnd}
              onUpdateLevel={setNumericGameLevel}
              onUpdateHumor={setHumorLevel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 font-body overflow-hidden">
      <AnimatePresence>
        {selectedCategory === undefined && (
          <motion.header
            initial={{ opacity: 1, y: -50 }}
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
              <button
                onClick={() => {
                  handleBackToMenu();
                  setShowInfoSection('about');
                }}
                className="hover:text-[#EF6035] transition-colors"
              >
                About
              </button>
              <button
                onClick={() => {
                  handleBackToMenu();
                  setShowInfoSection('faq');
                }}
                className="hover:text-[#EF6035] transition-colors"
              >
                FAQ
              </button>
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
