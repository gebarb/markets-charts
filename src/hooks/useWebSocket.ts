import { useCallback, useEffect, useRef, useState } from 'react';

import type { ConnectionStatus } from '@/types/market';

const DEFAULT_MAX_RETRIES = 10;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const HEALTH_CHECK_INTERVAL_MS = 30000;

export interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  onMessage: (event: MessageEvent) => void;
  onOpen?: (send: (data: string | Blob) => void) => void;
  onClose?: () => void;
  reconnect?: boolean;
  maxRetries?: number;
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (data: string | Blob) => void;
  disconnect: () => void;
  retryCount: number;
  lastMessageTime: number;
  connectionHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export function useWebSocket({
  url,
  enabled = true,
  onMessage,
  onOpen,
  onClose,
  reconnect = true,
  maxRetries = DEFAULT_MAX_RETRIES,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState<
    'healthy' | 'degraded' | 'unhealthy'
  >('healthy');

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const retryCountRef = useRef(0);
  const lastMessageTimeRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const isMountedRef = useRef(true);

  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  // Keep callback refs current without assigning to refs during render.
  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [onMessage, onOpen, onClose]);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const clearHealthCheckInterval = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  const startHealthCheck = useCallback(() => {
    clearHealthCheckInterval();

    healthCheckIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;

      const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;

      if (timeSinceLastMessage > HEALTH_CHECK_INTERVAL_MS * 2) {
        setConnectionHealth('unhealthy');
      } else if (timeSinceLastMessage > HEALTH_CHECK_INTERVAL_MS) {
        setConnectionHealth('degraded');
      } else {
        setConnectionHealth('healthy');
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }, [clearHealthCheckInterval]);

  const send = useCallback((data: string | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;

    clearRetryTimeout();
    clearConnectTimeout();
    clearHealthCheckInterval();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
    setConnectionHealth('unhealthy');
  }, [clearRetryTimeout, clearConnectTimeout, clearHealthCheckInterval]);

  useEffect(() => {
    if (!enabled) return;

    intentionalCloseRef.current = false;
    isMountedRef.current = true;

    clearRetryTimeout();
    clearConnectTimeout();
    clearHealthCheckInterval();

    const connect = () => {
      if (!isMountedRef.current) return;

      if (wsRef.current) {
        wsRef.current.close();
      }

      setStatus('connecting');

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }

        console.log(`[WebSocket] Connected to ${url}`);

        setStatus('connected');
        retryCountRef.current = 0;
        setRetryCount(0);

        lastMessageTimeRef.current = Date.now();
        setLastMessageTime(lastMessageTimeRef.current);
        setConnectionHealth('healthy');

        onOpenRef.current?.(send);

        startHealthCheck();
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        lastMessageTimeRef.current = Date.now();
        setLastMessageTime(lastMessageTimeRef.current);
        setConnectionHealth('healthy');

        onMessageRef.current(event);
      };

      ws.onerror = (error) => {
        if (!isMountedRef.current) return;

        console.error(`[WebSocket] Error for ${url}:`, error);
        setStatus('error');
        setConnectionHealth('unhealthy');
      };

      ws.onclose = (event) => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        onCloseRef.current?.();
        clearHealthCheckInterval();

        if (intentionalCloseRef.current || !isMountedRef.current) {
          setStatus('disconnected');
          return;
        }

        console.log(
          `[WebSocket] Closed for ${url}. Code: ${event.code}, Reason: ${event.reason}`,
        );

        setStatus('disconnected');
        setConnectionHealth('unhealthy');

        if (reconnect && retryCountRef.current < maxRetries) {
          const delay = Math.min(
            BASE_RETRY_DELAY_MS * Math.pow(2, retryCountRef.current),
            MAX_RETRY_DELAY_MS,
          );

          retryCountRef.current += 1;
          setRetryCount(retryCountRef.current);

          console.log(
            `[WebSocket] Retrying connection to ${url} in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`,
          );

          retryTimeoutRef.current = setTimeout(connect, delay);
        } else if (retryCountRef.current >= maxRetries) {
          console.error(`[WebSocket] Max retries reached for ${url}`);
          setStatus('error');
        }
      };
    };

    // Delay the initial connection to avoid React StrictMode double-mount races.
    connectTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      retryCountRef.current = 0;
      setRetryCount(0);

      lastMessageTimeRef.current = 0;
      setLastMessageTime(0);
      setConnectionHealth('healthy');

      connect();
    }, 100);

    return () => {
      isMountedRef.current = false;
      intentionalCloseRef.current = true;

      // Clear pending timeouts directly so ESLint can verify cleanup.
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (connectTimeoutRef.current !== null) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      clearHealthCheckInterval();

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    clearRetryTimeout,
    clearConnectTimeout,
    clearHealthCheckInterval,
    enabled,
    maxRetries,
    reconnect,
    send,
    startHealthCheck,
    url,
  ]);

  return {
    status: enabled ? status : 'disconnected',
    send,
    disconnect,
    retryCount: enabled ? retryCount : 0,
    lastMessageTime,
    connectionHealth: enabled ? connectionHealth : 'unhealthy',
  };
}
