import React, { useRef, useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getImageData } from '../services/imageStore';

// Worker code is inlined to avoid cross-origin issues.
// Updated to use "Blur-Contain" logic:
// 1. Draw the image scaled to COVER the canvas, apply heavy blur and darken.
// 2. Draw the image scaled to CONTAIN within the canvas, centered.
const workerCode = `
const base64ToBlob = (base64, mimeType = 'image/png') => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

self.onmessage = async (e) => {
  const { canvas, imageDataString, width, height, devicePixelRatio } = e.data;
  const context = canvas.getContext('2d');

  // Set canvas dimensions based on DPR
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  
  // Reset transform for drawing
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  try {
    if (!imageDataString) throw new Error('No image data string provided.');

    let imageBitmap;
    if (imageDataString.startsWith('http')) {
      const response = await fetch(imageDataString);
      if (!response.ok) throw new Error(\`Failed to fetch: \${response.statusText}\`);
      const blob = await response.blob();
      imageBitmap = await createImageBitmap(blob);
    } else {
      const blob = base64ToBlob(imageDataString, 'image/png');
      imageBitmap = await createImageBitmap(blob);
    }
    
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = imageBitmap.width;
    const ih = imageBitmap.height;
    const canvasAspect = cw / ch;
    const imageAspect = iw / ih;

    // --- LAYER 1: BACKGROUND (Blurred & Darkened Cover) ---
    // We calculate 'cover' dimensions for the background
    let bgW, bgH, bgX, bgY;
    if (imageAspect > canvasAspect) {
        bgH = ch;
        bgW = bgH * imageAspect;
        bgX = (cw - bgW) / 2;
        bgY = 0;
    } else {
        bgW = cw;
        bgH = bgW / imageAspect;
        bgX = 0;
        bgY = (ch - bgH) / 2;
    }

    // Draw background image
    context.filter = 'blur(20px) brightness(0.4)';
    context.drawImage(imageBitmap, bgX, bgY, bgW, bgH);
    context.filter = 'none'; // Reset filter

    // --- LAYER 2: FOREGROUND (Sharp Contain) ---
    // We calculate 'contain' dimensions for the main image
    let fgW, fgH, fgX, fgY;
    if (imageAspect > canvasAspect) {
        // Image is wider than canvas: fit to width
        fgW = cw;
        fgH = fgW / imageAspect;
        fgX = 0;
        fgY = (ch - fgH) / 2;
    } else {
        // Image is taller than canvas: fit to height
        fgH = ch;
        fgW = fgH * imageAspect;
        fgY = 0;
        fgX = (cw - fgW) / 2;
    }

    // Add a subtle drop shadow behind the main image for pop
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 10;

    context.drawImage(imageBitmap, fgX, fgY, fgW, fgH);

    imageBitmap.close();
    self.postMessage({ type: 'loaded' });

  } catch (error) {
    console.error('Worker render error:', error);
    self.postMessage({ type: 'error', message: error.message });
  }
};
`;

interface CanvasImageDisplayProps {
  imageId: string | undefined;
  alt: string;
}

const CanvasImageDisplay: React.FC<CanvasImageDisplayProps> = ({ imageId, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerUrlRef.current = URL.createObjectURL(blob);

    return () => {
      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current);
        workerUrlRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    if (!imageId || !canvasRef.current || !workerUrlRef.current) {
      setIsLoading(false);
      return;
    }

    const imageDataString = getImageData(imageId);
    if (!imageDataString) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const offscreenCanvas = canvasRef.current.transferControlToOffscreen();
      const worker = new Worker(workerUrlRef.current);
      workerRef.current = worker;

      worker.postMessage(
        {
          canvas: offscreenCanvas,
          imageDataString: imageDataString,
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        [offscreenCanvas]
      );

      worker.onmessage = (e) => {
        if (e.data.type === 'loaded') setIsLoading(false);
        else if (e.data.type === 'error') setIsLoading(false);
      };
      worker.onerror = () => setIsLoading(false);
    } catch (error) {
      console.error('Failed to setup OffscreenCanvas:', error);
      setIsLoading(false);
    }
  }, [imageId]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <LoadingSpinner />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        aria-label={alt}
        role="img"
      />
    </div>
  );
};

export default CanvasImageDisplay;
