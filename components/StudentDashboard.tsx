import React from 'react';
import { UserProgress } from '../types';

const StudentDashboard = ({ progress }: { progress: UserProgress }) => (
  <div className="w-full max-w-6xl mx-auto mb-8">
    <div className="bg-[#1a1b23] p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              Student Record
            </span>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Last Active: {new Date(progress.lastPlayed).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white font-display mb-1">
            Level {progress.level}
          </h2>
          <p className="text-gray-400 font-medium">
            {progress.totalXP} XP Earned • {progress.questionsAnswered} Missions Completed
          </p>
        </div>

        <div className="flex gap-4 md:gap-8 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-3xl font-black text-[#EF6035]">{progress.currentStreak}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Current Streak
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-3xl font-black text-white">
              {progress.questionsAnswered > 0
                ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
                : 0}
              %
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Simple Progress Bar visual */}
      <div className="w-full h-2 bg-gray-800 rounded-full mt-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-[#EF6035]"
          style={{ width: `${progress.totalXP % 100}%` }}
        ></div>
      </div>
    </div>
  </div>
);

export default StudentDashboard;
