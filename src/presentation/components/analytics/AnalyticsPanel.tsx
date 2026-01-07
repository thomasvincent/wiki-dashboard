/**
 * Analytics Panel Component
 * Displays edit statistics, heatmap, and namespace breakdown
 * Connected to real Wikipedia APIs via XTools
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Alert,
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
import { format, subDays } from 'date-fns';
import { SectionHeader, StatsCard } from '../common';
import {
  useDashboard,
  useEditStreak,
  useNamespaceTotals,
  useMonthCounts,
  useTopEdits,
} from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { NamespaceStats, DailyActivity } from '@domain/entities';

// === Namespace colors and names ===
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

const NAMESPACE_NAMES: Record<string, string> = {
  '0': 'Article',
  '1': 'Talk',
  '2': 'User',
  '3': 'User talk',
  '4': 'Wikipedia',
  '5': 'Wikipedia talk',
  '6': 'File',
  '7': 'File talk',
  '10': 'Template',
  '11': 'Template talk',
  '14': 'Category',
  '15': 'Category talk',
  '100': 'Portal',
  '118': 'Draft',
  '119': 'Draft talk',
};

// === Edit Heatmap Component ===

interface EditHeatmapProps {
  data: { date: string; count: number }[];
  loading?: boolean;
  error?: string | null;
}

function EditHeatmap({ data, loading, error }: EditHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, 365);

  if (loading) {
    return <Skeleton variant="rounded" height={150} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Failed to load edit activity: {error}</Alert>
        </CardContent>
      </Card>
    );
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

  const totalEdits = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Edit Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalEdits.toLocaleString()} edits on {activeDays} days
          </Typography>
        </Box>
        <Box
          sx={{
            '& .react-calendar-heatmap': { width: '100%' },
            '& .react-calendar-heatmap text': { fontSize: '8px', fill: 'text.secondary' },
            '& .color-empty': { fill: '#ebedf0' },
            '& .color-scale-1': { fill: '#9be9a8' },
            '& .color-scale-2': { fill: '#40c463' },
            '& .color-scale-3': { fill: '#30a14e' },
            '& .color-scale-4': { fill: '#216e39' },
            '.MuiPaper-root[style*="dark"] &, [data-theme="dark"] &': {
              '& .color-empty': { fill: '#161b22' },
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
                sx={{ width: 12, height: 12, backgroundColor: color, borderRadius: 0.5 }}
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

  if (data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Namespace Breakdown</Typography>
          <Typography color="text.secondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

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
  data: { month: string; edits: number }[];
  loading?: boolean;
}

function MonthlyEditsChart({ data, loading }: MonthlyEditsChartProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={300} />;
  }

  if (data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Monthly Activity</Typography>
          <Typography color="text.secondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Monthly Activity
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
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

  if (recentData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Last 30 Days</Typography>
          <Typography color="text.secondary">No recent activity</Typography>
        </CardContent>
      </Card>
    );
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

  if (articles.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Most Edited Articles</Typography>
          <Typography color="text.secondary">No data available</Typography>
        </CardContent>
      </Card>
    );
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
                <MuiTooltip title={`Open ${article.title} on Wikipedia`}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      maxWidth: '70%',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' },
                    }}
                    onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`, '_blank')}
                  >
                    {index + 1}. {article.title}
                  </Typography>
                </MuiTooltip>
                <Typography variant="body2" color="text.secondary">
                  {article.editCount} edits
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
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: editStreakData, isLoading: streakLoading, error: streakError } = useEditStreak();
  const { data: namespaceTotals, isLoading: namespaceLoading } = useNamespaceTotals();
  const { data: monthCounts, isLoading: monthLoading } = useMonthCounts();
  const { data: topEditsRaw, isLoading: topEditsLoading } = useTopEdits();

  // Transform edit streak data into heatmap format
  const heatmapData = useMemo(() => {
    if (!editStreakData?.dates) return [];

    // Create a map of dates with edits
    const dateMap = new Map<string, number>();

    // Count edits per date from the streak data
    // The API returns dates that have edits, so we mark those
    editStreakData.dates.forEach(date => {
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Generate all dates for the past year
    const today = new Date();
    const result: { date: string; count: number }[] = [];

    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      result.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }

    return result;
  }, [editStreakData]);

  // Transform namespace data
  const namespaceData: NamespaceStats[] = useMemo(() => {
    if (!namespaceTotals) return [];

    const total = Object.values(namespaceTotals).reduce((sum, count) => sum + count, 0);

    return Object.entries(namespaceTotals)
      .map(([ns, count]) => ({
        namespace: parseInt(ns, 10),
        namespaceName: NAMESPACE_NAMES[ns] || `ns:${ns}`,
        editCount: count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.editCount - a.editCount)
      .slice(0, 8); // Top 8 namespaces
  }, [namespaceTotals]);

  // Transform monthly data
  const monthlyData = useMemo(() => {
    if (!monthCounts) return [];

    return Object.entries(monthCounts)
      .map(([yearMonth, count]) => {
        // yearMonth is in format "2024-01"
        const parts = yearMonth.split('-');
        const year = parts[0] ?? '';
        const month = parts[1] ?? '01';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(month, 10) - 1;
        return {
          month: `${monthNames[monthIndex] ?? 'Unknown'} ${year.slice(2)}`,
          edits: count,
          sortKey: yearMonth,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-12) // Last 12 months
      .map(({ month, edits }) => ({ month, edits }));
  }, [monthCounts]);

  // Transform top edits data
  const topArticles: TopArticle[] = useMemo(() => {
    if (!topEditsRaw) return [];

    return topEditsRaw
      .filter(edit => edit.page_namespace === 0) // Only mainspace articles
      .slice(0, 10)
      .map(edit => ({
        title: edit.page_title.replace(/_/g, ' '),
        editCount: edit.count,
      }));
  }, [topEditsRaw]);

  const stats = dashboard?.stats;
  const totalEdits = stats?.totalEdits ?? 0;
  const articlesCreated = stats?.articlesCreated ?? 0;
  const recentActivity = stats?.recentActivity ?? [];

  const isLoading = dashboardLoading || streakLoading || namespaceLoading || monthLoading || topEditsLoading;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Analytics"
        subtitle="Your editing statistics and activity patterns from Wikipedia"
      />

      {/* Edit Streak Info */}
      {editStreakData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Current streak: <strong>{editStreakData.currentStreak} days</strong> | Longest streak: <strong>{editStreakData.longestStreak} days</strong>
        </Alert>
      )}

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Total Edits"
            value={formatEditCount(totalEdits)}
            loading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Articles Created"
            value={articlesCreated.toString()}
            loading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Major Expansions"
            value={formatEditCount(stats?.majorExpansions ?? 0)}
            loading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            title="Talk Page Posts"
            value={formatEditCount(stats?.talkPagePosts ?? 0)}
            loading={dashboardLoading}
          />
        </Grid>
      </Grid>

      {/* Heatmap */}
      <Box sx={{ mb: 3 }}>
        <EditHeatmap
          data={heatmapData}
          loading={streakLoading}
          error={streakError ? String(streakError) : null}
        />
      </Box>

      {/* Recent trend */}
      <Box sx={{ mb: 3 }}>
        <EditTrendChart data={recentActivity} loading={dashboardLoading} />
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <NamespaceChart data={namespaceData} loading={namespaceLoading || isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MonthlyEditsChart data={monthlyData} loading={monthLoading || isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TopArticles articles={topArticles} loading={topEditsLoading || isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsPanel;
