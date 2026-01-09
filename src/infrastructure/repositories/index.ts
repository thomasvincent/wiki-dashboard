/**
 * Repository Implementations
 * Adapts Wikipedia API responses to domain entities
 * Implements caching for performance
 */

import type {
  WikiUser,
  Contribution,
  ContributionType,
  EditorStats,
  DailyActivity,
  EditorDashboard,
} from '@domain/entities';
import type {
  IUserRepository,
  IContributionRepository,
  IStatsRepository,
  IDashboardRepository,
  DashboardConfig,
} from '@domain/repositories';
import { wikipediaApi, type UserContribsResponse } from '../api/wikipedia-client';

// === Cache Implementation ===

interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// === User Repository ===

export class UserRepository implements IUserRepository {
  private readonly cache = new SimpleCache<WikiUser>(300_000); // 5 min cache

  async getUser(username: string): Promise<WikiUser> {
    const cached = this.cache.get(username);
    if (cached) return cached;

    const userInfo = await wikipediaApi.getUserInfo(username);

    const user: WikiUser = {
      username: userInfo.name,
      userId: userInfo.userid,
      registrationDate: new Date(userInfo.registration),
      editCount: userInfo.editcount,
      groups: userInfo.groups,
    };

    this.cache.set(username, user);
    return user;
  }

  async getEditCount(username: string): Promise<number> {
    const user = await this.getUser(username);
    return user.editCount;
  }
}

// === Contribution Repository ===

function mapContributionType(contrib: UserContribsResponse): ContributionType {
  // Namespace-based detection
  if (contrib.ns === 1 || contrib.ns === 3 || contrib.ns === 5) {
    return 'talk_page';
  }

  // Check tags for reverts
  if (contrib.tags.some((t) => t.includes('revert') || t.includes('undo'))) {
    return 'revert';
  }

  // Size-based detection
  if (contrib.parentid === 0) {
    return 'new_article';
  }

  if (Math.abs(contrib.sizediff) > 1000) {
    return 'major_expansion';
  }

  return 'minor_edit';
}

export class ContributionRepository implements IContributionRepository {
  private readonly cache = new SimpleCache<Contribution[]>(60_000); // 1 min cache

  async getRecentContributions(username: string, limit = 50): Promise<readonly Contribution[]> {
    const cacheKey = `${username}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await wikipediaApi.getUserContribs(username, limit);

    const contributions: Contribution[] = response.data.map((c) => ({
      revisionId: c.revid,
      articleTitle: c.title,
      articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(c.title.replace(/ /g, '_'))}`,
      timestamp: new Date(c.timestamp),
      type: mapContributionType(c),
      byteDiff: c.sizediff,
      summary: c.comment,
      isMinor: c.minor ?? false,
      tags: c.tags,
    }));

    this.cache.set(cacheKey, contributions);
    return contributions;
  }

  async getContributionsByDateRange(
    username: string,
    startDate: Date,
    endDate: Date
  ): Promise<readonly Contribution[]> {
    // For now, fetch all and filter client-side
    // TODO: Use API date parameters for efficiency
    const all = await this.getRecentContributions(username, 500);
    return all.filter((c) => c.timestamp >= startDate && c.timestamp <= endDate);
  }

  async getContributionsForArticle(
    username: string,
    articleTitle: string
  ): Promise<readonly Contribution[]> {
    const all = await this.getRecentContributions(username, 500);
    return all.filter((c) => c.articleTitle === articleTitle);
  }
}

// === Stats Repository ===

export class StatsRepository implements IStatsRepository {
  constructor(private readonly contributionRepo: ContributionRepository) {}

  async getEditorStats(username: string): Promise<EditorStats> {
    const [xtoolsData, contributions] = await Promise.all([
      wikipediaApi.getXToolsEditCount(username),
      this.contributionRepo.getRecentContributions(username, 100),
    ]);

    const recentActivity = await this.getDailyActivity(username, 30);

    // Calculate stats from contributions
    let articlesCreated = 0;
    let majorExpansions = 0;
    let minorEdits = 0;
    let talkPagePosts = 0;

    for (const c of contributions) {
      switch (c.type) {
        case 'new_article':
          articlesCreated++;
          break;
        case 'major_expansion':
          majorExpansions++;
          break;
        case 'minor_edit':
          minorEdits++;
          break;
        case 'talk_page':
          talkPagePosts++;
          break;
      }
    }

    return {
      totalEdits: xtoolsData.live_edit_count,
      articlesCreated,
      majorExpansions,
      minorEdits,
      talkPagePosts,
      recentActivity,
    };
  }

  async getDailyActivity(username: string, days = 30): Promise<readonly DailyActivity[]> {
    const contributions = await this.contributionRepo.getRecentContributions(username, 500);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const dailyMap = new Map<string, { editCount: number; bytesAdded: number }>();

    for (const c of contributions) {
      if (c.timestamp < cutoffDate) continue;

      const dateKey = c.timestamp.toISOString().split('T')[0]!;
      const existing = dailyMap.get(dateKey) ?? { editCount: 0, bytesAdded: 0 };

      dailyMap.set(dateKey, {
        editCount: existing.editCount + 1,
        bytesAdded: existing.bytesAdded + Math.max(0, c.byteDiff),
      });
    }

    return Array.from(dailyMap.entries())
      .map(([dateStr, data]) => ({
        date: new Date(dateStr),
        editCount: data.editCount,
        bytesAdded: data.bytesAdded,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

// === Dashboard Repository (Aggregate) ===
// Note: Local data (drafts, tasks, focusAreas, coiDisclosures) is managed by Zustand stores
// This repository only fetches server data (user, stats, contributions)

export class DashboardRepository implements IDashboardRepository {
  private readonly cache = new SimpleCache<EditorDashboard>(60_000);

  constructor(
    private readonly config: DashboardConfig,
    private readonly userRepo: UserRepository,
    private readonly contributionRepo: ContributionRepository,
    private readonly statsRepo: StatsRepository
  ) {}

  async getDashboard(username: string): Promise<EditorDashboard> {
    const cached = this.cache.get(username);
    if (cached) return cached;

    return this.refreshDashboard(username);
  }

  async refreshDashboard(username: string): Promise<EditorDashboard> {
    const [user, stats, contributions] = await Promise.all([
      this.userRepo.getUser(username),
      this.statsRepo.getEditorStats(username),
      this.contributionRepo.getRecentContributions(username, this.config.maxRecentContributions),
    ]);

    // Note: drafts, focusAreas, tasks, coiDisclosures come from Zustand stores
    // They are merged in the UI layer, not here
    const dashboard: EditorDashboard = {
      user,
      stats,
      drafts: [], // From useDraftStore
      recentContributions: contributions,
      focusAreas: [], // From useFocusAreaStore
      tasks: [], // From useTaskStore
      coiDisclosures: [], // From useCoiStore
      lastUpdated: new Date(),
    };

    this.cache.set(username, dashboard);
    return dashboard;
  }
}

// === Singleton Instances (Shared Caches) ===
// All repositories share the same instances to maximize cache hits

const userRepoInstance = new UserRepository();
const contributionRepoInstance = new ContributionRepository();
const statsRepoInstance = new StatsRepository(contributionRepoInstance);

/**
 * Creates a DashboardRepository with shared singleton dependencies.
 * This ensures all caches are shared across the application.
 */
export function createDashboardRepository(config: DashboardConfig): DashboardRepository {
  return new DashboardRepository(
    config,
    userRepoInstance,
    contributionRepoInstance,
    statsRepoInstance
  );
}
