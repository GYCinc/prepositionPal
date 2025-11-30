import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Button from './Button';

const pageVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

export const AboutSection = ({ onBack }: { onBack: () => void }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="w-full max-w-3xl mx-auto bg-[#212229]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
  >
    <h2 className="text-4xl font-black text-[#EF6035] mb-6 font-display">About PrepositionPal</h2>
    <div className="space-y-4 text-gray-300 font-body leading-relaxed text-xl">
      <p>
        Welcome, intrepid language adventurer! You've stumbled upon PrepositionPal. We believe
        learning English prepositions shouldn't feel like deciphering ancient hieroglyphs.
      </p>
      <p>
        Our sophisticated AI (Gemini) crafts unique sentences and vivid images to burn those pesky
        prepositions into your linguistic memory. Every 5th question, we generate a unique video to
        test your skills in motion!
      </p>
    </div>
    <div className="mt-10">
      <Button
        onClick={onBack}
        className="bg-gray-800 hover:bg-gray-700 text-white py-4 px-8 rounded-xl text-lg font-bold"
      >
        Back to Settings
      </Button>
    </div>
  </motion.div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        className="flex justify-between items-center w-full text-left py-5 px-2 focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold text-xl text-gray-200 group-hover:text-[#EF6035] transition-colors font-display">
          {question}
        </h3>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-6 h-6 text-gray-500 group-hover:text-[#EF6035]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M19 9l-7 7-7-7"
          ></path>
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 px-2 text-gray-400 font-body leading-relaxed text-lg">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FaqSection = ({ onBack }: { onBack: () => void }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="w-full max-w-3xl mx-auto bg-[#212229]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
  >
    <h2 className="text-4xl font-black text-[#EF6035] mb-8 font-display text-center">FAQ</h2>
    <div className="space-y-2">
      <FaqItem
        question="How does PrepositionPal know which prepositions to use?"
        answer="Our AI, Gemini, has been extensively trained on a vast ocean of English text. It's exceptionally good at spotting patterns and predicting the most natural preposition for any given context."
      />
      <FaqItem
        question="Why do some images look a little... quirky?"
        answer="Ah, the artistic license of AI! While Gemini strives for photorealism, occasionally it's still figuring out the difference between 'a dog on a unicycle' and 'a unicycle on a dog.'"
      />
      <FaqItem
        question="What is the 'Special Video Round'?"
        answer="Every 5th question, we use Veo to generate a short video instead of a static image. This helps you see prepositions in action! These videos are cached so we don't have to make them twice."
      />
    </div>
    <div className="mt-10 flex justify-center">
      <Button
        onClick={onBack}
        className="bg-gray-800 hover:bg-gray-700 text-white py-4 px-10 rounded-xl text-lg font-bold"
      >
        Back
      </Button>
    </div>
  </motion.div>
);
