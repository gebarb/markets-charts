import type { Asset, Quote } from "../../models";
import type { MarketDataProvider, ProviderCapabilities, Subscription } from "../Provider";

const COINBASE_WS_URL = "wss://ws-feed.pro.coinbase.com";

export class CoinbaseWebSocketProvider implements MarketDataProvider {
  id = "coinbase-websocket";
  capabilities: ProviderCapabilities = {
    browser: true,
    server: false,
    realtime: true,
    websocket: true,
    quotes: true,
    history: false,
  };

  private sockets: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, Set<(quote: Quote) => void>> = new Map();
  private subscriptions: Set<string> = new Set();

  supports(asset: Asset): boolean {
    return asset.instruments.some(inst => inst.provider === "coinbase");
  }

  subscribe(asset: Asset, callback: (quote: Quote) => void): Subscription {
    const instrument = asset.instruments.find(
      (inst) => inst.provider === "coinbase"
    );

    if (!instrument) {
      throw new Error(`No Coinbase instrument found for ${asset.id}`);
    }

    // Store callback
    if (!this.callbacks.has(asset.id)) {
      this.callbacks.set(asset.id, new Set());
    }
    this.callbacks.get(asset.id)!.add(callback);

    // Track subscription
    this.subscriptions.add(asset.id);

    // Create socket if not exists
    if (!this.sockets.has("crypto")) {
      const ws = new WebSocket(COINBASE_WS_URL);

      ws.onopen = () => {
        console.log("[Coinbase WS] Connected");
        this.sendSubscriptionMessage(ws);
      };

      ws.onmessage = (event) => {
        console.log("[Coinbase WS] Raw message:", event.data);
        const parsed = this.parseMessage(event.data);
        if (parsed) {
          console.log("[Coinbase WS] Received message:", parsed);
          const quote: Quote = {
            assetId: parsed.assetId,
            price: parsed.price,
            timestamp: Date.now(),
            receivedAt: Date.now(),
            source: this.id,
          };

          console.log("[Coinbase WS] Sending quote to callbacks for", parsed.assetId, ":", quote);
          this.callbacks.get(parsed.assetId)?.forEach((cb) => cb(quote));
        }
      };

      ws.onerror = (error) => {
        console.error("[Coinbase WS] Error:", error);
      };

      ws.onclose = (event) => {
        console.log("[Coinbase WS] Connection closed:", event.code, event.reason);
      };

      this.sockets.set("crypto", ws);
    } else {
      // Socket already exists, send updated subscription
      const ws = this.sockets.get("crypto");
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendSubscriptionMessage(ws);
      }
    }

    return {
      unsubscribe: () => {
        this.callbacks.get(asset.id)?.delete(callback);
        this.subscriptions.delete(asset.id);
        
        // If no more subscriptions, close socket
        if (this.subscriptions.size === 0) {
          const ws = this.sockets.get("crypto");
          if (ws) {
            ws.close();
            this.sockets.delete("crypto");
          }
        }
      },
    };
  }

  private sendSubscriptionMessage(ws: WebSocket): void {
    const symbols = Array.from(this.subscriptions);
    
    if (symbols.length > 0) {
      const subscribeMsg = JSON.stringify({
        type: "subscribe",
        product_ids: symbols,
        channels: [
          "heartbeat",
          {
            name: "ticker",
            product_ids: symbols,
          },
        ],
      });
      ws.send(subscribeMsg);
      console.log("[Coinbase WS] Subscribed to symbols:", symbols);
      console.log("[Coinbase WS] Subscription message:", subscribeMsg);
    }
  }

  private parseMessage(data: string): { assetId: string; price: number } | null {
    try {
      const parsed = JSON.parse(data);
      
      // Handle ticker messages
      if (parsed.type === "ticker" && parsed.product_id && parsed.price) {
        // Convert product_id to asset ID (e.g., "BTC-USD" -> "BTC-USD")
        return {
          assetId: parsed.product_id,
          price: parseFloat(parsed.price),
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }
}
