import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ALL_PREPOSITIONS,
  PREPOSITIONS_BY_LEVEL,
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
  let fewShotExamples = ''; // Changed to hold multiple examples
  let humorAdj = '';

  if (humorLevel >= 5) {
    // Keep humor grounded and realistic, not fantastical
    humorAdj = 'The scenario can be mildly unusual or amusing in a realistic, subtle way. Humor should arise from a simple, real-world twist. Avoid absurdity, puns, or fantastical elements; the language must remain completely natural and straightforward. Focus on concrete scenarios.';
  }

  // General instruction: Generate ONE single, natural-sounding, everyday English sentence. It MUST sound like something a native speaker would genuinely say or appear in a common language textbook. Vary the scenarios to keep them fresh and diverse. Include a single blank '______' where the preposition should fit.
  // ABSOLUTELY AVOID: poetry, abstract concepts, figurative language, metaphors, similes, overly descriptive adjectives/adverbs, fantastical elements, complex clauses (unless specifically for C1/C2), more than one distinct action or subject, rarely used vocabulary, formal tone, or anything difficult for an AI to depict simply and unambiguously.
  // Prioritize common verbs, nouns, and everyday expressions (lexical chunks) that make the English sound genuinely natural and conversational.
  // Ensure the scenario is clearly depictable in a single image with 1-2 main subjects/objects.

  switch (level) {
    case GameLevel.A1:
      levelHint = 'A1-level vocabulary and very simple subject-verb-object structure. Use common, concrete nouns and verbs only. Shortest sentences (8-12 words), focusing on immediate, observable actions or locations.';
      fewShotExamples = `
For an A1 level, correct sentences look like this:
- "The keys are ______ the table."
- "She lives ______ a small house."
- "He is waiting ______ the bus stop."
- "The dog ran ______ the tree."
- "She put her book ______ the bag."`;
      break;
    case GameLevel.A2:
      levelHint = 'A2-level vocabulary and simple compound sentences (e.g., using "and," "but," "because"). Focus on concrete daily activities, immediate surroundings, or simple past/future events. Short to medium length (8-18 words).';
      fewShotExamples = `
For an A2 level, correct sentences look like this:
- "I usually go to work ______ bus every morning."
- "The cat jumped ______ the fence into the garden."
- "We walked ______ the park after dinner."
- "She always leaves her keys ______ the kitchen counter."
- "He looked ______ the window at the rain."`;
      break;
    case GameLevel.B1:
      levelHint = 'B1-level vocabulary and common complex sentences (e.g., with relative clauses like "which," "who," "that," "when," or simple conditional structures). Everyday topics, social interactions, or descriptions of experiences. Medium length (12-18 words). Use common phrasal verbs.';
      fewShotExamples = `
For a B1 level, correct sentences look like this:
- "She put the groceries ______ the cupboard for storage."
- "The entire team depends ______ his leadership skills."
- "They argued ______ the best way to solve the problem."
- "He apologized ______ being late to the meeting."
- "She is thinking ______ moving to a new city next year."`;
      break;
    case GameLevel.B2:
      levelHint = 'B2-level vocabulary and varied complex sentence structures (e.g., advanced conditionals, some passive voice, reported speech). Suitable for discussing opinions, current events, describing processes, or more nuanced everyday situations. Medium to long length (12-18 words). Use more complex phrasal verbs and idiomatic expressions.';
      fewShotExamples = `
For a B2 level, correct sentences look like this:
- "Her promotion was a direct result ______ her consistent hard work."
- "The decision to cancel the event rests ______ the committee members."
- "They talked ______ length about their travel plans for the summer."
- "The government imposed new restrictions ______ imports to protect local industries."
- "He succeeded ______ persuading them to change their minds."`;
      break;
    case GameLevel.C1:
      levelHint = 'C1-level vocabulary and sophisticated, varied complex sentence structures (e.g., advanced conditionals, inversions, nuanced passive voice, complex sentence adverbs). Sentences should involve detailed descriptions of concrete situations or complex sequential actions in realistic, visualizable contexts. Longer length (15-22 words). Use advanced collocations and more formal but natural phrasing.';
      fewShotExamples = `
For a C1 level, correct sentences look like this:
- "The new policy came ______ effect immediately after the announcement."
- "Despite the harsh conditions, the explorers pressed ______ with their journey."
- "He often finds himself at odds ______ his colleagues on policy matters."
- "The committee deliberated ______ the proposed changes for several hours."
- "She demonstrated a profound understanding ______ the complex theoretical framework."`;
      break;
    case GameLevel.C2:
      levelHint = 'C2-level vocabulary and highly advanced, precise, and idiomatic sentence structures, reflecting native-like mastery. Sentences should express subtle distinctions, complex interdependencies, or professional-level discourse within realistic and highly detailed, visualizable contexts. Very long and grammatically intricate (15-22 words). Prioritize native-like idiomatic expressions and subtle nuances of meaning.';
      fewShotExamples = `
For a C2 level, correct sentences look like this:
- "The politician was held ______ account for his controversial statements."
- "Her meticulous attention ______ detail ensured the project's success."
- "The company embarked ______ a new venture to expand its global reach."
- "They decided to dispense ______ the formalities and proceed directly to the main agenda."
- "The historical document provided invaluable insight ______ the customs of ancient civilizations."`;
      break;
    default:
      levelHint = 'basic vocabulary and simple sentence structures.';
      fewShotExamples = '';
  }

  return `Generate ONE single, natural-sounding, everyday English sentence. It MUST sound like something a native speaker would genuinely say or appear in a common language textbook. Vary the scenarios to keep them fresh and diverse. Include a single blank '______' where the preposition should fit.
ABSOLUTELY AVOID: poetry, abstract concepts, figurative language, metaphors, similes, overly descriptive adjectives/adverbs, fantastical elements, complex clauses (unless specifically for C1/C2), more than one distinct action or subject, rarely used vocabulary, formal tone, or anything difficult for an AI to depict simply and unambiguously.
Prioritize common verbs, nouns, and everyday expressions (lexical chunks) that make the English sound genuinely natural and conversational.
Keep sentences concise: 8-12 words for A1/A2, 12-18 words for B1/B2, and 15-22 words for C1/C2. Do NOT exceed these limits.
Ensure the scenario is clearly depictable in a single image with 1-2 main subjects/objects.
${humorAdj ? humorAdj + '\n' : ''}
The sentence should be appropriate for a ${level} learner, using ${levelHint}.
${fewShotExamples}
Use the preposition "${preposition}".
Return ONLY the sentence with the blank.`;
};

const generateRandomSentenceContext = (
  level: GameLevel,
  selectedCategory: PrepositionCategory | null,
): { correctPreposition: PrepositionItem } => {
  let categoriesToConsider: PrepositionCategory[];

  if (selectedCategory) {
    categoriesToConsider = [selectedCategory];
  } else {
    // Dynamic category selection based on level
    if (level === GameLevel.A1 || level === GameLevel.A2) {
      categoriesToConsider = [PrepositionCategory.LOCATION, PrepositionCategory.DIRECTION, PrepositionCategory.TIME];
    } else {
      categoriesToConsider = Object.values(PrepositionCategory);
    }
  }

  let filteredPrepositionsByCategory: PrepositionItem[] = [];
  for (const cat of categoriesToConsider) {
    const preps = ALL_PREPOSITIONS.filter((p) => p.category === cat);
    filteredPrepositionsByCategory.push(...preps);
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
  category: PrepositionCategory | null;
  onApiKeyNeeded: () => void;
  onGameEnd: () => void;
}

const wittyLoadingMessages = [
  "Conjuring prepositions from the linguistic ether...",
  "Teaching our AI the difference between 'in' and 'on' (it's complicated)...",
  "Brewing a fresh batch of grammatically challenging scenarios...",
  "Consulting the oracle of 'at,' 'in,' and 'on'...",
  "Polishing the linguistic lenses for your next visual puzzle...",
  "Downloading more brain cells for the next sentence...",
  "Wrangling words into grammatically correct formations...",
  "Applying advanced prepositional physics...",
  "Just a moment, our AI is contemplating the nuances of 'upon'...",
  "Generating a sentence so perfectly obscure, it's brilliant...",
  "Fetching pixels and prepositions, in that order...",
  "Ensuring your next challenge is 'on point'...",
  "Almost ready! Our AI is just adding a touch of 'between' to the scene...",
  "Dusting off some forgotten prepositions for your pleasure...",
  "Asking the AI to please, for the love of grammar, keep it concise...",
  "Warming up the image generator – hope it knows its 'beside' from its 'behind'!",
  "Calculating the exact degree of linguistic trickery needed...",
  "Feeding the algorithm more coffee (and prepositions)...",
  "Scanning for sentences that won't make you say 'huh?'",
];

const PrepositionGame: React.FC<PrepositionGameProps> = ({ level, humorLevel, category, onApiKeyNeeded, onGameEnd }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Preposition | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState<string>('');


  const askedQuestionsInSessionRef = useRef<Set<string>>(new Set());
  const currentImageIdRef = useRef<string | null>(null);

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'loading') => {
    const audioContext: AudioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    switch (type) {
      case 'correct':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'incorrect':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'loading':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
    }
  }, []);

  const generateQuestion = useCallback(async (questionNumber: number) => {
    setLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setExplanation(null);
    playSound('loading'); // Play loading sound
    setCurrentLoadingMessage(wittyLoadingMessages[Math.floor(Math.random() * wittyLoadingMessages.length)]);


    if (currentImageIdRef.current) {
        clearImageData(currentImageIdRef.current);
    }

    try {
      const imageId = `question-${Date.now()}-${questionNumber}`;
      currentImageIdRef.current = imageId;

      const cachedQuestionData = await getQuestionFromCache(level, category, Array.from(askedQuestionsInSessionRef.current));

      let generatedSentence: string;
      let correctPrepositionItem: PrepositionItem; // Changed from correctPreposition
      let options: Preposition[];
      let imageData: string;
      let imageUrlForCache: string;

      if (cachedQuestionData) {
        setImageData(imageId, cachedQuestionData.imageUrl); 
        options = getWrongOptions(cachedQuestionData.correctAnswer, level);
        generatedSentence = cachedQuestionData.sentence;
        correctPrepositionItem = ALL_PREPOSITIONS.find(p => p.preposition === cachedQuestionData.correctAnswer)!;
        imageData = cachedQuestionData.imageUrl; // Already a URL or base64
        imageUrlForCache = cachedQuestionData.imageUrl;
      } else {
        ({ correctPreposition: correctPrepositionItem } = generateRandomSentenceContext(level, category)); // Corrected variable name
        
        // 1. Generate the sentence FIRST.
        const sentencePrompt = buildGeminiPrompt(level, correctPrepositionItem.preposition, humorLevel);
        generatedSentence = (await generateText(sentencePrompt)).trim();

        // Ensure the blank is present; if not, re-insert using the correct preposition
        if (!generatedSentence.includes('______')) {
          const regex = new RegExp(`\\b${correctPrepositionItem.preposition}\\b`, 'gi');
          generatedSentence = generatedSentence.replace(regex, '______');
          // Fallback to example sentence if AI generated sentence doesn't have the preposition or blank
          if (!generatedSentence.includes('______')) {
              generatedSentence = correctPrepositionItem.exampleSentence.replace(correctPrepositionItem.preposition, '______');
          }
        }
        
        // 2. NOW use the *generatedSentence* for the image prompt.
        // Explicitly instruct the AI to depict the *exact scene* described and to NOT add text.
        const imagePrompt = `Generate a high-resolution, photorealistic image. The image MUST directly and unambiguously depict the exact scene or situation described in this English sentence: "${generatedSentence.replace('______', correctPrepositionItem.preposition)}". The image must be a pure visual representation. DO NOT, under any circumstances, render any text, letters, or words onto the image. The final image must contain ZERO text. Focus on creating a clear, single focal point that visually emphasizes the spatial or temporal relationship implied by the preposition. Use distinct, easily identifiable objects, a simple and relevant background, and strong visual cues to enhance clarity and memorability for a language learner. The image should act as a strong mental anchor, making the preposition's usage immediately apparent through visual context. Do not add any elements that are not explicitly mentioned in the sentence.`;

        options = getWrongOptions(correctPrepositionItem.preposition, level); // Pre-compute options here
        
        const imageDataResponse = await generateImage(imagePrompt).catch(err => {
            console.warn('Image generation failed, falling back:', err);
            return `https://picsum.photos/800/450?random=${Math.random()}`;
          });

        imageData = imageDataResponse;
        setImageData(imageId, imageData); 
        imageUrlForCache = imageData.startsWith('http') ? imageData : `data:image/png;base64,${imageData}`;
        
        addQuestionToCache({
            level,
            category: correctPrepositionItem.category,
            sentence: generatedSentence,
            correctAnswer: correctPrepositionItem.preposition,
            imageUrl: imageUrlForCache, 
        });
      }

      setCurrentQuestion({
        id: cachedQuestionData?.id, // Use cached ID if available
        sentence: generatedSentence,
        correctAnswer: correctPrepositionItem.preposition,
        options,
        imageId: imageId,
      });

      if (cachedQuestionData?.id) {
          askedQuestionsInSessionRef.current.add(cachedQuestionData.id);
      }

    } catch (err: any) {
      console.error('Failed to generate question:', err);
      if (err.message && err.message.includes("API key selection initiated")) {
        setError("Your API key may be invalid or unselected. Please select your API key to continue.");
        onApiKeyNeeded();
      } else {
        setError(err.message || 'Failed to generate question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [level, humorLevel, category, onApiKeyNeeded, playSound]);

  useEffect(() => {
    if (!isFadingOut) { // Only generate new question if not currently fading out
      generateQuestion(questionCount);
    }
  }, [questionCount, generateQuestion, isFadingOut]); 

  const handleCheckAnswer = useCallback(async () => {
    if (!selectedAnswer || !currentQuestion) return;

    setIsAnswerChecked(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
      playSound('correct'); // Play correct sound
    } else {
      playSound('incorrect'); // Play incorrect sound
      setExplanation('Generating explanation...');
      try {
        const fullSentence = currentQuestion.sentence.replace('______', `"${currentQuestion.correctAnswer}"`);
        const explanationPrompt = `For an English learner at the ${level} level, briefly explain why the preposition "${currentQuestion.correctAnswer}" is the correct choice in the sentence: "${fullSentence}". Keep the explanation very short, simple, and encouraging.`;
        const generatedExplanation = await generateText(explanationPrompt);
        setExplanation(generatedExplanation);
      } catch (err) {
        console.error("Failed to generate explanation:", err);
        setExplanation("Sorry, couldn't generate an explanation.");
      }
    }
  }, [selectedAnswer, currentQuestion, level, playSound]);

  const handleNextQuestion = useCallback(() => {
    setIsFadingOut(true); // Start fade-out
    setTimeout(() => {
      setQuestionCount((prev) => prev + 1);
      setIsFadingOut(false); // Reset fade-out after new question loads
    }, 500); // Duration of fade-out animation
  }, []);

  const getFeedbackClasses = (option: Preposition): string => {
    if (!isAnswerChecked) {
      // Not checked yet: subtle ring for selected, default for others
      return selectedAnswer === option
        ? 'ring-primary border-primary scale-[1.01] shadow-lg'
        : 'ring-gray-300 dark:ring-gray-700 hover:ring-primary/50';
    }
    // Answer is checked, apply feedback animations
    if (option === currentQuestion?.correctAnswer) {
      return 'ring-green-500 !bg-green-50 dark:!bg-green-900/50 animate-pulse-correct shadow-md shadow-green-500/50';
    }
    if (option === selectedAnswer) {
      return 'ring-red-500 !bg-red-50 dark:!bg-red-900/50 animate-shake-incorrect shadow-md shadow-red-500/50';
    }
    // Correct but not selected, or wrong and not selected
    return 'ring-gray-300 dark:ring-gray-700 opacity-60 pointer-events-none';
  };

  if (loading || isFadingOut) {
    return <LoadingSpinner message={isFadingOut ? "Transitioning..." : currentLoadingMessage} />;
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-md mx-auto animate-fade-in ethereal-border">
        <p className="font-semibold text-red-500 font-display drop-shadow-sm">An Error Occurred</p>
        <p className="text-sm my-4 text-gray-700 dark:text-gray-300 font-body drop-shadow-sm">{error}</p>
        <Button onClick={() => generateQuestion(questionCount)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return null; // Should not happen if not loading and no error
  }

  return (
    <div className={`w-full max-w-3xl mx-auto flex flex-col items-center ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="w-full aspect-video rounded-lg overflow-hidden shadow-xl ethereal-border bg-gray-200 dark:bg-gray-900 relative">
        <CanvasImageDisplay 
          key={currentQuestion.imageId} 
          imageId={currentQuestion.imageId}
          alt="Scenario" 
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden w-full mt-8 ethereal-border">
        <div className="bg-gray-50 dark:bg-gray-700 py-3 px-6 border-b border-gray-200 dark:border-gray-600">
          <p className="text-base font-semibold tracking-wider text-gray-600 dark:text-gray-300 uppercase text-center font-display drop-shadow-sm">Complete the sentence</p>
        </div>
        <div className="p-6">
          <p className="text-xl md:text-2xl text-center text-gray-900 dark:text-white flex items-center justify-center gap-2 flex-wrap font-display drop-shadow-sm">
            {currentQuestion.sentence.split('______').map((part, index, arr) => (
              <React.Fragment key={index}>
                <span>{part}</span>
                {index < arr.length - 1 && <span className="inline-block w-20 h-8 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-md"></span>}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 w-full mt-8">
        {currentQuestion.options.map((option) => (
          <label 
            key={option}
            className={`flex items-center justify-center min-w-[100px] flex-grow py-3 px-5 rounded-lg shadow-md cursor-pointer ring-2 transition-all duration-200 ease-in-out
                        bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 font-semibold font-display drop-shadow-sm
                        active:scale-[0.97] active:bg-gray-100 dark:active:bg-gray-700/80
                        focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background-dark
                        ${getFeedbackClasses(option)}`}
          >
            <span>{option}</span>
            <input 
              type="radio"
              name="preposition-option"
              value={option}
              checked={selectedAnswer === option}
              onChange={() => setSelectedAnswer(option)}
              disabled={isAnswerChecked}
              className="sr-only"
            />
          </label>
        ))}
      </div>
      
      {isAnswerChecked && explanation && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full ethereal-border animate-fade-in">
           <p className="text-gray-800 dark:text-gray-200 font-body drop-shadow-sm">{explanation}</p>
        </div>
      )}

      <footer className="w-full pt-8">
        <Button 
          onClick={isAnswerChecked ? handleNextQuestion : handleCheckAnswer}
          disabled={!selectedAnswer && !isAnswerChecked}
        >
          {isAnswerChecked ? 'Next Question' : 'Check Answer'}
        </Button>
      </footer>
    </div>
  );
};

export default PrepositionGame;