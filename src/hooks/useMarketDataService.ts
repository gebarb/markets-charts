import { useCallback, useEffect, useState, useRef } from 'react';
import { marketDataService } from '@/market-data';
import { getAssetById } from '@/market-data/assets';
import type { QuotesMap } from '@/types/market';
import {
  calculateMarketTrend,
  resetQuoteHistory,
  toggleQuoteSelection,
  updateQuote,
} from '@/utils/marketData';

export interface UseMarketDataServiceReturn {
  quotes: QuotesMap;
  marketTrend: string | undefined;
  connectionError: boolean;
  areMarketsLoaded: boolean;
  toggleItemSelection: (itemName: string) => void;
  resetData: () => void;
  connectionHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export function useMarketDataService(): UseMarketDataServiceReturn {
  const [quotes, setQuotes] = useState<QuotesMap>({});
  const [marketTrend, setMarketTrend] = useState<string | undefined>(undefined);
  const [connectionError] = useState(false);
  const [providersReady, setProvidersReady] = useState(false);

  const initializedRef = useRef(false);

  const toggleItemSelection = useCallback((itemName: string) => {
    setQuotes((prev) => toggleQuoteSelection(prev, itemName));
  }, []);

  const resetData = useCallback(() => {
    setQuotes((prev) => resetQuoteHistory(prev));
  }, []);

  const areMarketsLoaded = Object.keys(quotes).length >= 1;

  // Check if providers are available.
  useEffect(() => {
    if (initializedRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const checkProviders = () => {
      if (cancelled) return;

      const availableProviders = marketDataService.getAvailableProviders();

      if (availableProviders.length > 0) {
        initializedRef.current = true;
        setProvidersReady(true);
      } else {
        timeoutId = setTimeout(checkProviders, 100);
      }
    };

    checkProviders();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Subscribe to all assets once providers are ready.
  useEffect(() => {
    if (!providersReady) return;

    const assetIds = [
      'AAPL',
      'MSFT',
      'AMZN',
      'TSLA',
      'GOOGL',
      'XAUUSD',
      'XAGUSD',
      'EURUSD',
      'BTC-USD',
      'ETH-USD',
    ];

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    assetIds.forEach((assetId) => {
      const asset = getAssetById(assetId);

      if (asset) {
        try {
          const subscription = marketDataService.subscribe(
            asset,
            (aggregatedQuote) => {
              setQuotes((prev) => {
                const result = updateQuote(
                  prev,
                  assetId,
                  aggregatedQuote.price,
                  Date.now(),
                );

                setMarketTrend(
                  calculateMarketTrend(result.upCount, result.downCount),
                );

                return result.quotes;
              });
            },
          );

          subscriptions.push(subscription);
        } catch (error) {
          console.warn(`Failed to subscribe to ${assetId}:`, error);
        }
      }
    });

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [providersReady]);

  return {
    quotes,
    marketTrend,
    connectionError,
    areMarketsLoaded,
    toggleItemSelection,
    resetData,
    connectionHealth: 'healthy',
  };
}
