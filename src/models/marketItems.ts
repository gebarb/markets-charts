import type { QuoteItem, QuotesMap, MarketTrend } from '@/types/market';

export default interface MarketItemState {
  quotes: QuotesMap;
  market_trend?: MarketTrend;
  connectionError?: boolean;
}

export type { QuoteItem, QuotesMap, MarketTrend };
