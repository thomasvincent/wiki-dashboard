/**
 * React Query Hooks
 * Data fetching with caching, refetching, and error handling
 * Follows React Query best practices for 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardRepository } from '@infrastructure/repositories';
import { DEFAULT_CONFIG } from '@domain/repositories';
import { wikipediaApi } from '@infrastructure/api/wikipedia-client';
import { wikimediaRestApi } from '@infrastructure/api/wikimedia-rest-client';
import { useDashboardStore } from './store';
import type { EditorDashboard } from '@domain/entities';

// === Query Keys ===

export const queryKeys = {
  dashboard: (username: string) => ['dashboard', username] as const,
  contributions: (username: string) => ['contributions', username] as const,
  drafts: (username: string) => ['drafts', username] as const,
  stats: (username: string) => ['stats', username] as const,
  editStreak: (username: string) => ['editStreak', username] as const,
  topEdits: (username: string) => ['topEdits', username] as const,
  namespaceTotals: (username: string) => ['namespaceTotals', username] as const,
  monthCounts: (username: string) => ['monthCounts', username] as const,
  thanksReceived: (username: string) => ['thanksReceived', username] as const,
  thanksGiven: (username: string) => ['thanksGiven', username] as const,
  articlesCreated: (username: string) => ['articlesCreated', username] as const,
  wikiProjects: (username: string) => ['wikiProjects', username] as const,
  pageViews: (titles: string[]) => ['pageViews', titles] as const,
  pageAssessments: (titles: string[]) => ['pageAssessments', titles] as const,
  recentEdits: (username: string) => ['recentEdits', username] as const,
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

// === Edit Streak Hook ===

export function useEditStreak(username: string = DEFAULT_CONFIG.username, days = 365) {
  return useQuery({
    queryKey: queryKeys.editStreak(username),
    queryFn: () => wikipediaApi.getUserEditStreak(username, days),
    staleTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// === Top Edits Hook ===

export function useTopEdits(username: string = DEFAULT_CONFIG.username, limit = 10) {
  return useQuery({
    queryKey: queryKeys.topEdits(username),
    queryFn: () => wikipediaApi.getXToolsTopEdits(username, 0, limit),
    staleTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// === Namespace Totals Hook ===

export function useNamespaceTotals(username: string = DEFAULT_CONFIG.username) {
  return useQuery({
    queryKey: queryKeys.namespaceTotals(username),
    queryFn: () => wikipediaApi.getXToolsNamespaceTotals(username),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Monthly Edit Counts Hook ===

export function useMonthCounts(username: string = DEFAULT_CONFIG.username) {
  return useQuery({
    queryKey: queryKeys.monthCounts(username),
    queryFn: () => wikipediaApi.getXToolsMonthCounts(username),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Thanks Received Hook ===

export function useThanksReceived(username: string = DEFAULT_CONFIG.username, limit = 50) {
  return useQuery({
    queryKey: queryKeys.thanksReceived(username),
    queryFn: () => wikipediaApi.getThanksReceived(username, limit),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Thanks Given Hook ===

export function useThanksGiven(username: string = DEFAULT_CONFIG.username, limit = 50) {
  return useQuery({
    queryKey: queryKeys.thanksGiven(username),
    queryFn: () => wikipediaApi.getThanksGiven(username, limit),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Articles Created Hook ===

export function useArticlesCreated(username: string = DEFAULT_CONFIG.username, limit = 100) {
  return useQuery({
    queryKey: queryKeys.articlesCreated(username),
    queryFn: () => wikipediaApi.getArticlesCreated(username, 0, limit),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === WikiProjects Hook ===

export function useWikiProjects(username: string = DEFAULT_CONFIG.username) {
  return useQuery({
    queryKey: queryKeys.wikiProjects(username),
    queryFn: () => wikipediaApi.getUserWikiProjects(username),
    staleTime: 30 * 60_000, // 30 minutes - projects don't change often
    refetchOnWindowFocus: false,
  });
}

// === Page Views Hook ===

export function usePageViews(titles: string[], days = 30) {
  return useQuery({
    queryKey: queryKeys.pageViews(titles),
    queryFn: () => wikimediaRestApi.getMultiplePageViews(titles, days),
    staleTime: 60 * 60_000, // 1 hour - pageviews update daily
    refetchOnWindowFocus: false,
    enabled: titles.length > 0,
  });
}

// === Impact Metrics Hook ===

export function useImpactMetrics(articleTitles: string[], days = 30) {
  return useQuery({
    queryKey: ['impactMetrics', articleTitles, days],
    queryFn: () => wikimediaRestApi.getImpactMetrics(articleTitles, days),
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    enabled: articleTitles.length > 0,
  });
}

// === Page Assessments Hook ===

export function usePageAssessments(titles: string[]) {
  return useQuery({
    queryKey: queryKeys.pageAssessments(titles),
    queryFn: () => wikipediaApi.getPageAssessments(titles),
    staleTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    enabled: titles.length > 0,
  });
}

// === Recent Edits Hook (for Watchlist-like view) ===

export function useRecentEdits(username: string = DEFAULT_CONFIG.username, days = 7) {
  return useQuery({
    queryKey: queryKeys.recentEdits(username),
    queryFn: () => wikipediaApi.getUserRecentEdits(username, days),
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Auto-refresh every 5 minutes
  });
}
