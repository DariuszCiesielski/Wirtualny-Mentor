import { tavily, type TavilyClient } from '@tavily/core';

// Lazy initialization to avoid build-time errors when TAVILY_API_KEY is not set
let tvlyClient: TavilyClient | null = null;

function getTavilyClient(): TavilyClient {
  if (!tvlyClient) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error(
        'TAVILY_API_KEY is not set. Please add it to your environment variables.'
      );
    }
    tvlyClient = tavily({ apiKey });
  }
  return tvlyClient;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  answer?: string;
  results: SearchResult[];
}

export async function searchWeb(
  query: string,
  options?: {
    topic?: 'general' | 'news';
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
  }
): Promise<SearchResponse> {
  const tvly = getTavilyClient();
  const response = await tvly.search(query, {
    searchDepth: options?.searchDepth || 'basic',
    topic: options?.topic || 'general',
    maxResults: options?.maxResults || 5,
    includeAnswer: true,
  });

  return {
    answer: response.answer,
    results: response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}

export async function extractUrls(
  urls: string[]
): Promise<{ url: string; content: string }[]> {
  const tvly = getTavilyClient();
  const response = await tvly.extract(urls);
  return response.results.map((r) => ({
    url: r.url,
    content: r.rawContent?.slice(0, 5000) || '', // Limit content
  }));
}
