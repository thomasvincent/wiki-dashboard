/**
 * React Query Hooks
 * Data fetching with caching, refetching, and error handling
 * Follows React Query best practices - let React Query manage state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDashboardRepository } from '@infrastructure/repositories';
import { DEFAULT_CONFIG } from '@domain/repositories';
import { wikipediaApi } from '@infrastructure/api/wikipedia-client';
import { wikimediaRestApi } from '@infrastructure/api/wikimedia-rest-client';
import { useSettingsStore } from './store';
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

// === Repository Instance (Singleton) ===

const dashboardRepo = createDashboardRepository(DEFAULT_CONFIG);

// === Custom hook to get configured username ===

export function useConfiguredUsername(): string {
  const { configuredUsername } = useSettingsStore();
  return configuredUsername;
}

// === Dashboard Hook ===
// Let React Query manage loading/error state - no manual Zustand sync

export function useDashboard(username?: string) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.dashboard(effectiveUsername),
    queryFn: (): Promise<EditorDashboard> => dashboardRepo.getDashboard(effectiveUsername),
    staleTime: 60_000, // Consider data fresh for 1 minute
    refetchInterval: DEFAULT_CONFIG.refreshIntervalMs, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// === Refresh Dashboard Mutation ===

export function useRefreshDashboard(username?: string) {
  const queryClient = useQueryClient();
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useMutation({
    mutationFn: (): Promise<EditorDashboard> => dashboardRepo.refreshDashboard(effectiveUsername),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.dashboard(effectiveUsername), data);
    },
  });
}

// === Prefetch Hook ===

export function usePrefetchDashboard(username?: string) {
  const queryClient = useQueryClient();
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard(effectiveUsername),
      queryFn: () => dashboardRepo.getDashboard(effectiveUsername),
      staleTime: 60_000,
    });
  };
}

// === Time Since Last Update ===
// Uses React Query's dataUpdatedAt instead of manual Zustand tracking

export function useTimeSinceUpdate(): string {
  const configuredUsername = useConfiguredUsername();
  const { dataUpdatedAt } = useQuery({
    queryKey: queryKeys.dashboard(configuredUsername),
    queryFn: () => dashboardRepo.getDashboard(configuredUsername),
    staleTime: 60_000,
  });

  if (!dataUpdatedAt) return 'Never';

  const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// === Edit Streak Hook ===

export function useEditStreak(username?: string, days = 365) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.editStreak(effectiveUsername),
    queryFn: () => wikipediaApi.getUserEditStreak(effectiveUsername, days),
    staleTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// === Top Edits Hook ===

export function useTopEdits(username?: string, limit = 10) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.topEdits(effectiveUsername),
    queryFn: () => wikipediaApi.getXToolsTopEdits(effectiveUsername, 0, limit),
    staleTime: 10 * 60_000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// === Namespace Totals Hook ===

export function useNamespaceTotals(username?: string) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.namespaceTotals(effectiveUsername),
    queryFn: () => wikipediaApi.getXToolsNamespaceTotals(effectiveUsername),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Monthly Edit Counts Hook ===

export function useMonthCounts(username?: string) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.monthCounts(effectiveUsername),
    queryFn: () => wikipediaApi.getXToolsMonthCounts(effectiveUsername),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Thanks Received Hook ===

export function useThanksReceived(username?: string, limit = 50) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.thanksReceived(effectiveUsername),
    queryFn: () => wikipediaApi.getThanksReceived(effectiveUsername, limit),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Thanks Given Hook ===

export function useThanksGiven(username?: string, limit = 50) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.thanksGiven(effectiveUsername),
    queryFn: () => wikipediaApi.getThanksGiven(effectiveUsername, limit),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === Articles Created Hook ===

export function useArticlesCreated(username?: string, limit = 100) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.articlesCreated(effectiveUsername),
    queryFn: () => wikipediaApi.getArticlesCreated(effectiveUsername, 0, limit),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// === WikiProjects Hook ===

export function useWikiProjects(username?: string) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.wikiProjects(effectiveUsername),
    queryFn: () => wikipediaApi.getUserWikiProjects(effectiveUsername),
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

export function useRecentEdits(username?: string, days = 7) {
  const configuredUsername = useConfiguredUsername();
  const effectiveUsername = username ?? configuredUsername;

  return useQuery({
    queryKey: queryKeys.recentEdits(effectiveUsername),
    queryFn: () => wikipediaApi.getUserRecentEdits(effectiveUsername, days),
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Auto-refresh every 5 minutes
  });
}
