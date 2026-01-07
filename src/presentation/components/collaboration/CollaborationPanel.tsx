/**
 * Collaboration Panel Component
 * WikiProjects, editathons, and community engagement
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
} from '@mui/icons-material';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import { SectionHeader } from '../common';
import type { WikiProject, Editathon } from '@domain/entities';

// === Mock data ===
const mockWikiProjects: WikiProject[] = [
  {
    name: 'WikiProject Computing',
    shortname: 'WP:COMP',
    url: 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Computing',
    memberCount: 1250,
    activeDiscussions: 12,
  },
  {
    name: 'WikiProject Artificial Intelligence',
    shortname: 'WP:AI',
    url: 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Artificial_intelligence',
    memberCount: 340,
    activeDiscussions: 8,
  },
  {
    name: 'WikiProject Technology',
    shortname: 'WP:TECH',
    url: 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Technology',
    memberCount: 890,
    activeDiscussions: 5,
  },
  {
    name: 'WikiProject Science',
    shortname: 'WP:SCI',
    url: 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Science',
    memberCount: 2100,
    activeDiscussions: 18,
  },
];

const mockEditathons: Editathon[] = [
  {
    id: '1',
    name: 'AI Week 2026',
    description: 'Improve articles about artificial intelligence and machine learning',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:AI_Week_2026',
    participantCount: 45,
    articleCount: 0,
  },
  {
    id: '2',
    name: 'Women in Tech Edit-a-thon',
    description: 'Create and improve articles about women in technology',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:Women_in_Tech_2026',
    participantCount: 128,
    articleCount: 67,
  },
  {
    id: '3',
    name: 'Science Citation Sprint',
    description: 'Add citations to science articles',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    url: 'https://en.wikipedia.org/wiki/Wikipedia:Science_Citation_Sprint',
    participantCount: 89,
    articleCount: 234,
  },
];

// === WikiProject Card ===

interface WikiProjectCardProps {
  project: WikiProject;
}

function WikiProjectCard({ project }: WikiProjectCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {project.name}
            </Typography>
            <Chip
              label={project.shortname}
              size="small"
              variant="outlined"
              sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Button
            size="small"
            endIcon={<OpenIcon fontSize="small" />}
            onClick={() => window.open(project.url, '_blank')}
          >
            Visit
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {project.memberCount?.toLocaleString() ?? '?'} members
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ForumIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {project.activeDiscussions} discussions
            </Typography>
          </Box>
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

        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {editathon.participantCount} participants
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ArticleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {editathon.articleCount} articles
            </Typography>
          </Box>
        </Box>

        <Button
          variant={isActive ? 'contained' : 'outlined'}
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => window.open(editathon.url, '_blank')}
          endIcon={<OpenIcon fontSize="small" />}
        >
          {isActive ? 'Join Now' : isUpcoming ? 'Learn More' : 'View Results'}
        </Button>
      </CardContent>
    </Card>
  );
}

// === Main Collaboration Panel ===

export function CollaborationPanel() {
  // Separate editathons by status
  const { activeEditathons, upcomingEditathons, pastEditathons } = useMemo(() => {
    const active: Editathon[] = [];
    const upcoming: Editathon[] = [];
    const past: Editathon[] = [];

    mockEditathons.forEach(e => {
      if (isFuture(e.startDate)) {
        upcoming.push(e);
      } else if (isFuture(e.endDate)) {
        active.push(e);
      } else {
        past.push(e);
      }
    });

    return { activeEditathons: active, upcomingEditathons: upcoming, pastEditathons: past };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Collaboration"
        subtitle="WikiProjects and community events"
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <GroupsIcon color="primary" />
              <Typography variant="h5" fontWeight={600}>
                {mockWikiProjects.length}
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
              <ForumIcon color="action" />
              <Typography variant="h5" fontWeight={600}>
                {mockWikiProjects.reduce((sum, p) => sum + p.activeDiscussions, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Discussions
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
      </Grid>

      {/* Active and Upcoming Editathons */}
      {(activeEditathons.length > 0 || upcomingEditathons.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Editathons & Events
          </Typography>
          <Grid container spacing={2}>
            {[...activeEditathons, ...upcomingEditathons].map(editathon => (
              <Grid item xs={12} md={6} key={editathon.id}>
                <EditathonCard editathon={editathon} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* WikiProjects */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your WikiProjects
        </Typography>
        <Grid container spacing={2}>
          {mockWikiProjects.map(project => (
            <Grid item xs={12} sm={6} md={4} key={project.shortname}>
              <WikiProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Past Editathons */}
      {pastEditathons.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Past Events
          </Typography>
          <Grid container spacing={2}>
            {pastEditathons.map(editathon => (
              <Grid item xs={12} md={6} key={editathon.id}>
                <EditathonCard editathon={editathon} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Discover more */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Discover More
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<GroupsIcon />}
              onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Council/Directory', '_blank')}
            >
              Browse WikiProjects
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:Meetup', '_blank')}
            >
              Find Meetups
            </Button>
            <Button
              variant="outlined"
              startIcon={<ForumIcon />}
              onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:Village_pump', '_blank')}
            >
              Village Pump
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CollaborationPanel;
