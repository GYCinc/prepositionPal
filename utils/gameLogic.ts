
import { GameLevel, Preposition, PrepositionCategory, PrepositionItem } from '../types';
import { ALL_PREPOSITIONS, PREPOSITIONS_BY_LEVEL } from '../constants';

// Exclusion map to prevent semantically ambiguous distractors
// Expanded to prevent "walk in/through/to" confusion
const AMBIGUOUS_PAIRS: Record<string, string[]> = {
  [Preposition.IN]: [Preposition.INSIDE, Preposition.WITHIN, Preposition.INTO, Preposition.THROUGH, Preposition.AT, Preposition.ON],
  [Preposition.INSIDE]: [Preposition.IN, Preposition.WITHIN, Preposition.INTO, Preposition.THROUGH],
  [Preposition.INTO]: [Preposition.IN, Preposition.INSIDE, Preposition.TOWARDS, Preposition.TO, Preposition.THROUGH],
  [Preposition.ON]: [Preposition.UPON, Preposition.ABOVE, Preposition.OVER, Preposition.AT, Preposition.IN],
  [Preposition.UPON]: [Preposition.ON, Preposition.ABOVE],
  [Preposition.AT]: [Preposition.BY, Preposition.NEAR, Preposition.BESIDE, Preposition.IN, Preposition.ON], 
  [Preposition.TO]: [Preposition.TOWARDS, Preposition.INTO, Preposition.AT, Preposition.IN, Preposition.THROUGH], 
  [Preposition.TOWARDS]: [Preposition.TO, Preposition.INTO],
  [Preposition.THROUGH]: [Preposition.IN, Preposition.INTO, Preposition.ACROSS, Preposition.PAST],
  [Preposition.UNDER]: [Preposition.BELOW, Preposition.BENEATH],
  [Preposition.BELOW]: [Preposition.UNDER, Preposition.BENEATH],
  [Preposition.BENEATH]: [Preposition.UNDER, Preposition.BELOW],
  [Preposition.ABOVE]: [Preposition.OVER, Preposition.ON, Preposition.UPON],
  [Preposition.OVER]: [Preposition.ABOVE, Preposition.ON],
  [Preposition.BESIDE]: [Preposition.NEAR, Preposition.BY, Preposition.AT],
  [Preposition.NEAR]: [Preposition.BESIDE, Preposition.BY, Preposition.AT],
  [Preposition.BY]: [Preposition.NEAR, Preposition.BESIDE, Preposition.AT],
  [Preposition.WITHIN]: [Preposition.IN, Preposition.INSIDE],
};

// List of prepositions that are inherently dynamic and make for good videos
const DYNAMIC_PREPOSITIONS = [
    Preposition.THROUGH, Preposition.ALONG, Preposition.ACROSS, 
    Preposition.INTO, Preposition.OUT_OF, Preposition.PAST, 
    Preposition.AROUND, Preposition.TOWARDS, Preposition.OVER, 
    Preposition.UNDER, Preposition.UP, Preposition.OFF, Preposition.FROM
];

// Recalibrated based on strict COCA (Corpus of Contemporary American English) Frequency Lists
export const buildGeminiPrompt = (level: GameLevel, preposition: Preposition, humorLevel: number, forceContextDiversity: boolean = false): string => {
  let vocabConstraint = '';
  let sentenceStructure = '';
  let sentenceType = 'declarative'; // Default to declarative

  switch (level) {
    case GameLevel.Level_1: // A1
      vocabConstraint = 'STRICTLY usage of only the Top 500 words in COCA (American). Use varied and interesting lexical choices.';
      sentenceStructure = 'Simple Active Subject-Verb-Object. Max 6 words.';
      break;
    case GameLevel.Level_2: // A1.5
      vocabConstraint = 'STRICTLY usage of only the Top 800 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Active sentences. Max 7 words.';
      break;
    case GameLevel.Level_3: // A2
      vocabConstraint = 'STRICTLY usage of only the Top 1200 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Simple compound sentences. Max 9 words. Vary grammatical patterns.';
      break;
    case GameLevel.Level_4: // A2.5
      vocabConstraint = 'STRICTLY usage of only the Top 1800 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Sentences with basic adjectives. Max 10 words. Vary grammatical patterns and simple clauses.';
      break;
    case GameLevel.Level_5: // B1
      vocabConstraint = 'STRICTLY usage of only the Top 2500 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Conversational American English. Max 12 words. Incorporate more complex clauses or phrases.';
      break;
    case GameLevel.Level_6: // B1.5
      vocabConstraint = 'STRICTLY usage of only the Top 3200 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Conversational. Max 13 words. Utilize various tenses (Future/Past) and more complex sentence structures.';
      break;
    case GameLevel.Level_7: // B2
      vocabConstraint = 'Usage of Top 4000 words in COCA. Use varied and interesting lexical choices.';
      sentenceStructure = 'Natural, fluent American phrasing. Max 15 words. Include diverse grammatical structures.';
      // 20% chance for interrogative/exclamatory
      if (Math.random() < 0.2) sentenceType = (Math.random() < 0.5) ? 'interrogative' : 'exclamatory';
      break;
    case GameLevel.Level_8: // B2.5
      vocabConstraint = 'Usage of the full Top 5000 words in COCA (Mastery). Use varied and interesting lexical choices.';
      sentenceStructure = 'Natural, fluent American phrasing. Max 16 words. Include diverse and more complex grammatical structures.';
      if (Math.random() < 0.2) sentenceType = (Math.random() < 0.5) ? 'interrogative' : 'exclamatory';
      break;
    case GameLevel.Level_9: // C1
      vocabConstraint = 'Advanced vocabulary (Top 8000 COCA). Use varied and interesting lexical choices.';
      sentenceStructure = 'Complex, nuanced American idioms. Max 18 words. Explore sophisticated grammatical constructions.';
      if (Math.random() < 0.25) sentenceType = (Math.random() < 0.5) ? 'interrogative' : 'exclamatory';
      break;
    case GameLevel.Level_10: // C1.5
      vocabConstraint = 'Unrestricted Native-level American eloquence. Use varied and interesting lexical choices.';
      sentenceStructure = 'Highly sophisticated, abstract, or literary structures. Max 20 words. Employ a full range of grammatical complexity.';
      if (Math.random() < 0.25) sentenceType = (Math.random() < 0.5) ? 'interrogative' : 'exclamatory';
      break;
    default:
      vocabConstraint = 'Top 2000 COCA words. Use varied and interesting lexical choices.';
      sentenceStructure = 'Standard American English. Vary grammatical patterns.';
  }

  let humorAdj = '';
  if (humorLevel <= 2) {
    humorAdj = 'Tone: Professional, academic, and direct.';
  } else if (humorLevel <= 5) {
    humorAdj = 'Tone: Casual, friendly, and conversational.';
  } else if (humorLevel <= 8) {
    humorAdj = 'Tone: Energetic, enthusiastic, and lively.';
  } else { // 9-10
    humorAdj = 'Tone: Playful, witty, and clever.';
  }

  // DEEP DIVE LOGIC:
  let deepDiveContext = '';
  if (forceContextDiversity) {
      const contexts = [
          "a physical/spatial context (e.g., location, surface)",
          "a temporal context (e.g., time, duration, sequence)",
          "an abstract or metaphorical context (e.g., emotions, ideas)",
          "an idiomatic expression or phrasal verb usage"
      ];
      const contextType = contexts[Math.floor(Math.random() * contexts.length)];
      deepDiveContext = `
      TASK: This is a DEEP DIVE into the polysemous nature of "${preposition}".
      CONSTRAINT: You MUST generate a sentence using "${preposition}" in specifically **${contextType}**.
      Avoid generic usages. Explore the nuance of this word.
      `;
  }

  let sentenceTypeInstruction = '';
  if (sentenceType === 'interrogative') {
      sentenceTypeInstruction = 'The sentence MUST be an **INTERROGATIVE QUESTION**. Ensure the question can be visually depicted.';
  } else if (sentenceType === 'exclamatory') {
      sentenceTypeInstruction = 'The sentence MUST be an **EXCLAMATORY STATEMENT**. Ensure the exclamation can be visually depicted.';
  } else {
      sentenceTypeInstruction = 'The sentence MUST be a **DECLARATIVE STATEMENT**.';
  }


  return `Generate ONE single, natural-sounding **American English** sentence using the preposition "${preposition}".
Include a single blank '______' where the preposition should fit.

CRITICAL PEDAGOGICAL DIRECTIVES:
1. **REAL AMERICAN ENGLISH ONLY**: Absolutely NO British spellings or vocabulary.
2. **Pedagogical Level**: ${vocabConstraint}
3. **Structure & Type**: ${sentenceTypeInstruction} ${sentenceStructure}
4. **Context & Ambiguity Prevention**: 
   - The sentence MUST depict a clear **REAL-WORLD, EVERYDAY** physical scene.
   - **CRITICAL**: The context must rule out other common prepositions.
     - If the target is "IN" (Location), DO NOT use movement verbs like "walk", "run", or "go" that could imply "THROUGH" or "TO". Use containment verbs like "sit", "wait", "stand", "live", or "hide".
     - If the target is "TO" (Direction), ensure there is a clear destination point, not a container.
     - Example Bad: "She walks ______ the park." (Could be IN, THROUGH, or TO).
     - Example Good: "She has a picnic ______ the park." (Clearly IN).
   - **Verb Selection**: Use active verbs (e.g., "places", "holds") over static "is/are" whenever possible, UNLESS a static verb is required to prevent ambiguity (as above).
   - **FORBIDDEN**: NO fantasy, NO sci-fi, NO video game aesthetics.
5. ${humorAdj}
${deepDiveContext}

Return ONLY the sentence.`;
};

export const generateRandomSentenceContext = (
  level: GameLevel,
  selectedCategory: PrepositionCategory | null,
  isVideoRound: boolean = false
): { correctPreposition: PrepositionItem } => {
  let categoriesToConsider: PrepositionCategory[];

  if (selectedCategory) {
    categoriesToConsider = [selectedCategory];
  } else {
    // If it's a video round, prioritized categories that imply movement/action
    if (isVideoRound) {
        categoriesToConsider = [PrepositionCategory.DIRECTION]; // Primary source of action
    } else {
        // For lower levels, restrict categories to basics to prevent confusion
        if (level === GameLevel.Level_1 || level === GameLevel.Level_2 || level === GameLevel.Level_3) {
          categoriesToConsider = [PrepositionCategory.LOCATION, PrepositionCategory.DIRECTION];
        } else if (level === GameLevel.Level_4 || level === GameLevel.Level_5) {
           categoriesToConsider = [PrepositionCategory.LOCATION, PrepositionCategory.DIRECTION, PrepositionCategory.TIME];
        } else {
          categoriesToConsider = Object.values(PrepositionCategory);
        }
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

  // Filter for DYNAMIC prepositions if it's a video round
  if (isVideoRound) {
      const dynamicOptions = availablePrepositions.filter(p => DYNAMIC_PREPOSITIONS.includes(p.preposition));
      // If we have dynamic options available for this level, use them. Otherwise fall back to general available.
      if (dynamicOptions.length > 0) {
          const correctPreposition = dynamicOptions[Math.floor(Math.random() * dynamicOptions.length)];
          return { correctPreposition };
      }
  }

  if (availablePrepositions.length === 0) {
    // Fallback logic
    const fallbackPrepositions = ALL_PREPOSITIONS.filter((p) =>
      [Preposition.IN, Preposition.ON, Preposition.AT].includes(p.preposition)
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

export const getWrongOptions = (correctAnswer: Preposition, level: GameLevel): Preposition[] => {
    const allPossiblePrepositions = ALL_PREPOSITIONS.map((p) => p.preposition);
    let options: Preposition[] = [correctAnswer];
    let wrongOptionsCount: number = 3; 
    
    // Get exclusions for the correct answer
    const excluded = AMBIGUOUS_PAIRS[correctAnswer] || [];

    while (options.length < wrongOptionsCount + 1) {
        const randomPreposition = allPossiblePrepositions[Math.floor(Math.random() * allPossiblePrepositions.length)];
        
        // Only add if it's not already there AND not in the exclusion list
        if (!options.includes(randomPreposition) && !excluded.includes(randomPreposition)) {
            options.push(randomPreposition);
        }
    }
    return options.sort(() => Math.random() - 0.5);
};
