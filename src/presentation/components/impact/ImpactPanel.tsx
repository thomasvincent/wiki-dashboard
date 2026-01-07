/**
 * Impact Panel Component
 * Display article views and reach metrics
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
import { useDashboard } from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { PageViewStats, ImpactMetrics } from '@domain/entities';

// === Helper function ===
function generateDailyViews(baseViews: number, variance: number): readonly { date: string; views: number }[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string,
    views: Math.floor(baseViews + Math.random() * variance),
  }));
}

// === Mock data ===
const mockImpactMetrics: ImpactMetrics = {
  articlesCreated: 12,
  totalPageViews: 2450000,
  averageViewsPerArticle: 204166,
  articleSurvivalRate: 0.92,
  mostViewedArticles: [
    {
      title: 'Machine learning',
      views: 850000,
      period: 'last 30 days',
      dailyViews: generateDailyViews(20000, 15000),
    },
    {
      title: 'Neural network',
      views: 620000,
      period: 'last 30 days',
      dailyViews: generateDailyViews(15000, 12000),
    },
    {
      title: 'Deep learning',
      views: 480000,
      period: 'last 30 days',
      dailyViews: generateDailyViews(12000, 8000),
    },
    {
      title: 'Computer vision',
      views: 320000,
      period: 'last 30 days',
      dailyViews: generateDailyViews(8000, 6000),
    },
    {
      title: 'Artificial neural network',
      views: 180000,
      period: 'last 30 days',
      dailyViews: generateDailyViews(4000, 4000),
    },
  ],
};

// === Page Views Chart ===

interface PageViewsChartProps {
  articles: readonly PageViewStats[];
  loading?: boolean;
}

function PageViewsChart({ articles, loading }: PageViewsChartProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

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
  articles: readonly PageViewStats[];
  loading?: boolean;
}

function TopArticlesChart({ articles, loading }: TopArticlesChartProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  const data = articles.map(a => ({
    title: a.title.length > 20 ? a.title.slice(0, 17) + '...' : a.title,
    views: a.views,
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
  articles: readonly PageViewStats[];
  loading?: boolean;
}

function ArticleViewsList({ articles, loading }: ArticleViewsListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxViews = Math.max(...articles.map(a => a.views));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Articles Created
        </Typography>
        <Paper variant="outlined">
          <List disablePadding>
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
                            {formatEditCount(article.views)} views
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
                                width: `${(article.views / maxViews) * 100}%`,
                                bgcolor: 'success.main',
                                borderRadius: 2,
                              }}
                            />
                          </Box>
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
  const { isLoading } = useDashboard();

  const metrics = mockImpactMetrics;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Impact"
        subtitle="Your contribution reach and article performance"
      />

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Articles Created"
            value={metrics.articlesCreated.toString()}
            icon={<ArticleIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Total Views"
            value={formatEditCount(metrics.totalPageViews)}
            subtitle="Last 30 days"
            icon={<ViewsIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Avg per Article"
            value={formatEditCount(metrics.averageViewsPerArticle)}
            subtitle="Last 30 days"
            icon={<TrendingIcon />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Survival Rate"
            value={`${Math.round(metrics.articleSurvivalRate * 100)}%`}
            subtitle="Articles not deleted"
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
                {formatEditCount(metrics.totalPageViews)} readers reached
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Estimated unique readers who viewed your created articles in the last 30 days
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <PageViewsChart articles={metrics.mostViewedArticles} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopArticlesChart articles={metrics.mostViewedArticles} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ArticleViewsList articles={metrics.mostViewedArticles} loading={isLoading} />
        </Grid>
      </Grid>

      {/* Note about data */}
      <Card variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Page view data provided by Wikimedia Analytics. Connect your Wikipedia account for personalized stats.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ImpactPanel;
