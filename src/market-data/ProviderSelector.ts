import type { Asset } from './models';
import type {
  MarketDataProvider,
  ProviderCapabilities,
} from './providers/Provider';
import { providerRegistry } from './ProviderRegistry';

export interface ProviderSelectionCriteria {
  requireRealtime?: boolean;
  requireWebsocket?: boolean;
  requireQuotes?: boolean;
  requireHistory?: boolean;
  requireBrowser?: boolean;
  requireServer?: boolean;
}

export class ProviderSelector {
  selectProvidersForAsset(
    asset: Asset,
    criteria?: ProviderSelectionCriteria,
  ): MarketDataProvider[] {
    const available = providerRegistry.getAvailable();

    return available.filter((provider) => {
      // Check if provider supports this asset
      if (!provider.supports(asset)) {
        return false;
      }

      // Apply capability filters
      const caps = provider.capabilities;

      if (criteria?.requireRealtime && !caps.realtime) return false;
      if (criteria?.requireWebsocket && !caps.websocket) return false;
      if (criteria?.requireQuotes && !caps.quotes) return false;
      if (criteria?.requireHistory && !caps.history) return false;
      if (criteria?.requireBrowser && !caps.browser) return false;
      if (criteria?.requireServer && !caps.server) return false;

      return true;
    });
  }

  selectBestProvider(
    asset: Asset,
    criteria?: ProviderSelectionCriteria,
  ): MarketDataProvider | undefined {
    const providers = this.selectProvidersForAsset(asset, criteria);

    if (providers.length === 0) return undefined;
    if (providers.length === 1) return providers[0];

    // Prefer WebSocket providers for real-time data
    const websocketProvider = providers.find((p) => p.capabilities.websocket);
    if (websocketProvider && criteria?.requireRealtime) {
      return websocketProvider;
    }

    // Otherwise, return the first available
    return providers[0];
  }

  selectAllProvidersForCapability(
    capability: keyof ProviderCapabilities,
  ): MarketDataProvider[] {
    return providerRegistry.getByCapability(capability);
  }
}

export const providerSelector = new ProviderSelector();
