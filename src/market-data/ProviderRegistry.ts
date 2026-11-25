import type {
  MarketDataProvider,
  ProviderCapabilities,
} from './providers/Provider';

class ProviderRegistry {
  private providers: Map<string, MarketDataProvider> = new Map();
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
  }

  register(provider: MarketDataProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  get(providerId: string): MarketDataProvider | undefined {
    return this.providers.get(providerId);
  }

  getAll(): MarketDataProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailable(): MarketDataProvider[] {
    return this.getAll().filter((provider) => {
      const capabilities = provider.capabilities;
      return this.isBrowser ? capabilities.browser : capabilities.server;
    });
  }

  getByCapability(
    capability: keyof ProviderCapabilities,
  ): MarketDataProvider[] {
    return this.getAvailable().filter(
      (provider) => provider.capabilities[capability],
    );
  }

  clear(): void {
    this.providers.clear();
  }
}

export const providerRegistry = new ProviderRegistry();
