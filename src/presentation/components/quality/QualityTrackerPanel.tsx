/**
 * Quality Tracker Panel Component
 * Track article quality nominations and assessments
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
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  EmojiEvents as TrophyIcon,
  Pending as PendingIcon,
  CheckCircle as PassedIcon,
  Cancel as FailedIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SectionHeader, EmptyState } from '../common';
import { useDashboard } from '@presentation/hooks/queries';
import type { QualityAssessment, QualityNomination, ArticleClass } from '@domain/entities';

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

// === Mock data ===
const mockNominations: QualityNomination[] = [
  {
    id: '1',
    title: 'Machine learning',
    type: 'GA',
    status: 'under-review',
    nominatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    resolvedAt: null,
    url: 'https://en.wikipedia.org/wiki/Talk:Machine_learning/GA1',
  },
  {
    id: '2',
    title: 'Artificial neural network',
    type: 'peer-review',
    status: 'pending',
    nominatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    resolvedAt: null,
    url: 'https://en.wikipedia.org/wiki/Wikipedia:Peer_review/Artificial_neural_network',
  },
  {
    id: '3',
    title: 'Deep learning',
    type: 'DYK',
    status: 'passed',
    nominatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    url: 'https://en.wikipedia.org/wiki/Template:Did_you_know_nominations/Deep_learning',
  },
  {
    id: '4',
    title: 'Computer vision',
    type: 'GA',
    status: 'failed',
    nominatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    url: 'https://en.wikipedia.org/wiki/Talk:Computer_vision/GA1',
  },
];

const mockAssessments: QualityAssessment[] = [
  { title: 'Machine learning', class: 'B', importance: 'top', projects: ['Computing', 'AI'], assessedAt: new Date() },
  { title: 'Neural network', class: 'C', importance: 'high', projects: ['Computing'], assessedAt: new Date() },
  { title: 'Deep learning', class: 'GA', importance: 'high', projects: ['Computing', 'AI'], assessedAt: new Date() },
  { title: 'Computer vision', class: 'B', importance: 'mid', projects: ['Computing'], assessedAt: new Date() },
  { title: 'Convolutional neural network', class: 'start', importance: 'mid', projects: ['Computing'], assessedAt: new Date() },
];

// === Nomination Status Icon ===
function NominationStatusIcon({ status }: { status: QualityNomination['status'] }) {
  switch (status) {
    case 'passed':
      return <PassedIcon color="success" />;
    case 'failed':
      return <FailedIcon color="error" />;
    case 'under-review':
      return <PendingIcon color="info" />;
    default:
      return <PendingIcon color="action" />;
  }
}

// === Nomination Type Chip ===
function NominationTypeChip({ type }: { type: QualityNomination['type'] }) {
  const config: Record<string, { label: string; color: string }> = {
    GA: { label: 'Good Article', color: '#66FF66' },
    FA: { label: 'Featured Article', color: '#FFD700' },
    FL: { label: 'Featured List', color: '#FFD700' },
    DYK: { label: 'Did You Know', color: '#9c27b0' },
    ITN: { label: 'In The News', color: '#1976d2' },
    'peer-review': { label: 'Peer Review', color: '#757575' },
  };

  const c = config[type] ?? { label: type, color: '#757575' };
  return (
    <Chip
      label={c.label}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.65rem',
        bgcolor: `${c.color}20`,
        color: c.color,
        borderColor: c.color,
      }}
      variant="outlined"
    />
  );
}

// === Quality Distribution Chart ===

function QualityDistribution({ assessments }: { assessments: QualityAssessment[] }) {
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

// === Nomination List ===

function NominationList({ nominations }: { nominations: QualityNomination[] }) {
  const activeNominations = nominations.filter(n => n.status === 'pending' || n.status === 'under-review');
  const resolvedNominations = nominations.filter(n => n.status === 'passed' || n.status === 'failed');

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quality Nominations
        </Typography>

        {activeNominations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Active
            </Typography>
            <Paper variant="outlined">
              <List disablePadding>
                {activeNominations.map((nomination, index) => (
                  <Box key={nomination.id}>
                    {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Chip
                          label={nomination.status === 'under-review' ? 'Under Review' : 'Pending'}
                          size="small"
                          color={nomination.status === 'under-review' ? 'info' : 'default'}
                        />
                      }
                    >
                      <ListItemButton onClick={() => window.open(nomination.url, '_blank')}>
                        <ListItemIcon>
                          <NominationStatusIcon status={nomination.status} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {nomination.title}
                              </Typography>
                              <NominationTypeChip type={nomination.type} />
                            </Box>
                          }
                          secondary={`Nominated ${format(nomination.nominatedAt, 'MMM d, yyyy')}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {resolvedNominations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent History
            </Typography>
            <Paper variant="outlined">
              <List disablePadding>
                {resolvedNominations.map((nomination, index) => (
                  <Box key={nomination.id}>
                    {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Chip
                          label={nomination.status === 'passed' ? 'Passed' : 'Failed'}
                          size="small"
                          color={nomination.status === 'passed' ? 'success' : 'error'}
                        />
                      }
                    >
                      <ListItemButton onClick={() => window.open(nomination.url, '_blank')}>
                        <ListItemIcon>
                          <NominationStatusIcon status={nomination.status} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{nomination.title}</Typography>
                              <NominationTypeChip type={nomination.type} />
                            </Box>
                          }
                          secondary={
                            nomination.resolvedAt
                              ? `Resolved ${format(nomination.resolvedAt, 'MMM d, yyyy')}`
                              : `Nominated ${format(nomination.nominatedAt, 'MMM d, yyyy')}`
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {nominations.length === 0 && (
          <EmptyState
            title="No nominations"
            description="Start a GA or FA nomination to track progress here"
            icon={<TrophyIcon sx={{ fontSize: 48 }} />}
          />
        )}
      </CardContent>
    </Card>
  );
}

// === Main Quality Tracker Panel ===

export function QualityTrackerPanel() {
  useDashboard(); // Preload dashboard data

  const activeNominations = mockNominations.filter(
    n => n.status === 'pending' || n.status === 'under-review'
  ).length;
  const passedNominations = mockNominations.filter(n => n.status === 'passed').length;
  const gaArticles = mockAssessments.filter(a => a.class === 'GA' || a.class === 'FA').length;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Quality Tracker"
        subtitle="Track article quality and nominations"
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <TrendingIcon color="primary" />
              <Typography variant="h5" fontWeight={600}>
                {activeNominations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Nominations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <PassedIcon color="success" />
              <Typography variant="h5" fontWeight={600} color="success.main">
                {passedNominations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Passed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <StarIcon sx={{ color: '#66FF66' }} />
              <Typography variant="h5" fontWeight={600}>
                {gaArticles}
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
              <StarBorderIcon color="action" />
              <Typography variant="h5" fontWeight={600}>
                {mockAssessments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assessed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <QualityDistribution assessments={mockAssessments} />
        </Grid>
        <Grid item xs={12} md={6}>
          <NominationList nominations={mockNominations} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default QualityTrackerPanel;
