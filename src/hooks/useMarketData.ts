import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { MarketTrend, QuotesMap, DataSourceMode } from '@/types/market';
import { UPDATE_THROTTLE_MS } from '@/types/market';
import {
  calculateMarketTrend,
  parseMarketMessage,
  resetQuoteHistory,
  toggleQuoteSelection,
  updateQuote,
} from '@/utils/marketData';
import {
  fetchStockQuotes,
  fetchForexQuotes,
  fetchCryptoQuotes,
} from '@/utils/restApi';

const WS_API_KEY = import.meta.env.VITE_EOD_WS_KEY || 'demo';
const STOCKS_URL = `wss://ws.eodhistoricaldata.com/ws/us?api_token=${WS_API_KEY}`;
const FOREX_URL = `wss://ws.eodhistoricaldata.com/ws/forex?api_token=${WS_API_KEY}`;
const CRYPTO_URL = `wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${WS_API_KEY}`;

const STOCKS_SUBSCRIBE = JSON.stringify({
  action: 'subscribe',
  symbols: 'AAPL, MSFT, AMZN, TSLA, GOOGL',
});

const FOREX_SUBSCRIBE = JSON.stringify({
  action: 'subscribe',
  symbols: 'XAUUSD, XAGUSD, EURUSD',
});

const CRYPTO_SUBSCRIBE = JSON.stringify({
  action: 'subscribe',
  symbols: 'BTC-USD, ETH-USD',
});

export interface UseMarketDataReturn {
  quotes: QuotesMap;
  marketTrend: MarketTrend;
  connectionError: boolean;
  areMarketsLoaded: boolean;
  toggleItemSelection: (itemName: string) => void;
  resetData: () => void;
  connectionHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export function useMarketData(
  onDataReceived: () => void,
  dataSourceMode: DataSourceMode = 'websocket',
): UseMarketDataReturn {
  const [quotes, setQuotes] = useState<QuotesMap>({});
  const [marketTrend, setMarketTrend] = useState<MarketTrend>(undefined);

  const pendingUpdatesRef = useRef<
    { ticker: string; value: number; timestamp: number }[]
  >([]);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDataReceivedRef = useRef(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  const flushPendingUpdates = useCallback(() => {
    const pending = pendingUpdatesRef.current;
    if (pending.length === 0) return;

    pendingUpdatesRef.current = [];
    let totalUp = 0;
    let totalDown = 0;

    setQuotes((prev) => {
      let next = prev;

      for (const { ticker, value, timestamp } of pending) {
        const result = updateQuote(next, ticker, value, timestamp);
        next = result.quotes;
        totalUp += result.upCount;
        totalDown += result.downCount;
      }

      return next;
    });

    setMarketTrend(calculateMarketTrend(totalUp, totalDown));
    onDataReceivedRef.current();
  }, []);

  const queueUpdate = useCallback(
    (ticker: string, value: number, timestamp: number) => {
      pendingUpdatesRef.current.push({ ticker, value, timestamp });

      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null;
          flushPendingUpdates();
        }, UPDATE_THROTTLE_MS);
      }
    },
    [flushPendingUpdates],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const parsed = parseMarketMessage(event.data as string);
      if (!parsed) return;

      queueUpdate(parsed.ticker, parsed.value, Date.now());
    },
    [queueUpdate],
  );

  // REST API polling
  useEffect(() => {
    if (dataSourceMode !== 'rest-api') return;

    const pollInterval = 5000;
    const stockSymbols = JSON.parse(STOCKS_SUBSCRIBE).symbols.split(', ');
    const forexSymbols = JSON.parse(FOREX_SUBSCRIBE).symbols.split(', ');
    const cryptoSymbols = JSON.parse(CRYPTO_SUBSCRIBE).symbols.split(', ');

    const fetchData = async () => {
      try {
        const [stocks, forex, crypto] = await Promise.all([
          fetchStockQuotes(stockSymbols),
          fetchForexQuotes(forexSymbols),
          fetchCryptoQuotes(cryptoSymbols),
        ]);

        [...stocks, ...forex, ...crypto].forEach((quote) => {
          queueUpdate(quote.ticker, quote.value, quote.timestamp);
        });
      } catch (error) {
        console.error('[REST API] Error fetching data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, pollInterval);

    return () => clearInterval(intervalId);
  }, [dataSourceMode, queueUpdate]);

  // WebSocket connections (only when in websocket mode)
  const stocksWs = useWebSocket({
    url: STOCKS_URL,
    enabled: dataSourceMode === 'websocket',
    onMessage: handleMessage,
    onOpen: (send) => {
      console.log('[Stocks] Sending subscription:', STOCKS_SUBSCRIBE);
      send(new Blob([STOCKS_SUBSCRIBE], { type: 'application/json' }));
    },
  });

  const forexWs = useWebSocket({
    url: FOREX_URL,
    enabled: dataSourceMode === 'websocket',
    onMessage: handleMessage,
    onOpen: (send) => {
      console.log('[Forex] Sending subscription:', FOREX_SUBSCRIBE);
      send(new Blob([FOREX_SUBSCRIBE], { type: 'application/json' }));
    },
  });

  useWebSocket({
    url: CRYPTO_URL,
    enabled: dataSourceMode === 'websocket',
    onMessage: handleMessage,
    onOpen: (send) => {
      console.log('[Crypto] Sending subscription:', CRYPTO_SUBSCRIBE);
      send(new Blob([CRYPTO_SUBSCRIBE], { type: 'application/json' }));
    },
    maxRetries: 3,
  });

  // Only report a connection error if both primary connections have failed.
  // REST API mode does not use WebSocket connections.
  const connectionError =
    dataSourceMode !== 'rest-api' &&
    (stocksWs.status === 'error' || stocksWs.status === 'disconnected') &&
    (forexWs.status === 'error' || forexWs.status === 'disconnected');

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, []);

  const toggleItemSelection = useCallback((itemName: string) => {
    setQuotes((prev) => toggleQuoteSelection(prev, itemName));
  }, []);

  const resetData = useCallback(() => {
    setQuotes((prev) => resetQuoteHistory(prev));
  }, []);

  const areMarketsLoaded = useMemo(
    () => Object.keys(quotes).length > 0,
    [quotes],
  );

  // Determine overall connection health - be lenient to allow partial failures.
  const overallConnectionHealth: 'healthy' | 'degraded' | 'unhealthy' =
    dataSourceMode === 'rest-api'
      ? 'healthy'
      : stocksWs.connectionHealth === 'healthy' ||
          forexWs.connectionHealth === 'healthy'
        ? 'healthy'
        : stocksWs.connectionHealth === 'degraded' ||
            forexWs.connectionHealth === 'degraded'
          ? 'degraded'
          : 'unhealthy';

  return {
    quotes,
    marketTrend,
    connectionError,
    areMarketsLoaded,
    toggleItemSelection,
    resetData,
    connectionHealth: overallConnectionHealth,
  };
}
