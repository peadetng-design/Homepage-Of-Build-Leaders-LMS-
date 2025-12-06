import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getDailyVerse = async (): Promise<{ verse: string; reference: string; reflection: string }> => {
  if (!apiKey) {
    return {
      verse: "Thy word is a lamp unto my feet, and a light unto my path.",
      reference: "Psalm 119:105",
      reflection: "God's word guides us through the darkness."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, inspiring Bible verse, its reference, and a very brief 1-sentence reflection for a student. Return as JSON with keys: verse, reference, reflection.",
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No content");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      verse: "For I know the plans I have for you...",
      reference: "Jeremiah 29:11",
      reflection: "Trust in His timing and His plan."
    };
  }
};

export const getAIQuizQuestion = async (topic: string = 'General'): Promise<{ question: string; options: string[]; answer: string }> => {
  if (!apiKey) {
    return {
      question: "Who was swallowed by a great fish?",
      options: ["Jonah", "Moses", "David", "Peter"],
      answer: "Jonah"
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a multiple choice bible quiz question about ${topic}. Return JSON with keys: question, options (array of 4 strings), answer (string matching one option).`,
      config: {
        responseMimeType: 'application/json'
      }
    });
     const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No content");
  } catch (e) {
    return {
      question: "In the beginning, God created...?",
      options: ["The heavens and the earth", "Adam and Eve", "The sun and moon", "The oceans"],
      answer: "The heavens and the earth"
    };
  }
}
