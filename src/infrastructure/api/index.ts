/**
 * API Clients Index
 * Re-exports all API clients and utilities
 */

export { BaseApiClient, createApiClient } from './base-client';
export type { ApiClientConfig, ApiResponse, ApiError } from './base-client';

export { wikipediaApi } from './wikipedia-client';
export type {
  WikiApiResponse,
  UserInfoResponse,
  UserContribsResponse,
  XToolsEditCountResponse,
  RecentChangeResponse,
  PageAssessmentResponse,
  CategoryResponse,
  LogEventResponse,
  ThanksLogResponse,
  XToolsMonthCountsResponse,
  XToolsTopEditsResponse,
  XToolsNamespaceResponse,
} from './wikipedia-client';

export { wikimediaRestApi } from './wikimedia-rest-client';
export type { PageViewsResponse, PageViewsAggregate } from './wikimedia-rest-client';

export type { OAuthConfig, OAuthTokens } from './oauth-client';
