// utils/blobUtils.ts
// This utility is intended for use within a Web Worker.

/**
 * Converts a base64 string to a Blob object.
 * @param base64 The raw base64 string (without 'data:mimeType;base64,' prefix).
 * @param mimeType The MIME type of the data (e.g., 'image/png').
 * @returns A Blob object.
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};
