
import { GoogleGenAI } from "@google/genai";

// Fix: Initialized the GoogleGenAI client according to the coding guidelines by using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache Keys
const CACHE_KEY_VERSE = 'bbl_daily_verse_cache';
const CACHE_KEY_QUIZ = 'bbl_daily_quiz_cache';

// Helper to get cached data if it's from today
const getCachedData = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const { data, timestamp } = JSON.parse(item);
      const now = new Date();
      const cacheDate = new Date(timestamp);
      // Check if cache is from today (same date string)
      if (now.toDateString() === cacheDate.toDateString()) {
         return data;
      }
    }
  } catch (e) {
    console.warn("Cache read error", e);
  }
  return null;
};

// Helper to set cached data
const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn("Cache write error", e);
  }
};

export const getDailyVerse = async (): Promise<{ verse: string; reference: string; reflection: string }> => {
  // 1. Try Cache First
  const cached = getCachedData(CACHE_KEY_VERSE);
  if (cached) return cached;

  // 2. API Call with gemini-3-flash-preview for text tasks as per guidelines
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, inspiring Bible verse, its reference, and a very brief 1-sentence reflection for a student. Return as JSON with keys: verse, reference, reflection.",
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      // Cache the successful result
      setCachedData(CACHE_KEY_VERSE, data);
      return data;
    }
    throw new Error("No content");
  } catch (error) {
    // 3. Graceful Error Handling (Quota Exceeded / Network Error)
    console.warn("Gemini API unavailable (using fallback):", error);
    return {
      verse: "For I know the plans I have for you...",
      reference: "Jeremiah 29:11",
      reflection: "Trust in His timing and His plan."
    };
  }
};

export const getAIQuizQuestion = async (topic: string = 'General'): Promise<{ question: string; options: string[]; answer: string }> => {
  // 1. Try Cache First
  const cached = getCachedData(CACHE_KEY_QUIZ);
  if (cached) return cached;

  // 2. API Call with gemini-3-flash-preview
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a multiple choice bible quiz question about ${topic}. Return JSON with keys: question, options (array of 4 strings), answer (string matching one option).`,
      config: {
        responseMimeType: 'application/json'
      }
    });
     const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      setCachedData(CACHE_KEY_QUIZ, data);
      return data;
    }
    throw new Error("No content");
  } catch (e) {
    console.warn("Gemini API unavailable (using fallback):", e);
    return {
      question: "In the beginning, God created...?",
      options: ["The heavens and the earth", "Adam and Eve", "The sun and moon", "The oceans"],
      answer: "The heavens and the earth"
    };
  }
}
