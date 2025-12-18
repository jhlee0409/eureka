import { GoogleGenAI, Type } from "@google/genai";

export const refineSpecifications = async (rawText: string): Promise<string[]> => {
  if (!rawText || rawText.trim().length < 5) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
  const prompt = `Convert the following raw design specification into a clean, concise list of QA test cases or checklist items in Korean.
  Ensure the tone is professional and actionable for a QA engineer.
  Raw Text: "${rawText}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of checklist items in Korean."
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Gemini refinement failed", error);
  }

  return rawText.split('\n').filter(line => line.trim().length > 0);
};
