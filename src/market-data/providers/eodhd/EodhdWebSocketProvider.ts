import type { Asset, Quote } from "../../models";
import type { MarketDataProvider, ProviderCapabilities, Subscription } from "../Provider";

const WS_API_KEY = import.meta.env.VITE_EOD_WS_KEY || "demo";

export class EodhdWebSocketProvider implements MarketDataProvider {
  id = "eodhd-websocket";
  capabilities: ProviderCapabilities = {
    browser: true,
    server: true,
    realtime: true,
    websocket: true,
    quotes: true,
    history: false,
  };

  private sockets: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, Set<(quote: Quote) => void>> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // asset IDs per market
  private connectionTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  supports(asset: Asset): boolean {
    return asset.instruments.some(
      (inst) => inst.provider === "eodhd"
    );
  }

  private getWebSocketUrl(market: string): string {
    return `wss://ws.eodhistoricaldata.com/ws/${market}?api_token=${WS_API_KEY}`;
  }

  private parseMessage(data: string): { ticker: string; value: number } | null {
    try {
      const parsed = JSON.parse(data);
      // Handle crypto/stock format: {s: "BTC-USD", p: "1846.1673"}
      if (parsed.s && parsed.p) {
        return { ticker: parsed.s, value: parseFloat(parsed.p) };
      }
      // Handle forex format: {s: "EURUSD", a: 1.1443, b: 1.1436}
      if (parsed.s && (parsed.a || parsed.b)) {
        // Use the average of bid and ask, or whichever is available
        const price = parsed.a && parsed.b ? (parseFloat(parsed.a) + parseFloat(parsed.b)) / 2 : parseFloat(parsed.a || parsed.b);
        return { ticker: parsed.s, value: price };
      }
      return null;
    } catch {
      return null;
    }
  }

  subscribe(asset: Asset, callback: (quote: Quote) => void): Subscription {
    const instrument = asset.instruments.find(
      (inst) => inst.provider === "eodhd"
    );

    if (!instrument) {
      throw new Error(`No EODHD instrument found for ${asset.id}`);
    }

    const market = this.determineMarket(instrument.symbol);
    const wsUrl = this.getWebSocketUrl(market);

    // Register callback
    if (!this.callbacks.has(asset.id)) {
      this.callbacks.set(asset.id, new Set());
    }
    this.callbacks.get(asset.id)!.add(callback);

    // Track subscription per market
    if (!this.subscriptions.has(market)) {
      this.subscriptions.set(market, new Set());
    }
    this.subscriptions.get(market)!.add(asset.id);

    // Create socket if not exists
    if (!this.sockets.has(market) && !this.connectionTimeouts.has(market)) {
      // Delay connection to match original useWebSocket timing (100ms)
      const timeout = setTimeout(() => {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`[EODHD WS] Connected to ${market}`);
          this.sendSubscriptionMessage(market, ws);
        };

        ws.onmessage = (event) => {
          console.log(`[EODHD WS] Raw message from ${market}:`, event.data);
          const parsed = this.parseMessage(event.data);
          if (parsed) {
            console.log(`[EODHD WS] Received message:`, parsed);
            // Map ticker back to asset ID
            const assetId = this.findAssetIdByTicker(parsed.ticker);
            console.log(`[EODHD WS] Mapped ticker ${parsed.ticker} to asset ${assetId}`);
            if (assetId) {
              const quote: Quote = {
                assetId,
                price: parsed.value,
                timestamp: Date.now(),
                receivedAt: Date.now(),
                source: this.id,
              };

              console.log(`[EODHD WS] Sending quote to callbacks for ${assetId}:`, quote);
              // Fan out to all callbacks for this asset
              this.callbacks.get(assetId)?.forEach((cb) => cb(quote));
            } else {
              console.warn(`[EODHD WS] No asset mapping found for ticker ${parsed.ticker}`);
            }
          } else {
            console.log(`[EODHD WS] Could not parse message:`, event.data);
          }
        };

        ws.onerror = (error) => {
          console.error(`[EODHD WS] Error for ${market}:`, error);
        };

        ws.onclose = (event) => {
          console.log(`[EODHD WS] Connection closed for ${market}:`, event.code, event.reason);
          this.sockets.delete(market);
          this.connectionTimeouts.delete(market);
        };

        this.sockets.set(market, ws);
      }, 100);

      this.connectionTimeouts.set(market, timeout);
    } else if (this.sockets.has(market)) {
      // Socket already exists, send updated subscription
      const ws = this.sockets.get(market);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendSubscriptionMessage(market, ws);
      }
    }

    return {
      unsubscribe: () => {
        const callbacks = this.callbacks.get(asset.id);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.callbacks.delete(asset.id);
          }
        }

        // Remove from market subscriptions
        const marketSubs = this.subscriptions.get(market);
        if (marketSubs) {
          marketSubs.delete(asset.id);
          if (marketSubs.size === 0) {
            this.subscriptions.delete(market);
            // Clear connection timeout
            const timeout = this.connectionTimeouts.get(market);
            if (timeout) {
              clearTimeout(timeout);
              this.connectionTimeouts.delete(market);
            }
            // Close socket if no more subscriptions
            const ws = this.sockets.get(market);
            if (ws) {
              ws.close();
              this.sockets.delete(market);
            }
          } else {
            // Send updated subscription
            const ws = this.sockets.get(market);
            if (ws && ws.readyState === WebSocket.OPEN) {
              this.sendSubscriptionMessage(market, ws);
            }
          }
        }
      },
    };
  }

  private sendSubscriptionMessage(market: string, ws: WebSocket): void {
    const assetIds = this.subscriptions.get(market);
    if (!assetIds || assetIds.size === 0) return;

    // Get symbols for all subscribed assets in this market
    const symbols: string[] = [];
    assetIds.forEach((assetId) => {
      const symbol = this.getSymbolForAssetId(assetId);
      if (symbol) {
        symbols.push(symbol);
      }
    });

    if (symbols.length > 0) {
      const subscribeMsg = JSON.stringify({
        action: "subscribe",
        symbols: symbols.join(", "),
      });
      ws.send(new Blob([subscribeMsg], { type: "application/json" }));
      console.log(`[EODHD WS] Subscribed to ${symbols.length} symbols in ${market}:`, symbols);
      console.log(`[EODHD WS] Subscription message:`, subscribeMsg);
    }
  }

  private findAssetIdByTicker(ticker: string): string | undefined {
    // Map ticker symbols back to asset IDs
    const tickerToAssetMap: Record<string, string> = {
      "AAPL": "AAPL",
      "MSFT": "MSFT",
      "AMZN": "AMZN",
      "TSLA": "TSLA",
      "GOOGL": "GOOGL",
      "XAUUSD": "XAUUSD",
      "XAGUSD": "XAGUSD",
      "EURUSD": "EURUSD",
      "BTC-USD": "BTC-USD",
      "ETH-USD": "ETH-USD",
    };
    return tickerToAssetMap[ticker];
  }

  private getSymbolForAssetId(assetId: string): string | undefined {
    // This is a placeholder - in production you'd have a proper asset registry
    // For now, we'll use a simple mapping based on the asset ID
    const symbolMap: Record<string, string> = {
      "AAPL": "AAPL",
      "MSFT": "MSFT",
      "AMZN": "AMZN",
      "TSLA": "TSLA",
      "GOOGL": "GOOGL",
      "XAUUSD": "XAUUSD",
      "XAGUSD": "XAGUSD",
      "EURUSD": "EURUSD",
      "BTC-USD": "BTC-USD",
      "ETH-USD": "ETH-USD",
    };
    return symbolMap[assetId];
  }

  private determineMarket(symbol: string): string {
    if (symbol.includes("USD") && !symbol.includes("-")) return "forex";
    if (symbol.includes("-")) return "crypto";
    return "us";
  }
}
