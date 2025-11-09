import React, { useRef, useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getImageData } from '../services/imageStore';

// Worker code is now inlined as a string to create a Blob URL, solving cross-origin issues.
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

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  context?.scale(devicePixelRatio, devicePixelRatio);

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  try {
    if (!context) throw new Error('Could not get 2D context from canvas in worker.');
    if (!imageDataString) throw new Error('No image data string provided to worker.');

    let imageBitmap;

    if (imageDataString.startsWith('http')) {
      const response = await fetch(imageDataString);
      if (!response.ok) throw new Error(\`Failed to fetch image from URL: \${response.statusText}\`);
      const blob = await response.blob();
      imageBitmap = await createImageBitmap(blob);
    } else {
      const blob = base64ToBlob(imageDataString, 'image/png');
      imageBitmap = await createImageBitmap(blob);
    }
    
    // Fill background to avoid transparent letterboxing
    context.fillStyle = '#17181C'; // background-dark
    context.fillRect(0, 0, canvas.width, canvas.height);

    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = imageBitmap.width / imageBitmap.height;
    let drawWidth, drawHeight, x, y;

    // 'cover' behavior: fill the canvas, cropping the image if necessary
    if (imageAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imageAspect;
        y = 0;
        x = (canvas.width - drawWidth) / 2;
    } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imageAspect;
        x = 0;
        y = (canvas.height - drawHeight) / 2;
    }

    context.drawImage(imageBitmap, x, y, drawWidth, drawHeight);
    imageBitmap.close();

    self.postMessage({ type: 'loaded' });
  } catch (error) {
    console.error('Error rendering image in worker:', error);
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    self.postMessage({ type: 'error', message: error.message || 'Unknown worker error' });
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

  // Effect to create and cleanup the worker's Blob URL.
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

  // Effect to manage the worker instance based on imageId.
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

      worker.postMessage({
        canvas: offscreenCanvas,
        imageDataString: imageDataString,
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
        devicePixelRatio: window.devicePixelRatio
      }, [offscreenCanvas]);

      worker.onmessage = (e) => {
        if (e.data.type === 'loaded') setIsLoading(false);
        else if (e.data.type === 'error') setIsLoading(false);
      };
      worker.onerror = () => setIsLoading(false);

    } catch (error) {
      console.error("Failed to setup OffscreenCanvas or Worker:", error);
      setIsLoading(false);
    }
    
  }, [imageId]);

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-900 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10">
          <LoadingSpinner />
        </div>
      )}
       <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        aria-label={alt}
        role="img"
       ></canvas>
    </div>
  );
};

export default CanvasImageDisplay;