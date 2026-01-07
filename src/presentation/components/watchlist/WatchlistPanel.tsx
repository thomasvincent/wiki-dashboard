/**
 * Watchlist Panel Component
 * Displays user's recent edits (simulates watchlist without OAuth)
 * Connected to real Wikipedia API
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Visibility as WatchIcon,
  OpenInNew as OpenIcon,
  Difference as DiffIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { SectionHeader, EmptyState } from '../common';
import { formatByteDiff } from '@domain/value-objects';
import { useRecentEdits } from '@presentation/hooks/queries';

// === Namespace display names ===
const NAMESPACE_NAMES: Record<number, string> = {
  0: 'Article',
  1: 'Talk',
  2: 'User',
  3: 'User talk',
  4: 'Wikipedia',
  5: 'Wikipedia talk',
  6: 'File',
  7: 'File talk',
  10: 'Template',
  11: 'Template talk',
  14: 'Category',
  118: 'Draft',
};

// === Watchlist Item Component ===

interface WatchlistItemRowProps {
  item: {
    title: string;
    ns: number;
    revid: number;
    user: string;
    timestamp: string;
    sizediff: number;
    comment: string;
  };
}

function WatchlistItemRow({ item }: WatchlistItemRowProps) {
  const diffColor = item.sizediff > 0 ? 'success.main' : item.sizediff < 0 ? 'error.main' : 'text.secondary';

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View diff">
            <IconButton
              size="small"
              onClick={() => window.open(`https://en.wikipedia.org/w/index.php?diff=${item.revid}`, '_blank')}
            >
              <DiffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View history">
            <IconButton
              size="small"
              onClick={() => window.open(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(item.title)}&action=history`, '_blank')}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open article">
            <IconButton
              size="small"
              onClick={() => window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`, '_blank')}
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemButton sx={{ pr: 14 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}
              >
                {item.title}
              </Typography>
              {item.ns !== 0 && (
                <Chip
                  label={NAMESPACE_NAMES[item.ns] || `ns:${item.ns}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
              <Typography
                variant="caption"
                sx={{ color: diffColor, fontWeight: 500 }}
              >
                {formatByteDiff(item.sizediff)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {item.user} - {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.comment || '(no edit summary)'}
            </Typography>
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );
}

// === Main Watchlist Panel ===

export function WatchlistPanel() {
  const [namespaceFilter, setNamespaceFilter] = useState<number | 'all'>('all');
  const [daysFilter, setDaysFilter] = useState<number>(7);

  const { data: recentEditsData, isLoading, error } = useRecentEdits(undefined, daysFilter);

  const watchlist = useMemo(() => {
    return recentEditsData?.data ?? [];
  }, [recentEditsData]);

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      if (namespaceFilter !== 'all' && item.ns !== namespaceFilter) return false;
      return true;
    });
  }, [watchlist, namespaceFilter]);

  // Get unique namespaces from watchlist
  const namespaces = useMemo(() => {
    const nsSet = new Set(watchlist.map(i => i.ns));
    return Array.from(nsSet).sort((a, b) => a - b);
  }, [watchlist]);

  // Namespace stats
  const articleCount = watchlist.filter(i => i.ns === 0).length;
  const talkCount = watchlist.filter(i => i.ns === 1 || i.ns === 3 || i.ns === 5).length;

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Recent Edits"
        subtitle={`${filteredWatchlist.length} edits in the last ${daysFilter} days`}
      />

      {/* Data source info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Showing your recent contribution history from Wikipedia. Full watchlist requires OAuth authentication.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load recent edits: {String(error)}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : watchlist.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Edits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600} color="primary.main">
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : articleCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Article Edits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : talkCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Talk Pages
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {isLoading ? <Skeleton width={40} sx={{ mx: 'auto' }} /> : namespaces.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Namespaces
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Namespace</InputLabel>
          <Select
            value={namespaceFilter}
            label="Namespace"
            onChange={(e) => setNamespaceFilter(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All namespaces</MenuItem>
            {namespaces.map(ns => (
              <MenuItem key={ns} value={ns}>
                {NAMESPACE_NAMES[ns] || `ns:${ns}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={daysFilter}
            label="Time Range"
            onChange={(e) => setDaysFilter(e.target.value as number)}
          >
            <MenuItem value={1}>Last 24 hours</MenuItem>
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={14}>Last 14 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Watchlist */}
      {isLoading ? (
        <Paper variant="outlined">
          <List disablePadding>
            {[1, 2, 3, 4, 5].map(i => (
              <Box key={i} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            ))}
          </List>
        </Paper>
      ) : filteredWatchlist.length > 0 ? (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredWatchlist.map((item, index) => (
              <Box key={`${item.revid}-${index}`}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <WatchlistItemRow item={item} />
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <EmptyState
          title="No recent edits"
          description={namespaceFilter !== 'all' ? 'Try adjusting your filters' : `No edits in the last ${daysFilter} days`}
          icon={<WatchIcon sx={{ fontSize: 48 }} />}
        />
      )}
    </Box>
  );
}

export default WatchlistPanel;
