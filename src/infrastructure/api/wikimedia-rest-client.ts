/**
 * Wikimedia REST API Client
 * Handles pageview statistics and other REST API endpoints
 * API Docs: https://wikimedia.org/api/rest_v1/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const WIKIMEDIA_REST_API_BASE = 'https://wikimedia.org/api/rest_v1';

export interface PageViewsResponse {
  readonly items: Array<{
    readonly project: string;
    readonly article: string;
    readonly granularity: string;
    readonly timestamp: string;
    readonly access: string;
    readonly agent: string;
    readonly views: number;
  }>;
}

export interface PageViewsAggregate {
  readonly title: string;
  readonly totalViews: number;
  readonly dailyViews: Array<{
    readonly date: string;
    readonly views: number;
  }>;
  readonly averageDaily: number;
}

class WikimediaRestClient {
  private readonly client: AxiosInstance;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // ms between requests

  constructor() {
    this.client = axios.create({
      baseURL: WIKIMEDIA_REST_API_BASE,
      timeout: 30_000,
      headers: {
        'User-Agent': 'WikiEditorDashboard/1.0 (https://github.com/user/wiki-dashboard)',
        'Accept': 'application/json',
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

        if (error instanceof AxiosError) {
          // Don't retry on 404 (article doesn't exist)
          if (error.response?.status === 404) {
            throw lastError;
          }
          // Rate limited - wait longer
          if (error.response?.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
            continue;
          }
        }

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  /**
   * Get page views for a specific article
   * @param title Article title (spaces will be converted to underscores)
   * @param days Number of days of data to fetch (default 30)
   * @param project Wikipedia project (default en.wikipedia)
   */
  async getPageViews(
    title: string,
    days = 30,
    project = 'en.wikipedia'
  ): Promise<PageViewsAggregate> {
    return this.retryRequest(async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const formatDate = (d: Date) => {
        const isoDate = d.toISOString().split('T')[0];
        return isoDate ? isoDate.replace(/-/g, '') : '';
      };

      // Encode title for URL (replace spaces with underscores, encode special chars)
      const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));

      const response = await this.client.get<PageViewsResponse>(
        `/metrics/pageviews/per-article/${project}/all-access/all-agents/${encodedTitle}/daily/${formatDate(startDate)}/${formatDate(endDate)}`
      );

      const items = response.data?.items ?? [];
      const dailyViews = items.map((item) => ({
        date: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`,
        views: item.views,
      }));

      const totalViews = dailyViews.reduce((sum, d) => sum + d.views, 0);
      const averageDaily = dailyViews.length > 0 ? Math.round(totalViews / dailyViews.length) : 0;

      return {
        title,
        totalViews,
        dailyViews,
        averageDaily,
      };
    });
  }

  /**
   * Get page views for multiple articles
   * @param titles Array of article titles
   * @param days Number of days of data to fetch
   */
  async getMultiplePageViews(
    titles: string[],
    days = 30
  ): Promise<PageViewsAggregate[]> {
    const results: PageViewsAggregate[] = [];

    for (const title of titles) {
      try {
        const views = await this.getPageViews(title, days);
        results.push(views);
      } catch (error) {
        // If a specific article fails (e.g., doesn't exist), continue with others
        console.warn(`Failed to get views for ${title}:`, error);
        results.push({
          title,
          totalViews: 0,
          dailyViews: [],
          averageDaily: 0,
        });
      }
    }

    return results;
  }

  /**
   * Get total views for all articles created by a user
   * @param articleTitles Array of article titles the user created
   * @param days Number of days to aggregate
   */
  async getImpactMetrics(
    articleTitles: string[],
    days = 30
  ): Promise<{
    totalViews: number;
    articleStats: PageViewsAggregate[];
    topArticles: PageViewsAggregate[];
  }> {
    const articleStats = await this.getMultiplePageViews(articleTitles, days);
    const totalViews = articleStats.reduce((sum, a) => sum + a.totalViews, 0);

    // Sort by total views and get top 10
    const topArticles = [...articleStats]
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 10);

    return {
      totalViews,
      articleStats,
      topArticles,
    };
  }
}

// Singleton export
export const wikimediaRestApi = new WikimediaRestClient();
