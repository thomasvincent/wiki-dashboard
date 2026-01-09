/**
 * MSW Request Handlers
 * Mock API responses for testing
 */

import { http, HttpResponse, delay } from 'msw';

// === Mock Data ===

export const mockUserInfo = {
  userid: 12345,
  name: 'TestUser',
  registration: '2020-01-15T00:00:00Z',
  editcount: 5000,
  groups: ['autoconfirmed', 'extendedconfirmed', 'reviewer'],
};

export const mockContributions = [
  {
    userid: 12345,
    user: 'TestUser',
    pageid: 100,
    revid: 1001,
    parentid: 1000,
    ns: 0,
    title: 'Test Article',
    timestamp: '2024-01-15T12:00:00Z',
    comment: 'Added section on testing',
    size: 5000,
    sizediff: 500,
    minor: false,
    tags: [],
  },
  {
    userid: 12345,
    user: 'TestUser',
    pageid: 101,
    revid: 1002,
    parentid: 1001,
    ns: 0,
    title: 'Another Article',
    timestamp: '2024-01-14T10:00:00Z',
    comment: 'Fixed typo',
    size: 3000,
    sizediff: -10,
    minor: true,
    tags: [],
  },
];

export const mockXToolsEditCount = {
  username: 'TestUser',
  user_id: 12345,
  live_edit_count: 5000,
  deleted_edit_count: 50,
  first_edit: '2020-01-20T00:00:00Z',
  latest_edit: '2024-01-15T12:00:00Z',
};

export const mockPageViews = {
  items: [
    {
      project: 'en.wikipedia',
      article: 'Test_Article',
      granularity: 'daily',
      timestamp: '2024011500',
      access: 'all-access',
      agent: 'all-agents',
      views: 1500,
    },
  ],
};

// === Handlers ===

export const handlers = [
  // Wikipedia API - User Info
  http.get('https://en.wikipedia.org/w/api.php', async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const list = url.searchParams.get('list');

    await delay(100); // Simulate network latency

    // User info query
    if (action === 'query' && list === 'users') {
      return HttpResponse.json({
        query: {
          users: [mockUserInfo],
        },
      });
    }

    // User contributions query
    if (action === 'query' && list === 'usercontribs') {
      return HttpResponse.json({
        query: {
          usercontribs: mockContributions,
        },
      });
    }

    // Recent changes query
    if (action === 'query' && list === 'recentchanges') {
      return HttpResponse.json({
        query: {
          recentchanges: [],
        },
      });
    }

    // Log events (thanks)
    if (action === 'query' && list === 'logevents') {
      return HttpResponse.json({
        query: {
          logevents: [],
        },
      });
    }

    // All pages query
    if (action === 'query' && list === 'allpages') {
      return HttpResponse.json({
        query: {
          allpages: [],
        },
      });
    }

    // Default response
    return HttpResponse.json({ query: {} });
  }),

  // XTools API - Edit Count
  http.get('https://xtools.wmcloud.org/api/user/simple_editcount/*', async () => {
    await delay(100);
    return HttpResponse.json(mockXToolsEditCount);
  }),

  // XTools API - Month Counts
  http.get('https://xtools.wmcloud.org/api/user/month_counts/*', async () => {
    await delay(100);
    return HttpResponse.json({
      month_counts: {
        '2024-01': 150,
        '2023-12': 120,
        '2023-11': 100,
      },
    });
  }),

  // XTools API - Top Edits
  http.get('https://xtools.wmcloud.org/api/user/top_edits/*', async () => {
    await delay(100);
    return HttpResponse.json({
      top_edits: [
        { page_title: 'Test Article', page_namespace: 0, count: 50 },
        { page_title: 'Another Article', page_namespace: 0, count: 30 },
      ],
    });
  }),

  // XTools API - Namespace Totals
  http.get('https://xtools.wmcloud.org/api/user/namespace_totals/*', async () => {
    await delay(100);
    return HttpResponse.json({
      namespace_totals: {
        '0': 4000,
        '1': 500,
        '2': 300,
        '3': 200,
      },
    });
  }),

  // Wikimedia REST API - Page Views
  http.get('https://wikimedia.org/api/rest_v1/metrics/pageviews/*', async () => {
    await delay(100);
    return HttpResponse.json(mockPageViews);
  }),
];

// === Error Handlers (for testing error states) ===

export const errorHandlers = [
  http.get('https://en.wikipedia.org/w/api.php', () => {
    return HttpResponse.json(
      { error: { code: 'unknown_error', info: 'An error occurred' } },
      { status: 500 }
    );
  }),
];

// === Rate Limited Handlers ===

export const rateLimitedHandlers = [
  http.get('https://en.wikipedia.org/w/api.php', () => {
    return HttpResponse.json(
      { error: { code: 'ratelimited', info: 'Rate limited' } },
      { status: 429, headers: { 'Retry-After': '5' } }
    );
  }),
];
