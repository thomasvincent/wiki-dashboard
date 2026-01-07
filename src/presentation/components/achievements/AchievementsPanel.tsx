/**
 * Achievements Panel Component
 * Displays edit streaks, milestones, barnstars, and gamification elements
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
import { format, differenceInDays } from 'date-fns';
import { SectionHeader } from '../common';
import { useDashboard } from '@presentation/hooks/queries';
import { formatEditCount } from '@domain/value-objects';
import type { EditStreak, Milestone, Barnstar } from '@domain/entities';

// === Milestone icon mapping ===
const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  'edit-count': <EditIcon />,
  'article-created': <ArticleIcon />,
  'first-ga': <StarIcon />,
  'first-fa': <TrophyIcon />,
  'thanks-received': <ThanksIcon />,
  'streak': <StreakIcon />,
};

// === Mock data (will be replaced with API data) ===

const mockEditStreak: EditStreak = {
  currentStreak: 7,
  longestStreak: 42,
  lastEditDate: new Date(),
  streakStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
};

const mockMilestones: Milestone[] = [
  {
    type: 'edit-count',
    name: 'First Edit',
    count: 1,
    achievedAt: new Date('2020-01-15'),
    icon: 'edit',
    description: 'Made your first edit',
  },
  {
    type: 'edit-count',
    name: '100 Edits',
    count: 100,
    achievedAt: new Date('2020-03-20'),
    icon: 'edit',
    description: 'Reached 100 edits',
  },
  {
    type: 'edit-count',
    name: '1,000 Edits',
    count: 1000,
    achievedAt: new Date('2021-06-10'),
    icon: 'edit',
    description: 'Reached 1,000 edits',
  },
  {
    type: 'edit-count',
    name: '10,000 Edits',
    count: 10000,
    achievedAt: null,
    icon: 'edit',
    description: 'Reach 10,000 edits',
  },
  {
    type: 'article-created',
    name: 'Article Creator',
    count: 1,
    achievedAt: new Date('2020-05-01'),
    icon: 'article',
    description: 'Created your first article',
  },
  {
    type: 'article-created',
    name: 'Prolific Creator',
    count: 10,
    achievedAt: new Date('2022-08-15'),
    icon: 'article',
    description: 'Created 10 articles',
  },
  {
    type: 'first-ga',
    name: 'Good Article',
    count: 1,
    achievedAt: null,
    icon: 'star',
    description: 'Have an article reach GA status',
  },
  {
    type: 'thanks-received',
    name: 'Appreciated',
    count: 10,
    achievedAt: new Date('2020-06-25'),
    icon: 'thanks',
    description: 'Received 10 thanks',
  },
  {
    type: 'streak',
    name: 'Week Warrior',
    count: 7,
    achievedAt: new Date('2023-02-14'),
    icon: 'streak',
    description: 'Edit for 7 consecutive days',
  },
  {
    type: 'streak',
    name: 'Month Master',
    count: 30,
    achievedAt: null,
    icon: 'streak',
    description: 'Edit for 30 consecutive days',
  },
];

const mockBarnstars: Barnstar[] = [
  {
    id: '1',
    name: 'The Original Barnstar',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Original_Barnstar_Hires.png/100px-Original_Barnstar_Hires.png',
    givenBy: 'ExampleUser',
    date: new Date('2023-05-15'),
    reason: 'For your excellent work expanding articles on machine learning',
  },
  {
    id: '2',
    name: 'The Copyeditor\'s Barnstar',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Copyeditor_Barnstar_Hires.png/100px-Copyeditor_Barnstar_Hires.png',
    givenBy: 'AnotherEditor',
    date: new Date('2023-08-22'),
    reason: 'For meticulous copyediting work across multiple articles',
  },
];

// === Edit Streak Card ===

interface EditStreakCardProps {
  streak: EditStreak;
  loading?: boolean;
}

function EditStreakCard({ streak, loading }: EditStreakCardProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={180} />;
  }

  const streakDays = streak.currentStreak;
  const isActive = streak.lastEditDate && differenceInDays(new Date(), streak.lastEditDate) <= 1;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <StreakIcon sx={{ color: isActive ? 'warning.main' : 'text.secondary' }} />
          <Typography variant="h6">Edit Streak</Typography>
          {isActive && (
            <Chip
              label="Active"
              size="small"
              color="warning"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: isActive ? 'warning.main' : 'text.secondary',
            }}
          >
            {streakDays}
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
              {streak.longestStreak} days
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Started
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {streak.streakStartDate ? format(streak.streakStartDate, 'MMM d') : 'N/A'}
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
  milestones: Milestone[];
  loading?: boolean;
}

function MilestoneProgress({ currentValue, milestones, loading }: MilestoneProgressProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  // Find next unachieved milestone
  const nextMilestone = milestones.find(m => !m.achievedAt);
  const progress = nextMilestone ? (currentValue / nextMilestone.count) * 100 : 100;

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
                {MILESTONE_ICONS[nextMilestone.type] || <BadgeIcon />}
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
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
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

// === Barnstar Collection ===

interface BarnstarCollectionProps {
  barnstars: Barnstar[];
  loading?: boolean;
}

function BarnstarCollection({ barnstars, loading }: BarnstarCollectionProps) {
  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  if (barnstars.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Barnstar Collection
          </Typography>
          <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
            <StarIcon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
            <Typography variant="body2">
              No barnstars yet. Keep contributing!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <StarIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6">Barnstar Collection</Typography>
          <Chip label={barnstars.length} size="small" sx={{ ml: 'auto' }} />
        </Box>

        <Grid container spacing={2}>
          {barnstars.map((barnstar) => (
            <Grid item xs={12} sm={6} key={barnstar.id}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    component="img"
                    src={barnstar.imageUrl}
                    alt={barnstar.name}
                    sx={{ width: 60, height: 60, objectFit: 'contain' }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {barnstar.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      From {barnstar.givenBy} - {format(barnstar.date, 'MMM d, yyyy')}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {barnstar.reason}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
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
  const { data: dashboard, isLoading } = useDashboard();

  const totalEdits = dashboard?.stats.totalEdits ?? 0;

  // Filter milestones by type for progress tracking
  const editMilestones = useMemo(
    () => mockMilestones.filter(m => m.type === 'edit-count'),
    []
  );

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Achievements"
        subtitle="Your editing milestones and recognition"
      />

      <Grid container spacing={2}>
        {/* Streak and Progress */}
        <Grid item xs={12} md={4}>
          <EditStreakCard streak={mockEditStreak} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MilestoneProgress
            currentValue={totalEdits}
            milestones={editMilestones}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ThanksStats
            thanksReceived={47}
            thanksGiven={23}
            loading={isLoading}
          />
        </Grid>

        {/* Milestones Grid */}
        <Grid item xs={12}>
          <MilestonesGrid milestones={mockMilestones} loading={isLoading} />
        </Grid>

        {/* Barnstars */}
        <Grid item xs={12}>
          <BarnstarCollection barnstars={mockBarnstars} loading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AchievementsPanel;
