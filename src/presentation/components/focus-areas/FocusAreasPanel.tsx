/**
 * Focus Areas Panel Component
 * Displays project clusters with article progress tracking
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Article as ArticleIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StatusChip, SectionHeader, WikiLink, EmptyState, ProgressCard } from '../common';
import { useDashboard } from '@presentation/hooks/queries';
import { calculateFocusAreaProgress } from '@application/services';
import { FOCUS_AREA_STATUS_DISPLAY } from '@domain/value-objects';
import type { FocusArea, FocusAreaArticle } from '@domain/entities';

// === Article Status Display ===

const ARTICLE_STATUS_DISPLAY: Record<FocusAreaArticle['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#9c27b0' },
  stub: { label: 'Stub', color: '#d32f2f' },
  start: { label: 'Start', color: '#ed6c02' },
  c_class: { label: 'C-Class', color: '#0288d1' },
  b_class: { label: 'B-Class', color: '#2e7d32' },
  ga: { label: 'GA', color: '#1976d2' },
  fa: { label: 'FA', color: '#ffc107' },
};

// === Focus Area Card ===

interface FocusAreaCardProps {
  focusArea: FocusArea;
  progress: { completedArticles: number; totalArticles: number; progressPercent: number };
}

function FocusAreaCard({ focusArea, progress }: FocusAreaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusDisplay = FOCUS_AREA_STATUS_DISPLAY[focusArea.status];

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {focusArea.name}
            <Chip
              label={statusDisplay.label}
              size="small"
              sx={{
                backgroundColor: `${statusDisplay.color}20`,
                color: statusDisplay.color,
                fontWeight: 500,
              }}
            />
          </Box>
        }
        subheader={focusArea.description}
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      
      {/* Progress Bar */}
      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="caption" fontWeight={500}>
            {progress.completedArticles}/{progress.totalArticles} articles
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress.progressPercent}
          color={progress.progressPercent >= 50 ? 'success' : 'primary'}
        />
        
        {/* WikiProjects */}
        {focusArea.wikiProjects.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {focusArea.wikiProjects.map((project) => (
              <Chip
                key={project}
                label={project}
                size="small"
                variant="outlined"
                onClick={() =>
                  window.open(
                    `https://en.wikipedia.org/wiki/Wikipedia:${project.replace(/ /g, '_')}`,
                    '_blank'
                  )
                }
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      {/* Expanded Article List */}
      <Collapse in={expanded}>
        <Divider />
        <List dense disablePadding>
          {focusArea.articles.map((article, index) => {
            const statusDisplay = ARTICLE_STATUS_DISPLAY[article.status];
            const hasUrl = article.url && article.url.length > 0;
            
            return (
              <ListItem
                key={index}
                secondaryAction={
                  hasUrl && (
                    <Tooltip title="Open article">
                      <IconButton
                        size="small"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ArticleIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{article.title}</Typography>
                      <Chip
                        label={statusDisplay.label}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: `${statusDisplay.color}20`,
                          color: statusDisplay.color,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    article.lastEdited
                      ? `Last edited: ${format(article.lastEdited, 'MMM d, yyyy')}`
                      : 'Not yet created'
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Card>
  );
}

// === Summary Stats ===

interface SummaryStatsProps {
  focusAreas: readonly FocusArea[];
}

function SummaryStats({ focusAreas }: SummaryStatsProps) {
  const active = focusAreas.filter((f) => f.status === 'active').length;
  const planned = focusAreas.filter((f) => f.status === 'planned').length;
  const completed = focusAreas.filter((f) => f.status === 'completed').length;
  const totalArticles = focusAreas.reduce((sum, f) => sum + f.articles.length, 0);
  const progress = calculateFocusAreaProgress(focusAreas);
  const totalCompleted = progress.reduce((sum, p) => sum + p.completedArticles, 0);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">{active}</Typography>
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="info.main">{planned}</Typography>
            <Typography variant="caption" color="text.secondary">Planned</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{completed}</Typography>
            <Typography variant="caption" color="text.secondary">Completed</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{totalArticles}</Typography>
            <Typography variant="caption" color="text.secondary">Total Articles</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">{totalCompleted}</Typography>
            <Typography variant="caption" color="text.secondary">B+ Class</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// === Main Focus Areas Panel ===

export function FocusAreasPanel() {
  const { data: dashboard } = useDashboard();
  const focusAreas = dashboard?.focusAreas ?? [];
  const progress = calculateFocusAreaProgress(focusAreas);

  // Create lookup for progress by ID
  const progressById = new Map(progress.map((p) => [p.id, p]));

  // Sort: active first, then planned, then completed
  const sortedAreas = [...focusAreas].sort((a, b) => {
    const order = { active: 0, planned: 1, blocked: 2, completed: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Focus Areas"
        subtitle={`${focusAreas.length} project clusters`}
      />

      <SummaryStats focusAreas={focusAreas} />

      {sortedAreas.length > 0 ? (
        <Grid container spacing={2}>
          {sortedAreas.map((area) => {
            const areaProgress = progressById.get(area.id) ?? {
              completedArticles: 0,
              totalArticles: 0,
              progressPercent: 0,
            };
            
            return (
              <Grid item xs={12} md={6} key={area.id}>
                <FocusAreaCard focusArea={area} progress={areaProgress} />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <EmptyState
          title="No focus areas"
          description="Create focus areas to organize your Wikipedia editing projects"
        />
      )}
    </Box>
  );
}

export default FocusAreasPanel;
