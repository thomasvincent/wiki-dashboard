/**
 * Online Status Hook
 * Detects and reacts to network connectivity changes
 * Provides offline-first UX patterns
 */

import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
  /** Whether the browser reports online status */
  isOnline: boolean;
  /** Whether we've verified actual connectivity (not just browser status) */
  isConnected: boolean;
  /** Timestamp of last successful connectivity check */
  lastOnline: Date | null;
  /** Whether currently checking connectivity */
  isChecking: boolean;
  /** Manually trigger a connectivity check */
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook to monitor and verify network connectivity
 * @param checkUrl - URL to ping for connectivity verification (defaults to Wikipedia API)
 * @param checkInterval - Interval in ms to verify connectivity when online (0 = disabled)
 */
export function useOnlineStatus(
  checkUrl = 'https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*',
  checkInterval = 0
): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isConnected, setIsConnected] = useState(isOnline);
  const [lastOnline, setLastOnline] = useState<Date | null>(isOnline ? new Date() : null);
  const [isChecking, setIsChecking] = useState(false);

  // Verify actual connectivity by pinging the server
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (isChecking) return isConnected;

    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(checkUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // no-cors mode returns opaque response, but if we get here, we're connected
      const connected = response.type === 'opaque' || response.ok;
      setIsConnected(connected);
      if (connected) {
        setLastOnline(new Date());
      }
      return connected;
    } catch {
      setIsConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [checkUrl, isChecking, isConnected]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verify actual connectivity when browser reports online
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connectivity check
    if (isOnline) {
      checkConnection();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, isOnline]);

  // Periodic connectivity verification when online
  useEffect(() => {
    if (!checkInterval || !isOnline) return;

    const intervalId = setInterval(() => {
      checkConnection();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval, isOnline, checkConnection]);

  return {
    isOnline,
    isConnected,
    lastOnline,
    isChecking,
    checkConnection,
  };
}

/**
 * Simple hook that just returns boolean online status
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus();
  return isOnline;
}

export default useOnlineStatus;
