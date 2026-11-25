import type {
  CoinbaseMessage,
  EodHistoricalMessage,
  HistoryPoint,
  MarketTrend,
  QuotesMap,
  WebSocketMarketMessage,
} from '@/types/market';
import { MAX_HISTORY_POINTS } from '@/types/market';

export function isEodHistoricalMessage(
  msg: WebSocketMarketMessage,
): msg is EodHistoricalMessage {
  return 's' in msg || ('p' in msg && !('product_id' in msg));
}

export function isCoinbaseMessage(
  msg: WebSocketMarketMessage,
): msg is CoinbaseMessage {
  return 'product_id' in msg || 'price' in msg;
}

export function parseMarketMessage(raw: string): {
  ticker: string;
  value: number;
} | null {
  try {
    const result = JSON.parse(raw) as WebSocketMarketMessage;

    if (isEodHistoricalMessage(result)) {
      const ticker = result.s;
      const val = result.p ?? result.a;
      if (ticker && val != null) {
        return { ticker, value: Number(val) };
      }
    }

    if (isCoinbaseMessage(result)) {
      const ticker = result.product_id;
      const val = result.price ? parseFloat(result.price) : undefined;
      if (ticker && val != null && !Number.isNaN(val)) {
        return { ticker, value: val };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function trimHistory(history: HistoryPoint[]): HistoryPoint[] {
  if (history.length <= MAX_HISTORY_POINTS) return history;
  return history.slice(-MAX_HISTORY_POINTS);
}

export function updateQuote(
  quotes: QuotesMap,
  ticker: string,
  value: number,
  timestamp: number,
): { quotes: QuotesMap; upCount: number; downCount: number } {
  const next = { ...quotes };
  let upCount = 0;
  let downCount = 0;

  if (next[ticker]) {
    if (next[ticker].current_value > value) {
      upCount++;
    } else if (next[ticker].current_value < value) {
      downCount++;
    }

    const history = trimHistory([
      ...next[ticker].history,
      { time: timestamp, value },
    ]);

    next[ticker] = {
      ...next[ticker],
      current_value: value,
      history,
    };
  } else {
    next[ticker] = {
      current_value: value,
      history: [{ time: timestamp, value }],
      is_selected: loadSelectedPreference(ticker),
    };
  }

  return { quotes: next, upCount, downCount };
}

export function calculateMarketTrend(
  upCount: number,
  downCount: number,
): MarketTrend {
  if (upCount === downCount) return undefined;
  return upCount > downCount ? 'up' : 'down';
}

export function toggleQuoteSelection(
  quotes: QuotesMap,
  itemName: string,
): QuotesMap {
  const next = { ...quotes };
  next[itemName] = {
    ...next[itemName],
    is_selected: !next[itemName].is_selected,
  };
  persistSelectedItems(next);
  return next;
}

export function resetQuoteHistory(quotes: QuotesMap): QuotesMap {
  const next = { ...quotes };
  Object.keys(next).forEach((itemName) => {
    const lastPoint = next[itemName].history.at(-1);
    if (lastPoint) {
      next[itemName] = { ...next[itemName], history: [lastPoint] };
    }
  });
  return next;
}

function loadSelectedPreference(ticker: string): boolean {
  try {
    const stored = localStorage.getItem('markets-charts-selected-items');
    if (!stored) return false;
    const selected = JSON.parse(stored) as string[];
    return selected.includes(ticker);
  } catch {
    return false;
  }
}

function persistSelectedItems(quotes: QuotesMap): void {
  try {
    const selected = Object.entries(quotes)
      .filter(([, item]) => item.is_selected)
      .map(([name]) => name);
    localStorage.setItem(
      'markets-charts-selected-items',
      JSON.stringify(selected),
    );
  } catch {
    // localStorage may be unavailable
  }
}

export function applyStoredSelections(quotes: QuotesMap): QuotesMap {
  const next = { ...quotes };
  Object.keys(next).forEach((ticker) => {
    next[ticker] = {
      ...next[ticker],
      is_selected: loadSelectedPreference(ticker),
    };
  });
  return next;
}
