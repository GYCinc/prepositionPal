import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import { PREPOSITION_DETAILS } from '../constants';
import { GameLevel, Preposition, PrepositionCategory, Question } from '../types';
import LoadingSpinner from './LoadingSpinner';
import {
  generateText,
  generateImage,
  generateSpeech,
  generateVideo,
} from '../services/geminiService';
import CanvasImageDisplay from './CanvasImageDisplay';
import { setImageData, clearImageData, getImageData } from '../services/imageStore';
import { playRawAudio } from '../utils/audioUtils';
import {
  saveQuestionResult,
  cacheGeneratedQuestion,
  findCachedQuestion,
} from '../services/dbService';
import {
  buildGeminiPrompt,
  generateRandomSentenceContext,
  getWrongOptions,
} from '../utils/gameLogic';

const ROUND_LENGTH = 5; // Every 5 questions is a "Video Round"
const HISTORY_LIMIT = 15;

// Helper function to parse bold markdown for display
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (
      (part.startsWith('**') && part.endsWith('**')) ||
      (part.startsWith('*') && part.endsWith('*'))
    ) {
      const cleanText = part.replace(/[*]+/g, '');
      return (
        <strong key={index} className="text-white font-black drop-shadow-md">
          {cleanText}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

interface PrepositionGameProps {
  level: GameLevel;
  numericLevel: number;
  humorLevel: number;
  category: PrepositionCategory | null;
  onApiKeyNeeded: () => void;
  onGameEnd: () => void;
  onUpdateLevel: (level: number) => void;
  onUpdateHumor: (humor: number) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const optionsContainerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const optionVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.5 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
  hover: {
    scale: 1.03,
    zIndex: 10,
    boxShadow: '0 0 25px rgba(239, 96, 53, 0.6)',
    borderColor: '#EF6035',
    transition: { duration: 0.1 },
  },
  tap: { scale: 0.95 },
};

const PrepositionGame: React.FC<PrepositionGameProps> = ({
  level,
  numericLevel,
  humorLevel,
  category,
  onApiKeyNeeded,
  onGameEnd,
  onUpdateLevel,
  onUpdateHumor,
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
  const [showCoreMeaning, setShowCoreMeaning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempNumericLevel, setTempNumericLevel] = useState(numericLevel);
  const [tempHumorLevel, setTempHumorLevel] = useState(humorLevel);

  const recentQuestionsRef = useRef<string[]>([]);
  const currentImageIdRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('prepositionPal_recentQuestionIds');
    if (savedHistory) {
      try {
        recentQuestionsRef.current = JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
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
      audioContext.resume().catch((e) => console.error('Audio resume failed', e));
    }

    const now = audioContext.currentTime;

    if (type === 'special') {
      const frequencies = [440, 554, 659, 880];
      frequencies.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);

        oscillator.start(now + i * 0.1);
        oscillator.stop(now + i * 0.1 + 0.7);

        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      });
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'correct':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      case 'incorrect':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      case 'loading':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
    }

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }, []);

  const generateQuestion = useCallback(
    async (index: number) => {
      setLoading(true);
      setError(null);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setExplanation(null);
      setShowCoreMeaning(false);

      const isSpecialVideoRound = (index + 1) % ROUND_LENGTH === 0;

      if (isSpecialVideoRound) {
        playSound('special');
        setCurrentLoadingMessage('Creating video challenge...');
      } else {
        playSound('loading');
        setCurrentLoadingMessage('Generating challenge...');
      }

      if (currentImageIdRef.current) clearImageData(currentImageIdRef.current);

      try {
        const { correctPreposition: correctPrepositionItem } = generateRandomSentenceContext(
          level,
          category
        );

        const cachedQ = await findCachedQuestion(
          level,
          correctPrepositionItem.preposition,
          recentQuestionsRef.current
        );

        let generatedSentence = '';
        let options: Preposition[] = [];
        let videoDataUrl: string | undefined = undefined;
        let imageId: string;

        if (cachedQ && !isSpecialVideoRound) {
          console.log('Using cached question');
          generatedSentence = cachedQ.sentence;
          options = cachedQ.options;
          imageId = cachedQ.id;

          const visualPrompt = cachedQ.visualPrompt;
          const existingImg = getImageData(imageId);
          if (!existingImg) {
            const imageData = await generateImage(visualPrompt).catch(
              () => `https://picsum.photos/800/450?random=${Math.random()}`
            );
            if (imageData) setImageData(imageId, imageData);
          }

          recentQuestionsRef.current.push(cachedQ.id);
          if (recentQuestionsRef.current.length > HISTORY_LIMIT) recentQuestionsRef.current.shift();
          localStorage.setItem(
            'prepositionPal_recentQuestionIds',
            JSON.stringify(recentQuestionsRef.current)
          );
          currentImageIdRef.current = imageId;
        } else {
          imageId = `q-${Date.now()}-${index}`;
          currentImageIdRef.current = imageId;

          const sentencePrompt = buildGeminiPrompt(
            level,
            correctPrepositionItem.preposition,
            humorLevel
          );
          generatedSentence = (await generateText(sentencePrompt)).trim();

          if (!generatedSentence.includes('______')) {
            generatedSentence = generatedSentence.replace(
              new RegExp(`\\b${correctPrepositionItem.preposition}\\b`, 'gi'),
              '______'
            );
            if (!generatedSentence.includes('______'))
              generatedSentence = correctPrepositionItem.exampleSentence.replace(
                correctPrepositionItem.preposition,
                '______'
              );
          }

          options = getWrongOptions(correctPrepositionItem.preposition, level);

          const visualPrompt = `Cinematic, wide angle shot, centered subject. The image MUST depict: "${generatedSentence.replace('______', correctPrepositionItem.preposition)}". Clear focal point in the middle of the frame. No text.`;

          if (isSpecialVideoRound) {
            videoDataUrl = await generateVideo(visualPrompt, '16:9', (msg) => {
              setCurrentLoadingMessage(msg);
            });
          } else {
            const imageData = await generateImage(visualPrompt).catch(
              () => `https://picsum.photos/800/450?random=${Math.random()}`
            );
            if (imageData) setImageData(imageId, imageData);

            const newCachedQ = {
              id: imageId,
              level: level,
              preposition: correctPrepositionItem.preposition,
              sentence: generatedSentence,
              options: options,
              visualPrompt: visualPrompt,
              timestamp: Date.now(),
            };
            await cacheGeneratedQuestion(newCachedQ);

            recentQuestionsRef.current.push(imageId);
            if (recentQuestionsRef.current.length > HISTORY_LIMIT)
              recentQuestionsRef.current.shift();
            localStorage.setItem(
              'prepositionPal_recentQuestionIds',
              JSON.stringify(recentQuestionsRef.current)
            );
          }
        }

        setCurrentQuestion({
          sentence: generatedSentence,
          correctAnswer: correctPrepositionItem.preposition,
          options,
          imageId: imageId,
          videoUrl: videoDataUrl,
        });
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes('API key')) {
          setError('Please check your API key.');
          onApiKeyNeeded();
        } else {
          setError('Failed to generate question. Retrying...');
        }
      } finally {
        setLoading(false);
      }
    },
    [level, humorLevel, category, onApiKeyNeeded, playSound]
  );

  useEffect(() => {
    generateQuestion(questionCount);
  }, [questionCount, generateQuestion]);

  const handleOptionClick = useCallback(
    async (option: Preposition) => {
      if (isAnswerChecked || !currentQuestion) {
        if (isAnswerChecked && option === currentQuestion?.correctAnswer) {
          handleSpeakPreposition();
        }
        return;
      }

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
        xpEarned: xpEarned,
      }).catch((e) => console.error('Failed to save progress:', e));

      if (isCorrect) {
        setScore((s) => {
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
          const fullSentence = currentQuestion.sentence.replace(
            '______',
            `"${currentQuestion.correctAnswer}"`
          );
          const explanationPrompt = `Explain why "${currentQuestion.correctAnswer}" is correct in the sentence: "${fullSentence}".
        
        FORMATTING RULES:
        - Use **bold** for key words.
        - Keep it under 40 words.
        - Be encouraging but match the user's level (${level}) in complexity.
        - Strictly American English.`;

          const exp = await generateText(explanationPrompt);
          setExplanation(exp);
        } catch {
          setExplanation('Could not load explanation.');
        }
      }
    },
    [currentQuestion, isAnswerChecked, playSound, highScore, level, category, numericLevel]
  );

  const handleNextQuestion = () => {
    setQuestionCount((prev) => prev + 1);
  };

  const handleSpeak = async () => {
    if (!currentQuestion || isSpeaking) return;
    setIsSpeaking(true);
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
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#111]/95 backdrop-blur-md">
        <p className="text-red-500 font-bold mb-6 text-2xl">{error}</p>
        <button
          onClick={() => generateQuestion(questionCount)}
          className="px-8 py-4 bg-[#EF6035] text-white rounded-xl text-xl font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#111]/70 backdrop-blur-xl overflow-hidden">
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
                className="fixed top-24 right-4 md:right-[calc(50%-10rem)] z-[70] bg-[#212229] p-8 rounded-3xl shadow-2xl border border-white/10 w-96"
              >
                <h3 className="text-2xl font-bold text-white mb-8 font-display border-b border-white/5 pb-2">
                  Settings
                </h3>
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 uppercase font-bold">Level</span>
                      <span className="font-bold text-[#EF6035] text-lg">{tempNumericLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={tempNumericLevel}
                      onChange={(e) => setTempNumericLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EF6035]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 uppercase font-bold">Humor</span>
                      <span className="font-bold text-[#EF6035] text-lg">{tempHumorLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={tempHumorLevel}
                      onChange={(e) => setTempHumorLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EF6035]"
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
              className="flex-1 flex flex-col w-full h-full"
              layout
            >
              <motion.div
                layout
                className="flex-1 w-full relative bg-black/20 overflow-hidden flex items-center justify-center p-6"
              >
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                  <div className="flex gap-2 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex flex-col items-center leading-none shadow-lg">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black">
                        Round
                      </span>
                      <span className="text-lg font-black text-white">{questionCount + 1}</span>
                    </div>
                    <button
                      onClick={onGameEnd}
                      className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 hover:bg-red-900/80 transition-colors text-white shadow-lg flex items-center justify-center"
                      title="Exit Game"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex flex-col items-end leading-none shadow-lg">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black">
                        Score
                      </span>
                      <div className="flex gap-1 text-lg font-black text-white">
                        <motion.span
                          key={score}
                          animate={{ scale: [1, 1.2, 1], color: ['#fff', '#EF6035', '#fff'] }}
                        >
                          {score}
                        </motion.span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400">{highScore}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="p-3 bg-black/60 backdrop-blur-md rounded-full text-gray-300 hover:text-[#EF6035] border border-white/10 transition-all hover:bg-black/80"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="w-full max-w-6xl h-full max-h-[60vh] relative border-[3px] border-[#33353F] rounded-3xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10">
                  {currentQuestion.videoUrl ? (
                    <div className="w-full h-full relative bg-black">
                      <div className="absolute bottom-4 right-4 z-20 bg-[#EF6035] text-white text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-lg animate-pulse">
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
                        <CanvasImageDisplay imageId={currentQuestion.imageId} alt="Scenario" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"></div>
                </div>
              </motion.div>

              <div className="shrink-0 w-full bg-black/40 backdrop-blur-md relative z-20 flex flex-col items-center justify-center px-4 pt-4 pb-2 border-t border-white/5">
                <p className="text-3xl md:text-5xl font-black font-display leading-tight text-center flex flex-wrap justify-center gap-x-3 gap-y-2 items-center drop-shadow-2xl max-w-6xl text-white">
                  {currentQuestion.sentence.split('______').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span className="opacity-95 drop-shadow-md">{part}</span>
                      {index < arr.length - 1 &&
                        (isAnswerChecked ? (
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
                        ))}
                    </React.Fragment>
                  ))}
                  <button
                    onClick={handleSpeak}
                    disabled={isSpeaking}
                    className="ml-2 p-2 rounded-full bg-white/10 hover:bg-[#EF6035] text-gray-300 hover:text-white transition-all duration-300 shadow-lg"
                  >
                    <svg
                      className={`w-6 h-6 ${isSpeaking ? 'animate-pulse text-white' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      ></path>
                    </svg>
                  </button>
                </p>
              </div>

              <div className="shrink-0 w-full h-[30vh] min-h-[220px] max-h-[350px] bg-black/40 backdrop-blur-xl p-4 pb-8 border-t border-white/5">
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
                            className={`
                                        h-full rounded-2xl text-3xl md:text-4xl font-bold tracking-tight border-2
                                        transition-all duration-200 outline-none relative overflow-hidden
                                        bg-orange-500/10 border-orange-500/40
                                        shadow-[0_4px_15px_rgba(0,0,0,0.5)]
                                        group hover:border-[#EF6035] hover:bg-gradient-to-br hover:from-[#EF6035] hover:to-[#D84A20]
                                        hover:shadow-[0_0_30px_rgba(239,96,53,0.6)]
                                        flex items-center justify-center
                                    `}
                          >
                            <span className="text-white drop-shadow-md group-hover:drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                              {option}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="feedback-card"
                        layoutId={
                          selectedAnswer === currentQuestion.correctAnswer
                            ? currentQuestion.correctAnswer
                            : 'feedback'
                        }
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative z-20 shadow-2xl flex items-center"
                        style={{
                          background:
                            selectedAnswer === currentQuestion.correctAnswer
                              ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)' // Emerald
                              : 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)', // Red
                        }}
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between w-full h-full p-6 md:p-8 relative gap-4">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

                          <div className="flex-1 w-full relative z-10 overflow-y-auto flex flex-col justify-center min-h-0">
                            <h3 className="text-white font-black font-display text-3xl md:text-4xl flex items-center gap-3 mb-3">
                              {selectedAnswer === currentQuestion.correctAnswer ? (
                                <>
                                  <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-400/30 shadow-lg shadow-emerald-500/20 shrink-0">
                                    <svg
                                      className="w-10 h-10 text-emerald-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="4"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-white drop-shadow-lg">Correct!</span>
                                </>
                              ) : (
                                <>
                                  <div className="bg-red-500/20 p-2 rounded-full border border-red-400/30 shadow-lg shadow-red-500/20 shrink-0">
                                    <svg
                                      className="w-10 h-10 text-red-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="4"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-white drop-shadow-lg">Not quite</span>
                                </>
                              )}
                            </h3>
                            <div className="text-lg md:text-xl text-gray-100 leading-relaxed font-medium drop-shadow-sm">
                              {selectedAnswer === currentQuestion.correctAnswer
                                ? 'Brilliant! You nailed the context.'
                                : renderFormattedText(explanation || 'Analyzing...')}
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col gap-4 relative z-10 md:min-w-[180px] justify-center w-full md:w-auto shrink-0">
                            <button
                              onClick={handleNextQuestion}
                              className="flex-1 md:flex-none px-8 py-4 md:py-6 rounded-2xl bg-white text-gray-900 text-xl md:text-2xl font-black hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                            >
                              Next
                              <svg
                                className="w-6 h-6 md:w-7 md:h-7"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                ></path>
                              </svg>
                            </button>
                            {selectedAnswer === currentQuestion.correctAnswer ? (
                              <button
                                onClick={handleSpeakPreposition}
                                className="flex-1 md:flex-none text-emerald-100 text-base md:text-lg font-bold hover:text-white flex items-center justify-center gap-2 py-3 md:py-4 bg-black/30 rounded-xl hover:bg-black/50 transition-all border border-white/10"
                              >
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                  ></path>
                                </svg>
                                Pronounce
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowCoreMeaning(!showCoreMeaning)}
                                className="flex-1 md:flex-none text-red-100 text-base md:text-lg font-bold hover:text-white flex items-center justify-center gap-2 py-3 md:py-4 bg-black/30 rounded-xl hover:bg-black/50 transition-all border border-white/10"
                              >
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  ></path>
                                </svg>
                                Why?
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {showCoreMeaning && selectedAnswer !== currentQuestion.correctAnswer && (
                            <motion.div
                              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-8 text-center"
                            >
                              <div>
                                <h4 className="text-gray-400 uppercase text-sm font-bold tracking-widest mb-3">
                                  Definition
                                </h4>
                                <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed">
                                  <span className="text-[#EF6035] font-black text-3xl md:text-4xl block mb-4">
                                    "{currentQuestion.correctAnswer}"
                                  </span>
                                  {PREPOSITION_DETAILS[currentQuestion.correctAnswer]}
                                </p>
                              </div>
                              <button
                                onClick={() => setShowCoreMeaning(false)}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"
                              >
                                <svg
                                  className="w-8 h-8"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  ></path>
                                </svg>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default PrepositionGame;
