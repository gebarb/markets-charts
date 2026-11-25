import type { Asset, Candle, Quote, Range } from "../models";

export interface ProviderCapabilities {
  browser: boolean;
  server: boolean;
  realtime: boolean;
  websocket: boolean;
  quotes: boolean;
  history: boolean;
}

export interface Subscription {
  unsubscribe: () => void;
}

export interface MarketDataProvider {
  id: string;
  capabilities: ProviderCapabilities;

  supports(asset: Asset): boolean;

  getQuote?(asset: Asset): Promise<Quote>;
  getHistory?(asset: Asset, range: Range): Promise<Candle[]>;
  subscribe?(asset: Asset, callback: (quote: Quote) => void): Subscription;
}
