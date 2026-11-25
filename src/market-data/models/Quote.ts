export interface Quote {
  assetId: string;
  price: number;
  timestamp: number;
  receivedAt: number;
  source: string;
  latency?: number;
}

export interface AggregatedQuote {
  assetId: string;
  price: number;
  sources: string[];
  confidence: 'high' | 'medium' | 'low' | 'conflict';
  conflict?: {
    status: 'conflict';
    preferred: string;
  };
}
