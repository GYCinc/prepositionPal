import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ALL_PREPOSITIONS,
  PREPOSITION_FAMILIES,
  PREPOSITIONS_BY_LEVEL,
  CATEGORY_COLORS,
} from '../constants';
import { GameLevel, Preposition, PrepositionCategory, PrepositionItem, Question, FirestoreQuestion } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { generateText, generateImage } from '../services/geminiService';
import { getQuestionFromCache, addQuestionToCache } from '../services/firebaseService';
import CanvasImageDisplay from './CanvasImageDisplay';
import { setImageData, clearImageData } from '../services/imageStore';


const buildGeminiPrompt = (level: GameLevel, preposition: Preposition, humorLevel: number): string => {
  let levelHint = '';
  let fewShotExample = '';
  let humorAdj = '';

  if (humorLevel >= 5) {
    humorAdj = 'The situation described can be mildly unusual or amusing in a realistic way, but the language must remain completely natural and straightforward.';
  }

  switch (level) {
    case GameLevel.A1:
      levelHint = 'A1-level vocabulary and very simple subject-verb-object structure. Use common, concrete nouns and verbs only. Shortest possible sentences.';
      fewShotExample = 'For an A1 level, a correct sentence looks like this: "My keys are ______ the table."';
      break;
    case GameLevel.A2:
      levelHint = 'A2-level vocabulary and simple compound sentences (e.g., using "and," "but"). Focus on concrete daily activities or immediate surroundings. Short to medium length.';
      fewShotExample = 'For an A2 level, a correct sentence looks like this: "I usually go to work ______ bus."';
      break;
    case GameLevel.B1:
      levelHint = 'B1-level vocabulary and common sentence structures, including basic complex sentences. Everyday topics and social interactions. Medium length, natural flow.';
      fewShotExample = 'For a B1 level, a correct sentence looks like this: "She always arrives ______ time for her appointments."';
      break;
    case GameLevel.B2:
      levelHint = 'B2-level vocabulary and varied sentence structures. Suitable for discussing opinions, current events, or more nuanced everyday situations. Medium to long length, clear and direct.';
      fewShotExample = 'For a B2 level, a correct sentence looks like this: "The success of the project depended heavily ______ his dedication."';
      break;
    case GameLevel.C1:
      levelHint = 'C1-level vocabulary and sophisticated factual sentence structures. Can discuss abstract concepts or academic/professional topics, maintaining a neutral and objective tone. Long length, natural and advanced phrasing.';
      fewShotExample = 'For a C1 level, a correct sentence looks like this: "They conversed animatedly ______ various topics throughout the evening."';
      break;
    case GameLevel.C2:
      levelHint = 'C2-level vocabulary and advanced, nuanced factual sentence structures. Can handle highly complex topics or express subtle meanings, reflecting native-like proficiency. Very long and complex sentences, highly natural.';
      fewShotExample = 'For a C2 level, a correct sentence looks like this: "His argument bordered ______ outright defiance of the committee\'s decision."';
      break;
    default:
      levelHint = 'basic vocabulary and simple sentence structures.';
      fewShotExample = '';
  }

  return `Generate ONE single, natural-sounding, everyday English sentence. It MUST sound like something a native speaker would genuinely say or appear in a common language textbook. Include a single blank '______' where the preposition should fit. Focus on realistic, concrete scenarios. Absolutely no poetry, no abstract concepts, no overly descriptive adjectives/adverbs, and no fantastical elements. The tone should be neutral and conversational.
${humorAdj ? humorAdj + '\n' : ''}
The sentence should be appropriate for a ${level} learner, using ${levelHint}.
${fewShotExample}
Use the preposition "${preposition}".
Return ONLY the sentence with the blank.`;
};

const generateRandomSentenceContext = (
  level: GameLevel,
  selectedCategory?: PrepositionCategory,
): { correctPreposition: PrepositionItem } => {
  let categoriesToConsider: PrepositionCategory[];

  if (selectedCategory) {
    categoriesToConsider = [selectedCategory];
  } else {
    // Dynamic category selection based on level
    if (level === GameLevel.A1 || level === GameLevel.A2) {
      categoriesToConsider = [PrepositionCategory.LOCATION, PrepositionCategory.DIRECTION, PrepositionCategory.TIME];
    } else if (level === GameLevel.B1 || level === GameLevel.B2) {
      categoriesToConsider = [
        PrepositionCategory.LOCATION,
        PrepositionCategory.DIRECTION,
        PrepositionCategory.TIME,
        PrepositionCategory.MANNER,
      ];
    } else { // C1, C2
      categoriesToConsider = Object.values(PrepositionCategory).filter(
        (cat) => PREPOSITION_FAMILIES[cat] && PREPOSITION_FAMILIES[cat].length > 0
      );
    }
  }

  let filteredPrepositionsByCategory: PrepositionItem[] = [];
  for (const cat of categoriesToConsider) {
    filteredPrepositionsByCategory.push(
      ...ALL_PREPOSITIONS.filter((p) => p.category === cat)
    );
  }
  filteredPrepositionsByCategory = Array.from(new Set(filteredPrepositionsByCategory));

  const allowedPrepositionsForLevel = PREPOSITIONS_BY_LEVEL[level];
  const availablePrepositions = filteredPrepositionsByCategory.filter((p) =>
    allowedPrepositionsForLevel.includes(p.preposition)
  );

  if (availablePrepositions.length === 0) {
    console.warn(`No prepositions found for criteria at level ${level}, falling back.`);
    const fallbackPrepositions = ALL_PREPOSITIONS.filter((p) =>
      PREPOSITIONS_BY_LEVEL[GameLevel.A1].includes(p.preposition)
    );
    const correctPreposition = fallbackPrepositions.length > 0
        ? fallbackPrepositions[Math.floor(Math.random() * fallbackPrepositions.length)]
        : ALL_PREPOSITIONS[Math.floor(Math.random() * ALL_PREPOSITIONS.length)];
    return { correctPreposition };
  }

  const correctPreposition =
    availablePrepositions[Math.floor(Math.random() * availablePrepositions.length)];

  return { correctPreposition };
};

const getWrongOptions = (correctAnswer: Preposition, level: GameLevel): Preposition[] => {
    const allPossiblePrepositions = ALL_PREPOSITIONS.map((p) => p.preposition);
    let options: Preposition[] = [correctAnswer];
    let wrongOptionsCount: number;

    switch (level) {
        case GameLevel.A1: wrongOptionsCount = 2; break;
        case GameLevel.A2: case GameLevel.B1: wrongOptionsCount = 3; break;
        case GameLevel.B2: case GameLevel.C1: wrongOptionsCount = 4; break;
        case GameLevel.C2: wrongOptionsCount = 5; break;
        default: wrongOptionsCount = 3;
    }

    while (options.length < wrongOptionsCount + 1) {
        const randomPreposition = allPossiblePrepositions[Math.floor(Math.random() * allPossiblePrepositions.length)];
        if (!options.includes(randomPreposition)) {
            options.push(randomPreposition);
        }
    }
    return options.sort(() => Math.random() - 0.5);
};

interface PrepositionGameProps {
  level: GameLevel;
  humorLevel: number;
  onApiKeyNeeded: () => void;
}


const PrepositionGame: React.FC<PrepositionGameProps> = ({ level, humorLevel, onApiKeyNeeded }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Preposition | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<PrepositionCategory | null>(null);
  
  const askedQuestionsInSessionRef = useRef<Set<string>>(new Set());
  const currentImageIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
        // Initialize AudioContext only once and store in ref
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    } catch (e) {
        console.error("Web Audio API is not supported in this browser:", e);
    }
  }, []); // Empty dependency array means this runs once on mount

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'loading') => {
    const ctx = audioContextRef.current;
    if (!ctx) {
      console.warn("AudioContext not available.");
      return;
    }

    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Failed to resume AudioContext:", e));
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);

    switch (type) {
        case 'correct':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
            break;
        case 'incorrect':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
            break;
        case 'loading':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
            break;
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const generateQuestion = useCallback(async (questionNumber: number) => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSelectedAnswer(null);

    // Clear the previous image data from the store
    if (currentImageIdRef.current) {
        clearImageData(currentImageIdRef.current);
    }

    try {
      const imageId = `question-${questionNumber}`;
      currentImageIdRef.current = imageId;

      const cachedQuestionData = await getQuestionFromCache(level, currentCategory, Array.from(askedQuestionsInSessionRef.current));

      if (cachedQuestionData) {
        console.log("Serving question from Firestore cache.");
        // For cached data, imageUrl is a string URL.
        setImageData(imageId, cachedQuestionData.imageUrl); 
        const options = getWrongOptions(cachedQuestionData.correctAnswer, level);
        setCurrentQuestion({
            id: cachedQuestionData.id,
            sentence: cachedQuestionData.sentence,
            correctAnswer: cachedQuestionData.correctAnswer,
            imageId: imageId,
            options: options,
        });
        askedQuestionsInSessionRef.current.add(cachedQuestionData.id!);
        setLoading(false);
        return;
      }

      console.log("No suitable cached question found. Generating a new one.");
      const { correctPreposition } = generateRandomSentenceContext(level, currentCategory || undefined);
      const sentencePrompt = buildGeminiPrompt(level, correctPreposition.preposition, humorLevel);
      
      const sentenceResponse = await generateText(sentencePrompt);
      let generatedSentence = (sentenceResponse || correctPreposition.exampleSentence).trim();

      if (!generatedSentence.includes('______')) {
        const regex = new RegExp(`\\b${correctPreposition.preposition}\\b`, 'gi');
        generatedSentence = generatedSentence.replace(regex, '______');
         if (!generatedSentence.includes('______')) {
            generatedSentence = correctPreposition.exampleSentence.replace(correctPreposition.preposition, '______');
         }
      }

      const imagePromptSentence = generatedSentence.replace('______', correctPreposition.preposition);
      const imagePrompt = `A visually striking, high-resolution, photorealistic image that clearly illustrates the scene from the sentence: "${imagePromptSentence}". Use cinematic lighting and a dynamic composition to make the image engaging, but ensure the core subject and action are immediately understandable. Maintain a realistic style.`;
      
      // `imageData` will now be a raw base64 data string (WITHOUT prefix) or a string URL (for fallbacks)
      const imageData = await generateImage(imagePrompt).catch(err => {
         console.warn('Image generation failed, falling back:', err);
         return `https://picsum.photos/800/450?random=${Math.random()}`; // Fallback is a string URL
      });
      
      setImageData(imageId, imageData); // Put the new image data (base64 string or URL) in the store

      // For Firestore, store a placeholder or actual URL. Raw base64 cannot be stored directly.
      // Prepend 'data:image/png;base64,' for cache consistency if storing raw base64.
      const imageUrlForCache = imageData.startsWith('http') ? imageData : `data:image/png;base64,${imageData}`;
      
      const newQuestionForCache: Omit<FirestoreQuestion, 'createdAt' | 'id'> = {
          level,
          category: correctPreposition.category,
          sentence: generatedSentence,
          correctAnswer: correctPreposition.preposition,
          imageUrl: imageUrlForCache, 
      };

      // NOTE: Storing Blob data in Firestore is not directly supported.
      // For a persistent cache, you would need to convert the Blob to base64 or upload it to Firebase Storage.
      addQuestionToCache(newQuestionForCache);

      const options = getWrongOptions(correctPreposition.preposition, level);
      setCurrentQuestion({
        sentence: generatedSentence,
        correctAnswer: correctPreposition.preposition,
        options,
        imageId: imageId,
      });

    } catch (err: any) {
      console.error('Failed to generate question:', err);
      if (err.message && err.message.includes("API key selection initiated due to 'Requested entity was not found.'")) {
        setError("Your API key may be invalid or unselected. Please select your API key to continue.");
        onApiKeyNeeded();
      } else {
        setError(err.message || 'Failed to generate question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [level, humorLevel, currentCategory, onApiKeyNeeded, playSound]); // Added playSound to dependencies

  useEffect(() => {
    generateQuestion(questionCount);
    // No specific cleanup for Blobs here; they are managed by the imageStore and renderImageOnCanvas utility.
    return () => {
        // No global URL.revokeObjectURL needed from PrepositionGame itself
        // as the image data is passed as a string to the worker.
    }
  }, [generateQuestion, questionCount]);

  const handleAnswer = useCallback((answer: Preposition) => {
    setSelectedAnswer(answer);
    if (currentQuestion && answer === currentQuestion.correctAnswer) {
      setFeedback('Correct! 🎉');
      setScore((prev) => prev + 1);
      playSound('correct');
    } else {
      setFeedback(`Incorrect. The correct answer was "${currentQuestion?.correctAnswer}". 🙁`);
      playSound('incorrect');
    }
  }, [currentQuestion, playSound]);

  const handleNextQuestion = useCallback(() => {
    playSound('loading');
    setQuestionCount((prev) => prev + 1);
  }, [playSound]);

  const resetGame = useCallback(() => {
    playSound('loading');
    setScore(0);
    setCurrentCategory(null);
    askedQuestionsInSessionRef.current.clear();
    // Clear image data for the current question when resetting
    if (currentImageIdRef.current) {
        clearImageData(currentImageIdRef.current);
        currentImageIdRef.current = null;
    }
    setQuestionCount(0); // This will trigger a new generateQuestion call via useEffect
  }, [playSound]);
  
  const handleCategoryChange = useCallback((category: PrepositionCategory | null) => {
    playSound('loading');
    setCurrentCategory(category);
    setQuestionCount(0); // This will trigger a new generateQuestion call via useEffect
  }, [playSound]);

  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8">
      <div className="w-full flex justify-end items-center mb-6">
        <div className="text-xl font-bold text-slate-300 bg-slate-700/50 px-4 py-2 rounded-lg">
          Score: <span className="font-mono text-violet-400">{score} / {questionCount}</span>
        </div>
      </div>
      
      <div className="flex justify-center flex-wrap gap-2 mb-8 border-b border-slate-700 pb-6 w-full">
        {Object.values(PrepositionCategory).map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={currentCategory === category ? CATEGORY_COLORS[category] + ' text-white border ' : ''}
            variant={currentCategory === category ? 'primary' : 'secondary'}
            size="sm"
          >
            {category}
          </Button>
        ))}
        <Button
          onClick={() => handleCategoryChange(null)}
          variant={currentCategory === null ? 'primary' : 'secondary'}
          size="sm"
        >
          All Categories
        </Button>
      </div>

      <div className="w-full min-h-[400px] flex items-center justify-center">
        {loading && <LoadingSpinner message="Loading..." />}
        {error && (
          <div className="p-4 bg-rose-900/50 border border-rose-700 text-rose-200 rounded-md text-center">
            <p className="font-semibold">An Error Occurred</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={() => generateQuestion(questionCount)} variant="secondary">
              Retry Question
            </Button>
          </div>
        )}

        {currentQuestion && !loading && !error && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <CanvasImageDisplay 
              key={currentQuestion.imageId} 
              imageId={currentQuestion.imageId}
              alt="Scenario" 
            />
            <div className="text-center mb-8">
              <p className="text-lg text-slate-400 mb-2">Fill in the blank:</p>
              <p className="text-2xl md:text-3xl font-medium text-slate-100 p-4 bg-slate-900/70 rounded-lg">
                {currentQuestion.sentence}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl mb-6">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  variant='secondary'
                  size='lg'
                  isSelected={selectedAnswer === option}
                  isCorrect={!!selectedAnswer && option === currentQuestion.correctAnswer}
                  isIncorrect={!!selectedAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer}
                >
                  {option}
                </Button>
              ))}
            </div>

            {feedback && (
              <div className="text-center animate-fade-in">
                <p
                  className={`text-xl font-semibold mb-4 ${
                    feedback.includes('Correct') ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {feedback}
                </p>
                <Button onClick={handleNextQuestion} className="w-full md:w-auto">
                  Next Question
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-slate-700 pt-6 w-full flex justify-center">
        <Button onClick={resetGame} variant="secondary">
          Reset Game
        </Button>
      </div>
    </div>
  );
};

export default PrepositionGame;
