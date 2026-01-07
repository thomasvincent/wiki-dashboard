/**
 * Repository Implementations
 * Adapts Wikipedia API responses to domain entities
 * Implements caching for performance
 */

import type {
  WikiUser,
  Draft,
  Contribution,
  ContributionType,
  EditorStats,
  DailyActivity,
  EditorDashboard,
  FocusArea,
  Task,
  CoiDisclosure,
} from '@domain/entities';
import type {
  IUserRepository,
  IDraftRepository,
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
  private readonly contributionRepo = new ContributionRepository();
  
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

export class DashboardRepository implements IDashboardRepository {
  private readonly userRepo = new UserRepository();
  private readonly contributionRepo = new ContributionRepository();
  private readonly statsRepo = new StatsRepository();
  private readonly cache = new SimpleCache<EditorDashboard>(60_000);
  
  // These would come from local storage or a backend in production
  private drafts: Draft[] = [];
  private focusAreas: FocusArea[] = [];
  private tasks: Task[] = [];
  private coiDisclosures: CoiDisclosure[] = [];
  
  constructor(private readonly config: DashboardConfig) {
    this.initializeMockData();
  }
  
  private initializeMockData(): void {
    // Initialize with user's actual data structure
    this.drafts = [
      {
        id: '1',
        title: 'Joseph Bennion',
        pageUrl: 'https://en.wikipedia.org/wiki/Draft:Joseph_Bennion',
        talkPageUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Joseph_Bennion',
        status: 'pending_review',
        createdAt: new Date('2026-01-01'),
        lastEditedAt: new Date('2026-01-01'),
        submittedAt: new Date('2026-01-01'),
        coiDisclosed: true,
        coiDetails: 'Personal acquaintance',
        notes: 'Submitted via AfC wizard',
        afcLogUrl: 'https://en.wikipedia.org/wiki/Special:Log?type=review&page=Draft%3AJoseph+Bennion',
      },
      {
        id: '2',
        title: 'Lee Udall Bennion',
        pageUrl: 'https://en.wikipedia.org/wiki/Draft:Lee_Udall_Bennion',
        talkPageUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Lee_Udall_Bennion',
        status: 'under_review',
        createdAt: new Date('2026-01-01'),
        lastEditedAt: new Date('2026-01-01'),
        submittedAt: new Date('2026-01-01'),
        coiDisclosed: true,
        coiDetails: 'Personal acquaintance',
        notes: 'Reviewer feedback received on secondary sources',
        afcLogUrl: 'https://en.wikipedia.org/wiki/Special:Log?type=review&page=Draft%3ALee+Udall+Bennion',
      },
      {
        id: '3',
        title: 'Jeffery Hotel',
        pageUrl: 'https://en.wikipedia.org/wiki/User:Sparks19923/Jeffery_Hotel',
        talkPageUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923/Jeffery_Hotel',
        status: 'in_development',
        createdAt: new Date('2025-12-31'),
        lastEditedAt: new Date('2025-12-31'),
        submittedAt: null,
        coiDisclosed: true,
        coiDetails: 'Distant descendant of founder',
        notes: 'NRHP-listed hotel',
        afcLogUrl: null,
      },
    ];
    
    this.focusAreas = [
      {
        id: '1',
        name: 'Boarding Schools',
        description: 'Educational institutions - prep schools',
        status: 'active',
        articles: [
          { title: 'Wasatch Academy', url: 'https://en.wikipedia.org/wiki/Wasatch_Academy', status: 'start', lastEdited: new Date('2025-12-28') },
          { title: 'Deerfield Academy', url: 'https://en.wikipedia.org/wiki/Deerfield_Academy', status: 'start', lastEdited: new Date('2026-01-06') },
        ],
        wikiProjects: ['WikiProject Schools'],
      },
      {
        id: '2',
        name: 'Cherokee History',
        description: 'Cherokee history and Native American leaders',
        status: 'active',
        articles: [
          { title: 'Yonaguska', url: 'https://en.wikipedia.org/wiki/Yonaguska', status: 'start', lastEdited: new Date('2025-12-30') },
          { title: 'Middle Towns (Cherokee)', url: '', status: 'draft', lastEdited: null },
          { title: 'Lower Towns (Cherokee)', url: '', status: 'draft', lastEdited: null },
        ],
        wikiProjects: ['WikiProject Indigenous peoples of North America'],
      },
      {
        id: '3',
        name: 'California Gold Rush',
        description: 'Historic buildings and districts in Gold Country',
        status: 'planned',
        articles: [
          { title: 'Jeffery Hotel', url: '', status: 'draft', lastEdited: null },
          { title: 'Coulterville Main Street Historic District', url: '', status: 'draft', lastEdited: null },
        ],
        wikiProjects: ['WikiProject California', 'WikiProject National Register of Historic Places'],
      },
      {
        id: '4',
        name: 'Sanpete County, Utah',
        description: 'Utah regional content - Feb 2026 targets',
        status: 'planned',
        articles: [
          { title: 'Liberal Hall', url: '', status: 'draft', lastEdited: null },
          { title: 'First Presbyterian Church (Mt. Pleasant)', url: '', status: 'draft', lastEdited: null },
        ],
        wikiProjects: ['WikiProject Utah'],
      },
    ];
    
    this.tasks = [
      { id: '1', title: 'Complete Jeffery Hotel draft', description: 'Finish NRHP article and prepare for AfC', priority: 'high', status: 'not_started', dueDate: new Date('2026-01-31'), relatedArticles: ['Jeffery Hotel'], createdAt: new Date('2025-12-31'), completedAt: null },
      { id: '2', title: 'Complete Coulterville HD draft', description: 'Finish historic district article', priority: 'high', status: 'not_started', dueDate: new Date('2026-01-31'), relatedArticles: ['Coulterville Main Street Historic District'], createdAt: new Date('2025-12-31'), completedAt: null },
      { id: '3', title: 'Create Middle Towns (Cherokee)', description: 'Parallel to Overhill Cherokee article', priority: 'medium', status: 'not_started', dueDate: new Date('2026-01-17'), relatedArticles: ['Middle Towns (Cherokee)'], createdAt: new Date('2025-12-30'), completedAt: null },
      { id: '4', title: 'Monitor Bennion AfC submissions', description: 'Check for reviewer feedback', priority: 'high', status: 'in_progress', dueDate: null, relatedArticles: ['Joseph Bennion', 'Lee Udall Bennion'], createdAt: new Date('2026-01-01'), completedAt: null },
      { id: '5', title: 'Sanpete Wikidata enhancements', description: 'Add properties to municipality items', priority: 'low', status: 'not_started', dueDate: new Date('2026-02-19'), relatedArticles: [], createdAt: new Date('2025-12-30'), completedAt: null },
    ];
    
    this.coiDisclosures = [
      { id: '1', subject: 'Wasatch Academy', relationship: 'Alumnus & Advancement Committee member', disclosureUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923', disclosedAt: new Date('2025-12-31'), isActive: true },
      { id: '2', subject: 'Jeffery Hotel', relationship: 'Distant descendant of founder', disclosureUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923', disclosedAt: new Date('2025-12-31'), isActive: true },
      { id: '3', subject: 'Joseph Bennion', relationship: 'Personal acquaintance', disclosureUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Joseph_Bennion', disclosedAt: new Date('2026-01-01'), isActive: true },
      { id: '4', subject: 'Lee Udall Bennion', relationship: 'Personal acquaintance', disclosureUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Lee_Udall_Bennion', disclosedAt: new Date('2026-01-01'), isActive: true },
    ];
  }
  
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
    
    const dashboard: EditorDashboard = {
      user,
      stats,
      drafts: this.drafts,
      recentContributions: contributions,
      focusAreas: this.focusAreas,
      tasks: this.tasks,
      coiDisclosures: this.coiDisclosures,
      lastUpdated: new Date(),
    };
    
    this.cache.set(username, dashboard);
    return dashboard;
  }
}
