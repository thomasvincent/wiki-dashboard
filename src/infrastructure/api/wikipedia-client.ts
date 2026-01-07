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
}

// Singleton export
export const wikipediaApi = new WikipediaApiClient();
