
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptSegment } from "../types";

// Initialize AI client with the global API key. 
// Note: In a production Vercel environment, this is injected via Environment Variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getTranscriptionFromUrl = async (url: string, title: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a highly detailed, professional-grade transcript for the YouTube video titled "${title}" located at ${url}. 
      Use your search grounding tool to find the actual content or reliable transcriptions. 
      Format the output as a JSON array of segments. 
      Each segment should have: id (unique string), startTime (format MM:SS), speaker (e.g. Host, Guest), and text (the dialogue).
      Also provide a 2-paragraph executive summary of the video content.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["id", "startTime", "speaker", "text"]
              }
            }
          },
          required: ["summary", "segments"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as { summary: string; segments: TranscriptSegment[] };
  } catch (error) {
    console.error("Transcription service error:", error);
    throw error;
  }
};

export const refineTranscriptSegment = async (
  currentText: string, 
  videoContext: string,
  previousText?: string,
  nextText?: string
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `I am refining a specific segment of a video transcript to ensure high professional quality.
    
Video Context: "${videoContext}"
Previous Segment (for context): "${previousText || 'None'}"
Current Segment to Refine: "${currentText}"
Next Segment (for context): "${nextText || 'None'}"

Please correct any grammatical errors, spelling mistakes, or nonsensical word choices. Use the surrounding segments to ensure continuity and correct speaker transitions or references. 

Return ONLY the corrected text for the "Current Segment to Refine". Do not include the previous or next segments in your output.`,
  });
  return response.text;
};
