
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { STUDENT_ROSTER } from '../constants';

interface LoginModalProps {
  onLogin: (username: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    // Validate against the roster source of truth
    const isValidUser = STUDENT_ROSTER.some(student => student.username === trimmed);
    
    if (isValidUser) {
      onLogin(trimmed);
    } else {
      setError('Invalid access code. Please check your username.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-dark-accent-1 border border-white/10 p-8 rounded-20px shadow-2xl"
      >
        <h2 className="text-3xl font-black text-[#EF6035] font-display mb-6 text-center">
          Student Access
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-bold text-gray-400 uppercase tracking-wider mb-2">
              Enter Access Code
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              className="w-full bg-[#1a1b23] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:border-[#EF6035] focus:ring-1 focus:ring-[#EF6035] outline-none transition-all"
              placeholder="username-2026"
              autoFocus
            />
            {error && <p className="text-red-500 text-base mt-2 font-medium animate-pulse">{error}</p>}
          </div>
          <Button type="submit">Begin Session</Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginModal;
