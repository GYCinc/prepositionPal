import React, { useState, useEffect, useCallback } from 'react';
import PrepositionGame from './components/PrepositionGame';
import { GameLevel, PrepositionCategory } from './types';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';

const CategorySelectionScreen = ({ onSelectCategory }: { onSelectCategory: (category: PrepositionCategory | null) => void }) => (
  <div className="w-full">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ethereal-border">
      <div className="bg-gray-50 dark:bg-gray-700 py-4 px-6 border-b border-gray-200 dark:border-gray-600">
        <h2 className="text-xl font-bold tracking-wider text-gray-700 dark:text-gray-200 uppercase text-center font-display drop-shadow-sm">Choose a Category</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 font-body drop-shadow-sm">
          Select a category to focus your learning, or play with all prepositions.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
          {Object.values(PrepositionCategory).map((category) => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className="group flex flex-col items-center justify-center h-28 p-4 rounded-lg shadow-md cursor-pointer
                         bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900
                         border border-gray-400 dark:border-gray-700
                         hover:bg-gradient-to-br hover:from-primary/70 hover:to-orange-500/70 hover:border-primary
                         hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30
                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark
                         active:scale-[0.98] transition-all duration-200 ease-in-out"
            >
              <span className="text-base text-gray-900 dark:text-gray-200 font-semibold group-hover:text-white transition-colors font-display drop-shadow-sm">
                {category}
              </span>
            </button>
          ))}
          <button
            onClick={() => onSelectCategory(null)}
            className="group flex flex-col items-center justify-center h-28 p-4 rounded-lg shadow-md cursor-pointer
                       bg-gradient-to-br from-primary to-orange-600 border border-primary
                       hover:from-orange-400 hover:to-red-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/40
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark
                       active:scale-[0.98] transition-all duration-200 ease-in-out"
          >
            <span className="text-base text-white font-semibold font-display drop-shadow-sm">
              All Categories
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AboutSection = ({ onBack }: { onBack: () => void }) => (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ethereal-border p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-display drop-shadow-sm">About PrepositionPal: Your Digital Grammar Guru (with a Sense of Humor)</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 font-body drop-shadow-sm">
                Welcome, intrepid language adventurer! You've stumbled upon PrepositionPal, the only app that truly understands your love-hate relationship with 'in,' 'on,' and 'at.' We believe learning English prepositions shouldn't feel like deciphering ancient hieroglyphs, especially when you're just trying to say you're 'on' the bus, not 'in' the bus (unless you're literally <em>inside</em> the engine compartment, which we don't recommend).
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 font-body drop-shadow-sm">
                Our sophisticated AI (Gemini, who occasionally asks <em>us</em> for help with tricky idioms) crafts unique sentences and vivid images to burn those pesky prepositions into your linguistic memory. No more dull drills! We promise context, clarity, and maybe a few chuckles. Adjust the 'humor level' to see if our AI can truly tickle your funny bone, or if it just delivers dad jokes from the digital ether.
            </p>
            <p className="text-gray-700 dark:text-gray-300 font-body drop-shadow-sm">
                <strong>Disclaimer:</strong> PrepositionPal is not responsible for any sudden urges to correct other people's grammar at parties. Use your newfound powers wisely.
            </p>
        </div>
        <div className="w-full mt-8">
            <Button onClick={onBack}>Back to Settings</Button>
        </div>
    </div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <button
                className="flex justify-between items-center w-full text-left p-4 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white font-display drop-shadow-sm">
                    {question}
                </h3>
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'} text-gray-600 dark:text-gray-300`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-gray-700 dark:text-gray-300 font-body drop-shadow-sm animate-fade-in">
                    {answer}
                </div>
            )}
        </div>
    );
};

const FaqSection = ({ onBack }: { onBack: () => void }) => (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ethereal-border w-full">
            <div className="bg-gray-50 dark:bg-gray-700 py-4 px-6 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-display drop-shadow-sm text-center">Frequently Asked Questions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-body drop-shadow-sm">
                    Answers to the burning questions that keep you 'in' suspense.
                </p>
            </div>
            <div className="p-2 sm:p-4">
                <FaqItem
                    question="How does PrepositionPal know which prepositions to use?"
                    answer="Our AI, Gemini, has been extensively trained on a vast ocean of English text. It's basically read more books than a thousand librarians combined. It doesn't 'know' in the human sense, but it's exceptionally good at spotting patterns and predicting the most natural preposition for any given context. Think of it as a super-smart parrot who's also a grammar genius. But don't worry, it won't ask for crackers."
                />
                <FaqItem
                    question="Why do some images look a little... quirky?"
                    answer="Ah, the artistic license of AI! While Gemini strives for photorealism, occasionally it's still figuring out the difference between 'a dog on a unicycle' and 'a unicycle on a dog.' Plus, if you've cranked up the 'humor level,' our AI might get a little too creative. Embrace the quirkiness! It's all part of the charm (and sometimes, a good laugh)."
                />
                <FaqItem
                    question="Can I really master all English prepositions with this app?"
                    answer="You absolutely can! While total 'mastery' is a lifelong journey even for native speakers (we still debate 'different from' vs. 'different than'), PrepositionPal will give you a rock-solid foundation and confidence. Think of us as your personal preposition trainer – we'll get you ripped... linguistically, of course. Consistent practice is key, and we'll keep the challenges fresh so you never get bored!"
                />
                <FaqItem
                    question="Is my API key safe with PrepositionPal?"
                    answer="Absolutely! Your API key is like your secret handshake with the Gemini API. We never store it, share it, or even glance at it sideways. It's used directly by your browser to communicate with Google's services. We're more interested in your preposition prowess than your personal credentials. Promise!"
                />
            </div>
        </div>
        <div className="w-full mt-8">
            <Button onClick={onBack}>Back to Settings</Button>
        </div>
    </div>
);


function App() {
  const [numericGameLevel, setNumericGameLevel] = useState<number>(() => {
    const savedLevel = localStorage.getItem('prepositionPal_gameLevel');
    return savedLevel ? parseInt(savedLevel, 10) : 3; // Default to B1
  });
  const [humorLevel, setHumorLevel] = useState<number>(() => {
    const savedHumor = localStorage.getItem('prepositionPal_humorLevel');
    return savedHumor ? parseInt(savedHumor, 10) : 5; // Default to Amusing
  });
  const [hasApiKeySelected, setHasApiKeySelected] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PrepositionCategory | null | undefined>(undefined); // undefined: not selected, null: all
  const [showInfoSection, setShowInfoSection] = useState<'none' | 'about' | 'faq'>('none'); // New state for info sections

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('prepositionPal_gameLevel', numericGameLevel.toString());
  }, [numericGameLevel]);

  useEffect(() => {
    localStorage.setItem('prepositionPal_humorLevel', humorLevel.toString());
  }, [humorLevel]);

  const getGameLevelFromNumeric = (value: number): GameLevel => {
    const levels = [GameLevel.A1, GameLevel.A2, GameLevel.B1, GameLevel.B2, GameLevel.C1, GameLevel.C2];
    return levels[value - 1] || GameLevel.B1;
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

  const handleSelectApiKey = async () => {
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

  const handleGameEnd = () => {
    setSelectedCategory(undefined);
  };

  const renderCategorySelectionAndSettings = () => {
    if (showInfoSection === 'about') {
        return <AboutSection onBack={() => setShowInfoSection('none')} />;
    }
    if (showInfoSection === 'faq') {
        return <FaqSection onBack={() => setShowInfoSection('none')} />;
    }

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
           {/* Welcome Section */}
           <div className="text-center mb-4 animate-fade-in">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 font-display drop-shadow-sm">Welcome to PrepositionPal!</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-body drop-shadow-sm">Master English prepositions with AI-powered challenges.</p>
            </div>

          {/* Adjust Your Challenge - Now on top! */}
          <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl ethereal-border animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-bold text-center text-gray-800 dark:text-gray-200 mb-6 font-display drop-shadow-sm">Adjust Your Challenge</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 font-body drop-shadow-sm">
                Customize the difficulty and humor of your learning experience.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <label htmlFor="game-level" className="font-semibold text-gray-700 dark:text-gray-300 drop-shadow-sm">Difficulty</label>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded-md text-sm drop-shadow-sm">{gameLevel}</span>
                      </div>
                      <input
                          id="game-level"
                          type="range"
                          min="1"
                          max="6"
                          step="1"
                          value={numericGameLevel}
                          onChange={(e) => setNumericGameLevel(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary
                                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-in-out
                                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:ease-in-out
                                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-body drop-shadow-sm">Controls vocabulary and sentence complexity.</p>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <label htmlFor="humor-level" className="font-semibold text-gray-700 dark:text-gray-300 drop-shadow-sm">Humor</label>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded-md text-sm drop-shadow-sm">{humorLabel}</span>
                      </div>
                      <input
                          id="humor-level"
                          type="range"
                          min="0"
                          max="10"
                          value={humorLevel}
                          onChange={(e) => setHumorLevel(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary
                                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-in-out
                                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:ease-in-out
                                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-body drop-shadow-sm">Determines the wittiness of the scenarios.</p>
                  </div>
              </div>
          </div>
          {/* Category Selection */}
          <div className="w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CategorySelectionScreen onSelectCategory={setSelectedCategory} />
          </div>

        </div>
    );
  };

  const renderContent = () => {
    if (hasApiKeySelected === null) {
      return <LoadingSpinner message="Checking API key status..." />;
    }

    if (hasApiKeySelected === false) {
      return (
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-auto animate-fade-in ethereal-border">
          <h2 className="text-2xl font-bold text-primary mb-4 font-display drop-shadow-sm">API Key Required</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 font-body drop-shadow-sm">
            Please select your Google Gemini API key to play.
          </p>
          <Button onClick={handleSelectApiKey}>
            Select API Key
          </Button>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-body drop-shadow-sm">
            Learn more about billing: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary/80 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
          </p>
        </div>
      );
    }

    if (selectedCategory === undefined) {
      return renderCategorySelectionAndSettings();
    }

    return (
      <PrepositionGame 
        level={gameLevel} 
        humorLevel={humorLevel}
        category={selectedCategory} 
        onApiKeyNeeded={handleSelectApiKey}
        onGameEnd={handleGameEnd}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6">
      <header className="py-8 w-full max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text font-display drop-shadow-lg-primary">PrepositionPal</h1>
      </header>
      
      <main className="flex-grow flex flex-col justify-center items-center">
        {renderContent()}
      </main>

      <footer className="w-full text-center text-gray-500 dark:text-gray-400 py-4 mt-8">
        <p className="text-sm font-body drop-shadow-sm flex justify-center items-center gap-x-4">
          <button onClick={() => setShowInfoSection('about')} className="text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark rounded-md">
            About PrepositionPal
          </button>
          <span>&bull;</span>
          <button onClick={() => setShowInfoSection('faq')} className="text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark rounded-md">
            FAQ
          </button>
        </p>
        <p className="text-sm font-body drop-shadow-sm mt-2">
          Powered by ADD & the gate crashers
        </p>
      </footer>
    </div>
  );
}

export default App;