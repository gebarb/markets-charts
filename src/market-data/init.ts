import { providerRegistry } from "./ProviderRegistry";
import { EodhdWebSocketProvider } from "./providers/eodhd/EodhdWebSocketProvider";
import { EodhdRestProvider } from "./providers/eodhd/EodhdRestProvider";

// Initialize providers immediately at module load time
providerRegistry.register(new EodhdWebSocketProvider());
providerRegistry.register(new EodhdRestProvider());

console.log("[Market Data] Initialized providers:", providerRegistry.getAll().map(p => p.id));

export function initializeMarketData() {
  // Providers are already initialized at module load time
  // This function is kept for compatibility but does nothing
}
