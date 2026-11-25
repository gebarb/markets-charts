import type { Asset, Candle, Quote, Range } from "../../models";
import type { MarketDataProvider, ProviderCapabilities } from "../Provider";

const REST_API_KEY = import.meta.env.VITE_EOD_REST_KEY || "demo";
const BASE_URL = "https://eodhd.com/api";

export class EodhdRestProvider implements MarketDataProvider {
  id = "eodhd-rest";
  capabilities: ProviderCapabilities = {
    browser: false, // REST API mode disabled due to CORS
    server: true,
    realtime: false,
    websocket: false,
    quotes: true,
    history: true,
  };

  supports(asset: Asset): boolean {
    return asset.instruments.some(
      (inst) => inst.provider === "eodhd"
    );
  }

  async getQuote(asset: Asset): Promise<Quote> {
    const instrument = asset.instruments.find(
      (inst) => inst.provider === "eodhd"
    );

    if (!instrument) {
      throw new Error(`No EODHD instrument found for ${asset.id}`);
    }

    const url = `${BASE_URL}/eod/${instrument.symbol}?api_token=${REST_API_KEY}&filter=last_close&fmt=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`EODHD REST API error: ${response.status}`);
    }

    const value = await response.json();
    const price = typeof value === "number" ? value : parseFloat(value);

    return {
      assetId: asset.id,
      price,
      timestamp: Date.now(),
      receivedAt: Date.now(),
      source: this.id,
    };
  }

  async getHistory(asset: Asset, range: Range): Promise<Candle[]> {
    const instrument = asset.instruments.find(
      (inst) => inst.provider === "eodhd"
    );

    if (!instrument) {
      throw new Error(`No EODHD instrument found for ${asset.id}`);
    }

    const from = range.from.toISOString().split("T")[0];
    const to = range.to.toISOString().split("T")[0];
    const period = range.interval || "d";

    const url = `${BASE_URL}/eod/${instrument.symbol}?api_token=${REST_API_KEY}&from=${from}&to=${to}&period=${period}&fmt=json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`EODHD REST API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      assetId: asset.id,
      timestamp: new Date(item.date).getTime(),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      source: this.id,
    }));
  }
}
