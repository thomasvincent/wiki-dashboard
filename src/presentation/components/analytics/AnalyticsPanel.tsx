/**
 * Analytics Panel Component
 * Displays edit statistics, heatmap, and namespace breakdown
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import CalendarHeatmap, { type ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { SectionHeader, StatsCard } from '../common';
import { useDashboard } from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { NamespaceStats, DailyActivity } from '@domain/entities';

// === Namespace colors ===
const NAMESPACE_COLORS = [
  '#1976d2', // Article (main)
  '#9c27b0', // Talk
  '#2e7d32', // User
  '#ed6c02', // User talk
  '#0288d1', // Wikipedia
  '#d32f2f', // Template
  '#757575', // Category
  '#00796b', // Draft
  '#5d4037', // Other
];

// === Mock data generators (will be replaced with API data) ===

function generateMockHeatmapData(): { date: string; count: number }[] {
  const today = new Date();
  const startDate = subDays(today, 365);
  const days = eachDayOfInterval({ start: startDate, end: today });

  return days.map(date => ({
    date: format(date, 'yyyy-MM-dd'),
    count: Math.random() > 0.4 ? Math.floor(Math.random() * 15) : 0,
  }));
}

function generateMockNamespaceData(): NamespaceStats[] {
  return [
    { namespace: 0, namespaceName: 'Article', editCount: 4521, percentage: 45.2 },
    { namespace: 1, namespaceName: 'Talk', editCount: 1823, percentage: 18.2 },
    { namespace: 2, namespaceName: 'User', editCount: 1205, percentage: 12.1 },
    { namespace: 3, namespaceName: 'User talk', editCount: 892, percentage: 8.9 },
    { namespace: 4, namespaceName: 'Wikipedia', editCount: 612, percentage: 6.1 },
    { namespace: 10, namespaceName: 'Template', editCount: 421, percentage: 4.2 },
    { namespace: 118, namespaceName: 'Draft', editCount: 326, percentage: 3.3 },
    { namespace: -1, namespaceName: 'Other', editCount: 200, percentage: 2.0 },
  ];
}

// === Edit Heatmap Component ===

interface EditHeatmapProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

function EditHeatmap({ data, loading }: EditHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, 365);

  if (loading) {
    return <Skeleton variant="rounded" height={150} />;
  }

  const getColorClass = (value: ReactCalendarHeatmapValue<string> | undefined) => {
    if (!value) return 'color-empty';
    const v = value as unknown as { count?: number };
    if (!v.count || v.count === 0) return 'color-empty';
    if (v.count < 3) return 'color-scale-1';
    if (v.count < 6) return 'color-scale-2';
    if (v.count < 10) return 'color-scale-3';
    return 'color-scale-4';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Edit Activity
        </Typography>
        <Box
          sx={{
            '& .react-calendar-heatmap': {
              width: '100%',
            },
            '& .react-calendar-heatmap text': {
              fontSize: '8px',
              fill: 'text.secondary',
            },
            '& .color-empty': {
              fill: '#ebedf0',
            },
            '& .color-scale-1': {
              fill: '#9be9a8',
            },
            '& .color-scale-2': {
              fill: '#40c463',
            },
            '& .color-scale-3': {
              fill: '#30a14e',
            },
            '& .color-scale-4': {
              fill: '#216e39',
            },
            // Dark mode support
            '.MuiPaper-root[style*="dark"] &, [data-theme="dark"] &': {
              '& .color-empty': {
                fill: '#161b22',
              },
            },
          }}
        >
          <CalendarHeatmap
            startDate={startDate}
            endDate={today}
            values={data}
            classForValue={getColorClass}
            showWeekdayLabels
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">Less</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((color) => (
              <Box
                key={color}
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: color,
                  borderRadius: 0.5,
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">More</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// === Namespace Breakdown Chart ===

interface NamespaceChartProps {
  data: NamespaceStats[];
  loading?: boolean;
}

function NamespaceChart({ data, loading }: NamespaceChartProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  // Convert to plain objects for recharts
  const chartData = data.map(d => ({
    namespaceName: d.namespaceName,
    editCount: d.editCount,
    percentage: d.percentage,
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Namespace Breakdown
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="editCount"
              nameKey="namespaceName"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={false}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={NAMESPACE_COLORS[index % NAMESPACE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// === Monthly Edits Chart ===

interface MonthlyEditsChartProps {
  data: readonly DailyActivity[];
  loading?: boolean;
}

function MonthlyEditsChart({ data, loading }: MonthlyEditsChartProps) {
  // Aggregate by month
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; edits: number; bytes: number }> = {};

    data.forEach(activity => {
      const monthKey = format(activity.date, 'MMM yyyy');
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, edits: 0, bytes: 0 };
      }
      months[monthKey].edits += activity.editCount;
      months[monthKey].bytes += activity.bytesAdded;
    });

    return Object.values(months).slice(-12); // Last 12 months
  }, [data]);

  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Monthly Activity
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="edits" fill="#1976d2" name="Edits" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// === Edit Trend Chart ===

interface EditTrendChartProps {
  data: readonly DailyActivity[];
  loading?: boolean;
}

function EditTrendChart({ data, loading }: EditTrendChartProps) {
  // Get last 30 days
  const recentData = useMemo(() => {
    return data.slice(-30).map(d => ({
      date: format(d.date, 'MMM d'),
      edits: d.editCount,
      bytes: d.bytesAdded,
    }));
  }, [data]);

  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Last 30 Days
        </Typography>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="edits"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              name="Edits"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// === Top Edited Articles ===

interface TopArticle {
  title: string;
  editCount: number;
}

interface TopArticlesProps {
  articles: TopArticle[];
  loading?: boolean;
}

function TopArticles({ articles, loading }: TopArticlesProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  const maxEdits = Math.max(...articles.map(a => a.editCount));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Most Edited Articles
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {articles.map((article, index) => (
            <Box key={article.title}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <MuiTooltip title={article.title}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                    {index + 1}. {article.title}
                  </Typography>
                </MuiTooltip>
                <Typography variant="body2" color="text.secondary">
                  {article.editCount}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  backgroundColor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${(article.editCount / maxEdits) * 100}%`,
                    backgroundColor: 'primary.main',
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// === Main Analytics Panel ===

export function AnalyticsPanel() {
  const { data: dashboard, isLoading } = useDashboard();

  // Generate mock data (will be replaced with real API calls)
  const heatmapData = useMemo(() => generateMockHeatmapData(), []);
  const namespaceData = useMemo(() => generateMockNamespaceData(), []);

  // Mock top articles
  const topArticles: TopArticle[] = useMemo(() => [
    { title: 'Artificial intelligence', editCount: 87 },
    { title: 'Machine learning', editCount: 64 },
    { title: 'Neural network', editCount: 52 },
    { title: 'Deep learning', editCount: 41 },
    { title: 'Computer vision', editCount: 38 },
  ], []);

  const stats = dashboard?.stats;
  const totalEdits = stats?.totalEdits ?? 0;
  const articlesCreated = stats?.articlesCreated ?? 0;
  const recentActivity = stats?.recentActivity ?? [];

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Analytics"
        subtitle="Your editing statistics and activity patterns"
      />

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Total Edits"
            value={formatEditCount(totalEdits)}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Articles Created"
            value={articlesCreated.toString()}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Major Expansions"
            value={formatEditCount(stats?.majorExpansions ?? 0)}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Talk Page Posts"
            value={formatEditCount(stats?.talkPagePosts ?? 0)}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Heatmap */}
      <Box sx={{ mb: 3 }}>
        <EditHeatmap data={heatmapData} loading={isLoading} />
      </Box>

      {/* Recent trend */}
      <Box sx={{ mb: 3 }}>
        <EditTrendChart data={recentActivity} loading={isLoading} />
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <NamespaceChart data={namespaceData} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MonthlyEditsChart data={recentActivity} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopArticles articles={topArticles} loading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsPanel;
