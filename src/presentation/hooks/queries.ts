/**
 * React Query Hooks
 * Data fetching with caching, refetching, and error handling
 * Follows React Query best practices for 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardRepository } from '@infrastructure/repositories';
import { DEFAULT_CONFIG } from '@domain/repositories';
import { useDashboardStore } from './store';
import type { EditorDashboard } from '@domain/entities';

// === Query Keys ===

export const queryKeys = {
  dashboard: (username: string) => ['dashboard', username] as const,
  contributions: (username: string) => ['contributions', username] as const,
  drafts: (username: string) => ['drafts', username] as const,
  stats: (username: string) => ['stats', username] as const,
} as const;

// === Repository Instance ===

const dashboardRepo = new DashboardRepository(DEFAULT_CONFIG);

// === Dashboard Hook ===

export function useDashboard(username: string = DEFAULT_CONFIG.username) {
  const { setDashboard, setLoading, setError } = useDashboardStore();

  return useQuery({
    queryKey: queryKeys.dashboard(username),
    queryFn: async (): Promise<EditorDashboard> => {
      setLoading(true);
      try {
        const dashboard = await dashboardRepo.getDashboard(username);
        setDashboard(dashboard);
        return dashboard;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load dashboard';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 60_000, // Consider data fresh for 1 minute
    refetchInterval: DEFAULT_CONFIG.refreshIntervalMs, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// === Refresh Dashboard Mutation ===

export function useRefreshDashboard(username: string = DEFAULT_CONFIG.username) {
  const queryClient = useQueryClient();
  const { setDashboard, setLoading, setError } = useDashboardStore();

  return useMutation({
    mutationFn: async (): Promise<EditorDashboard> => {
      setLoading(true);
      try {
        const dashboard = await dashboardRepo.refreshDashboard(username);
        setDashboard(dashboard);
        return dashboard;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh dashboard';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.dashboard(username), data);
    },
  });
}

// === Prefetch Hook ===

export function usePrefetchDashboard(username: string = DEFAULT_CONFIG.username) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard(username),
      queryFn: () => dashboardRepo.getDashboard(username),
      staleTime: 60_000,
    });
  };
}

// === Time Since Last Update ===

export function useTimeSinceUpdate(): string {
  const { lastRefresh } = useDashboardStore();

  if (!lastRefresh) return 'Never';

  const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
