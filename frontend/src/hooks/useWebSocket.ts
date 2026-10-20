import { useState, useEffect, useRef, useCallback } from 'react';
import { NetworkEvent } from '../types';
import { api } from '../services/api';

const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return 'ws://localhost:8000/ws/network-events';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/network-events`;
  }
  return 'ws://localhost:8000/ws/network-events';
};

interface UseWebSocketOptions {
  onEvent?: (event: NetworkEvent) => void;
  enablePollingFallback?: boolean;
  pollingIntervalMs?: number;
}

export function useWebSocket({
  onEvent,
  enablePollingFallback = true,
  pollingIntervalMs = 5000,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<NetworkEvent | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  const handleIncomingEvent = useCallback(
    (event: NetworkEvent) => {
      if (!event.event_id || seenEventIdsRef.current.has(event.event_id)) {
        return; // Deduplicate
      }
      seenEventIdsRef.current.add(event.event_id);
      // Keep seen set bounded
      if (seenEventIdsRef.current.size > 500) {
        const arr = Array.from(seenEventIdsRef.current);
        seenEventIdsRef.current = new Set(arr.slice(arr.length - 200));
      }
      setLastEvent(event);
      if (onEvent) onEvent(event);
    },
    [onEvent]
  );

  // Poll fallback
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) return;
    setConnectionMode('polling');

    const poll = async () => {
      try {
        const events = await api.getEvents({ limit: 5 });
        if (events && events.length > 0) {
          // Process in chronological order
          const reversed = [...events].reverse();
          for (const ev of reversed) {
            handleIncomingEvent(ev);
          }
        }
      } catch {
        // quiet error during background polling
      }
    };

    poll();
    pollingTimerRef.current = setInterval(poll, pollingIntervalMs);
  }, [handleIncomingEvent, pollingIntervalMs]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Connect WebSocket
  const connectWs = useCallback(() => {
    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionMode('websocket');
        reconnectAttemptRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event_id) {
            handleIncomingEvent(parsed);
          }
        } catch {
          // ignore non-JSON ping/pong messages
        }
      };

      ws.onerror = () => {
        // Trigger close to initiate reconnect or fallback
        ws.close();
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;

        // Exponential backoff reconnect
        const attempt = reconnectAttemptRef.current;
        if (attempt < 5) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
          reconnectAttemptRef.current += 1;
          reconnectTimerRef.current = setTimeout(connectWs, delay);
        } else {
          // Switch to HTTP polling fallback
          if (enablePollingFallback) {
            startPolling();
          } else {
            setConnectionMode('disconnected');
          }
        }
      };
    } catch {
      if (enablePollingFallback) {
        startPolling();
      }
    }
  }, [enablePollingFallback, handleIncomingEvent, startPolling, stopPolling]);

  useEffect(() => {
    connectWs();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopPolling();
    };
  }, [connectWs, stopPolling]);

  return { isConnected, connectionMode, lastEvent };
}
