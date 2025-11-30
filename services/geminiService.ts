import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { getCachedVideo, cacheVideo, getCachedAudio, cacheAudio } from './dbService';

const getGeminiClient = () => {
  // Always create a new instance to ensure the latest API key is used
  // in case the user changes it via window.aistudio.openSelectKey()
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateText = async (
  prompt: string,
  model: string = 'gemini-2.5-flash'
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _modelUsed = model;
  try {
    const ai = getGeminiClient();

    // Initialize config object
    const config: any = {};

    // Apply thinking config for 'gemini-2.5-flash' as requested.
    // The effective token limit for the response is `maxOutputTokens` minus the `thinkingBudget`.
    // In this case: 200 - 100 = 100 tokens available for the final response,
    // which is sufficient for generating sentences and short explanations.
    if (model === 'gemini-2.5-flash') {
      config.maxOutputTokens = 200;
      config.thinkingConfig = { thinkingBudget: 100 };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined, // Only include config if it has properties
    });
    return response.text || '';
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

/**
 * Generates text using Google Search grounding.
 * This function should be used for queries that relate to recent events, news, or up-to-date information.
 * As per guidelines, if Google Search is used, extracted URLs from grounding chunks MUST ALWAYS be listed in the UI.
 * @param prompt The user's query that requires external search.
 * @param model The model to use (defaults to 'gemini-2.5-flash').
 * @returns An object containing the generated text and any relevant grounding URLs.
 */
export const generateSearchGroundedText = async (
  prompt: string,
  model: string = 'gemini-2.5-flash'
): Promise<{ text: string; groundingUrls: { uri: string; title?: string }[] }> => {
  try {
    const ai = getGeminiClient();

    const config: any = {
      tools: [{ googleSearch: {} }],
    };

    // Apply thinking config for 'gemini-2.5-flash' if it's the selected model
    if (model === 'gemini-2.5-flash') {
      // The effective token limit for the response is `maxOutputTokens` minus the `thinkingBudget`.
      // 200 - 100 = 100 tokens available for the final response.
      config.maxOutputTokens = 200;
      config.thinkingConfig = { thinkingBudget: 100 };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });

    const groundingUrls: { uri: string; title?: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingUrls.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      }
    }

    return {
      text: response.text || '',
      groundingUrls: groundingUrls,
    };
  } catch (error) {
    console.error('Error generating search-grounded text:', error);
    throw error;
  }
};

// Changed return type to Promise<string> - will return raw base64 data string (WITHOUT prefix) or a fallback URL string
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        // Return only the raw base64 data (without the mimeType prefix)
        return part.inlineData.data;
      }
    }
    throw new Error('No image found in the response.');
  } catch (error: any) {
    if (error.message && error.message.includes('Requested entity was not found.')) {
      console.warn('API key might be invalid or not selected. Prompting user to select key.');
      // Re-throw with a specific message that the UI can catch to trigger key selection
      throw new Error("API key selection initiated due to 'Requested entity was not found.'.");
    }
    console.error('Error generating image:', error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  // 1. Check persistent cache
  const cachedAudio = await getCachedAudio(text, voiceName);
  if (cachedAudio) {
    console.log('Using cached TTS audio');
    return cachedAudio;
  }

  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error('No audio data generated.');
    }

    // 2. Save to persistent cache
    await cacheAudio(text, voiceName, audioData);

    return audioData;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  onProgress?: (status: string) => void
): Promise<string> => {
  // 1. Check persistent cache
  if (onProgress) onProgress('Checking archives...');
  const cachedBlob = await getCachedVideo(prompt, aspectRatio);
  if (cachedBlob) {
    console.log('Using cached Veo video');
    return URL.createObjectURL(cachedBlob);
  }

  const ai = getGeminiClient();
  try {
    // 2. Initiate video generation
    if (onProgress) onProgress('Generating video: Step 1/3 - Scene Setup');
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Defaulting to 720p for preview speed
        aspectRatio: aspectRatio,
      },
    });

    // 3. Poll for completion
    // Note: Veo generation can take a moment.
    if (onProgress) onProgress('Generating video: Step 2/3 - Rendering');
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Poll every 3 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error('Video generation completed but no URI returned.');
    }

    // 4. Fetch the actual video bytes using the API Key
    // The URI requires the API key appended to it.
    if (onProgress) onProgress('Generating video: Step 3/3 - Finalizing');
    const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();

    // 5. Save to persistent cache
    await cacheVideo(prompt, aspectRatio, blob);

    return URL.createObjectURL(blob); // Return a locally accessible Blob URL
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
};
