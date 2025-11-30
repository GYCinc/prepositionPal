import React from 'react';
import { motion, Variants } from 'framer-motion';
import { PrepositionCategory } from '../types';

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
};

const getCategoryIcon = (category: PrepositionCategory | null) => {
  const iconClass =
    'w-12 h-12 md:w-14 md:h-14 text-gray-400 group-hover:text-[#EF6035] transition-colors duration-300 drop-shadow-md';
  const activeIconClass = 'w-14 h-14 md:w-16 md:h-16 text-white drop-shadow-lg';

  if (category === null) {
    return (
      <svg className={activeIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    );
  }

  switch (category) {
    case PrepositionCategory.LOCATION: // Folded Map
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      );
    case PrepositionCategory.DIRECTION: // Signpost
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      );
    case PrepositionCategory.TIME: // Alarm Clock
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case PrepositionCategory.MANNER: // Magic Wand
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      );
    case PrepositionCategory.CAUSE: // Lightbulb
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      );
    case PrepositionCategory.POSSESSION: // Treasure Chest
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      );
    case PrepositionCategory.AGENT: // Robot
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      );
    case PrepositionCategory.FREQUENCY: // Cycle
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    case PrepositionCategory.INSTRUMENT: // Wrench/Tool
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    case PrepositionCategory.PURPOSE: // Target/Flag
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8H3zm0 0V5a2 2 0 012-2h14a2 2 0 012 2v8H5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 12a2 2 0 100-4 2 2 0 000 4z"
          />
        </svg>
      );
    default:
      return <div className="w-12 h-12 bg-gray-700 rounded-full" />;
  }
};

const CategorySelectionScreen = ({
  onSelectCategory,
}: {
  onSelectCategory: (category: PrepositionCategory | null) => void;
}) => (
  <div className="w-full">
    <motion.div
      variants={gridContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* All Categories */}
      <motion.button
        variants={gridItemVariants}
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectCategory(null)}
        className="group relative flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer
                       bg-gradient-to-br from-[#EF6035] to-[#D84A20]
                       shadow-[0_0_25px_rgba(239,96,53,0.3)] hover:shadow-[0_0_40px_rgba(239,96,53,0.6)]
                       transition-all duration-300 overflow-hidden border-2 border-orange-400/50 h-40"
      >
        <div className="z-10 flex flex-col items-center gap-4">
          {getCategoryIcon(null)}
          <span className="text-xl md:text-2xl text-white font-black uppercase tracking-tight leading-none drop-shadow-md text-center">
            All
            <br />
            Modules
          </span>
        </div>

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </motion.button>

      {Object.values(PrepositionCategory).map((category) => (
        <motion.button
          key={category}
          variants={gridItemVariants}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectCategory(category)}
          className="group relative flex flex-col justify-center items-center p-5 rounded-2xl cursor-pointer
                         bg-[#212229]/80 hover:bg-[#262730]/90 backdrop-blur-sm
                         border-2 border-white/20 hover:border-[#EF6035]
                         shadow-lg hover:shadow-[0_0_30px_rgba(239,96,53,0.2)] 
                         transition-all duration-200 h-40 overflow-hidden gap-4"
        >
          <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            {getCategoryIcon(category)}
          </div>

          <span className="text-lg md:text-lg text-gray-300 font-black leading-tight tracking-tight group-hover:text-white transition-colors text-center uppercase">
            {category}
          </span>
        </motion.button>
      ))}
    </motion.div>
  </div>
);

export default CategorySelectionScreen;
