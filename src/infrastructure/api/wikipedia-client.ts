/**
 * Wikipedia API Client
 * Handles all HTTP communication with Wikipedia's MediaWiki API
 * Implements retry logic and rate limiting
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const XTOOLS_API_BASE = 'https://xtools.wmcloud.org/api';

export interface WikiApiResponse<T> {
  readonly data: T;
  readonly continue?: Record<string, string>;
}

export interface UserInfoResponse {
  readonly userid: number;
  readonly name: string;
  readonly registration: string;
  readonly editcount: number;
  readonly groups: string[];
}

export interface UserContribsResponse {
  readonly userid: number;
  readonly user: string;
  readonly pageid: number;
  readonly revid: number;
  readonly parentid: number;
  readonly ns: number;
  readonly title: string;
  readonly timestamp: string;
  readonly comment: string;
  readonly size: number;
  readonly sizediff: number;
  readonly minor?: boolean;
  readonly tags: string[];
}

export interface XToolsEditCountResponse {
  readonly username: string;
  readonly user_id: number;
  readonly live_edit_count: number;
  readonly deleted_edit_count: number;
  readonly first_edit: string;
  readonly latest_edit: string;
}

// === Watchlist/Recent Changes Types ===

export interface RecentChangeResponse {
  readonly type: string;
  readonly ns: number;
  readonly title: string;
  readonly pageid: number;
  readonly revid: number;
  readonly old_revid: number;
  readonly rcid: number;
  readonly user: string;
  readonly oldlen: number;
  readonly newlen: number;
  readonly timestamp: string;
  readonly comment: string;
  readonly tags: string[];
}

// === Page Assessment Types ===

export interface PageAssessmentResponse {
  readonly [project: string]: {
    readonly class: string;
    readonly importance: string;
  };
}

// === Category/WikiProject Types ===

export interface CategoryResponse {
  readonly ns: number;
  readonly title: string;
}

// === Log Events Types ===

export interface LogEventResponse {
  readonly logid: number;
  readonly ns: number;
  readonly title: string;
  readonly type: string;
  readonly action: string;
  readonly user: string;
  readonly timestamp: string;
  readonly comment: string;
}

// === Thanks Types ===

export interface ThanksLogResponse {
  readonly logid: number;
  readonly title: string;
  readonly type: string;
  readonly user: string;
  readonly timestamp: string;
}

// === XTools Additional Types ===

export interface XToolsMonthCountsResponse {
  readonly [yearMonth: string]: number;
}

export interface XToolsTopEditsResponse {
  readonly top_edits: Array<{
    readonly page_title: string;
    readonly page_namespace: number;
    readonly count: number;
  }>;
}

export interface XToolsNamespaceResponse {
  readonly namespace_totals: {
    readonly [ns: string]: number;
  };
}

class WikipediaApiClient {
  private readonly client: AxiosInstance;
  private readonly xtoolsClient: AxiosInstance;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 200; // ms between requests (rate limiting)

  constructor() {
    this.client = axios.create({
      baseURL: WIKIPEDIA_API_BASE,
      timeout: 30_000,
      headers: {
        'User-Agent': 'WikiEditorDashboard/1.0 (https://github.com/user/wiki-dashboard)',
      },
      params: {
        format: 'json',
        origin: '*',
      },
    });

    this.xtoolsClient = axios.create({
      baseURL: XTOOLS_API_BASE,
      timeout: 30_000,
      headers: {
        'User-Agent': 'WikiEditorDashboard/1.0',
      },
    });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.rateLimit();
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof AxiosError && error.response?.status === 429) {
          // Rate limited - wait longer
          await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
          continue;
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
        }
      }
    }
    
    throw lastError ?? new Error('Request failed after retries');
  }

  async getUserInfo(username: string): Promise<UserInfoResponse> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'users',
          ususers: username,
          usprop: 'registration|editcount|groups',
        },
      });
      
      const user = response.data?.query?.users?.[0];
      if (!user || user.missing) {
        throw new Error(`User not found: ${username}`);
      }
      
      return user as UserInfoResponse;
    });
  }

  async getUserContribs(
    username: string,
    limit = 50,
    continueToken?: string
  ): Promise<WikiApiResponse<UserContribsResponse[]>> {
    return this.retryRequest(async () => {
      const params: Record<string, string | number> = {
        action: 'query',
        list: 'usercontribs',
        ucuser: username,
        uclimit: limit,
        ucprop: 'ids|title|timestamp|comment|size|sizediff|flags|tags',
      };
      
      if (continueToken) {
        params['uccontinue'] = continueToken;
      }
      
      const response = await this.client.get('', { params });
      
      return {
        data: response.data?.query?.usercontribs ?? [],
        continue: response.data?.continue,
      };
    });
  }

  async getPageInfo(titles: string[]): Promise<Record<string, { pageid: number; ns: number; title: string }>> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          titles: titles.join('|'),
          prop: 'info',
        },
      });
      
      return response.data?.query?.pages ?? {};
    });
  }

  async getXToolsEditCount(username: string): Promise<XToolsEditCountResponse> {
    return this.retryRequest(async () => {
      const response = await this.xtoolsClient.get(
        `/user/simple_editcount/en.wikipedia.org/${encodeURIComponent(username)}`
      );
      return response.data;
    });
  }

  async getUserSubpages(username: string): Promise<string[]> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'allpages',
          apprefix: `${username}/`,
          apnamespace: 2, // User namespace
          aplimit: 100,
        },
      });

      return (response.data?.query?.allpages ?? []).map((p: { title: string }) => p.title);
    });
  }

  // === Recent Changes (Public Watchlist Alternative) ===

  async getRecentChanges(
    titles: string[],
    limit = 50
  ): Promise<WikiApiResponse<RecentChangeResponse[]>> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'recentchanges',
          rctitle: titles.length === 1 ? titles[0] : undefined,
          rclimit: limit,
          rcprop: 'title|ids|sizes|flags|user|timestamp|comment|tags',
          rctype: 'edit|new',
        },
      });

      return {
        data: response.data?.query?.recentchanges ?? [],
        continue: response.data?.continue,
      };
    });
  }

  // === Get user's recently edited pages for watchlist simulation ===

  async getUserRecentEdits(
    username: string,
    days = 7,
    limit = 100
  ): Promise<WikiApiResponse<UserContribsResponse[]>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'usercontribs',
          ucuser: username,
          uclimit: limit,
          ucstart: endDate.toISOString(),
          ucend: startDate.toISOString(),
          ucprop: 'ids|title|timestamp|comment|size|sizediff|flags|tags',
        },
      });

      return {
        data: response.data?.query?.usercontribs ?? [],
        continue: response.data?.continue,
      };
    });
  }

  // === Page Assessments (Article Quality) ===

  async getPageAssessments(
    titles: string[]
  ): Promise<Record<string, PageAssessmentResponse>> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          titles: titles.join('|'),
          prop: 'pageassessments',
          palimit: 'max',
        },
      });

      const pages = response.data?.query?.pages ?? {};
      const result: Record<string, PageAssessmentResponse> = {};

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId];
        if (page.pageassessments) {
          result[page.title] = page.pageassessments;
        }
      }

      return result;
    });
  }

  // === Page Categories ===

  async getPageCategories(title: string): Promise<CategoryResponse[]> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          titles: title,
          prop: 'categories',
          cllimit: 'max',
        },
      });

      const pages = response.data?.query?.pages ?? {};
      const page = Object.values(pages)[0] as { categories?: CategoryResponse[] };
      return page?.categories ?? [];
    });
  }

  // === Thanks Received ===

  async getThanksReceived(
    username: string,
    limit = 50
  ): Promise<ThanksLogResponse[]> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'logevents',
          letype: 'thanks',
          letitle: `User:${username}`,
          lelimit: limit,
          leprop: 'ids|title|type|user|timestamp',
        },
      });

      return response.data?.query?.logevents ?? [];
    });
  }

  // === Thanks Given ===

  async getThanksGiven(
    username: string,
    limit = 50
  ): Promise<ThanksLogResponse[]> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'logevents',
          letype: 'thanks',
          leuser: username,
          lelimit: limit,
          leprop: 'ids|title|type|user|timestamp',
        },
      });

      return response.data?.query?.logevents ?? [];
    });
  }

  // === Get Articles Created by User ===

  async getArticlesCreated(
    username: string,
    namespace = 0,
    limit = 50
  ): Promise<Array<{ title: string; timestamp: string; pageid: number }>> {
    return this.retryRequest(async () => {
      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'usercontribs',
          ucuser: username,
          ucnamespace: namespace,
          uclimit: limit,
          ucshow: 'new',
          ucprop: 'ids|title|timestamp',
        },
      });

      return (response.data?.query?.usercontribs ?? []).map(
        (c: { title: string; timestamp: string; pageid: number }) => ({
          title: c.title,
          timestamp: c.timestamp,
          pageid: c.pageid,
        })
      );
    });
  }

  // === XTools: Monthly Edit Counts ===

  async getXToolsMonthCounts(
    username: string
  ): Promise<XToolsMonthCountsResponse> {
    return this.retryRequest(async () => {
      const response = await this.xtoolsClient.get(
        `/user/month_counts/en.wikipedia.org/${encodeURIComponent(username)}`
      );
      return response.data?.month_counts ?? {};
    });
  }

  // === XTools: Top Edited Pages ===

  async getXToolsTopEdits(
    username: string,
    namespace = 0,
    limit = 10
  ): Promise<XToolsTopEditsResponse['top_edits']> {
    return this.retryRequest(async () => {
      const response = await this.xtoolsClient.get(
        `/user/top_edits/en.wikipedia.org/${encodeURIComponent(username)}/${namespace}/${limit}`
      );
      return response.data?.top_edits ?? [];
    });
  }

  // === XTools: Namespace Totals ===

  async getXToolsNamespaceTotals(
    username: string
  ): Promise<Record<string, number>> {
    return this.retryRequest(async () => {
      const response = await this.xtoolsClient.get(
        `/user/namespace_totals/en.wikipedia.org/${encodeURIComponent(username)}`
      );
      return response.data?.namespace_totals ?? {};
    });
  }

  // === WikiProject membership check ===

  async getUserWikiProjects(username: string): Promise<string[]> {
    return this.retryRequest(async () => {
      // Check user's categories for WikiProject membership
      const response = await this.client.get('', {
        params: {
          action: 'query',
          titles: `User:${username}`,
          prop: 'categories',
          clshow: '!hidden',
          cllimit: 'max',
        },
      });

      const pages = response.data?.query?.pages ?? {};
      const page = Object.values(pages)[0] as { categories?: CategoryResponse[] };
      const categories = page?.categories ?? [];

      // Filter for WikiProject categories
      return categories
        .filter((c: CategoryResponse) =>
          c.title.includes('WikiProject') || c.title.includes('Wikipedians who')
        )
        .map((c: CategoryResponse) => c.title.replace('Category:', ''));
    });
  }

  // === Get edit streak data ===

  async getUserEditStreak(
    username: string,
    days = 365
  ): Promise<{ dates: string[]; currentStreak: number; longestStreak: number }> {
    return this.retryRequest(async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.get('', {
        params: {
          action: 'query',
          list: 'usercontribs',
          ucuser: username,
          uclimit: 'max',
          ucstart: endDate.toISOString(),
          ucend: startDate.toISOString(),
          ucprop: 'timestamp',
        },
      });

      const contribs = response.data?.query?.usercontribs ?? [];
      const editDates = new Set<string>();

      for (const contrib of contribs) {
        if (contrib.timestamp) {
          const dateStr = new Date(contrib.timestamp).toISOString().split('T')[0];
          if (dateStr) {
            editDates.add(dateStr);
          }
        }
      }

      // Calculate streaks
      const sortedDates = Array.from(editDates).sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;
      const today = new Date().toISOString().split('T')[0];

      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        if (lastDate) {
          const diffDays = Math.floor(
            (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = date;

        // Check if this streak is current (includes today or yesterday)
        if (dateStr === today || dateStr === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
          currentStreak = tempStreak;
        }
      }

      return {
        dates: sortedDates,
        currentStreak,
        longestStreak,
      };
    });
  }
}

// Singleton export
export const wikipediaApi = new WikipediaApiClient();
