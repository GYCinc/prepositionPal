import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const getGeminiClient = () => {
  // Always create a new instance to ensure the latest API key is used
  // in case the user changes it via window.aistudio.openSelectKey()
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateText = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating text:', error);
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

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // Return only the raw base64 data (without the mimeType prefix)
        return part.inlineData.data;
      }
    }
    throw new Error('No image found in the response.');
  } catch (error: any) {
    if (error.message && error.message.includes("Requested entity was not found.")) {
      console.warn("API key might be invalid or not selected. Prompting user to select key.");
      // Re-throw with a specific message that the UI can catch to trigger key selection
      throw new Error("API key selection initiated due to 'Requested entity was not found.'.");
    }
    console.error('Error generating image:', error);
    throw error;
  }
};