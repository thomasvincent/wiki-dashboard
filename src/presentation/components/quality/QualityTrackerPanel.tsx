/**
 * Quality Tracker Panel Component
 * Track article quality nominations and assessments
 * Connected to real Wikipedia API for page assessments
 */

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  EmojiEvents as TrophyIcon,
  Pending as PendingIcon,
  CheckCircle as PassedIcon,
  TrendingUp as TrendingIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { SectionHeader, EmptyState } from '../common';
import { useArticlesCreated, usePageAssessments } from '@presentation/hooks/queries';
import type { ArticleClass } from '@domain/entities';

// === Article class config ===
const CLASS_CONFIG: Record<ArticleClass, { label: string; color: string; icon: React.ReactNode }> = {
  FA: { label: 'Featured', color: '#FFD700', icon: <StarIcon sx={{ color: '#FFD700' }} /> },
  FL: { label: 'Featured List', color: '#FFD700', icon: <StarIcon sx={{ color: '#FFD700' }} /> },
  A: { label: 'A-class', color: '#66FF66', icon: <StarBorderIcon sx={{ color: '#66FF66' }} /> },
  GA: { label: 'Good', color: '#66FF66', icon: <StarBorderIcon sx={{ color: '#66FF66' }} /> },
  B: { label: 'B-class', color: '#B2FF66', icon: <StarBorderIcon sx={{ color: '#B2FF66' }} /> },
  C: { label: 'C-class', color: '#FFFF66', icon: <StarBorderIcon sx={{ color: '#FFFF66' }} /> },
  start: { label: 'Start', color: '#FFAA66', icon: <StarBorderIcon sx={{ color: '#FFAA66' }} /> },
  stub: { label: 'Stub', color: '#FF6666', icon: <StarBorderIcon sx={{ color: '#FF6666' }} /> },
  List: { label: 'List', color: '#AA88FF', icon: <StarBorderIcon sx={{ color: '#AA88FF' }} /> },
  Unassessed: { label: 'Unassessed', color: '#AAAAAA', icon: <StarBorderIcon sx={{ color: '#AAAAAA' }} /> },
};

// === Quality Assessment from API ===
interface AssessmentData {
  title: string;
  class: ArticleClass;
  projects: string[];
}

// === Quality Distribution Chart ===

interface QualityDistributionProps {
  assessments: AssessmentData[];
  loading?: boolean;
}

function QualityDistribution({ assessments, loading }: QualityDistributionProps) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    assessments.forEach(a => {
      counts[a.class] = (counts[a.class] || 0) + 1;
    });

    const order: ArticleClass[] = ['FA', 'FL', 'A', 'GA', 'B', 'C', 'start', 'stub', 'List', 'Unassessed'];
    return order
      .filter(c => counts[c] !== undefined && counts[c] > 0)
      .map(c => ({
        class: c,
        count: counts[c] as number,
        config: CLASS_CONFIG[c],
      }));
  }, [assessments]);

  const total = assessments.length;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Article Quality Distribution
          </Typography>
          {[1, 2, 3, 4].map(i => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (distribution.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Article Quality Distribution
          </Typography>
          <Typography color="text.secondary">
            No assessed articles found. Create mainspace articles to see quality assessments.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Article Quality Distribution
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {distribution.map(({ class: cls, count, config }) => (
            <Box key={cls}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {config.icon}
                  <Typography variant="body2">{config.label}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {count} ({Math.round((count / total) * 100)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(count / total) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: config.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// === Article List by Quality ===

interface ArticleListProps {
  assessments: AssessmentData[];
  loading?: boolean;
}

function ArticleList({ assessments, loading }: ArticleListProps) {
  // Sort by quality class
  const sortedArticles = useMemo(() => {
    const classOrder: ArticleClass[] = ['FA', 'FL', 'A', 'GA', 'B', 'C', 'start', 'stub', 'List', 'Unassessed'];
    return [...assessments].sort((a, b) => {
      return classOrder.indexOf(a.class) - classOrder.indexOf(b.class);
    });
  }, [assessments]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Assessed Articles
          </Typography>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sortedArticles.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Assessed Articles
          </Typography>
          <EmptyState
            title="No assessed articles"
            description="Create mainspace articles to see quality assessments here"
            icon={<TrophyIcon sx={{ fontSize: 48 }} />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Assessed Articles ({sortedArticles.length})
        </Typography>
        <Paper variant="outlined">
          <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sortedArticles.map((article, index) => {
              const config = CLASS_CONFIG[article.class];
              return (
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
                      <ListItemIcon>{config.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {article.title}
                            </Typography>
                            <Chip
                              label={config.label}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: `${config.color}20`,
                                color: config.color,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          article.projects.length > 0
                            ? `WikiProjects: ${article.projects.join(', ')}`
                            : 'No WikiProject assessment'
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </Paper>
      </CardContent>
    </Card>
  );
}

// === Nomination Info Card ===

function NominationInfo() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quality Nominations
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Nomination tracking requires OAuth authentication for full access.
          Visit these pages to check your active nominations manually.
        </Alert>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<StarIcon sx={{ color: '#66FF66' }} />}
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() =>
              window.open('https://en.wikipedia.org/wiki/Wikipedia:Good_article_nominations', '_blank')
            }
          >
            Good Article Nominations
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<StarIcon sx={{ color: '#FFD700' }} />}
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() =>
              window.open('https://en.wikipedia.org/wiki/Wikipedia:Featured_article_candidates', '_blank')
            }
          >
            Featured Article Candidates
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TrophyIcon color="secondary" />}
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() =>
              window.open('https://en.wikipedia.org/wiki/Wikipedia:Did_you_know', '_blank')
            }
          >
            Did You Know
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PendingIcon color="action" />}
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() =>
              window.open('https://en.wikipedia.org/wiki/Wikipedia:Peer_review', '_blank')
            }
          >
            Peer Review
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// === Main Quality Tracker Panel ===

export function QualityTrackerPanel() {
  // Fetch user's created articles
  const { data: articlesCreated, isLoading: articlesLoading } = useArticlesCreated();

  // Get article titles for assessment lookup
  const articleTitles = useMemo(() => {
    return articlesCreated?.map(a => a.title) ?? [];
  }, [articlesCreated]);

  // Fetch page assessments for created articles
  const { data: assessmentsData, isLoading: assessmentsLoading, error: assessmentsError } = usePageAssessments(articleTitles);

  // Transform assessment data
  const assessments: AssessmentData[] = useMemo(() => {
    if (!assessmentsData || !articlesCreated) return [];

    return articlesCreated.map(article => {
      const assessment = assessmentsData[article.title];
      if (assessment) {
        // Get the highest quality class from all projects
        const classes = Object.values(assessment).map(p => p.class);
        const classOrder: ArticleClass[] = ['FA', 'FL', 'A', 'GA', 'B', 'C', 'start', 'stub', 'List', 'Unassessed'];
        const bestClass = classes.reduce((best, current) => {
          const bestIdx = classOrder.indexOf(best as ArticleClass);
          const currentIdx = classOrder.indexOf(current as ArticleClass);
          return currentIdx < bestIdx ? current : best;
        }, 'Unassessed') as ArticleClass;

        return {
          title: article.title,
          class: bestClass,
          projects: Object.keys(assessment),
        };
      }
      return {
        title: article.title,
        class: 'Unassessed' as ArticleClass,
        projects: [],
      };
    });
  }, [articlesCreated, assessmentsData]);

  const isLoading = articlesLoading || assessmentsLoading;

  // Calculate stats
  const gaFaArticles = assessments.filter(a => a.class === 'GA' || a.class === 'FA' || a.class === 'FL').length;
  const bClassOrBetter = assessments.filter(a => ['FA', 'FL', 'A', 'GA', 'B'].includes(a.class)).length;
  const assessedCount = assessments.filter(a => a.class !== 'Unassessed').length;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Quality Tracker"
        subtitle="Track article quality and assessments"
      />

      {/* Data source info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Quality assessments are fetched live from Wikipedia for your created articles.
      </Alert>

      {assessmentsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some assessment data couldn't be loaded. Showing available data.
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <TrendingIcon color="primary" />
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : articleTitles.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Articles Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <PassedIcon color="success" />
              <Typography variant="h5" fontWeight={600} color="success.main">
                {isLoading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : assessedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assessed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <StarIcon sx={{ color: '#66FF66' }} />
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : gaFaArticles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                GA/FA Articles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <StarBorderIcon sx={{ color: '#B2FF66' }} />
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : bClassOrBetter}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                B-class or better
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <QualityDistribution assessments={assessments} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <NominationInfo />
        </Grid>
        <Grid item xs={12}>
          <ArticleList assessments={assessments} loading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default QualityTrackerPanel;
