import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { generateVideo } from '../services/geminiService';

interface VideoGeneratorProps {
  onBack: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const url = await generateVideo(prompt, aspectRatio);
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ethereal-border">
        <div className="bg-gray-50 dark:bg-gray-700 py-4 px-6 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display uppercase tracking-wider">
            Veo Video Studio
          </h2>
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe the video you want to create
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars..."
              className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-32"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <div className="flex gap-4">
              <label
                className={`flex-1 cursor-pointer p-4 rounded-lg border-2 transition-all ${aspectRatio === '16:9' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <input
                  type="radio"
                  name="aspectRatio"
                  value="16:9"
                  checked={aspectRatio === '16:9'}
                  onChange={() => setAspectRatio('16:9')}
                  className="sr-only"
                  disabled={loading}
                />
                <div className="text-center">
                  <div className="mx-auto w-12 h-7 border-2 border-gray-400 dark:border-gray-500 rounded mb-2 bg-gray-200 dark:bg-gray-800"></div>
                  <span className="font-bold text-gray-900 dark:text-white">16:9</span>
                  <p className="text-xs text-gray-500">Landscape</p>
                </div>
              </label>
              <label
                className={`flex-1 cursor-pointer p-4 rounded-lg border-2 transition-all ${aspectRatio === '9:16' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <input
                  type="radio"
                  name="aspectRatio"
                  value="9:16"
                  checked={aspectRatio === '9:16'}
                  onChange={() => setAspectRatio('9:16')}
                  className="sr-only"
                  disabled={loading}
                />
                <div className="text-center">
                  <div className="mx-auto w-7 h-12 border-2 border-gray-400 dark:border-gray-500 rounded mb-2 bg-gray-200 dark:bg-gray-800"></div>
                  <span className="font-bold text-gray-900 dark:text-white">9:16</span>
                  <p className="text-xs text-gray-500">Portrait</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <LoadingSpinner message="Generating your video with Veo (this may take a minute)..." />
            </div>
          ) : videoUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-800 bg-black relative">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto max-h-[600px] mx-auto"
                />
              </div>
              <Button onClick={() => setVideoUrl(null)}>Create Another</Button>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={!prompt.trim()}>
              Generate Video
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoGenerator;
