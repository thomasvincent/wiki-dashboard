/**
 * Wikipedia OAuth 1.0a Client
 * Handles authentication flow with Wikipedia
 *
 * Note: Full OAuth 1.0a requires a backend server for security.
 * This implementation uses a popup flow with MediaWiki's OAuth.
 *
 * To use OAuth:
 * 1. Register an OAuth consumer at https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration
 * 2. Set the callback URL to your app's domain
 * 3. Configure the consumer key in environment variables
 */

// OAuth endpoints
const OAUTH_ENDPOINTS = {
  initiate: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/initiate',
  authorize: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/authorize',
  token: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/token',
  identify: 'https://meta.wikimedia.org/w/index.php?title=Special:OAuth/identify',
};

export interface OAuthTokens {
  accessToken: string;
  accessSecret: string;
}

export interface WikiUserInfo {
  username: string;
  userId: number;
  editCount: number;
  groups: string[];
  registrationDate: string;
}

export interface OAuthConfig {
  consumerKey: string;
  consumerSecret: string;
  callbackUrl: string;
}

/**
 * Since Wikipedia uses OAuth 1.0a which requires server-side signature generation,
 * we provide a simplified flow that can work with:
 * 1. A proxy server that handles OAuth signatures
 * 2. Or a manual token entry for users who have generated tokens
 */
class WikipediaOAuthClient {
  private config: OAuthConfig | null = null;

  /**
   * Configure the OAuth client
   */
  configure(config: OAuthConfig): void {
    this.config = config;
  }

  /**
   * Check if OAuth is configured
   */
  isConfigured(): boolean {
    return this.config !== null &&
           this.config.consumerKey !== '' &&
           this.config.consumerSecret !== '';
  }

  /**
   * Get the authorization URL for the OAuth flow
   * Note: This requires a backend to generate the OAuth signature
   */
  getAuthorizationUrl(): string {
    if (!this.config) {
      throw new Error('OAuth not configured');
    }
    // For a full implementation, this would need server-side request token generation
    return `${OAUTH_ENDPOINTS.authorize}?oauth_consumer_key=${this.config.consumerKey}`;
  }

  /**
   * Validate tokens by making a test API call
   */
  async validateTokens(tokens: OAuthTokens): Promise<WikiUserInfo | null> {
    try {
      // Make a simple API call to verify the tokens work
      const response = await fetch(
        'https://en.wikipedia.org/w/api.php?action=query&meta=userinfo&uiprop=editcount|groups|registration&format=json',
        {
          headers: {
            'Authorization': `OAuth oauth_consumer_key="${this.config?.consumerKey ?? ''}", oauth_token="${tokens.accessToken}"`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const userinfo = data?.query?.userinfo;

      if (!userinfo || userinfo.anon) {
        return null;
      }

      return {
        username: userinfo.name,
        userId: userinfo.id,
        editCount: userinfo.editcount ?? 0,
        groups: userinfo.groups ?? [],
        registrationDate: userinfo.registration ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Open Wikipedia's OAuth authorization page
   * This is a simplified flow for demonstration
   */
  openAuthorizationPage(): void {
    const authUrl = 'https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration';
    window.open(authUrl, '_blank', 'width=800,height=600');
  }

  /**
   * Get user info using the stored credentials
   * Falls back to public API if no OAuth
   */
  async getUserInfo(username: string): Promise<WikiUserInfo | null> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=users&ususers=${encodeURIComponent(username)}&usprop=editcount|groups|registration&format=json&origin=*`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const user = data?.query?.users?.[0];

      if (!user || user.missing) {
        return null;
      }

      return {
        username: user.name,
        userId: user.userid,
        editCount: user.editcount ?? 0,
        groups: user.groups ?? [],
        registrationDate: user.registration ?? '',
      };
    } catch {
      return null;
    }
  }
}

// Singleton export
export const oauthClient = new WikipediaOAuthClient();

/**
 * Storage keys for OAuth data
 */
export const OAUTH_STORAGE_KEYS = {
  accessToken: 'wiki_oauth_access_token',
  accessSecret: 'wiki_oauth_access_secret',
  username: 'wiki_oauth_username',
  userId: 'wiki_oauth_user_id',
} as const;

/**
 * Save OAuth tokens to localStorage
 */
export function saveOAuthTokens(tokens: OAuthTokens, userInfo: WikiUserInfo): void {
  localStorage.setItem(OAUTH_STORAGE_KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(OAUTH_STORAGE_KEYS.accessSecret, tokens.accessSecret);
  localStorage.setItem(OAUTH_STORAGE_KEYS.username, userInfo.username);
  localStorage.setItem(OAUTH_STORAGE_KEYS.userId, userInfo.userId.toString());
}

/**
 * Load OAuth tokens from localStorage
 */
export function loadOAuthTokens(): { tokens: OAuthTokens; username: string; userId: number } | null {
  const accessToken = localStorage.getItem(OAUTH_STORAGE_KEYS.accessToken);
  const accessSecret = localStorage.getItem(OAUTH_STORAGE_KEYS.accessSecret);
  const username = localStorage.getItem(OAUTH_STORAGE_KEYS.username);
  const userId = localStorage.getItem(OAUTH_STORAGE_KEYS.userId);

  if (!accessToken || !accessSecret || !username || !userId) {
    return null;
  }

  return {
    tokens: { accessToken, accessSecret },
    username,
    userId: parseInt(userId, 10),
  };
}

/**
 * Clear OAuth tokens from localStorage
 */
export function clearOAuthTokens(): void {
  localStorage.removeItem(OAUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(OAUTH_STORAGE_KEYS.accessSecret);
  localStorage.removeItem(OAUTH_STORAGE_KEYS.username);
  localStorage.removeItem(OAUTH_STORAGE_KEYS.userId);
}
