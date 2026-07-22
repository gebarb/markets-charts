import type { Asset } from "../models";

export const assets: Asset[] = [
  {
    id: "AAPL",
    displayName: "Apple Inc.",
    type: "stock",
    instruments: [
      {
        provider: "eodhd",
        symbol: "AAPL",
        marketType: "equity",
      },
    ],
  },
  {
    id: "MSFT",
    displayName: "Microsoft Corporation",
    type: "stock",
    instruments: [
      {
        provider: "eodhd",
        symbol: "MSFT",
        marketType: "equity",
      },
    ],
  },
  {
    id: "AMZN",
    displayName: "Amazon.com Inc.",
    type: "stock",
    instruments: [
      {
        provider: "eodhd",
        symbol: "AMZN",
        marketType: "equity",
      },
    ],
  },
  {
    id: "TSLA",
    displayName: "Tesla Inc.",
    type: "stock",
    instruments: [
      {
        provider: "eodhd",
        symbol: "TSLA",
        marketType: "equity",
      },
    ],
  },
  {
    id: "GOOGL",
    displayName: "Alphabet Inc.",
    type: "stock",
    instruments: [
      {
        provider: "eodhd",
        symbol: "GOOGL",
        marketType: "equity",
      },
    ],
  },
  {
    id: "XAUUSD",
    displayName: "Gold",
    type: "forex",
    instruments: [
      {
        provider: "eodhd",
        symbol: "XAUUSD",
        marketType: "spot",
      },
    ],
  },
  {
    id: "XAGUSD",
    displayName: "Silver",
    type: "forex",
    instruments: [
      {
        provider: "eodhd",
        symbol: "XAGUSD",
        marketType: "spot",
      },
    ],
  },
  {
    id: "EURUSD",
    displayName: "EUR/USD",
    type: "forex",
    instruments: [
      {
        provider: "eodhd",
        symbol: "EURUSD",
        marketType: "spot",
      },
    ],
  },
  {
    id: "BTC-USD",
    displayName: "Bitcoin",
    type: "crypto",
    instruments: [
      {
        provider: "eodhd",
        symbol: "BTC-USD",
        marketType: "spot",
      },
    ],
  },
  {
    id: "ETH-USD",
    displayName: "Ethereum",
    type: "crypto",
    instruments: [
      {
        provider: "eodhd",
        symbol: "ETH-USD",
        marketType: "spot",
      },
    ],
  },
];

export function getAssetById(id: string): Asset | undefined {
  return assets.find((asset) => asset.id === id);
}

export function getAssetsByType(type: string): Asset[] {
  return assets.filter((asset) => asset.type === type);
}
