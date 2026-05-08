import { API_URL } from '../config';

// Minimal product shape needed by the assistant feature
export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  rating?: number;
}

export interface ParsedIntent {
  brand?: string | null;
  category?: string | null;
  useCase?: string | null;
  color?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | null;
  referenceProduct?: string | null;
}

export interface AssistantResponse {
  results: Product[];
  parsedIntent: ParsedIntent;
  intentSummary: string;
  totalCount: number;
}

export interface ConversationTurn {
  query: string;
  results: Product[];
  parsedIntent: ParsedIntent;
  intentSummary: string;
  totalCount: number;
}

export class AssistantApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AssistantApiError';
    this.status = status;
  }
}

export async function queryAssistant(query: string): Promise<AssistantResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch (err) {
    throw new AssistantApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (errorData as { error?: string }).error ||
      `Request failed (${response.status})`;
    throw new AssistantApiError(message, response.status);
  }

  return response.json() as Promise<AssistantResponse>;
}
