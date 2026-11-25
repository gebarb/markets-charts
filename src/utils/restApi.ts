// REST API mode uses historical EOD data endpoints with filter=last_close
// This returns the latest close price from historical data (end-of-day)
// Works with free API keys and avoids CORS/payment issues from real-time endpoints
// For true real-time data, use WebSocket mode with a paid API key.
// NOTE: REST API mode is currently disabled due to CORS restrictions from EOD API.
// TODO: Add backend proxy server or switch to CORS-friendly API provider.
const REST_API_KEY = import.meta.env.VITE_EOD_REST_KEY || 'demo';
const BASE_URL = 'https://eodhd.com/api';

export interface RestApiQuote {
  ticker: string;
  value: number;
  timestamp: number;
}

export interface EodApiQuote {
  code: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchStockQuotes(
  symbols: string[],
): Promise<RestApiQuote[]> {
  // Use EOD historical endpoint with filter=last_close for stocks
  // Returns latest close price from historical data (works with free API)
  const promises = symbols.map(async (symbol) => {
    const ticker = symbol.endsWith('.US') ? symbol : `${symbol}.US`;
    const url = `${BASE_URL}/eod/${ticker}?api_token=${REST_API_KEY}&filter=last_close&fmt=json`;

    console.log('[REST API] Fetching stock:', symbol, 'from:', url);

    try {
      const response = await fetch(url);
      console.log(
        '[REST API] Stock response status for',
        symbol,
        ':',
        response.status,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[REST API] Stock error response for',
          symbol,
          ':',
          errorText,
        );
        return null;
      }

      const value = await response.json();
      console.log('[REST API] Stock value received for', symbol, ':', value);

      return {
        ticker: symbol,
        value: typeof value === 'number' ? value : parseFloat(value),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(
        '[REST API] Error fetching stock quote for',
        symbol,
        ':',
        error,
      );
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((quote): quote is RestApiQuote => quote !== null);
}

export async function fetchForexQuotes(
  symbols: string[],
): Promise<RestApiQuote[]> {
  return [];
  // Use EOD historical endpoint with filter=last_close for forex
  // Returns latest close price from historical data (works with free API)
  const promises = symbols.map(async (symbol) => {
    const ticker = symbol.endsWith('.FOREX') ? symbol : `${symbol}.FOREX`;
    const url = `${BASE_URL}/eod/${ticker}?api_token=${REST_API_KEY}&filter=last_close&fmt=json`;

    console.log('[REST API] Fetching forex:', symbol, 'from:', url);

    try {
      const response = await fetch(url);
      console.log(
        '[REST API] Forex response status for',
        symbol,
        ':',
        response.status,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[REST API] Forex error response for',
          symbol,
          ':',
          errorText,
        );
        return null;
      }

      const value = await response.json();
      console.log('[REST API] Forex value received for', symbol, ':', value);

      return {
        ticker: symbol,
        value: typeof value === 'number' ? value : parseFloat(value),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(
        '[REST API] Error fetching forex quote for',
        symbol,
        ':',
        error,
      );
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((quote): quote is RestApiQuote => quote !== null);
}

export async function fetchCryptoQuotes(
  symbols: string[],
): Promise<RestApiQuote[]> {
  // Use EOD historical endpoint with filter=last_close for crypto
  // Returns latest close price from historical data (works with free API)
  return [];
  const promises = symbols.map(async (symbol) => {
    const ticker = symbol.endsWith('.CC') ? symbol : `${symbol}.CC`;
    const url = `${BASE_URL}/eod/${ticker}?api_token=${REST_API_KEY}&filter=last_close&fmt=json`;

    console.log('[REST API] Fetching crypto:', symbol, 'from:', url);

    try {
      const response = await fetch(url);
      console.log(
        '[REST API] Crypto response status for',
        symbol,
        ':',
        response.status,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[REST API] Crypto error response for',
          symbol,
          ':',
          errorText,
        );
        return null;
      }

      const value = await response.json();
      console.log('[REST API] Crypto value received for', symbol, ':', value);

      return {
        ticker: symbol,
        value: typeof value === 'number' ? value : parseFloat(value),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(
        '[REST API] Error fetching crypto quote for',
        symbol,
        ':',
        error,
      );
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((quote): quote is RestApiQuote => quote !== null);
}
