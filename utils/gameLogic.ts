import { GameLevel, Preposition, PrepositionCategory, PrepositionItem } from '../types';
import { ALL_PREPOSITIONS, PREPOSITIONS_BY_LEVEL } from '../constants';

// Recalibrated based on strict COCA (Corpus of Contemporary American English) Frequency Lists
export const buildGeminiPrompt = (
  level: GameLevel,
  preposition: Preposition,
  humorLevel: number
): string => {
  let vocabConstraint = '';
  let sentenceStructure = '';

  switch (level) {
    case GameLevel.Level_1: // A1
      vocabConstraint = 'STRICTLY usage of only the Top 500 words in COCA (American).';
      sentenceStructure = 'Simple Subject-Verb-Object. Max 6 words. Present Simple.';
      break;
    case GameLevel.Level_2: // A1.5
      vocabConstraint = 'STRICTLY usage of only the Top 800 words in COCA.';
      sentenceStructure = 'Basic sentences. Max 7 words. Simple tenses.';
      break;
    case GameLevel.Level_3: // A2
      vocabConstraint = 'STRICTLY usage of only the Top 1200 words in COCA.';
      sentenceStructure = 'Simple compound sentences. Max 9 words.';
      break;
    case GameLevel.Level_4: // A2.5
      vocabConstraint = 'STRICTLY usage of only the Top 1800 words in COCA.';
      sentenceStructure = 'Sentences with basic adjectives. Max 10 words.';
      break;
    case GameLevel.Level_5: // B1
      vocabConstraint = 'STRICTLY usage of only the Top 2500 words in COCA.';
      sentenceStructure = 'Conversational American English. Max 12 words.';
      break;
    case GameLevel.Level_6: // B1.5
      vocabConstraint = 'STRICTLY usage of only the Top 3200 words in COCA.';
      sentenceStructure = 'Conversational. Max 13 words. Future/Past tenses.';
      break;
    case GameLevel.Level_7: // B2
      vocabConstraint = 'Usage of Top 4000 words in COCA.';
      sentenceStructure = 'Natural, fluent American phrasing. Max 15 words.';
      break;
    case GameLevel.Level_8: // B2.5
      vocabConstraint = 'Usage of the full Top 5000 words in COCA (Mastery).';
      sentenceStructure = 'Natural, fluent American phrasing. Max 16 words.';
      break;
    case GameLevel.Level_9: // C1
      vocabConstraint = 'Advanced vocabulary (Top 8000 COCA).';
      sentenceStructure = 'Complex, nuanced American idioms. Max 18 words.';
      break;
    case GameLevel.Level_10: // C1.5
      vocabConstraint = 'Unrestricted Native-level American eloquence.';
      sentenceStructure = 'Highly sophisticated, abstract, or literary structures. Max 20 words.';
      break;
    default:
      vocabConstraint = 'Top 2000 COCA words.';
      sentenceStructure = 'Standard American English.';
  }

  let humorAdj = '';
  if (humorLevel <= 1) {
    humorAdj = 'Tone: Serious, factual, and direct.';
  } else if (humorLevel <= 4) {
    humorAdj = 'Tone: Casual and light.';
  } else if (humorLevel <= 7) {
    humorAdj = 'Tone: Clever and engaging.';
  } else {
    // 8-10
    humorAdj = 'Tone: Witty, sharp, or containing a surprising twist.';
  }

  return `Generate ONE single, natural-sounding **American English** sentence using the preposition "${preposition}".
Include a single blank '______' where the preposition should fit.

CRITICAL PEDAGOGICAL DIRECTIVES:
1. **REAL AMERICAN ENGLISH ONLY**: Absolutely NO British spellings (colour, centre), vocabulary (lorry, flat, biscuit, lift), or idioms.
2. **Pedagogical Level**: ${vocabConstraint}
3. **Structure**: ${sentenceStructure}
4. **Context**: The sentence MUST depict a clear physical scene suitable for photography.
5. ${humorAdj}

Return ONLY the sentence.`;
};

export const generateRandomSentenceContext = (
  level: GameLevel,
  selectedCategory: PrepositionCategory | null
): { correctPreposition: PrepositionItem } => {
  let categoriesToConsider: PrepositionCategory[];

  if (selectedCategory) {
    categoriesToConsider = [selectedCategory];
  } else {
    // For lower levels, restrict categories to basics to prevent confusion
    if (level === GameLevel.Level_1 || level === GameLevel.Level_2 || level === GameLevel.Level_3) {
      categoriesToConsider = [PrepositionCategory.LOCATION, PrepositionCategory.DIRECTION];
    } else if (level === GameLevel.Level_4 || level === GameLevel.Level_5) {
      categoriesToConsider = [
        PrepositionCategory.LOCATION,
        PrepositionCategory.DIRECTION,
        PrepositionCategory.TIME,
      ];
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
    // Fallback to Level 1 prepositions if filtered list is empty
    const fallbackPrepositions = ALL_PREPOSITIONS.filter((p) =>
      PREPOSITIONS_BY_LEVEL[GameLevel.Level_1].includes(p.preposition)
    );
    const correctPreposition =
      fallbackPrepositions.length > 0
        ? fallbackPrepositions[Math.floor(Math.random() * fallbackPrepositions.length)]
        : ALL_PREPOSITIONS[Math.floor(Math.random() * ALL_PREPOSITIONS.length)];
    return { correctPreposition };
  }

  const correctPreposition =
    availablePrepositions[Math.floor(Math.random() * availablePrepositions.length)];

  return { correctPreposition };
};

export const getWrongOptions = (correctAnswer: Preposition, _level: GameLevel): Preposition[] => {
  const allPossiblePrepositions = ALL_PREPOSITIONS.map((p) => p.preposition);
  const options: Preposition[] = [correctAnswer];
  const wrongOptionsCount: number = 3;

  while (options.length < wrongOptionsCount + 1) {
    const randomPreposition =
      allPossiblePrepositions[Math.floor(Math.random() * allPossiblePrepositions.length)];
    if (!options.includes(randomPreposition)) {
      options.push(randomPreposition);
    }
  }
  return options.sort(() => Math.random() - 0.5);
};
