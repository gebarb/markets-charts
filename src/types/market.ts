export interface HistoryPoint {
  time: number;
  value: number;
}

export interface QuoteItem {
  current_value: number;
  history: HistoryPoint[];
  is_selected: boolean;
}

export type QuotesMap = Record<string, QuoteItem>;

export type MarketTrend = "up" | "down" | undefined;

export interface EodHistoricalMessage {
  s?: string;
  p?: number;
  a?: number;
}

export interface CoinbaseMessage {
  product_id?: string;
  price?: string;
  type?: string;
}

export type WebSocketMarketMessage = EodHistoricalMessage | CoinbaseMessage;

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type DataSourceMode = "websocket" | "rest-api";

export const MAX_HISTORY_POINTS = 500;
export const UPDATE_THROTTLE_MS = 100;
export const SELECTED_ITEMS_KEY = "markets-charts-selected-items";
