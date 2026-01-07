/**
 * Watchlist Panel Component
 * Displays watched articles with recent changes
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
} from '@mui/material';
import {
  Visibility as WatchIcon,
  Circle as UnreadIcon,
  OpenInNew as OpenIcon,
  Difference as DiffIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { SectionHeader, EmptyState } from '../common';
import { formatByteDiff } from '@domain/value-objects';
import type { WatchlistItem } from '@domain/entities';

// === Mock data ===
const mockWatchlist: WatchlistItem[] = [
  {
    title: 'Artificial intelligence',
    ns: 0,
    lastRevisionId: 1234567,
    lastEditor: 'ExampleUser',
    timestamp: new Date(Date.now() - 3600000),
    oldLength: 45000,
    newLength: 45320,
    comment: 'Added information about latest developments',
    unread: true,
  },
  {
    title: 'Machine learning',
    ns: 0,
    lastRevisionId: 1234568,
    lastEditor: 'AnotherEditor',
    timestamp: new Date(Date.now() - 7200000),
    oldLength: 32000,
    newLength: 31800,
    comment: 'Removed unsourced content',
    unread: true,
  },
  {
    title: 'Talk:Deep learning',
    ns: 1,
    lastRevisionId: 1234569,
    lastEditor: 'TalkUser',
    timestamp: new Date(Date.now() - 86400000),
    oldLength: 5000,
    newLength: 5200,
    comment: 'New discussion about article structure',
    unread: false,
  },
  {
    title: 'Neural network',
    ns: 0,
    lastRevisionId: 1234570,
    lastEditor: 'EditMaster',
    timestamp: new Date(Date.now() - 172800000),
    oldLength: 28000,
    newLength: 29500,
    comment: 'Added new section on transformers',
    unread: false,
  },
  {
    title: 'Computer vision',
    ns: 0,
    lastRevisionId: 1234571,
    lastEditor: 'CVExpert',
    timestamp: new Date(Date.now() - 259200000),
    oldLength: 22000,
    newLength: 22100,
    comment: 'Fixed typo',
    unread: false,
  },
];

// === Namespace display names ===
const NAMESPACE_NAMES: Record<number, string> = {
  0: 'Article',
  1: 'Talk',
  2: 'User',
  3: 'User talk',
  4: 'Wikipedia',
  5: 'Wikipedia talk',
  10: 'Template',
  118: 'Draft',
};

// === Watchlist Item Component ===

interface WatchlistItemRowProps {
  item: WatchlistItem;
  onMarkRead?: (title: string) => void;
}

function WatchlistItemRow({ item, onMarkRead }: WatchlistItemRowProps) {
  const byteDiff = item.newLength - item.oldLength;
  const diffColor = byteDiff > 0 ? 'success.main' : byteDiff < 0 ? 'error.main' : 'text.secondary';

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View diff">
            <IconButton
              size="small"
              onClick={() => window.open(`https://en.wikipedia.org/w/index.php?diff=${item.lastRevisionId}`, '_blank')}
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
      <ListItemButton
        onClick={() => item.unread && onMarkRead?.(item.title)}
        sx={{ pr: 14 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
          {item.unread && (
            <UnreadIcon sx={{ fontSize: 10, color: 'primary.main', mt: 0.8 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                fontWeight={item.unread ? 600 : 400}
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
                {formatByteDiff(byteDiff)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {item.lastEditor} - {formatDistanceToNow(item.timestamp, { addSuffix: true })}
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
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(mockWatchlist);

  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      if (namespaceFilter !== 'all' && item.ns !== namespaceFilter) return false;
      if (showUnreadOnly && !item.unread) return false;
      return true;
    });
  }, [watchlist, namespaceFilter, showUnreadOnly]);

  const unreadCount = watchlist.filter(i => i.unread).length;

  const handleMarkRead = (title: string) => {
    setWatchlist(prev =>
      prev.map(item =>
        item.title === title ? { ...item, unread: false } : item
      )
    );
  };

  const handleMarkAllRead = () => {
    setWatchlist(prev => prev.map(item => ({ ...item, unread: false })));
  };

  // Get unique namespaces from watchlist
  const namespaces = useMemo(() => {
    const nsSet = new Set(watchlist.map(i => i.ns));
    return Array.from(nsSet).sort((a, b) => a - b);
  }, [watchlist]);

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Watchlist"
        subtitle={`${filteredWatchlist.length} articles${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        action={
          unreadCount > 0 && (
            <Chip
              label="Mark all read"
              size="small"
              onClick={handleMarkAllRead}
              sx={{ cursor: 'pointer' }}
            />
          )
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {watchlist.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Watched
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600} color="primary.main">
                {unreadCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Unread
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {watchlist.filter(i => i.ns === 0).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Articles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {watchlist.filter(i => i.ns === 1).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Talk Pages
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
        <Chip
          label="Unread only"
          variant={showUnreadOnly ? 'filled' : 'outlined'}
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          color={showUnreadOnly ? 'primary' : 'default'}
        />
      </Box>

      {/* Watchlist */}
      {filteredWatchlist.length > 0 ? (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredWatchlist.map((item, index) => (
              <Box key={item.title}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <WatchlistItemRow item={item} onMarkRead={handleMarkRead} />
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <EmptyState
          title="No watchlist items"
          description={showUnreadOnly ? 'No unread changes' : 'Add articles to your watchlist to track changes'}
          icon={<WatchIcon sx={{ fontSize: 48 }} />}
        />
      )}

      {/* Login prompt for real data */}
      <Card variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            This is sample data. Connect your Wikipedia account to see your actual watchlist.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default WatchlistPanel;
