/**
 * Collaboration Panel Component
 * WikiProjects, editathons, and community engagement
 * Connected to real Wikipedia API for WikiProject memberships
 */

import { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Event as EventIcon,
  Forum as ForumIcon,
  OpenInNew as OpenIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  HelpOutline as HelpIcon,
  School as SchoolIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import { SectionHeader } from '../common';
import { useWikiProjects, useDashboard } from '@presentation/hooks/queries';
import type { Editathon } from '@domain/entities';

// === Featured Editathons (curated list - hard to fetch programmatically) ===
const featuredEditathons: Editathon[] = [
  {
    id: '1',
    name: 'Art+Feminism 2026',
    description: 'Improve coverage of women and the arts on Wikipedia',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-31'),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:Meetup/ArtAndFeminism',
    participantCount: 500,
    articleCount: 0,
  },
  {
    id: '2',
    name: 'Wiki Loves Monuments',
    description: 'Annual photo contest for cultural heritage monuments',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-30'),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:Wiki_Loves_Monuments',
    participantCount: 10000,
    articleCount: 0,
  },
  {
    id: '3',
    name: '1Lib1Ref',
    description: 'Librarians adding citations to Wikipedia',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-02-05'),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:1Lib1Ref',
    participantCount: 2000,
    articleCount: 0,
  },
];

// === WikiProject Card ===

interface WikiProjectCardProps {
  projectName: string;
}

function WikiProjectCard({ projectName }: WikiProjectCardProps) {
  // Format project name for URL and display
  const formattedName = projectName.replace(/^Wikipedia:WikiProject\s*/, '');
  const projectUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(projectName)}`;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={500}>
              {formattedName}
            </Typography>
            <Chip
              label="Member"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Button
            size="small"
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() => window.open(projectUrl, '_blank')}
          >
            Visit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            size="small"
            variant="text"
            startIcon={<ForumIcon fontSize="small" />}
            onClick={() => window.open(`${projectUrl}/Talk`, '_blank')}
          >
            Talk
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<ArticleIcon fontSize="small" />}
            onClick={() => window.open(`${projectUrl}/Assessment`, '_blank')}
          >
            Tasks
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// === Editathon Card ===

interface EditathonCardProps {
  editathon: Editathon;
}

function EditathonCard({ editathon }: EditathonCardProps) {
  const isUpcoming = isFuture(editathon.startDate);
  const isActive = !isUpcoming && isFuture(editathon.endDate);

  const statusColor = isActive ? 'success' : isUpcoming ? 'info' : 'default';
  const statusLabel = isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed';

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderColor: isActive ? 'success.main' : undefined,
        borderWidth: isActive ? 2 : 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body1" fontWeight={500}>
                {editathon.name}
              </Typography>
              <Chip
                label={statusLabel}
                size="small"
                color={statusColor}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {editathon.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {format(editathon.startDate, 'MMM d')} - {format(editathon.endDate, 'MMM d, yyyy')}
          </Typography>
          {isActive && (
            <Typography variant="caption" color="success.main" fontWeight={500}>
              (Ends {formatDistanceToNow(editathon.endDate, { addSuffix: true })})
            </Typography>
          )}
          {isUpcoming && (
            <Typography variant="caption" color="info.main" fontWeight={500}>
              (Starts {formatDistanceToNow(editathon.startDate, { addSuffix: true })})
            </Typography>
          )}
        </Box>

        <Button
          variant={isActive ? 'contained' : 'outlined'}
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => window.open(editathon.url, '_blank')}
          endIcon={<OpenIcon fontSize="small" />}
        >
          {isActive ? 'Join Now' : isUpcoming ? 'Learn More' : 'View Event'}
        </Button>
      </CardContent>
    </Card>
  );
}

// === Community Resources ===

function CommunityResources() {
  const resources = [
    {
      title: 'Teahouse',
      description: 'Get help from experienced editors',
      icon: <HelpIcon />,
      url: 'https://en.wikipedia.org/wiki/Wikipedia:Teahouse',
    },
    {
      title: 'Adopt-a-User',
      description: 'Find a mentor or become one',
      icon: <SchoolIcon />,
      url: 'https://en.wikipedia.org/wiki/Wikipedia:Adopt-a-user',
    },
    {
      title: 'Collaboration',
      description: 'Join collaborative editing projects',
      icon: <HandshakeIcon />,
      url: 'https://en.wikipedia.org/wiki/Wikipedia:Collaboration',
    },
    {
      title: 'Village Pump',
      description: 'Central discussion forum',
      icon: <ForumIcon />,
      url: 'https://en.wikipedia.org/wiki/Wikipedia:Village_pump',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Community Resources
        </Typography>
        <Paper variant="outlined">
          <List disablePadding>
            {resources.map((resource, index) => (
              <Box key={resource.title}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => window.open(resource.url, '_blank')}>
                    <ListItemIcon>{resource.icon}</ListItemIcon>
                    <ListItemText
                      primary={resource.title}
                      secondary={resource.description}
                    />
                    <OpenIcon fontSize="small" color="action" />
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

// === Main Collaboration Panel ===

export function CollaborationPanel() {
  const { data: dashboard } = useDashboard();
  const { data: wikiProjects, isLoading: projectsLoading, error: projectsError } = useWikiProjects();

  // Separate editathons by status
  const { activeEditathons, upcomingEditathons } = useMemo(() => {
    const active: Editathon[] = [];
    const upcoming: Editathon[] = [];
    const past: Editathon[] = [];

    featuredEditathons.forEach(e => {
      if (isFuture(e.startDate)) {
        upcoming.push(e);
      } else if (isFuture(e.endDate)) {
        active.push(e);
      } else {
        past.push(e);
      }
    });

    return { activeEditathons: active, upcomingEditathons: upcoming };
  }, []);

  const projectCount = wikiProjects?.length ?? 0;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Collaboration"
        subtitle="WikiProjects and community engagement"
      />

      {/* Data source info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        WikiProject memberships are detected from your user page and talk page participation.
      </Alert>

      {projectsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load WikiProject data. Check your user page for project userboxes.
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <GroupsIcon color="primary" />
              <Typography variant="h5" fontWeight={600}>
                {projectsLoading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : projectCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                WikiProjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <EventIcon color="success" />
              <Typography variant="h5" fontWeight={600} color="success.main">
                {activeEditathons.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <TrendingIcon color="action" />
              <Typography variant="h5" fontWeight={600}>
                {upcomingEditathons.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upcoming Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <PeopleIcon color="action" />
              <Typography variant="h5" fontWeight={600}>
                {dashboard?.stats.totalEdits.toLocaleString() ?? '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your Edits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Your WikiProjects */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your WikiProjects
        </Typography>
        {projectsLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={120} />
              </Grid>
            ))}
          </Grid>
        ) : projectCount > 0 ? (
          <Grid container spacing={2}>
            {wikiProjects?.map(project => (
              <Grid item xs={12} sm={6} md={4} key={project}>
                <WikiProjectCard projectName={project} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                No WikiProject memberships detected.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Join WikiProjects to collaborate with other editors on topics you're interested in.
                Add project userboxes to your user page to be detected.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<GroupsIcon />}
                onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Council/Directory', '_blank')}
              >
                Browse WikiProjects
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Featured Editathons */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Featured Events
        </Typography>
        <Grid container spacing={2}>
          {[...activeEditathons, ...upcomingEditathons].slice(0, 3).map(editathon => (
            <Grid item xs={12} md={4} key={editathon.id}>
              <EditathonCard editathon={editathon} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Community Resources */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <CommunityResources />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Find More
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<GroupsIcon />}
                  onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Council/Directory', '_blank')}
                >
                  All WikiProjects
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:Meetup', '_blank')}
                >
                  Meetups
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:Editathon', '_blank')}
                >
                  Editathons
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CollaborationPanel;
