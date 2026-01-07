/**
 * Dashboard Overview Component
 * Main summary view with drill-down capabilities
 * Compact design for laptop screens
 */

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActionArea,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Edit as EditIcon,
  Task as TaskIcon,
  Folder as FolderIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { StatsCard, ProgressCard, StatusChip, WikiLink, SectionHeader } from '../common';
import { useUIStore, useDashboardStore } from '@presentation/hooks';
import { useDashboard, useRefreshDashboard, useTimeSinceUpdate } from '@presentation/hooks/queries';
import { analyzeDrafts, analyzeContributions, calculateFocusAreaProgress } from '@application/services';
import { formatEditCount, getXToolsUrl, getContributionsUrl } from '@domain/value-objects';
import type { EditorDashboard, Draft, Task, FocusArea } from '@domain/entities';

// === Quick Stats Row ===

interface QuickStatsProps {
  dashboard: EditorDashboard;
  onNavigate: (section: string) => void;
}

function QuickStats({ dashboard, onNavigate }: QuickStatsProps) {
  const draftSummary = analyzeDrafts(dashboard.drafts);
  const contribSummary = analyzeContributions(dashboard.recentContributions);
  const pendingTasks = dashboard.tasks.filter((t) => t.status !== 'completed').length;
  const highPriorityTasks = dashboard.tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <StatsCard
          title="Total Edits"
          value={formatEditCount(dashboard.stats.totalEdits)}
          subtitle="All time"
          icon={<EditIcon />}
          onClick={() => window.open(getXToolsUrl(dashboard.user.username), '_blank')}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard
          title="Active Drafts"
          value={draftSummary.pendingReview + draftSummary.underReview + draftSummary.inDevelopment}
          subtitle={`${draftSummary.pendingReview} pending review`}
          icon={<ArticleIcon />}
          onClick={() => onNavigate('drafts')}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard
          title="Open Tasks"
          value={pendingTasks}
          subtitle={highPriorityTasks > 0 ? `${highPriorityTasks} high priority` : 'All on track'}
          icon={<TaskIcon />}
          onClick={() => onNavigate('tasks')}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard
          title="Focus Areas"
          value={dashboard.focusAreas.filter((f) => f.status === 'active').length}
          subtitle={`${dashboard.focusAreas.length} total`}
          icon={<FolderIcon />}
          onClick={() => onNavigate('focus-areas')}
        />
      </Grid>
    </Grid>
  );
}

// === Recent Drafts Card ===

interface RecentDraftsCardProps {
  drafts: readonly Draft[];
  onViewAll: () => void;
  onDraftClick: (draft: Draft) => void;
}

function RecentDraftsCard({ drafts, onViewAll, onDraftClick }: RecentDraftsCardProps) {
  const activeDrafts = drafts
    .filter((d) => ['pending_review', 'under_review', 'in_development'].includes(d.status))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Active Drafts"
        subheader={`${activeDrafts.length} drafts in progress`}
        action={
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={onViewAll}
          >
            View all →
          </Typography>
        }
      />
      <Divider />
      <List dense disablePadding>
        {activeDrafts.map((draft) => (
          <ListItem
            key={draft.id}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            onClick={() => onDraftClick(draft)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ArticleIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary={draft.title}
              secondary={draft.notes}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
            />
            <StatusChip status={draft.status} type="draft" />
          </ListItem>
        ))}
        {activeDrafts.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No active drafts"
              secondary="Start a new draft to see it here"
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>
    </Card>
  );
}

// === High Priority Tasks Card ===

interface HighPriorityTasksCardProps {
  tasks: readonly Task[];
  onViewAll: () => void;
  onTaskClick: (task: Task) => void;
}

function HighPriorityTasksCard({ tasks, onViewAll, onTaskClick }: HighPriorityTasksCardProps) {
  const highPriorityTasks = tasks
    .filter((t) => t.priority === 'high' && t.status !== 'completed')
    .slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="High Priority Tasks"
        subheader={`${highPriorityTasks.length} tasks need attention`}
        action={
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={onViewAll}
          >
            View all →
          </Typography>
        }
      />
      <Divider />
      <List dense disablePadding>
        {highPriorityTasks.map((task) => (
          <ListItem
            key={task.id}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            onClick={() => onTaskClick(task)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={task.title}
              secondary={task.dueDate ? `Due: ${task.dueDate.toLocaleDateString()}` : 'No due date'}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <StatusChip status={task.status} type="task-status" />
          </ListItem>
        ))}
        {highPriorityTasks.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No high priority tasks"
              secondary="You're all caught up!"
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>
    </Card>
  );
}

// === Focus Areas Progress ===

interface FocusAreasProgressProps {
  focusAreas: readonly FocusArea[];
  onViewAll: () => void;
}

function FocusAreasProgress({ focusAreas, onViewAll }: FocusAreasProgressProps) {
  const progress = calculateFocusAreaProgress(focusAreas);
  const activeFocusAreas = focusAreas.filter((f) => f.status === 'active');

  return (
    <Card>
      <CardHeader
        title="Focus Areas"
        subheader={`${activeFocusAreas.length} active projects`}
        action={
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={onViewAll}
          >
            View all →
          </Typography>
        }
      />
      <Divider />
      <CardContent sx={{ pt: 1 }}>
        <Grid container spacing={1}>
          {progress.slice(0, 4).map((area) => (
            <Grid item xs={6} key={area.id}>
              <ProgressCard
                title={area.name}
                current={area.completedArticles}
                total={area.totalArticles}
                subtitle={`${area.progressPercent}% complete`}
                color={area.progressPercent >= 50 ? 'success' : 'primary'}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// === Main Overview Component ===

export function DashboardOverview() {
  const { setActiveSection, pushDrillDown } = useUIStore();
  const { data: dashboard, isLoading, error } = useDashboard();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshDashboard();
  const lastUpdate = useTimeSinceUpdate();

  if (isLoading || !dashboard) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error loading dashboard: {error.message}</Typography>
      </Box>
    );
  }

  const handleNavigate = (section: string) => {
    setActiveSection(section as any);
  };

  const handleDraftClick = (draft: Draft) => {
    setActiveSection('drafts');
    pushDrillDown(draft.id);
  };

  const handleTaskClick = (task: Task) => {
    setActiveSection('tasks');
    pushDrillDown(task.id);
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title={`Welcome back, ${dashboard.user.username}`}
        subtitle={`Last updated: ${lastUpdate}`}
        onRefresh={() => refresh()}
        loading={isRefreshing}
      />

      <Box sx={{ mb: 3 }}>
        <QuickStats dashboard={dashboard} onNavigate={handleNavigate} />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <RecentDraftsCard
            drafts={dashboard.drafts}
            onViewAll={() => handleNavigate('drafts')}
            onDraftClick={handleDraftClick}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <HighPriorityTasksCard
            tasks={dashboard.tasks}
            onViewAll={() => handleNavigate('tasks')}
            onTaskClick={handleTaskClick}
          />
        </Grid>
        <Grid item xs={12}>
          <FocusAreasProgress
            focusAreas={dashboard.focusAreas}
            onViewAll={() => handleNavigate('focus-areas')}
          />
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader title="Quick Links" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <WikiLink href={getContributionsUrl(dashboard.user.username)}>
                  My Contributions
                </WikiLink>
              </Grid>
              <Grid item xs={6} sm={3}>
                <WikiLink href={getXToolsUrl(dashboard.user.username)}>
                  XTools Stats
                </WikiLink>
              </Grid>
              <Grid item xs={6} sm={3}>
                <WikiLink href={`https://en.wikipedia.org/wiki/Special:Watchlist`}>
                  Watchlist
                </WikiLink>
              </Grid>
              <Grid item xs={6} sm={3}>
                <WikiLink href={`https://en.wikipedia.org/wiki/User:${dashboard.user.username}/Dashboard`}>
                  Wiki Dashboard
                </WikiLink>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default DashboardOverview;
