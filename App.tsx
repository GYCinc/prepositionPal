import React, { useState, useEffect, useCallback } from 'react';
import PrepositionGame from './components/PrepositionGame';
import { GameLevel } from './types';
import Button from './components/Button';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [numericGameLevel, setNumericGameLevel] = useState<number>(3); // 1: A1, 2: A2, ..., 6: C2 (starting at B1)
  const [humorLevel, setHumorLevel] = useState<number>(5); // 0-10
  const [hasApiKeySelected, setHasApiKeySelected] = useState<boolean | null>(null); // null means checking, false means not selected

  const getGameLevelFromNumeric = (value: number): GameLevel => {
    switch (value) {
      case 1: return GameLevel.A1;
      case 2: return GameLevel.A2;
      case 3: return GameLevel.B1;
      case 4: return GameLevel.B2;
      case 5: return GameLevel.C1;
      case 6: return GameLevel.C2;
      default: return GameLevel.B1; // Default to B1
    }
  };

  const gameLevel = getGameLevelFromNumeric(numericGameLevel);
  
  const checkApiKey = useCallback(async () => {
    try {
      // Assuming window.aistudio is globally available and its types are provided by the environment.
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKeySelected(selected);
      } else {
        // Assume API key is managed externally or not needed for this environment
        // if window.aistudio is not available (e.g., local development without AI Studio wrapper)
        setHasApiKeySelected(true);
        console.warn('window.aistudio.hasSelectedApiKey is not available. Assuming API key is pre-configured.');
      }
    } catch (error) {
      console.error('Error checking API key selection status:', error);
      setHasApiKeySelected(false); // Assume failure means no key selected
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectApiKey = async () => {
    try {
      // Assuming window.aistudio is globally available and its types are provided by the environment.
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        // Optimistic update: assume success, then re-check for certainty
        setHasApiKeySelected(true);
        // Re-check after a brief moment to ensure the environment variable is updated
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

  if (hasApiKeySelected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900 text-slate-200">
        <LoadingSpinner message="Checking API key status..." size="lg" />
      </div>
    );
  }

  if (hasApiKeySelected === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 to-gray-900 text-slate-200">
        <h2 className="text-3xl sm:text-4xl font-bold text-orange-400 mb-4">API Key Required</h2>
        <p className="text-lg text-slate-300 mb-6 max-w-md">
          To unlock the full potential of PrepositionPal, including AI-powered question generation and image creation, 
          please select your Google Gemini API key.
        </p>
        <Button onClick={handleSelectApiKey} variant="primary" size="lg">
          Select API Key
        </Button>
        <p className="mt-8 text-sm text-slate-400">
          Need an API key? Learn more about billing: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
          <span className="text-orange-400">Preposition</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Pal</span>
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Your AI-powered guide to mastering English prepositions.</p>
      </header>
      
      <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-lg mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="game-level" className="font-semibold text-slate-300 whitespace-nowrap">Difficulty:</label>
          <input
            id="game-level"
            type="range"
            min="1"
            max="6"
            step="1"
            value={numericGameLevel}
            onChange={(e) => setNumericGameLevel(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer custom-range"
          />
          <span className="text-orange-400 font-bold w-8 text-center">{gameLevel}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="humor-level" className="font-semibold text-slate-300">Humor:</label>
          <input
            id="humor-level"
            type="range"
            min="0"
            max="10"
            value={humorLevel}
            onChange={(e) => setHumorLevel(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer custom-range"
          />
          <span className="text-orange-400 font-bold w-8 text-center">{humorLevel}</span>
        </div>
      </div>

      <main className="flex-grow w-full max-w-5xl">
        <PrepositionGame level={gameLevel} humorLevel={humorLevel} onApiKeyNeeded={handleSelectApiKey} />
      </main>

      <footer className="w-full text-center text-slate-500 mt-12">
        <p className="text-sm">
          Powered by the Google Gemini API
        </p>
      </footer>
    </div>
  );
}

export default App;