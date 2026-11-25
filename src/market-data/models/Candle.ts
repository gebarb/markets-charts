export interface Candle {
  assetId: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  source: string;
}

export interface Range {
  from: Date;
  to: Date;
  interval?: "1m" | "5m" | "15m" | "1h" | "1d" | "1w" | "1M";
}
