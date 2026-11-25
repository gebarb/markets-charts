import type { Asset, Quote } from "./models";
import type { MarketDataProvider, Subscription } from "./providers/Provider";
import { providerSelector } from "./ProviderSelector";

interface ActiveSubscription {
  assetId: string;
  providerId: string;
  subscription: Subscription;
  callbacks: Set<(quote: Quote) => void>;
}

export class SubscriptionManager {
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private callbackMap: Map<string, Set<(quote: Quote) => void>> = new Map();

  subscribe(
    asset: Asset,
    callback: (quote: Quote) => void,
    providerId?: string
  ): Subscription {
    const assetId = asset.id;

    // Register callback
    if (!this.callbackMap.has(assetId)) {
      this.callbackMap.set(assetId, new Set());
    }
    this.callbackMap.get(assetId)!.add(callback);

    // Check if already subscribed
    const existing = this.subscriptions.get(assetId);
    if (existing) {
      return {
        unsubscribe: () => this.unsubscribe(assetId, callback),
      };
    }

    // Select provider if not specified
    const provider = providerId
      ? this.getProviderById(providerId)
      : providerSelector.selectBestProvider(asset, { requireRealtime: true });

    if (!provider || !provider.subscribe) {
      console.warn(`No provider available for subscription to ${assetId}`);
      return {
        unsubscribe: () => this.unsubscribe(assetId, callback),
      };
    }

    // Create provider subscription
    const providerSubscription = provider.subscribe(asset, (quote) => {
      // Fan out to all callbacks
      this.callbackMap.get(assetId)?.forEach((cb) => cb(quote));
    });

    // Store subscription
    this.subscriptions.set(assetId, {
      assetId,
      providerId: provider.id,
      subscription: providerSubscription,
      callbacks: this.callbackMap.get(assetId)!,
    });

    return {
      unsubscribe: () => this.unsubscribe(assetId, callback),
    };
  }

  unsubscribe(assetId: string, callback: (quote: Quote) => void): void {
    const callbacks = this.callbackMap.get(assetId);
    if (callbacks) {
      callbacks.delete(callback);

      // Clean up if no more callbacks
      if (callbacks.size === 0) {
        this.callbackMap.delete(assetId);
        const subscription = this.subscriptions.get(assetId);
        if (subscription) {
          subscription.subscription.unsubscribe();
          this.subscriptions.delete(assetId);
        }
      }
    }
  }

  unsubscribeAll(assetId: string): void {
    const subscription = this.subscriptions.get(assetId);
    if (subscription) {
      subscription.subscription.unsubscribe();
      this.subscriptions.delete(assetId);
    }
    this.callbackMap.delete(assetId);
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  getProviderForAsset(assetId: string): string | undefined {
    return this.subscriptions.get(assetId)?.providerId;
  }

  private getProviderById(providerId: string): MarketDataProvider | undefined {
    const providers = providerSelector.selectAllProvidersForCapability("quotes");
    return providers.find((p) => p.id === providerId);
  }

  clear(): void {
    this.subscriptions.forEach((sub) => sub.subscription.unsubscribe());
    this.subscriptions.clear();
    this.callbackMap.clear();
  }
}

export const subscriptionManager = new SubscriptionManager();
