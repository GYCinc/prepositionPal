
import { Preposition, PrepositionCategory, PrepositionItem, GameLevel } from './types';

export const STUDENT_ROSTER = [
  { id: '744fe539-383e-4862-837f-2788662bdaf4', username: 'aarontutor' },
  { id: '3ad44160-b80e-4222-a28d-b1475eff7453', username: 'andrea-always-aims-above-average-2026' },
  { id: '55b773b9-ce9d-45f9-a25a-f16641289f00', username: 'carlos-premium-english-2025' },
  { id: '1a81b7e1-ffc6-48f9-8d08-4c35d389ea88', username: 'david-saves-snacks-2025' },
  { id: 'ed3b3507-2791-4c44-b01a-0442079e4741', username: 'edwin-enjoys-every-english-exam-2026' },
  { id: '244ef8ff-e7d6-400a-8dc6-3cb187ff92c4', username: 'francisco-finds-five-funny-facts-2026' },
  { id: '0f77a40d-cdbc-4070-b22a-3cf06098b367', username: 'jocelyn-explains-meeting-mania-2026' },
  { id: '11aaf099-5bba-4bc0-a178-78103a4ee341', username: 'kyrylo-keeps-kicking-knowledge-keys-2026' },
  { id: 'bd3d38ae-803c-481a-b92d-9535d2c98b40', username: 'maarten-makes-many-major-moves-2026' },
  { id: 'eae95969-fd97-4e50-afd3-d6a4ec5b4eab', username: 'matias-masters-many-magic-maps-2026' },
  { id: '2850da05-4a71-4905-801e-e61a3b93a292', username: 'nicolas-never-needs-new-notes-2026' },
  { id: 'bd300c0f-1bb3-4900-9c45-846db6670b49', username: 'norbert-never-naps-near-noon-2026' },
  { id: '2ff6b298-6918-4616-9cb9-0a89f38172c7', username: 'ruslan-rarely-runs-round-rooms-2026' },
  { id: '35c0221b-b9ec-440f-9712-1583680a89d7', username: 'sergio-sees-seven-super-stars-2026' },
  { id: 'e5c2edf5-0a18-4ace-8c2d-a570e43e1837', username: 'test' }
];

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
    category: PrepositionCategory.AGENT,
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
    category: PrepositionCategory.INSTRUMENT,
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
  {
    preposition: Preposition.PER,
    category: PrepositionCategory.FREQUENCY,
    description: 'Used to express rates, prices, or measurements for each unit.',
    exampleSentence: 'The car was traveling 60 miles ___ hour.',
  },
  {
    preposition: Preposition.FOR,
    category: PrepositionCategory.PURPOSE,
    description: 'Used to indicate the use of something or the reason for something.',
    exampleSentence: 'This gift is ___ you.',
  },
];

export const PREPOSITION_DETAILS: Record<string, string> = {
  [Preposition.IN]: "Used to indicate inclusion within space, a place, or limits.",
  [Preposition.INTO]: "Movement or action with the result that something becomes enclosed.",
  [Preposition.TO]: "Expresses motion in the direction of a particular location.",
  [Preposition.TOWARDS]: "Movement in the direction of someone or something.",
  [Preposition.THROUGH]: "Moving in one side and out of the other side.",
  [Preposition.OUT_OF]: "From the inside to the outside of something.",
  [Preposition.FROM]: "Indicates the starting point of motion or origin.",
  [Preposition.AWAY_FROM]: "Moving to a greater distance from something.",
  [Preposition.ON]: "Physically in contact with and supported by a surface.",
  [Preposition.AT]: "Expresses a specific location, arrival point, or time.",
  [Preposition.AGAINST]: "In contact or collision with; in opposition to.",
  [Preposition.NEAR]: "At or to a short distance away; not far.",
  [Preposition.BETWEEN]: "In the space separating two distinct objects or points.",
  [Preposition.AMONG]: "Surrounded by or in the middle of a group.",
  [Preposition.UNDER]: "Extending or directly below something.",
  [Preposition.BELOW]: "At a lower level or layer than something else.",
  [Preposition.BY]: "Identifying the agent performing an action; close to.",
  [Preposition.AROUND]: "Located or moving on every side of something.",
  [Preposition.PAST]: "To or on the further side of something.",
  [Preposition.ACROSS]: "From one side to the other of a clear boundary.",
  [Preposition.ALONG]: "Moving in a constant direction on a long surface.",
  [Preposition.UP]: "Towards a higher place or position.",
  [Preposition.ABOVE]: "In extended space over and not touching.",
  [Preposition.OVER]: "Extending directly upwards from; covering.",
  [Preposition.AFTER]: "In the time following an event.",
  [Preposition.WITHIN]: "Inside the limits or boundaries of.",
  [Preposition.INSIDE]: "Situated within the inner part of.",
  [Preposition.OFF]: "Moving away and often down from a place.",
  [Preposition.BEHIND]: "At the back of something, often hidden by it.",
  [Preposition.BEFORE]: "During the period of time preceding an event.",
  [Preposition.BENEATH]: "Extending or directly underneath (more formal).",
  [Preposition.BESIDE]: "At the side of; next to.",
  [Preposition.WITH]: "Using an instrument or tool; or accompanied by.",
  [Preposition.BEYOND]: "At or to the further side of; outside the limits.",
  [Preposition.UPON]: "A more formal or emphatic term for 'on'.",
  [Preposition.PER]: "For each; for every (used to express rates).",
  [Preposition.FOR]: "Used to indicate the purpose or recipient of something.",
};

export const PREPOSITION_FAMILIES: Record<string, Preposition[]> = {
  [PrepositionCategory.LOCATION]: [
    Preposition.ON, Preposition.AT, Preposition.NEAR, Preposition.BETWEEN,
    Preposition.AMONG, Preposition.UNDER, Preposition.BELOW, Preposition.ABOVE,
    Preposition.BEHIND, Preposition.BEFORE, Preposition.IN, Preposition.INSIDE, Preposition.WITHIN,
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
  [PrepositionCategory.MANNER]: [], 
  [PrepositionCategory.CAUSE]: [], 
  [PrepositionCategory.POSSESSION]: [], 
  [PrepositionCategory.AGENT]: [Preposition.BY],
  [PrepositionCategory.FREQUENCY]: [Preposition.PER],
  [PrepositionCategory.INSTRUMENT]: [Preposition.WITH],
  [PrepositionCategory.PURPOSE]: [Preposition.FOR],
};

// 10-Level Redistribution for Game Logic (mapped from 1-36 via App.tsx)
export const PREPOSITIONS_BY_LEVEL: Record<GameLevel, Preposition[]> = {
  [GameLevel.Level_1]: [Preposition.IN, Preposition.ON, Preposition.AT, Preposition.TO], // A1
  [GameLevel.Level_2]: [Preposition.FROM, Preposition.UP, Preposition.WITH, Preposition.BY, Preposition.FOR], // A1.5
  [GameLevel.Level_3]: [Preposition.UNDER, Preposition.OVER, Preposition.FOR], // A2
  [GameLevel.Level_4]: [Preposition.BEFORE, Preposition.AFTER, Preposition.NEAR], // A2.5
  [GameLevel.Level_5]: [Preposition.BEHIND, Preposition.INTO, Preposition.OFF], // B1
  [GameLevel.Level_6]: [Preposition.BETWEEN, Preposition.AMONG, Preposition.AROUND], // B1.5
  [GameLevel.Level_7]: [Preposition.THROUGH, Preposition.ACROSS, Preposition.ALONG], // B2
  [GameLevel.Level_8]: [Preposition.PAST, Preposition.INSIDE, Preposition.TOWARDS], // B2.5
  [GameLevel.Level_9]: [Preposition.OUT_OF, Preposition.ABOVE, Preposition.BELOW, Preposition.WITHIN], // C1
  [GameLevel.Level_10]: [Preposition.BENEATH, Preposition.BESIDE, Preposition.AGAINST, Preposition.BEYOND, Preposition.UPON, Preposition.PER], // C1.5
};

// 36 Ranks - Professional Proficiency Tiering
export const LEVEL_TITLES: string[] = [
  "Novice I", "Novice II", "Novice III", "Novice IV",
  "Beginner I", "Beginner II", "Beginner III", "Beginner IV",
  "Competent I", "Competent II", "Competent III", "Competent IV",
  "Intermediate I", "Intermediate II", "Intermediate III", "Intermediate IV",
  "Proficient I", "Proficient II", "Proficient III", "Proficient IV",
  "Advanced I", "Advanced II", "Advanced III", "Advanced IV",
  "Expert I", "Expert II", "Expert III", "Expert IV",
  "Master I", "Master II", "Master III", "Master IV",
  "Legend I", "Legend II", "Legend III", "Legend IV"
];
