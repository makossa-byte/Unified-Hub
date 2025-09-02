
import { GoogleGenAI, Type } from "@google/genai";
import type { AIAnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      priority: {
        type: Type.STRING,
        description: "Categorize the message as 'High Priority', 'Normal', or 'Low Priority'.",
        enum: ["High Priority", "Normal", "Low Priority"],
      },
      summary: {
        type: Type.STRING,
        description: "A concise, one-sentence summary of the message.",
      },
      replies: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "Suggest three short, actionable, and context-aware quick replies.",
      },
    },
    required: ["priority", "summary", "replies"],
  };


export const analyzeMessage = async (messageText: string): Promise<AIAnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API key not configured.");
  }

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following message and provide a priority, a summary, and three suggested replies. Message: "${messageText}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonString = response.text;
    const parsedResult = JSON.parse(jsonString);
    
    // Basic validation
    if (parsedResult.priority && parsedResult.summary && Array.isArray(parsedResult.replies)) {
        return parsedResult as AIAnalysisResult;
    } else {
        throw new Error("Invalid format received from AI.");
    }

  } catch (error) {
    console.error("Error analyzing message with Gemini API:", error);
    throw new Error("Failed to get AI analysis. Please check your API key and network connection.");
  }
};

export const translateMessage = async (text: string, targetLanguage: string = 'English'): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API key not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate the following text to ${targetLanguage}. Provide only the translated text, without any additional commentary or phrases like "Here is the translation:": "${text}"`,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error translating message with Gemini API:", error);
    throw new Error("Failed to translate message. Please check your API key and network connection.");
  }
};
