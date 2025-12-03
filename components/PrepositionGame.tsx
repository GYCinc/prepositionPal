
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import { ALL_PREPOSITIONS, PREPOSITION_DETAILS } from '../constants'; // Import ALL_PREPOSITIONS
import { GameLevel, Preposition, PrepositionCategory, Question, PrepositionItem } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { generateText, generateImage, generateSpeech, generateVideo } from '../services/geminiService';
import CanvasImageDisplay from './CanvasImageDisplay'; // Corrected import path
import { setImageData, clearImageData, getImageData } from '../services/imageStore';
import { playRawAudio } from '../utils/audioUtils';
import { saveQuestionResult, cacheGeneratedQuestion, findCachedQuestion } from '../services/dbService';
import { buildGeminiPrompt, generateRandomSentenceContext, getWrongOptions } from '../utils/gameLogic';
import { ActivityLogger } from '../utils/ActivityLogger';

const ROUND_LENGTH = 5; // Every 5 questions is a "Video Round"
const HISTORY_LIMIT = 15; 
const GAME_STATE_KEY = 'prepositionPal_gameState';

// Dynamic Loading Messages
const STANDARD_MESSAGES = [
  "Consulting the grammar spirits...",
  "Summoning a scenario...",
  "Polishing prepositions...",
  "Constructing context...",
  "Painting with pixels...",
  "Weaving words together...",
  "Loading wit and wisdom...",
  "Asking Gemini nicely..."
];

const VIDEO_MESSAGES = [
  "You sure expect a lot from me...",
  "Lights, camera, preposition!",
  "Rendering reality (this takes a sec)...",
  "Teaching pixels how to move...",
  "Directing a blockbuster just for you...",
  "Waking up the director...",
  "Converting coffee into video frames...",
  "Please hold, making movie magic...",
  "Generating frames (patience is a virtue)..."
];

const getRandomLoadingMessage = (isVideo: boolean) => {
  const messages = isVideo ? VIDEO_MESSAGES : STANDARD_MESSAGES;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to parse bold markdown for display
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
        const cleanText = part.replace(/[\*]+/g, '');
        return <strong key={index} className="text-white font-black drop-shadow-md">{cleanText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

interface PrepositionGameProps {
  level: GameLevel;
  numericLevel: number;
  humorLevel: number;
  category: PrepositionCategory | null;
  forcedPreposition?: PrepositionItem | null; // Optional prop for Deep Dive
  onApiKeyNeeded: () => void;
  onGameEnd: (finalGameSessionStreak?: number) => void;
  onUpdateLevel: (level: number) => void;
  onUpdateHumor: (humor: number) => void;
  logger: ActivityLogger | null;
  initialCurrentStreak: number;
}

interface HistoryEntry {
  id: string;
  sentence: string;
  correctAnswer: Preposition;
  selectedAnswer: Preposition | null;
  isCorrect: boolean;
  explanation: string | null;
  timestamp: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const optionsContainerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const optionVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.5 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 15 } },
  hover: { scale: 1.03, zIndex: 10, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};

const PrepositionGame: React.FC<PrepositionGameProps> = ({ 
    level, 
    numericLevel, 
    humorLevel, 
    category, 
    forcedPreposition,
    onApiKeyNeeded, 
    onGameEnd,
    onUpdateLevel,
    onUpdateHumor,
    logger,
    initialCurrentStreak
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Preposition | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingPreposition, setIsSpeakingPreposition] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempNumericLevel, setTempNumericLevel] = useState(numericLevel);
  const [tempHumorLevel, setTempHumorLevel] = useState(humorLevel);
  const [hoveredPreposition, setHoveredPreposition] = useState<Preposition | null>(null);
  const [gameSessionStreak, setGameSessionStreak] = useState<number>(() => {
    // Try to restore streak from localStorage first (for resume), else use initial
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            return parsed.gameSessionStreak;
        } catch (e) { console.error(e); }
    }
    return initialCurrentStreak;
  });
  
  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryEntry | null>(null);

  const recentQuestionsRef = useRef<string[]>([]);
  const currentImageIdRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const isResumingRef = useRef(false); // Flag to track if we are resuming a saved game
  const explanationPromiseRef = useRef<Promise<string> | null>(null);
  const loadingMusicRef = useRef<HTMLAudioElement | null>(null); // Ref for loading music

  // Map for quick preposition info lookup
  const prepositionInfoMap = useRef(new Map<Preposition, { category: PrepositionCategory; description: string }>());

  // Logic to restore game state on mount
  useEffect(() => {
    const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            // Only resume if it's recent (e.g., last 24 hours)
            const isRecent = Date.now() - savedState.timestamp < 86400000;
            
            if (isRecent && savedState.currentQuestion) {
                // VALIDATION: If starting a Deep Dive, ensure the saved game matches the forced preposition.
                // If it doesn't match, or if we are entering Deep Dive from a generic game, start fresh.
                if (forcedPreposition && savedState.currentQuestion.correctAnswer !== forcedPreposition.preposition) {
                    console.log("Saved state mismatch for Deep Dive. Starting fresh.");
                    localStorage.removeItem(GAME_STATE_KEY);
                    return;
                }

                console.log("Resuming saved game state...");
                setScore(savedState.score);
                setQuestionCount(savedState.questionCount);
                setGameSessionStreak(savedState.gameSessionStreak);
                setCurrentQuestion(savedState.currentQuestion);
                // Also try to restore history if we wanted to be thorough, but for now we start history fresh or could save it too
                // For simplicity, we just resume the active game params.
                setLoading(false);
                isResumingRef.current = true; // Mark as resuming so we don't generate a new question
            }
        } catch (e) {
            console.error("Failed to parse game state", e);
            localStorage.removeItem(GAME_STATE_KEY);
        }
    }
  }, [forcedPreposition]);

  // Save game state on updates
  useEffect(() => {
      if (!loading && currentQuestion) {
          const stateToSave = {
              score,
              questionCount,
              gameSessionStreak,
              currentQuestion,
              timestamp: Date.now()
          };
          localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
      }
  }, [score, questionCount, gameSessionStreak, currentQuestion, loading]);

  // Start/End Activity on Mount/Unmount
  useEffect(() => {
    if (logger) {
      const activityName = forcedPreposition ? `Deep Dive: ${forcedPreposition.preposition}` : `Preposition Drill - ${category || 'Mixed'}`;
      logger.startActivity(`game_session_${Date.now()}`, 'drill', activityName);
      logger.addMetadata('start_level', numericLevel);
      logger.addMetadata('start_humor', humorLevel);
    }
    return () => {
      if (logger) {
        logger.endActivity();
      }
    };
  }, []); // Run once on mount

  useEffect(() => {
    // Initialize prepositionInfoMap once
    ALL_PREPOSITIONS.forEach(item => {
      prepositionInfoMap.current.set(item.preposition, {
        category: item.category,
        description: PREPOSITION_DETAILS[item.preposition] || item.description 
      });
    });
  }, []);

  useEffect(() => {
      const savedHistory = localStorage.getItem('prepositionPal_recentQuestionIds');
      if (savedHistory) {
          try {
              recentQuestionsRef.current = JSON.parse(savedHistory);
          } catch (e) { console.error("Failed to parse history", e); }
      }
  }, []);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
    }
    return () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
    };
  }, []);

  // Loading music effect
  useEffect(() => {
    if (loadingMusicRef.current) {
      if (loading) {
        loadingMusicRef.current.volume = 0.1; // Start at low volume
        loadingMusicRef.current.loop = true;
        loadingMusicRef.current.play().catch(e => console.warn("Loading music autoplay prevented:", e));
      } else {
        // Fade out music
        if (loadingMusicRef.current.volume > 0) {
            const fadeOutInterval = setInterval(() => {
                if (loadingMusicRef.current && loadingMusicRef.current.volume > 0.01) {
                    loadingMusicRef.current.volume -= 0.01;
                } else {
                    if (loadingMusicRef.current) {
                        loadingMusicRef.current.pause();
                        loadingMusicRef.current.currentTime = 0;
                        loadingMusicRef.current.volume = 0.1; // Reset volume for next play
                    }
                    clearInterval(fadeOutInterval);
                }
            }, 50);
        }
      }
    }
  }, [loading]);

  useEffect(() => {
      setTempNumericLevel(numericLevel);
      setTempHumorLevel(humorLevel);
  }, [numericLevel, humorLevel, isSettingsOpen]);

  useEffect(() => {
    const savedScore = localStorage.getItem('prepositionPal_highScore');
    if (savedScore) {
      setHighScore(parseInt(savedScore, 10));
    }
  }, []);

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'loading' | 'special') => {
    const audioContext = audioCtxRef.current;
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error("Audio resume failed", e));
    }

    const now = audioContext.currentTime;
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
        // "Glassy" Major Chord (C5 - E5 - G5)
        // Smooth sine waves with a soft attack and long, reverb-like tail
        const frequencies = [523.25, 659.25, 783.99]; 
        frequencies.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            noteGain.connect(gainNode);
            
            // Envelope: Soft Attack -> Decay -> Sustain -> Long Release
            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(0.1, now + 0.05); // Attack
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // Long tail
            
            osc.connect(noteGain);
            osc.start(now);
            osc.stop(now + 1.3);
        });
        
        // Add a high "ping" for clarity
        const ping = audioContext.createOscillator();
        const pingGain = audioContext.createGain();
        ping.type = 'sine';
        ping.frequency.value = 1046.50; // C6
        pingGain.gain.setValueAtTime(0, now);
        pingGain.gain.linearRampToValueAtTime(0.05, now + 0.02);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        ping.connect(pingGain);
        pingGain.connect(gainNode);
        ping.start(now);
        ping.stop(now + 0.5);

    } else if (type === 'incorrect') {
        // Soft Thud (Low Triangle + Sine)
        // Gentle, non-aggressive failure sound
        const osc1 = audioContext.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        
        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(100, now);
        osc2.frequency.linearRampToValueAtTime(50, now + 0.3);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02); // Fast soft attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // Quick fade

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);

    } else if (type === 'special') {
        // Cinematic Swell
        const freqs = [220, 440, 660, 880];
        freqs.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const localGain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 1.0); // Slight pitch drift up
            
            localGain.gain.setValueAtTime(0, now);
            localGain.gain.linearRampToValueAtTime(0.05, now + 0.5); // Slow swell in
            localGain.gain.linearRampToValueAtTime(0, now + 1.5); // Fade out

            osc.connect(localGain);
            localGain.connect(gainNode);
            osc.start(now);
            osc.stop(now + 1.5);
        });
    } else if (type === 'loading') {
        // Subtle air/whoosh
        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.3);
    }
  }, []);

  const generateQuestion = useCallback(async (index: number) => {
    // If we are resuming from a saved state, skip generation logic once
    if (isResumingRef.current) {
        isResumingRef.current = false;
        // Make sure image data is loaded if possible, or trigger reload if missing
        if (currentQuestion?.imageId) {
            const imgData = getImageData(currentQuestion.imageId);
            if (!imgData) {
               // If image data is lost from cache (memory), we might need to regenerate
            }
        }
        return;
    }

    setLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setExplanation(null);
    explanationPromiseRef.current = null; // Reset explanation promise

    const isSpecialVideoRound = (index + 1) % ROUND_LENGTH === 0;
    
    const initialMessage = getRandomLoadingMessage(isSpecialVideoRound);
    setCurrentLoadingMessage(initialMessage);

    if (isSpecialVideoRound) {
         playSound('special');
    } else {
         playSound('loading');
    }

    if (currentImageIdRef.current) clearImageData(currentImageIdRef.current);

    try {
      // Logic: If forcedPreposition exists (Deep Dive), use it. Otherwise, random.
      let correctPrepositionItem: PrepositionItem;
      
      if (forcedPreposition) {
          correctPrepositionItem = forcedPreposition;
      } else {
          // Pass isSpecialVideoRound to prioritize dynamic prepositions for videos
          const result = generateRandomSentenceContext(level, category, isSpecialVideoRound);
          correctPrepositionItem = result.correctPreposition;
      }

      // If deep dive, skip cache to ensure variety (since we are exploring polysemy)
      // Otherwise, use cache.
      const cachedQ = forcedPreposition ? null : await findCachedQuestion(level, correctPrepositionItem.preposition, recentQuestionsRef.current);
      
      let generatedSentence = "";
      let options: Preposition[] = [];
      let videoDataUrl: string | undefined = undefined;
      let imageId: string;

      if (cachedQ && !isSpecialVideoRound) {
          console.log("Using cached question");
          generatedSentence = cachedQ.sentence;
          options = cachedQ.options;
          imageId = cachedQ.id; 
          
          const visualPrompt = cachedQ.visualPrompt;
           const existingImg = getImageData(imageId);
           if (!existingImg) {
                const imageData = await generateImage(visualPrompt).catch(() => `https://picsum.photos/800/450?random=${Math.random()}`);
                if (imageData) setImageData(imageId, imageData);
           }
           
           recentQuestionsRef.current.push(cachedQ.id);
           if (recentQuestionsRef.current.length > HISTORY_LIMIT) recentQuestionsRef.current.shift();
           localStorage.setItem('prepositionPal_recentQuestionIds', JSON.stringify(recentQuestionsRef.current));
           currentImageIdRef.current = imageId;

      } else {
          imageId = `q-${Date.now()}-${index}`;
          currentImageIdRef.current = imageId;

          // Build Prompt: Pass '!!forcedPreposition' as the forceContextDiversity flag
          const sentencePrompt = buildGeminiPrompt(level, correctPrepositionItem.preposition, humorLevel, !!forcedPreposition);
          generatedSentence = (await generateText(sentencePrompt)).trim();
    
          if (!generatedSentence.includes('______')) {
             generatedSentence = generatedSentence.replace(new RegExp(`\\b${correctPrepositionItem.preposition}\\b`, 'gi'), '______');
             if (!generatedSentence.includes('______')) generatedSentence = correctPrepositionItem.exampleSentence.replace(correctPrepositionItem.preposition, '______');
          }
    
          options = getWrongOptions(correctPrepositionItem.preposition, level);
          
          // STRICTER IMAGE PROMPT: Documentary style, literal interpretation to avoid metaphors.
          // Removed specific gaze instructions to prevent AI drawing diagrams.
          // Added ACTION instructions if it is a video round.
          let visualPrompt = `Cinematic, photorealistic photography, documentary style. The image MUST be a LITERAL visual translation of the following scene: "${generatedSentence.replace('______', correctPrepositionItem.preposition)}". Focus strictly on the physical spatial relationship described by "${correctPrepositionItem.preposition}". Natural lighting. Real world setting. NO text. NO visual metaphors. NO magical elements.`;
          
          if (isSpecialVideoRound) {
              visualPrompt += " ACTION-ORIENTED: This is a video. Capture the DYNAMIC MOTION and MOVEMENT described. The scene must show active changing state or continuous action.";
              videoDataUrl = await generateVideo(visualPrompt, '16:9', (msg) => {
                  setCurrentLoadingMessage(msg);
              });
          } else {
              const imageData = await generateImage(visualPrompt).catch(() => `https://picsum.photos/800/450?random=${Math.random()}`);
              if (imageData) setImageData(imageId, imageData);
              
              // Only cache if NOT deep diving (deep dives are meant to generate varied unique content)
              if (!forcedPreposition) {
                  const newCachedQ = {
                      id: imageId,
                      level: level,
                      preposition: correctPrepositionItem.preposition,
                      sentence: generatedSentence,
                      options: options,
                      visualPrompt: visualPrompt,
                      timestamp: Date.now()
                  };
                  await cacheGeneratedQuestion(newCachedQ);
              }

              recentQuestionsRef.current.push(imageId);
              if (recentQuestionsRef.current.length > HISTORY_LIMIT) recentQuestionsRef.current.shift();
              localStorage.setItem('prepositionPal_recentQuestionIds', JSON.stringify(recentQuestionsRef.current));
          }
      }

      // PRELOAD EXPLANATION IMMEDIATELY
      // We generate this now so it's ready instantly if the user clicks the wrong answer.
      const fullSentenceForExp = generatedSentence.replace('______', `"${correctPrepositionItem.preposition}"`);
      const explanationPrompt = `Explain strictly the grammatical or contextual reason why "${correctPrepositionItem.preposition}" is correct in the sentence: "${fullSentenceForExp}".
        
      STRICT FORMATTING RULES:
      1. Start the explanation IMMEDIATELY. DO NOT use filler phrases like "That's a great question" or "Here is why".
      2. Use **bold** for the preposition and key words.
      3. Keep it under 40 words.
      4. Be direct and educational.
      5. Strictly American English.`;
      
      // Store the promise in a ref to be awaited later
      explanationPromiseRef.current = generateText(explanationPrompt);

      setCurrentQuestion({
        sentence: generatedSentence,
        correctAnswer: correctPrepositionItem.preposition,
        options,
        imageId: imageId,
        videoUrl: videoDataUrl,
      });
      
      // Reset start time once loaded
      questionStartTimeRef.current = performance.now();

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("API key")) {
        setError("Please check your API key.");
        onApiKeyNeeded();
      } else {
        setError("Failed to generate question. Retrying...");
      }
    } finally {
      setLoading(false);
    }
  }, [level, humorLevel, category, onApiKeyNeeded, playSound, forcedPreposition]);

  useEffect(() => {
      // Only trigger generation if we are NOT loading from a resumed state
      if (!isResumingRef.current) {
          generateQuestion(questionCount);
      }
  }, [questionCount, generateQuestion]); 

  const handleOptionClick = useCallback(async (option: Preposition) => {
    if (isAnswerChecked || !currentQuestion) {
        if (isAnswerChecked && option === currentQuestion?.correctAnswer) {
             handleSpeakPreposition();
        }
        return;
    }

    const timeSpent = (performance.now() - questionStartTimeRef.current) / 1000;
    setSelectedAnswer(option);
    setIsAnswerChecked(true);
    
    const isCorrect = option === currentQuestion.correctAnswer;
    
    const baseXP = 10;
    const multiplier = numericLevel; 
    const xpEarned = isCorrect ? baseXP * multiplier : 0;

    saveQuestionResult({
        gameLevel: level,
        category: category || null,
        isCorrect: isCorrect,
        xpEarned: xpEarned
    }).catch(e => console.error("Failed to save progress:", e));

    if (isCorrect) {
      setGameSessionStreak(s => s + 1);
    } else {
      setGameSessionStreak(0);
    }

    // AGGRESSIVE TRACKING: Log the focus item (grammar attempt)
    if (logger) {
        logger.logFocusItem(
            'Grammar', 
            currentQuestion.correctAnswer,
            timeSpent,
            isCorrect ? 1.0 : 0.0,
            1,
            isCorrect ? [] : [`Selected '${option}' instead of '${currentQuestion.correctAnswer}'`],
            currentQuestion.sentence
        );
    }

    if (isCorrect) {
      setScore(s => {
        const ns = s + 1;
        if (ns > highScore) {
            setHighScore(ns);
            localStorage.setItem('prepositionPal_highScore', ns.toString());
        }
        return ns;
      });
      playSound('correct'); 
    } else {
      playSound('incorrect');
      setExplanation('Thinking...');
      try {
        // Use preloaded explanation if available
        let exp;
        if (explanationPromiseRef.current) {
            exp = await explanationPromiseRef.current;
        } else {
            // Fallback in case promise is missing (unlikely)
            const fullSentence = currentQuestion.sentence.replace('______', `"${currentQuestion.correctAnswer}"`);
            const prompt = `Explain strictly the grammatical or contextual reason why "${currentQuestion.correctAnswer}" is correct in the sentence: "${fullSentence}".
        
            STRICT FORMATTING RULES:
            1. Start the explanation IMMEDIATELY. DO NOT use filler phrases like "That's a great question" or "Here is why".
            2. Use **bold** for the preposition and key words.
            3. Keep it under 40 words.
            4. Be direct and educational.
            5. Strictly American English.`;
            exp = await generateText(prompt);
        }
        setExplanation(exp);
        
        // AGGRESSIVE TRACKING: Log that they received an explanation
        if (logger) logger.addMetadata('explanation_viewed', true);

      } catch {
        setExplanation("Could not load explanation.");
      }
    }
  }, [currentQuestion, isAnswerChecked, playSound, highScore, level, category, numericLevel, logger, setGameSessionStreak]);

  const handleNextQuestion = () => {
      // Archive current question to history
      if (currentQuestion) {
          setHistory(prev => [{
              id: currentQuestion.imageId || Date.now().toString(),
              sentence: currentQuestion.sentence,
              correctAnswer: currentQuestion.correctAnswer,
              selectedAnswer: selectedAnswer,
              isCorrect: selectedAnswer === currentQuestion.correctAnswer,
              explanation: explanation,
              timestamp: Date.now()
          }, ...prev]);
      }
      setQuestionCount(prev => prev + 1);
  };

  const handleSpeak = async () => {
    if (!currentQuestion || isSpeaking) return;
    setIsSpeaking(true);
    
    // AGGRESSIVE TRACKING: Using 'Flow' or 'Pronunciation' for listening practice
    if (logger) logger.logFocusItem('Flow', 'Sentence Audio', 0, null, 1, [], currentQuestion.sentence);

    try {
        const text = isAnswerChecked 
            ? currentQuestion.sentence.replace('______', currentQuestion.correctAnswer) 
            : currentQuestion.sentence.replace('______', 'blank');
        const audio = await generateSpeech(text);
        await playRawAudio(audio);
    } finally {
        setIsSpeaking(false);
    }
  };

  const handleSpeakPreposition = async () => {
    if (!currentQuestion || isSpeakingPreposition) return;
    setIsSpeakingPreposition(true);
    
    // AGGRESSIVE TRACKING
    if (logger) logger.logFocusItem('Pronunciation', currentQuestion.correctAnswer, 0, null, 1, [], currentQuestion.correctAnswer);

    try {
        const audio = await generateSpeech(currentQuestion.correctAnswer);
        await playRawAudio(audio);
    } finally {
        setIsSpeakingPreposition(false);
    }
  };
  
  const saveSettings = () => {
      onUpdateLevel(tempNumericLevel);
      onUpdateHumor(tempHumorLevel);
      setIsSettingsOpen(false);
      // AGGRESSIVE TRACKING
      if (logger) {
        logger.addMetadata('updated_level', tempNumericLevel);
        logger.addMetadata('updated_humor', tempHumorLevel);
      }
  };

  // Cleanup session state on game exit
  const handleExitGame = () => {
      localStorage.removeItem(GAME_STATE_KEY); // Clear saved state
      onGameEnd(gameSessionStreak);
  };

  const [showExtendedExplanation, setShowExtendedExplanation] = useState(false);
  const [extendedExplanation, setExtendedExplanation] = useState<string | null>(null);
  const [loadingExtendedExplanation, setLoadingExtendedExplanation] = useState(false);

  const handleLoadExtendedExplanation = useCallback(async () => {
      if (!currentQuestion || !explanation || loadingExtendedExplanation) return;

      setLoadingExtendedExplanation(true);
      setShowExtendedExplanation(true); // Always show once clicked, even if content is loading
      
      // AGGRESSIVE TRACKING: Log that they requested an extended explanation
      if (logger) logger.startActivity('extended_explanation', 'reading', `Extended Explanation for ${currentQuestion.correctAnswer}`);

      try {
          const extendedPrompt = `Provide a detailed grammatical and contextual explanation for the preposition "${currentQuestion.correctAnswer}" in the sentence "${currentQuestion.sentence.replace('______', currentQuestion.correctAnswer)}".
          
          Include 2-3 additional clear and distinct example sentences illustrating different uses or nuances of "${currentQuestion.correctAnswer}".
          
          STRICT FORMATTING RULES:
          1. Start immediately. DO NOT use conversational fillers.
          2. Use **bold** for the preposition and key grammatical terms.
          3. Ensure the explanation is educational and covers various semantic aspects (e.g., spatial, temporal, abstract).
          4. Strictly American English.`;

          const extendedExp = await generateText(extendedPrompt);
          setExtendedExplanation(extendedExp);

          if (logger) logger.endActivity(); // End the reading activity
          
      } catch (err) {
          console.error("Failed to load extended explanation:", err);
          setExtendedExplanation("Could not load more details.");
          if (logger) logger.addMetadata('error', 'extended_explanation_failed');
          if (logger) logger.endActivity();
      } finally {
          setLoadingExtendedExplanation(false);
      }
  }, [currentQuestion, explanation, loadingExtendedExplanation, logger]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111]/95 backdrop-blur-md">
        <p className="text-red-500 font-bold mb-6 text-2xl">{error}</p>
        <button onClick={() => generateQuestion(questionCount)} className="px-8 py-4 bg-[#EF6035] text-white rounded-xl text-xl font-bold shadow-lg hover:scale-105 transition-transform">Retry</button>
      </div>
    );
  }

  return (
    <LayoutGroup>
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111]/70 backdrop-blur-xl overflow-hidden flex items-center justify-center">
      
      {/* Hidden Audio Element for Loading Music */}
      <audio ref={loadingMusicRef} src="/audio/loading_music.mp3" preload="auto" />

      {/* HISTORY REVIEW MODAL */}
      <AnimatePresence>
          {viewingHistoryItem && (
              <>
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      onClick={() => setViewingHistoryItem(null)}
                      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm"
                  />
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-[#212229] p-8 rounded-20px shadow-2xl border border-white/10 w-full max-w-2xl"
                  >
                      <div className="flex justify-between items-start mb-6">
                          <h3 className="text-2xl font-black text-white font-display">Round Review</h3>
                          <button onClick={() => setViewingHistoryItem(null)} className="text-gray-400 hover:text-white">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>
                      
                      <div className="bg-black/30 p-6 rounded-xl mb-6 border border-white/5">
                          <p className="text-xl md:text-2xl text-white font-bold text-center leading-relaxed">
                              {viewingHistoryItem.sentence.split('______').map((part, i, arr) => (
                                  <React.Fragment key={i}>
                                      {part}
                                      {i < arr.length - 1 && (
                                          <span className={`inline-block border-b-2 px-1 mx-1 ${viewingHistoryItem.isCorrect ? 'text-emerald-400 border-emerald-500' : 'text-red-400 border-red-500'}`}>
                                              {viewingHistoryItem.selectedAnswer || 'skipped'}
                                          </span>
                                      )}
                                  </React.Fragment>
                              ))}
                          </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20">
                              <span className="block text-xs uppercase tracking-widest text-emerald-400 mb-1 font-bold">Correct Answer</span>
                              <span className="text-2xl font-black text-white">{viewingHistoryItem.correctAnswer}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${viewingHistoryItem.isCorrect ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-red-900/20 border-red-500/20'}`}>
                              <span className={`block text-xs uppercase tracking-widest mb-1 font-bold ${viewingHistoryItem.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>You Selected</span>
                              <span className="text-2xl font-black text-white">{viewingHistoryItem.selectedAnswer || '-'}</span>
                          </div>
                      </div>

                      {viewingHistoryItem.explanation && (
                          <div className="text-gray-300 bg-[#1a1b23] p-5 rounded-xl border border-white/5 text-lg leading-relaxed">
                              {renderFormattedText(viewingHistoryItem.explanation)}
                          </div>
                      )}
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {isSettingsOpen && (
              <>
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSettingsOpen(false)}
                      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: -20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: -20 }}
                      className="fixed top-24 right-4 md:right-[calc(50%-10rem)] z-[70] bg-[#212229] p-8 rounded-20px shadow-2xl border border-white/10 w-96"
                  >
                      <h3 className="text-2xl font-bold text-white mb-8 font-display border-b border-white/5 pb-2">Settings</h3>
                      <div className="space-y-8">
                          <div>
                              <div className="flex justify-between text-base mb-2">
                                  <span className="text-gray-300 uppercase font-bold">Level</span>
                                  <span className="font-bold text-[#EF6035] text-xl">{tempNumericLevel}</span>
                              </div>
                              <input 
                                  type="range" min="1" max="36" step="1" 
                                  value={tempNumericLevel}
                                  onChange={(e) => setTempNumericLevel(parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EF6035]"
                              />
                          </div>
                          <div>
                              <div className="flex justify-between text-base mb-2">
                                  <span className="text-gray-300 uppercase font-bold">Humor</span>
                                  <span className="font-bold text-[#EF6035] text-xl">{tempHumorLevel}</span>
                              </div>
                              <input 
                                  type="range" min="0" max="10" step="1"
                                  value={tempHumorLevel}
                                  onChange={(e) => setTempHumorLevel(parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                          </div>
                          <button 
                              onClick={saveSettings}
                              className="w-full bg-[#EF6035] hover:bg-[#d84a20] text-white font-bold py-4 rounded-xl transition-colors text-lg mt-2 shadow-lg"
                          >
                              Apply Changes
                          </button>
                      </div>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading || !currentQuestion ? (
          <motion.div 
            key="loading-state"
            className="absolute inset-0 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner message={currentLoadingMessage} />
          </motion.div>
        ) : (
          <motion.div
            key={currentQuestion.imageId || currentQuestion.videoUrl}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col w-full h-full max-w-7xl mx-auto bg-dark-accent-1 rounded-20px shadow-2xl border border-white/10 overflow-hidden"
            layout
          >
            {/* 
              NEW DEDICATED HEADER BAR ("Marching Array")
              Moves HUD elements out of the image area into a structured top row.
            */}
            <div className="w-full px-6 py-4 flex justify-between items-center bg-[#15161b] border-b border-white/5 shrink-0 z-30">
                 {/* Left Side: Round + Deep Dive + Exit */}
                 <div className="flex gap-3 items-center">
                     <div className="bg-[#212229] px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center leading-none shadow-sm min-w-[80px]">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Round</span>
                        <span className="text-xl font-black text-white">{questionCount + 1}</span>
                    </div>
                    {forcedPreposition && (
                        <div className="bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-500/30 flex flex-col items-center leading-none shadow-sm">
                            <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">Mode</span>
                            <span className="text-sm font-black text-purple-100">Deep Dive</span>
                        </div>
                    )}
                     <button
                        onClick={handleExitGame}
                        className="h-[58px] px-4 bg-[#212229] rounded-xl border border-white/10 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/30 transition-all text-gray-400 shadow-sm flex items-center justify-center group"
                        title="Exit Game"
                    >
                       <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>

                 {/* Right Side: Score + Settings */}
                 <div className="flex gap-3 items-center">
                    <div className="bg-[#212229] px-5 py-2 rounded-xl border border-white/10 flex flex-col items-end leading-none shadow-sm min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Score</span>
                        <div className="flex gap-1 text-xl font-black text-white items-baseline">
                            <motion.span key={score} animate={{scale: [1, 1.2, 1], color: ['#fff', '#EF6035', '#fff']}}>{score}</motion.span>
                            <span className="text-gray-600 text-sm">/</span>
                            <span className="text-gray-600 text-sm">{highScore}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="h-[58px] px-4 bg-[#212229] rounded-xl text-gray-400 hover:text-[#EF6035] border border-white/10 transition-all hover:bg-[#25262e] hover:border-[#EF6035]/30 group flex items-center justify-center"
                    >
                       <svg className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C11.5 2 11.08 2.36 11 2.86L10.74 4.7C10.27 4.88 9.83 5.12 9.42 5.41L7.69 4.67C7.23 4.47 6.7 4.64 6.46 5.06L4.46 8.52C4.22 8.94 4.31 9.47 4.7 9.78L6.15 10.92C6.1 11.27 6.1 11.63 6.15 11.99L4.7 13.13C4.31 13.44 4.22 13.97 4.46 14.39L6.46 17.85C6.7 18.27 7.23 18.44 7.69 18.24L9.42 17.5C9.83 17.79 10.27 18.03 10.74 18.21L11 20.05C11.08 20.55 11.5 20.91 12 20.91H16C16.5 20.91 16.92 20.55 17 20.05L17.26 18.21C17.73 18.03 18.17 17.79 18.58 17.5L20.31 18.24C20.77 18.44 21.3 18.27 21.54 17.85L23.54 14.39C23.78 13.97 23.69 13.44 23.3 13.13L21.85 11.99C21.9 11.63 21.9 11.27 21.85 10.92L23.3 9.78C23.69 9.47 23.78 8.94 23.54 8.52L21.54 5.06C21.3 4.64 20.77 4.47 20.31 4.67L18.58 5.41C18.17 5.12 17.73 4.88 17.26 4.7L17 2.86C16.92 2.36 16.5 2 16 2H12ZM14 11.91C14 13.0146 13.1046 13.91 12 13.91C10.8954 13.91 10 13.0146 10 11.91C10 10.8054 10.8954 9.91 12 9.91C13.1046 9.91 14 10.8054 14 11.91Z" />
                       </svg>
                    </button>
                </div>
            </div>

            <motion.div 
              layout
              className="flex-1 w-full relative bg-black/20 overflow-hidden flex items-center justify-center p-4 md:p-6"
            >
              <div className="w-full max-w-6xl h-full max-h-[60vh] relative border-[3px] border-[#33353F] rounded-3xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10">
                {currentQuestion.videoUrl ? (
                    <div className="w-full h-full relative bg-black">
                        <div className="absolute bottom-4 right-4 z-20 bg-[#EF6035] text-white text-base font-black px-4 py-2 rounded-lg uppercase tracking-wider shadow-lg animate-pulse">
                            Video Round
                        </div>
                        <video 
                            src={currentQuestion.videoUrl} 
                            className="w-full h-full object-contain" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            controls={false}
                        />
                        <video 
                            src={currentQuestion.videoUrl} 
                            className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-50 z-0" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            controls={false}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black relative">
                        <div className="absolute inset-0">
                            <CanvasImageDisplay 
                                imageId={currentQuestion.imageId}
                                alt="Scenario" 
                            />
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]]"></div>
              </div>
            </motion.div>

            <div className="shrink-0 w-full bg-black/40 backdrop-blur-md relative z-20 flex flex-col items-center justify-center px-4 pt-4 pb-2 border-t border-white/5">
               <p className="text-3xl md:text-5xl font-black font-display leading-tight text-center flex flex-wrap justify-center gap-x-3 gap-y-2 items-center drop-shadow-2xl max-w-6xl text-white">
                  {currentQuestion.sentence.split('______').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span className="opacity-95 drop-shadow-md">{part}</span>
                      {index < arr.length - 1 && (
                         isAnswerChecked ? (
                           selectedAnswer === currentQuestion.correctAnswer ? (
                             <span className="font-black border-b-4 px-2 text-emerald-400 border-emerald-500 transition-colors duration-300">
                               {selectedAnswer}
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-3 mx-1">
                               <span className="text-red-400/80 line-through decoration-4 decoration-red-500 font-bold text-2xl md:text-3xl opacity-80">
                                 {selectedAnswer}
                               </span>
                               <span className="text-emerald-400 font-black border-b-4 border-emerald-500 px-1">
                                 {currentQuestion.correctAnswer}
                               </span>
                             </span>
                           )
                         ) : (
                           <span className="inline-block w-16 h-1 border-b-4 border-gray-500 mx-1 animate-pulse"></span>
                         )
                      )}
                    </React.Fragment>
                  ))}
                   <button 
                    onClick={handleSpeak}
                    disabled={isSpeaking}
                    className="ml-2 p-2 rounded-full bg-white/10 hover:bg-[#EF6035] text-gray-300 hover:text-white transition-all duration-300 shadow-lg"
                   >
                     <svg className={`w-6 h-6 ${isSpeaking ? 'animate-pulse text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                   </button>
               </p>
            </div>

            <div className="shrink-0 w-full h-[30vh] min-h-[220px] max-h-[350px] bg-black/40 backdrop-blur-xl p-4 pb-8 border-t border-white/5 relative">
                <div className="h-full max-w-7xl mx-auto relative">
                    <AnimatePresence mode="popLayout">
                        {!isAnswerChecked ? (
                            <motion.div 
                                key="options-grid"
                                variants={optionsContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                className="grid grid-cols-2 gap-4 w-full h-full"
                            >
                            {currentQuestion.options.map((option) => (
                                <motion.button
                                    key={option}
                                    layoutId={option}
                                    variants={optionVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleOptionClick(option)}
                                    onHoverStart={() => setHoveredPreposition(option)}
                                    onHoverEnd={() => setHoveredPreposition(null)}
                                    className={`
                                        h-full rounded-2xl text-3xl md:text-4xl font-black tracking-tight border-2
                                        transition-all duration-300 outline-none relative overflow-hidden
                                        bg-[#2C2D35] border-white/5 text-gray-200
                                        shadow-[0_4px_10px_rgba(0,0,0,0.3)]
                                        group 
                                        hover:border-[#EF6035] hover:bg-[#EF6035] hover:text-white
                                        hover:shadow-[0_0_25px_rgba(239,96,53,0.5)]
                                        flex items-center justify-center
                                    `}
                                >
                                    <span className="relative z-10 text-white drop-shadow-md group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                        {option}
                                    </span>
                                    <AnimatePresence>
                                        {hoveredPreposition === option && prepositionInfoMap.current.has(option) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg bg-gray-900 text-white text-base z-50 whitespace-nowrap shadow-lg border border-white/10"
                                            >
                                                <p className="font-bold text-primary mb-1">Category: {prepositionInfoMap.current.get(option)?.category}</p>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="feedback-card"
                                layoutId={selectedAnswer === currentQuestion.correctAnswer ? currentQuestion.correctAnswer : 'feedback'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="w-full h-full rounded-2xl overflow-hidden relative z-20 shadow-2xl flex items-center justify-center"
                            >
                                {/* Correct Answer State - Green Card */}
                                {selectedAnswer === currentQuestion.correctAnswer ? (
                                    <div 
                                        className="absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-8"
                                        style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)' }}
                                    >
                                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                                         
                                         <div className="flex-1 w-full relative z-10 flex flex-col justify-center">
                                             <h3 className="text-white font-black font-display text-4xl flex items-center gap-3 mb-3">
                                                 <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-400/30 shadow-lg shadow-emerald-500/20 shrink-0">
                                                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                                 </div>
                                                 Correct!
                                             </h3>
                                         </div>
                                        
                                         <div className="flex flex-row md:flex-col gap-4 relative z-10 mt-6 md:mt-0 md:ml-8 md:min-w-[200px]">
                                             <button 
                                                 onClick={handleNextQuestion}
                                                 className="w-full px-8 py-4 rounded-xl bg-white text-emerald-900 text-xl font-black hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                                             >
                                                 Next
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                             </button>
                                              <button onClick={handleSpeakPreposition} className="w-full text-emerald-100 text-lg font-bold hover:text-white flex items-center justify-center gap-2 py-3 bg-emerald-900/30 rounded-xl hover:bg-emerald-900/50 transition-all border border-emerald-500/20">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                                 Pronounce
                                              </button>
                                         </div>
                                    </div>
                                ) : (
                                    /* 
                                      NEW UNIFIED INCORRECT SCREEN - REFACTORED TO HORIZONTAL LAYOUT
                                      Explanation on Left | Button on Right
                                    */
                                    <div className="absolute inset-0 z-30 flex flex-row items-center justify-between p-6 md:p-12 text-left bg-[#0F1014]/95 backdrop-blur-xl border border-white/5 gap-8">
                                        <div className="flex-1 h-full flex flex-col justify-center">
                                            <h4 className="text-red-500 uppercase text-sm font-black tracking-[0.2em] mb-2 animate-pulse">
                                                Correction
                                            </h4>
                                            <div className="text-white font-medium leading-tight">
                                                <span className="text-[#EF6035] font-black block mb-2 text-4xl md:text-5xl drop-shadow-2xl">
                                                    "{currentQuestion.correctAnswer}"
                                                </span>
                                                <div className="text-gray-300 font-body text-lg md:text-xl leading-relaxed line-clamp-3">
                                                    {explanation ? renderFormattedText(explanation) : (
                                                        <span className="animate-pulse">Analyzing context...</span>
                                                    )}
                                                    {explanation && (
                                                        <button 
                                                            onClick={handleLoadExtendedExplanation} 
                                                            className="ml-2 text-sm text-blue-400 hover:text-blue-200 transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={loadingExtendedExplanation}
                                                        >
                                                            {loadingExtendedExplanation ? 'Loading...' : 'Learn More'}
                                                        </button>
                                                    )}
                                                </div>
                                                {showExtendedExplanation && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                        className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 overflow-hidden text-gray-400 text-base leading-normal"
                                                    >
                                                        {loadingExtendedExplanation ? (
                                                            <div className="flex items-center gap-2">
                                                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <span>Generating extended explanation...</span>
                                                            </div>
                                                        ) : (
                                                            extendedExplanation ? renderFormattedText(extendedExplanation) : "No extended explanation available."
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0">
                                            <button 
                                                onClick={handleNextQuestion}
                                                className="h-20 px-8 bg-[#EF6035] hover:bg-[#d84a20] text-white rounded-2xl text-xl font-black shadow-[0_0_30px_rgba(239,96,53,0.4)] hover:shadow-[0_0_50px_rgba(239,96,53,0.6)] hover:scale-105 transition-all flex items-center gap-3"
                                            >
                                                Continue
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* SESSION ARCHIVE (HISTORY) */}
            {history.length > 0 && (
                <div className="shrink-0 w-full bg-[#111] border-t border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">Archive of Souls</h4>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <AnimatePresence initial={false}>
                            {history.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => setViewingHistoryItem(item)}
                                    className={`
                                        shrink-0 w-64 p-4 rounded-xl border cursor-pointer transition-all hover:scale-105
                                        ${item.isCorrect ? 'bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-red-900/10 border-red-500/20 hover:border-red-500/40'}
                                    `}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {item.isCorrect ? 'SUCCESS' : 'FAILED'}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 leading-snug">
                                        {item.sentence.split('______').map((part, i, arr) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <span className={`font-bold ${item.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {item.selectedAnswer || '?'}
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </LayoutGroup>
  );
};

export default PrepositionGame;
