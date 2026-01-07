/**
 * Achievements Panel Component
 * Displays edit streaks, milestones, barnstars, and gamification elements
 * Connected to real Wikipedia APIs
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Paper,
  Skeleton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  LocalFireDepartment as StreakIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  ThumbUp as ThanksIcon,
  Create as EditIcon,
  Article as ArticleIcon,
  WorkspacePremium as BadgeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SectionHeader } from '../common';
import {
  useDashboard,
  useEditStreak,
  useThanksReceived,
  useThanksGiven,
  useArticlesCreated,
} from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { Milestone } from '@domain/entities';

// === Milestone icon mapping ===
const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  'edit-count': <EditIcon />,
  'article-created': <ArticleIcon />,
  'first-ga': <StarIcon />,
  'first-fa': <TrophyIcon />,
  'thanks-received': <ThanksIcon />,
  'streak': <StreakIcon />,
};

// === Milestone definitions based on common Wikipedia achievements ===
const EDIT_MILESTONES = [
  { count: 1, name: 'First Edit', description: 'Made your first edit' },
  { count: 100, name: '100 Edits', description: 'Reached 100 edits' },
  { count: 500, name: '500 Edits', description: 'Reached 500 edits' },
  { count: 1000, name: '1,000 Edits', description: 'Reached 1,000 edits' },
  { count: 5000, name: '5,000 Edits', description: 'Reached 5,000 edits' },
  { count: 10000, name: '10,000 Edits', description: 'Reached 10,000 edits' },
  { count: 50000, name: '50,000 Edits', description: 'Reached 50,000 edits' },
  { count: 100000, name: '100,000 Edits', description: 'Reached 100,000 edits' },
];

const ARTICLE_MILESTONES = [
  { count: 1, name: 'Article Creator', description: 'Created your first article' },
  { count: 5, name: 'Contributor', description: 'Created 5 articles' },
  { count: 10, name: 'Prolific Creator', description: 'Created 10 articles' },
  { count: 25, name: 'Article Expert', description: 'Created 25 articles' },
  { count: 50, name: 'Wikipedia Builder', description: 'Created 50 articles' },
  { count: 100, name: 'Content Legend', description: 'Created 100 articles' },
];

const STREAK_MILESTONES = [
  { count: 7, name: 'Week Warrior', description: 'Edit for 7 consecutive days' },
  { count: 14, name: 'Fortnight Fighter', description: 'Edit for 14 consecutive days' },
  { count: 30, name: 'Month Master', description: 'Edit for 30 consecutive days' },
  { count: 100, name: 'Century Streak', description: 'Edit for 100 consecutive days' },
  { count: 365, name: 'Year of Dedication', description: 'Edit for 365 consecutive days' },
];

const THANKS_MILESTONES = [
  { count: 10, name: 'Appreciated', description: 'Received 10 thanks' },
  { count: 50, name: 'Well Liked', description: 'Received 50 thanks' },
  { count: 100, name: 'Community Favorite', description: 'Received 100 thanks' },
  { count: 500, name: 'Beloved Editor', description: 'Received 500 thanks' },
];

// === Edit Streak Card ===

interface EditStreakCardProps {
  currentStreak: number;
  longestStreak: number;
  loading?: boolean;
  error?: Error | null;
}

function EditStreakCard({ currentStreak, longestStreak, loading, error }: EditStreakCardProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={180} />;
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 1 }}>Failed to load streak data</Alert>
        </CardContent>
      </Card>
    );
  }

  const isActive = currentStreak > 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <StreakIcon sx={{ color: isActive ? 'warning.main' : 'text.secondary' }} />
          <Typography variant="h6">Edit Streak</Typography>
          {isActive && (
            <Chip label="Active" size="small" color="warning" sx={{ ml: 'auto' }} />
          )}
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography
            variant="h2"
            sx={{ fontWeight: 700, color: isActive ? 'warning.main' : 'text.secondary' }}
          >
            {currentStreak}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            days in a row
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Longest Streak
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {longestStreak} days
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {isActive ? 'Keep it up!' : 'Start editing!'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// === Milestone Progress Card ===

interface MilestoneProgressProps {
  currentValue: number;
  milestones: Array<{ count: number; name: string; description: string }>;
  type: string;
  loading?: boolean;
}

function MilestoneProgress({ currentValue, milestones, type, loading }: MilestoneProgressProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  // Find next unachieved milestone
  const nextMilestone = milestones.find(m => m.count > currentValue);
  const prevMilestone = [...milestones].reverse().find(m => m.count <= currentValue);
  const progress = nextMilestone
    ? ((currentValue - (prevMilestone?.count || 0)) / (nextMilestone.count - (prevMilestone?.count || 0))) * 100
    : 100;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Progress to Next Milestone
        </Typography>

        {nextMilestone ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {MILESTONE_ICONS[type] || <BadgeIcon />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {nextMilestone.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {nextMilestone.description}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  {formatEditCount(currentValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatEditCount(nextMilestone.count)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              {formatEditCount(nextMilestone.count - currentValue)} more to go
            </Typography>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <TrophyIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
            <Typography variant="body1">
              All milestones achieved!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// === Milestones Grid ===

interface MilestonesGridProps {
  milestones: Milestone[];
  loading?: boolean;
}

function MilestonesGrid({ milestones, loading }: MilestonesGridProps) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} sm={4} md={3} key={i}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Milestones
        </Typography>
        <Grid container spacing={2}>
          {milestones.map((milestone) => {
            const isAchieved = !!milestone.achievedAt;

            return (
              <Grid item xs={6} sm={4} md={3} key={`${milestone.type}-${milestone.count}`}>
                <Tooltip
                  title={
                    isAchieved
                      ? `Achieved on ${format(milestone.achievedAt!, 'MMM d, yyyy')}`
                      : milestone.description
                  }
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      opacity: isAchieved ? 1 : 0.5,
                      borderColor: isAchieved ? 'primary.main' : 'divider',
                      bgcolor: isAchieved ? 'primary.main' : 'transparent',
                      color: isAchieved ? 'primary.contrastText' : 'text.primary',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      {MILESTONE_ICONS[milestone.type] || <BadgeIcon />}
                    </Box>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {milestone.name}
                    </Typography>
                    {isAchieved && (
                      <Typography variant="caption">
                        {format(milestone.achievedAt!, 'yyyy')}
                      </Typography>
                    )}
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

// === Thanks Stats Card ===

interface ThanksStatsProps {
  thanksReceived: number;
  thanksGiven: number;
  loading?: boolean;
}

function ThanksStats({ thanksReceived, thanksGiven, loading }: ThanksStatsProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={120} />;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ThanksIcon sx={{ color: 'success.main' }} />
          <Typography variant="h6">Thanks</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {thanksReceived}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Received
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {thanksGiven}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Given
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// === Main Achievements Panel ===

export function AchievementsPanel() {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: editStreakData, isLoading: streakLoading, error: streakError } = useEditStreak();
  const { data: thanksReceivedData, isLoading: thanksReceivedLoading } = useThanksReceived();
  const { data: thanksGivenData, isLoading: thanksGivenLoading } = useThanksGiven();
  const { data: articlesCreatedData, isLoading: articlesLoading } = useArticlesCreated();

  const totalEdits = dashboard?.stats.totalEdits ?? 0;
  const articlesCreated = articlesCreatedData?.length ?? 0;
  const thanksReceived = thanksReceivedData?.length ?? 0;
  const thanksGiven = thanksGivenData?.length ?? 0;
  const currentStreak = editStreakData?.currentStreak ?? 0;
  const longestStreak = editStreakData?.longestStreak ?? 0;

  // Build milestones based on actual data
  const milestones: Milestone[] = useMemo(() => {
    const result: Milestone[] = [];
    const registrationDate = dashboard?.user.registrationDate;

    // Edit milestones
    EDIT_MILESTONES.forEach(m => {
      result.push({
        type: 'edit-count',
        name: m.name,
        count: m.count,
        achievedAt: totalEdits >= m.count ? (registrationDate || new Date()) : null,
        icon: 'edit',
        description: m.description,
      });
    });

    // Article milestones
    ARTICLE_MILESTONES.forEach(m => {
      result.push({
        type: 'article-created',
        name: m.name,
        count: m.count,
        achievedAt: articlesCreated >= m.count ? (registrationDate || new Date()) : null,
        icon: 'article',
        description: m.description,
      });
    });

    // Streak milestones
    STREAK_MILESTONES.forEach(m => {
      result.push({
        type: 'streak',
        name: m.name,
        count: m.count,
        achievedAt: longestStreak >= m.count ? new Date() : null,
        icon: 'streak',
        description: m.description,
      });
    });

    // Thanks milestones
    THANKS_MILESTONES.forEach(m => {
      result.push({
        type: 'thanks-received',
        name: m.name,
        count: m.count,
        achievedAt: thanksReceived >= m.count ? new Date() : null,
        icon: 'thanks',
        description: m.description,
      });
    });

    return result;
  }, [totalEdits, articlesCreated, longestStreak, thanksReceived, dashboard?.user.registrationDate]);

  const isLoading = dashboardLoading || streakLoading || thanksReceivedLoading || thanksGivenLoading || articlesLoading;

  // Count achieved milestones
  const achievedCount = milestones.filter(m => m.achievedAt).length;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Achievements"
        subtitle={`${achievedCount} of ${milestones.length} milestones achieved`}
      />

      {/* Data source info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Achievement data is fetched live from Wikipedia. Some historical dates may be approximated.
      </Alert>

      <Grid container spacing={2}>
        {/* Streak and Progress */}
        <Grid item xs={12} md={4}>
          <EditStreakCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            loading={streakLoading}
            error={streakError}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MilestoneProgress
            currentValue={totalEdits}
            milestones={EDIT_MILESTONES}
            type="edit-count"
            loading={dashboardLoading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ThanksStats
            thanksReceived={thanksReceived}
            thanksGiven={thanksGiven}
            loading={thanksReceivedLoading || thanksGivenLoading}
          />
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {formatEditCount(totalEdits)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Edits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {articlesCreated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Articles Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {longestStreak}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Longest Streak
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {achievedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Badges Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Milestones Grid */}
        <Grid item xs={12}>
          <MilestonesGrid milestones={milestones} loading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AchievementsPanel;
