// This is a simple, non-reactive store that exists outside of the React state
// and props system. Its purpose is to hold large data payloads (like base64
// image strings or Blob objects) that cause buggy development environments to crash when they
// try to serialize them from component state.

const imageCache = new Map<string, string>(); // Updated type to string

/**
 * Stores image data in the cache with a specific ID.
 * @param id A unique identifier for the image.
 * @param data The image data (base64 string for generated images, or a string URL for fallbacks).
 */
export const setImageData = (id: string, data: string): void => { // Updated type
  imageCache.set(id, data);
};

/**
 * Retrieves image data from the cache using its ID.
 * @param id The unique identifier for the image.
 * @returns The image data (string), or undefined if not found.
 */
export const getImageData = (id: string): string | undefined => { // Updated type
  return imageCache.get(id);
};

/**
 * Removes image data from the cache to prevent memory leaks.
 * @param id The unique identifier for the image to remove.
 */
export const clearImageData = (id: string): void => {
  imageCache.delete(id);
};