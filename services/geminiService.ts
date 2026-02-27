import { GoogleGenAI, Type } from "@google/genai";
import { Source, ChartDataItem, DiscoveredAudience, ComparisonChartDataItem } from '../types';

const HTML_FORMAT_INSTRUCTION = "You MUST format your response using simple HTML tags (e.g., <strong> for bold, <ul> and <li> for lists, <br> for line breaks, <h3> for headings). Do not use markdown. Do not include <html> or <body> tags. Just send the formatted text content.";

const SYSTEM_INSTRUCTION_MARKET = `You are a friendly and professional market research analyst. Your audience is university students in India. Based only on the provided search results, provide a concise answer to the user's query. Start with a direct answer, then provide a brief summary. Do not add any preamble or conversational text. ${HTML_FORMAT_INSTRUCTION}`;
const SYSTEM_INSTRUCTION_AUDIENCE = `You are a market research analyst. The user is providing a detailed custom audience profile and a specific question about that profile. Using only the provided Google Search results, synthesize the information to answer their question about that specific audience. Be direct and data-driven. ${HTML_FORMAT_INSTRUCTION}`;
const SYSTEM_INSTRUCTION_CHARTS = "You are a market research analyst. The user will provide an audience profile and a research topic. Your job is to use Google Search to find real, verifiable data to answer their topic. You MUST format your entire response as a valid JSON array of objects. Do not include any text, markdown formatting, or explanations before or after the JSON. The JSON schema to follow is: an array of objects, where each object has two properties: a 'label' (string) which is the name of the data point, and a 'value' (string) which is the corresponding value. For example: [{\"label\": \"Instagram\", \"value\": \"85%\"}, {\"label\": \"YouTube\", \"value\": \"70%\"}]. Provide at least 3-5 data points if possible.";
const SYSTEM_INSTRUCTION_COMPARE_CHARTS = "You are a market research analyst. The user will provide two audience profiles and a single topic. Your job is to use Google Search to find data to compare both audiences on that topic. You MUST format your entire response as a valid JSON array of objects that strictly adheres to the provided schema. Do not include any text, markdown formatting, or explanations before or after the JSON. The JSON schema to follow is: an array of objects, where each object has three properties: 'label' (the shared data point), 'audienceA_value' (the value for the first audience), and 'audienceB_value' (the value for the second audience). For example: [{\"label\": \"Instagram\", \"audienceA_value\": \"75%\", \"audienceB_value\": \"68%\"}]. Provide at least 3-5 data points if possible.";
const SYSTEM_INSTRUCTION_DISCOVERY = "You are a senior market research analyst. The user will provide a general market. Your job is to use Google Search to find real, verifiable consumer segments or audiences within that market. You MUST format your entire response as a valid JSON array of objects that strictly adheres to the provided schema. Do not include any text, markdown formatting, or explanations before or after the JSON. Find 3-5 key segments. The JSON schema to follow is an array of objects, where each object has two properties: 'audienceName' (a concise name for the segment) and 'description' (a 1-2 sentence summary).";
const SYSTEM_INSTRUCTION_CAMPAIGN = `You are a creative marketing strategist specializing in the Indian market. The user will provide a detailed audience profile and a specific marketing goal. Your job is to use Google Search to find current trends, popular platforms, and relevant cultural insights. Based only on this data, generate 3 to 5 distinct marketing campaign ideas. For each idea, provide a catchy name, a 1-2 sentence concept, and the key channels to focus on (e.g., 'Instagram Reels', 'University Brand Ambassadors', 'YouTube Ads'). ${HTML_FORMAT_INSTRUCTION}`;
const SYSTEM_INSTRUCTION_CHAT = "You are not a helpful assistant. You are a living embodiment and persona of a specific consumer segment. Your only job is to answer questions from the perspective of that persona. Use 'I' and 'we' when you answer. DO NOT break character. DO NOT act like an AI. Base your answers only on the provided Google Search results, filtered through the lens of your persona's profile. You MUST format your response using simple HTML tags (e.g., <strong>, <p>, <ul>, <li>). Do not use markdown.";
const SYSTEM_INSTRUCTION_COMPARE = `You are a market research analyst. The user will provide two distinct audience profiles and a specific comparison question. Your job is to use Google Search to find data to answer the question for both audiences. You MUST present a direct, side-by-side comparison. Format your response using simple HTML. Use <h3> headings for 'Audience A' and 'Audience B', and then use <ul> lists or <p> tags to detail your findings for each. Stick strictly to the comparison. ${HTML_FORMAT_INSTRUCTION}`;


const callGemini = async (query: string, systemInstruction: string): Promise<{ answer: string; sources: Source[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text;
    const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: Source[] = rawSources
      .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }));

    // Deduplicate sources based on URI to avoid showing the same link multiple times
    const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

    return { answer, sources: uniqueSources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch data from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching data.");
  }
}

export const fetchAudienceChatResponse = async (audienceProfile: string, userQuestion: string): Promise<{ answer: string }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `My Persona Profile is: ${audienceProfile}\n\nBased on that, answer this question from my perspective: ${userQuestion}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: fullPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_CHAT,
                tools: [{ googleSearch: {} }],
            },
        });
        return { answer: response.text };
    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch chat response from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching chat data.");
    }
};

export const fetchMarketResearch = async (query: string): Promise<{ answer: string; sources: Source[] }> => {
  return callGemini(query, SYSTEM_INSTRUCTION_MARKET);
};

export const fetchAudienceResearch = async (query: string): Promise<{ answer: string; sources: Source[] }> => {
  return callGemini(query, SYSTEM_INSTRUCTION_AUDIENCE);
};

export const fetchAudienceComparison = async (query: string): Promise<{ answer: string; sources: Source[] }> => {
    return callGemini(query, SYSTEM_INSTRUCTION_COMPARE);
};

export const fetchCampaignIdeas = async (query: string): Promise<{ answer: string; sources: Source[] }> => {
    return callGemini(query, SYSTEM_INSTRUCTION_CAMPAIGN);
};

export const fetchChartData = async (query: string): Promise<{ data: ChartDataItem[]; sources: Source[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: query,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_CHARTS,
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        
        // Clean the response to remove markdown fences if the model adds them
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonRegex);
        if (match && match[1]) {
            jsonText = match[1];
        }

        const data: ChartDataItem[] = JSON.parse(jsonText);
        
        const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: Source[] = rawSources
            .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
            .map((chunk: any) => ({
                title: chunk.web.title,
                uri: chunk.web.uri,
            }));
        const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

        return { data, sources: uniqueSources };

    } catch (error) {
        console.error("Error calling Gemini API for chart data:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch chart data from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching chart data.");
    }
};

export const fetchComparisonChartData = async (query: string): Promise<{ data: ComparisonChartDataItem[]; sources: Source[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: query,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_COMPARE_CHARTS,
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonRegex);
        if (match && match[1]) {
            jsonText = match[1];
        }

        const data: ComparisonChartDataItem[] = JSON.parse(jsonText);
        
        const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: Source[] = rawSources
            .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
            .map((chunk: any) => ({
                title: chunk.web.title,
                uri: chunk.web.uri,
            }));
        const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

        return { data, sources: uniqueSources };

    } catch (error) {
        console.error("Error calling Gemini API for comparison chart data:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch comparison chart data from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching comparison chart data.");
    }
};


export const discoverAudiences = async (marketQuery: string): Promise<{ data: DiscoveredAudience[]; sources: Source[] }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const finalPrompt = `Based on real-world data, identify the key audience segments for the following market: ${marketQuery}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-09-2025",
            contents: finalPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_DISCOVERY,
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonRegex);
        if (match && match[1]) {
            jsonText = match[1];
        }

        const data: DiscoveredAudience[] = JSON.parse(jsonText);
        
        const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: Source[] = rawSources
            .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
            .map((chunk: any) => ({
                title: chunk.web.title,
                uri: chunk.web.uri,
            }));
        const uniqueSources = Array.from(new Map(sources.map(item => [item['uri'], item])).values());

        return { data, sources: uniqueSources };

    } catch (error) {
        console.error("Error calling Gemini API for audience discovery:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to discover audiences from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred while discovering audiences.");
    }
};