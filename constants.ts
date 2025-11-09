import { Preposition, PrepositionCategory, PrepositionItem, GameLevel } from './types';

export const ALL_PREPOSITIONS: PrepositionItem[] = [
  {
    preposition: Preposition.IN,
    category: PrepositionCategory.LOCATION,
    description: 'Used for an enclosed space, a large area, or a period of time.',
    exampleSentence: 'The cat is sleeping ___ the box.',
  },
  {
    preposition: Preposition.INTO,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement towards the inside of something.',
    exampleSentence: 'He walked ___ the room.',
  },
  {
    preposition: Preposition.TO,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for indicating direction or a destination.',
    exampleSentence: 'She went ___ the store.',
  },
  {
    preposition: Preposition.TOWARDS,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for indicating movement in the direction of something.',
    exampleSentence: 'The bird flew ___ the window.',
  },
  {
    preposition: Preposition.THROUGH,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement from one side of something to the other.',
    exampleSentence: 'The train passed ___ the tunnel.',
  },
  {
    preposition: Preposition.OUT_OF,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement from the inside to the outside.',
    exampleSentence: 'He stepped ___ the car.',
  },
  {
    preposition: Preposition.FROM,
    category: PrepositionCategory.DIRECTION,
    description: 'Used to indicate the starting point of a movement or origin.',
    exampleSentence: 'She came ___ Paris.',
  },
  {
    preposition: Preposition.AWAY_FROM,
    category: PrepositionCategory.DIRECTION,
    description: 'Used to indicate movement departing from something.',
    exampleSentence: 'The dog ran ___ the noisy crowd.',
  },
  {
    preposition: Preposition.ON,
    category: PrepositionCategory.LOCATION,
    description: 'Used for a surface, a day or date, or a public transport vehicle.',
    exampleSentence: 'The book is ___ the table.',
  },
  // Fix: Corrected property name from 'preposition' to 'category' and removed duplicate 'preposition' key.
  {
    category: PrepositionCategory.LOCATION,
    preposition: Preposition.AT,
    description: 'Used for a specific point, a small area, or a specific time.',
    exampleSentence: 'She is ___ home.',
  },
  {
    preposition: Preposition.AGAINST,
    category: PrepositionCategory.LOCATION,
    description: 'Used for touching something, often for support or resistance.',
    exampleSentence: 'He leaned ___ the wall.',
  },
  {
    preposition: Preposition.NEAR,
    category: PrepositionCategory.LOCATION,
    description: 'Used for a short distance from something.',
    exampleSentence: 'The park is ___ my house.',
  },
  {
    preposition: Preposition.BETWEEN,
    category: PrepositionCategory.LOCATION,
    description: 'Used for something in the space separating two distinct things.',
    exampleSentence: 'The ball is ___ the two chairs.',
  },
  {
    preposition: Preposition.AMONG,
    category: PrepositionCategory.LOCATION,
    description: 'Used for something in the middle of three or more distinct things.',
    exampleSentence: 'The rabbit hid ___ the bushes.',
  },
  {
    preposition: Preposition.UNDER,
    category: PrepositionCategory.LOCATION,
    description: 'Used for something directly below something else.',
    exampleSentence: 'The cat is ___ the bed.',
  },
  {
    preposition: Preposition.BELOW,
    category: PrepositionCategory.LOCATION,
    description: 'Used for something at a lower level than something else.',
    exampleSentence: 'The temperature is ___ freezing.',
  },
  {
    preposition: Preposition.BY,
    category: PrepositionCategory.ACTION_BY,
    description: 'Used to show the person or thing that does an action (in a passive sentence).',
    exampleSentence: 'The book was written ___ a famous author.',
  },
  {
    preposition: Preposition.AROUND,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement encircling something.',
    exampleSentence: 'The children ran ___ the tree.',
  },
  {
    preposition: Preposition.PAST,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement beyond something.',
    exampleSentence: 'He walked ___ the library.',
  },
  {
    preposition: Preposition.ACROSS,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement from one side of something to the other.',
    exampleSentence: 'They swam ___ the river.',
  },
  {
    preposition: Preposition.ALONG,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement in a line next to something long.',
    exampleSentence: 'We walked ___ the beach.',
  },
  {
    preposition: Preposition.UP,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement to a higher position.',
    exampleSentence: 'He climbed ___ the ladder.',
  },
  {
    preposition: Preposition.ABOVE,
    category: PrepositionCategory.LOCATION,
    description: 'Used for something at a higher level than something else, often not touching.',
    exampleSentence: 'The clouds are ___ the mountains.',
  },
  {
    preposition: Preposition.OVER,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement from one side to another, often implying an arch or covering.',
    exampleSentence: 'The bird flew ___ the fence.',
  },
  {
    preposition: Preposition.AFTER,
    category: PrepositionCategory.TIME,
    description: 'Used for following in time or order.',
    exampleSentence: 'Let\'s meet ___ dinner.',
  },
  {
    preposition: Preposition.WITHIN,
    category: PrepositionCategory.LOCATION,
    description: 'Used for inside the limits of something.',
    exampleSentence: 'The answer is ___ the text.',
  },
  {
    preposition: Preposition.INSIDE,
    category: PrepositionCategory.LOCATION,
    description: 'Used for the inner part or area of something.',
    exampleSentence: 'She keeps her keys ___ her purse.',
  },
  {
    preposition: Preposition.OFF,
    category: PrepositionCategory.DIRECTION,
    description: 'Used for movement away from a surface or position.',
    exampleSentence: 'The ball rolled ___ the table.',
  },
  {
    preposition: Preposition.BEHIND,
    category: PrepositionCategory.LOCATION,
    description: 'Used for at the back of something.',
    exampleSentence: 'The dog is hiding ___ the couch.',
  },
  {
    preposition: Preposition.BEFORE,
    category: PrepositionCategory.TIME,
    description: 'Used for earlier than, or in front of.',
    exampleSentence: 'Please finish your work ___ you play.',
  },
  {
    preposition: Preposition.BENEATH,
    category: PrepositionCategory.LOCATION,
    description: 'Used for in or to a lower position than, under.',
    exampleSentence: 'The treasure was buried ___ the old tree.',
  },
  {
    preposition: Preposition.BESIDE,
    category: PrepositionCategory.LOCATION,
    description: 'Used for next to or at the side of.',
    exampleSentence: 'He sat ___ her during the movie.',
  },
  {
    preposition: Preposition.WITH,
    category: PrepositionCategory.MANNER,
    description: 'Used for accompanied by, or using a tool.',
    exampleSentence: 'She painted the picture ___ a brush.',
  },
  {
    preposition: Preposition.BEYOND,
    category: PrepositionCategory.LOCATION,
    description: 'Used for on the far side of, or past.',
    exampleSentence: 'The mountains stretched ___ the horizon.',
  },
  {
    preposition: Preposition.UPON,
    category: PrepositionCategory.LOCATION,
    description: 'Used for on (often in a formal context).',
    exampleSentence: 'Once ___ a time, there was a princess.',
  },
];

export const PREPOSITION_FAMILIES: Record<string, Preposition[]> = {
  [PrepositionCategory.LOCATION]: [
    Preposition.IN, Preposition.ON, Preposition.AT, Preposition.NEAR, Preposition.BETWEEN,
    Preposition.AMONG, Preposition.UNDER, Preposition.BELOW, Preposition.ABOVE,
    Preposition.WITHIN, Preposition.INSIDE, Preposition.BEHIND, Preposition.BEFORE,
    Preposition.BENEATH, Preposition.BESIDE, Preposition.BEYOND, Preposition.UPON
  ],
  [PrepositionCategory.DIRECTION]: [
    Preposition.INTO, Preposition.TO, Preposition.TOWARDS, Preposition.THROUGH,
    Preposition.OUT_OF, Preposition.FROM, Preposition.AWAY_FROM, Preposition.AROUND,
    Preposition.PAST, Preposition.ACROSS, Preposition.ALONG, Preposition.UP, Preposition.OVER, Preposition.OFF
  ],
  [PrepositionCategory.TIME]: [
    Preposition.AFTER, Preposition.BEFORE, Preposition.IN, Preposition.ON, Preposition.AT
  ],
  [PrepositionCategory.MANNER]: [
    Preposition.WITH
  ],
  [PrepositionCategory.CAUSE]: [], // Could be expanded, e.g., 'because of'
  [PrepositionCategory.POSSESSION]: [], // Could be expanded, e.g., 'of'
  [PrepositionCategory.ACTION_BY]: [Preposition.BY],
};

// Fix: Redefine PREPOSITIONS_BY_LEVEL by defining arrays for each level sequentially
// to avoid "Block-scoped variable used before its declaration" errors.
const A1_PREPOSITIONS = [
  Preposition.IN, Preposition.ON, Preposition.AT, Preposition.TO, Preposition.FROM,
  Preposition.UNDER, Preposition.OVER, Preposition.BY, Preposition.WITH,
];

const A2_PREPOSITIONS = [
  ...A1_PREPOSITIONS,
  Preposition.INTO, Preposition.THROUGH, Preposition.NEAR, Preposition.ABOVE,
  Preposition.AFTER, Preposition.BEFORE, Preposition.BESIDE, Preposition.OFF,
];

const B1_PREPOSITIONS = [
  ...A2_PREPOSITIONS,
  Preposition.AMONG, Preposition.AROUND, Preposition.PAST, Preposition.ACROSS,
  Preposition.ALONG, Preposition.UP, Preposition.BEHIND, Preposition.INSIDE,
];

const B2_PREPOSITIONS = [
  ...B1_PREPOSITIONS,
  Preposition.OUT_OF, Preposition.TOWARDS, Preposition.AWAY_FROM, Preposition.BELOW,
  Preposition.WITHIN, Preposition.BENEATH,
];

const C1_PREPOSITIONS = [
  ...B2_PREPOSITIONS,
  Preposition.AGAINST, Preposition.BEYOND, Preposition.UPON,
];

const C2_PREPOSITIONS = [
  ...C1_PREPOSITIONS,
  // All remaining, highly nuanced, or idiomatic prepositions
  // (Ensure ALL_PREPOSITIONS are covered by C2 in practice)
];

export const PREPOSITIONS_BY_LEVEL: Record<GameLevel, Preposition[]> = {
  [GameLevel.A1]: A1_PREPOSITIONS,
  [GameLevel.A2]: A2_PREPOSITIONS,
  [GameLevel.B1]: B1_PREPOSITIONS,
  [GameLevel.B2]: B2_PREPOSITIONS,
  [GameLevel.C1]: C1_PREPOSITIONS,
  [GameLevel.C2]: C2_PREPOSITIONS,
};
