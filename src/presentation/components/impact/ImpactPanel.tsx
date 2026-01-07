/**
 * Impact Panel Component
 * Display article views and reach metrics from Wikimedia Analytics API
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewsIcon,
  TrendingUp as TrendingIcon,
  Article as ArticleIcon,
  Groups as ReachIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { SectionHeader, StatsCard } from '../common';
import {
  useDashboard,
  useArticlesCreated,
  useImpactMetrics,
} from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { PageViewsAggregate } from '@infrastructure/api/wikimedia-rest-client';

// === Page Views Chart ===

interface PageViewsChartProps {
  articles: PageViewsAggregate[];
  loading?: boolean;
}

function PageViewsChart({ articles, loading }: PageViewsChartProps) {
  // Aggregate all views by date
  const aggregatedData = useMemo(() => {
    const dateMap: Record<string, number> = {};

    articles.forEach(article => {
      article.dailyViews.forEach(day => {
        dateMap[day.date] = (dateMap[day.date] || 0) + day.views;
      });
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views,
      }));
  }, [articles]);

  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  if (aggregatedData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Total Page Views (Last 30 Days)</Typography>
          <Typography color="text.secondary">No pageview data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Total Page Views (Last 30 Days)
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={aggregatedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatEditCount(v)} />
            <ChartTooltip />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// === Top Articles Bar Chart ===

interface TopArticlesChartProps {
  articles: PageViewsAggregate[];
  loading?: boolean;
}

function TopArticlesChart({ articles, loading }: TopArticlesChartProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Top Articles by Views</Typography>
          <Typography color="text.secondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const data = articles.slice(0, 5).map(a => ({
    title: a.title.length > 20 ? a.title.slice(0, 17) + '...' : a.title,
    views: a.totalViews,
    fullTitle: a.title,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Articles by Views
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => formatEditCount(v)} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 11 }} />
            <ChartTooltip />
            <Bar dataKey="views" fill="#2e7d32" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// === Article List ===

interface ArticleViewsListProps {
  articles: PageViewsAggregate[];
  loading?: boolean;
}

function ArticleViewsList({ articles, loading }: ArticleViewsListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Articles Created</Typography>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Articles Created</Typography>
          <Typography color="text.secondary">No articles found</Typography>
        </CardContent>
      </Card>
    );
  }

  const maxViews = Math.max(...articles.map(a => a.totalViews), 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Articles Created ({articles.length})
        </Typography>
        <Paper variant="outlined">
          <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            {articles.map((article, index) => (
              <Box key={article.title}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      window.open(
                        `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                        '_blank'
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {article.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatEditCount(article.totalViews)} views
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Box
                            sx={{
                              height: 4,
                              bgcolor: 'grey.200',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${(article.totalViews / maxViews) * 100}%`,
                                bgcolor: 'success.main',
                                borderRadius: 2,
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            ~{article.averageDaily.toLocaleString()} daily avg
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      </CardContent>
    </Card>
  );
}

// === Main Impact Panel ===

export function ImpactPanel() {
  const { isLoading: dashboardLoading } = useDashboard();
  const { data: articlesCreatedData, isLoading: articlesLoading } = useArticlesCreated();

  // Get article titles for pageview fetching
  const articleTitles = useMemo(() => {
    return articlesCreatedData?.map(a => a.title) ?? [];
  }, [articlesCreatedData]);

  // Fetch pageviews for all created articles
  const { data: impactData, isLoading: impactLoading, error: impactError } = useImpactMetrics(articleTitles, 30);

  const isLoading = dashboardLoading || articlesLoading || impactLoading;
  const articlesCreated = articlesCreatedData?.length ?? 0;

  // Calculate metrics from real data
  const totalViews = impactData?.totalViews ?? 0;
  const topArticles = impactData?.topArticles ?? [];
  const allArticles = impactData?.articleStats ?? [];
  const averageViews = articlesCreated > 0 ? Math.round(totalViews / articlesCreated) : 0;

  // Calculate survival rate (articles that still exist / total created)
  const survivingArticles = allArticles.filter(a => a.totalViews > 0).length;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Impact"
        subtitle="Your contribution reach and article performance"
      />

      {/* Error Alert */}
      {impactError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some pageview data couldn't be loaded. Showing available data.
        </Alert>
      )}

      {/* Data source info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Pageview data is fetched live from Wikimedia Analytics API for the last 30 days.
      </Alert>

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Articles Created"
            value={articlesCreated.toString()}
            icon={<ArticleIcon />}
            loading={articlesLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Total Views"
            value={formatEditCount(totalViews)}
            subtitle="Last 30 days"
            icon={<ViewsIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Avg per Article"
            value={formatEditCount(averageViews)}
            subtitle="Last 30 days"
            icon={<TrendingIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="With Views"
            value={`${survivingArticles}/${articlesCreated}`}
            subtitle="Articles with traffic"
            icon={<ReachIcon />}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Estimated Reach */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReachIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {isLoading ? (
                  <Skeleton width={200} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  `${formatEditCount(totalViews)} readers reached`
                )}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Total pageviews across all your created articles in the last 30 days
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <PageViewsChart articles={allArticles} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopArticlesChart articles={topArticles} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ArticleViewsList articles={allArticles} loading={isLoading} />
        </Grid>
      </Grid>

      {/* Note about data */}
      {!isLoading && articlesCreated === 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Create mainspace articles to see your impact metrics here. Your article creation history is fetched from Wikipedia.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default ImpactPanel;
