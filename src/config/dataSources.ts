interface DataSourceConfig {
  enabled: boolean;
  url: string;
  apiKey?: string;
  symbols: string[];
  maxRetries?: number;
}

export const DATA_SOURCES = {
  stocks: {
    enabled: true,
    url: import.meta.env.VITE_STOCKS_WS_URL || "wss://ws.eodhistoricaldata.com/ws/us",
    apiKey: import.meta.env.VITE_EOD_WS_KEY || "demo",
    symbols: ["AAPL", "MSFT", "AMZN", "TSLA", "GOOGL"],
    maxRetries: 10,
  } as DataSourceConfig,
  forex: {
    enabled: true,
    url: import.meta.env.VITE_FOREX_WS_URL || "wss://ws.eodhistoricaldata.com/ws/forex",
    apiKey: import.meta.env.VITE_EOD_WS_KEY || "demo",
    symbols: ["XAUUSD", "XAGUSD", "EURUSD"],
    maxRetries: 10,
  } as DataSourceConfig,
  crypto: {
    enabled: true,
    url: import.meta.env.VITE_CRYPTO_WS_URL || "wss://ws-feed.pro.coinbase.com",
    symbols: ["ETH-USD", "BTC-USD"],
    maxRetries: 3,
  } as DataSourceConfig,
};

export function getStocksSubscribeMessage(): string {
  return JSON.stringify({
    action: "subscribe",
    symbols: DATA_SOURCES.stocks.symbols.join(","),
  });
}

export function getForexSubscribeMessage(): string {
  return JSON.stringify({
    action: "subscribe",
    symbols: DATA_SOURCES.forex.symbols.join(","),
  });
}

export function getCryptoSubscribeMessage(): string {
  return JSON.stringify({
    type: "subscribe",
    product_ids: DATA_SOURCES.crypto.symbols,
    channels: [
      "heartbeat",
      {
        name: "ticker",
        product_ids: DATA_SOURCES.crypto.symbols,
      },
    ],
  });
}

export function getStocksUnsubscribeMessage(): string {
  return JSON.stringify({
    action: "unsubscribe",
    symbols: DATA_SOURCES.stocks.symbols.join(","),
  });
}

export function getForexUnsubscribeMessage(): string {
  return JSON.stringify({
    action: "unsubscribe",
    symbols: DATA_SOURCES.forex.symbols.join(","),
  });
}

export function getCryptoUnsubscribeMessage(): string {
  return JSON.stringify({
    type: "unsubscribe",
    product_ids: DATA_SOURCES.crypto.symbols,
    channels: [
      "heartbeat",
      {
        name: "ticker",
        product_ids: DATA_SOURCES.crypto.symbols,
      },
    ],
  });
}
