
import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getImageData } from '../services/imageStore';

interface CanvasImageDisplayProps {
  imageId: string | undefined;
  alt: string;
}

const CanvasImageDisplay: React.FC<CanvasImageDisplayProps> = ({ imageId, alt }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset state when imageId changes
    setLoading(true);
    setError(false);
    setImageSrc(null);

    if (!imageId) {
        setLoading(false);
        return;
    }

    // Attempt to retrieve image data from the store
    const data = getImageData(imageId);
    
    if (data) {
        // Check if it's already a URL (e.g. fallback picsum) or a full data URI
        if (data.startsWith('http') || data.startsWith('data:')) {
            setImageSrc(data);
        } else {
            // It's raw base64 from Gemini, prepend standard png header
            setImageSrc(`data:image/png;base64,${data}`);
        }
        // Note: loading state will be cleared by the img.onLoad handler
    } else {
        // Data not found in store (e.g. after refresh clears memory cache)
        console.warn(`Image data not found for ID: ${imageId}`);
        setError(true);
        setLoading(false);
    }
  }, [imageId]);

  if (!imageId) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center text-gray-600">
            <span>No Image</span>
        </div>
      );
  }

  return (
    <div className="w-full h-full bg-black relative overflow-hidden select-none group">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <LoadingSpinner />
        </div>
      )}

      {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-[#111] p-4 text-center">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium opacity-60">Image unavailable</p>
          </div>
      ) : imageSrc && (
        <>
            {/* Blurred Background Layer (Fill) for ambient effect */}
            <img 
                src={imageSrc} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110" 
                aria-hidden="true"
            />
            
            {/* Sharp Foreground Layer (Contain) */}
            <img 
                src={imageSrc} 
                alt={alt} 
                className={`relative z-10 w-full h-full object-contain transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    console.error("Image failed to render");
                    setError(true);
                    setLoading(false);
                }}
            />
        </>
      )}
    </div>
  );
};

export default CanvasImageDisplay;
