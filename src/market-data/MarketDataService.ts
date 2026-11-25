import type { Asset, Candle, Quote, AggregatedQuote, Range } from './models';
import type { Subscription } from './providers/Provider';
import { providerSelector } from './ProviderSelector';
import { subscriptionManager } from './SubscriptionManager';
import { quoteAggregator } from './QuoteAggregator';

export class MarketDataService {
  async getQuote(asset: Asset): Promise<AggregatedQuote> {
    const providers = providerSelector.selectProvidersForAsset(asset, {
      requireQuotes: true,
    });

    if (providers.length === 0) {
      throw new Error(`No providers available for ${asset.id}`);
    }

    // Try to get quotes from all available providers
    const quotePromises = providers
      .filter((p) => p.getQuote)
      .map((p) => p.getQuote!(asset));

    const quotes = await Promise.allSettled(quotePromises);
    const successfulQuotes = quotes
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<Quote>).value);

    if (successfulQuotes.length === 0) {
      throw new Error(`All providers failed for ${asset.id}`);
    }

    return quoteAggregator.aggregate(successfulQuotes);
  }

  async getHistory(asset: Asset, range: Range): Promise<Candle[]> {
    const providers = providerSelector.selectProvidersForAsset(asset, {
      requireHistory: true,
    });

    if (providers.length === 0) {
      throw new Error(`No providers available for ${asset.id}`);
    }

    // Try providers in order, return first successful result
    for (const provider of providers) {
      if (provider.getHistory) {
        try {
          const candles = await provider.getHistory(asset, range);
          return candles;
        } catch (error) {
          console.warn(
            `Provider ${provider.id} failed for ${asset.id}:`,
            error,
          );
          continue;
        }
      }
    }

    throw new Error(`All providers failed for ${asset.id}`);
  }

  subscribe(
    asset: Asset,
    callback: (quote: AggregatedQuote) => void,
    providerId?: string,
  ): Subscription {
    // Subscribe to raw quotes from provider
    const rawSubscription = subscriptionManager.subscribe(
      asset,
      (rawQuote) => {
        // Aggregate and return
        const aggregated = quoteAggregator.aggregate([rawQuote]);
        callback(aggregated);
      },
      providerId,
    );

    return rawSubscription;
  }

  subscribeMultiSource(
    asset: Asset,
    callback: (quote: AggregatedQuote) => void,
  ): Subscription {
    const providers = providerSelector.selectProvidersForAsset(asset, {
      requireRealtime: true,
    });

    if (providers.length === 0) {
      throw new Error(`No providers available for ${asset.id}`);
    }

    const subscriptions: Subscription[] = [];
    const quotes: Quote[] = [];

    providers.forEach((provider) => {
      if (provider.subscribe) {
        const sub = provider.subscribe(asset, (quote) => {
          quotes.push(quote);
          const aggregated = quoteAggregator.aggregate([...quotes]);
          callback(aggregated);
        });
        subscriptions.push(sub);
      }
    });

    return {
      unsubscribe: () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      },
    };
  }

  getAvailableProviders(): string[] {
    return providerSelector
      .selectAllProvidersForCapability('quotes')
      .map((p) => p.id);
  }

  getProvidersForAsset(asset: Asset): string[] {
    return providerSelector.selectProvidersForAsset(asset).map((p) => p.id);
  }
}

export const marketDataService = new MarketDataService();
