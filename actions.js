'use server'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { kv } from "@vercel/kv";
import Papa from "papaparse";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Natural Language Parser
export async function parseQuery(input) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Convert this search into JSON: "${input}". 
  Keys: genre (Legal Thriller, Political Thriller, Historical Fiction, or null), 
  identity (male, female, trans, other, or null), 
  timeframe (5, 10, 20, 30, or null), 
  seriesOnly (boolean). Return ONLY JSON.`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().replace(/```json|```/g, ""));
}

// 2. The Recommendation Engine
export async function getBooks(query, filters, userId = "user_1") {
  const userHistory = await kv.smembers(`history:${userId}`) || [];
  
  // Fetch from Google Books API for raw candidates
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:${filters.genre || 'fiction'}&maxResults=15`);
  const data = await res.json();
  
  const candidates = data.items?.map(b => ({
    title: b.volumeInfo.title,
    author: b.volumeInfo.authors?.[0],
    description: b.volumeInfo.description,
    published: b.volumeInfo.publishedDate,
    isbn: b.volumeInfo.industryIdentifiers?.[0]?.identifier
  })) || [];

  // Use Gemini to Filter & Rank based on your "Advanced Criteria"
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Rank these books for a user wanting: ${query}. 
  Filters: ${JSON.stringify(filters)}. 
  Exclude these already read: ${userHistory.join(", ")}.
  Return a JSON array of top 5 with keys: title, author, isbn, reason (1 sentence why it matches identity/series/timeframe), isFirstInSeries (bool).
  Books: ${JSON.stringify(candidates)}`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().replace(/```json|```/g, ""));
}

// 3. CSV History Importer
export async function importHistory(csvText, userId = "user_1") {
  const parsed = Papa.parse(csvText, { header: true });
  const titleKey = Object.keys(parsed.data[0]).find(k => /title/i.test(k));
  const titles = parsed.data.map(r => r[titleKey]).filter(Boolean);
  await kv.sadd(`history:${userId}`, ...titles);
  return titles.length;
}