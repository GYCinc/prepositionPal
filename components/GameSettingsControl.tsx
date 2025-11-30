import React from 'react';
import { GameLevel } from '../types';

interface GameSettingsControlProps {
  gameLevel: GameLevel;
  numericGameLevel: number;
  setNumericGameLevel: (level: number) => void;
  humorLabel: string;
  humorLevel: number;
  setHumorLevel: (level: number) => void;
}

const GameSettingsControl: React.FC<GameSettingsControlProps> = ({
  gameLevel,
  numericGameLevel,
  setNumericGameLevel,
  humorLabel,
  humorLevel,
  setHumorLevel,
}) => {
  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Difficulty */}
      <div className="bg-[#1a1b23] px-8 py-6 rounded-3xl border-l-8 border-[#EF6035] flex flex-col justify-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-end mb-4">
          <div>
            <h3 className="text-[#EF6035] text-2xl font-black uppercase tracking-wide font-display drop-shadow-md">
              Difficulty
            </h3>
            <p className="text-gray-400 text-sm font-medium mt-1">Select your proficiency</p>
          </div>
          <span className="text-4xl font-black text-white font-display">{gameLevel}</span>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <span className="text-base font-bold text-white uppercase tracking-wide drop-shadow-sm">
            1
          </span>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={numericGameLevel}
            onChange={(e) => setNumericGameLevel(parseInt(e.target.value, 10))}
            className="w-full h-4 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#EF6035] hover:accent-[#ff7e55] transition-all"
          />
          <span className="text-base font-bold text-white uppercase tracking-wide drop-shadow-sm">
            10
          </span>
        </div>
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF6035]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      </div>

      {/* Tone */}
      <div className="bg-[#1a1b23] px-8 py-6 rounded-3xl border-l-8 border-purple-500 flex flex-col justify-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-end mb-4">
          <div>
            <h3 className="text-purple-400 text-2xl font-black uppercase tracking-wide font-display drop-shadow-md">
              Tone
            </h3>
            <p className="text-gray-400 text-sm font-medium mt-1">Adjust AI personality</p>
          </div>
          <span className="text-4xl font-black text-white font-display">{humorLabel}</span>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <span className="text-base font-bold text-white uppercase tracking-wide drop-shadow-sm">
            Conservative
          </span>
          <input
            type="range"
            min="0"
            max="10"
            value={humorLevel}
            onChange={(e) => setHumorLevel(parseInt(e.target.value, 10))}
            className="w-full h-4 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
          />
          <span className="text-base font-bold text-white uppercase tracking-wide drop-shadow-sm">
            Witty
          </span>
        </div>
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default GameSettingsControl;
