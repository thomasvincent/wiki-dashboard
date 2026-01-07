/**
 * Contributions Panel Component
 * Displays contribution history with filtering and drill-down
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { SectionHeader, EmptyState, WikiLink } from '../common';
import { useUIStore } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { analyzeContributions } from '@application/services';
import { formatByteDiff, CONTRIBUTION_TYPE_DISPLAY } from '@domain/value-objects';
import type { Contribution, ContributionType } from '@domain/entities';

// === Types ===

type SortField = 'timestamp' | 'articleTitle' | 'byteDiff' | 'type';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'timeline';

interface ContributionFilters {
  type: ContributionType | 'all';
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

// === Contribution Row ===

interface ContributionRowProps {
  contribution: Contribution;
  onSelect: (contribution: Contribution) => void;
}

function ContributionRow({ contribution, onSelect }: ContributionRowProps) {
  const typeDisplay = CONTRIBUTION_TYPE_DISPLAY[contribution.type];
  const isPositive = contribution.byteDiff >= 0;

  return (
    <TableRow
      hover
      sx={{ cursor: 'pointer' }}
      onClick={() => onSelect(contribution)}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {contribution.articleTitle}
          </Typography>
          {contribution.isMinor && (
            <Chip label="m" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
          {contribution.summary || 'No edit summary'}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={typeDisplay.label}
          size="small"
          sx={{
            backgroundColor: `${typeDisplay.color}20`,
            color: typeDisplay.color,
            fontWeight: 500,
          }}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" />
          )}
          <Typography
            variant="body2"
            sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 500 }}
          >
            {formatByteDiff(contribution.byteDiff)}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {format(contribution.timestamp, 'MMM d, yyyy')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {format(contribution.timestamp, 'h:mm a')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="View diff">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `https://en.wikipedia.org/wiki/Special:Diff/${contribution.revisionId}`,
                '_blank'
              );
            }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open article">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(contribution.articleUrl, '_blank');
            }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// === Timeline View ===

interface TimelineViewProps {
  contributions: readonly Contribution[];
}

function TimelineView({ contributions }: TimelineViewProps) {
  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, Contribution[]>();
    
    for (const c of contributions) {
      let label: string;
      if (isToday(c.timestamp)) {
        label = 'Today';
      } else if (isYesterday(c.timestamp)) {
        label = 'Yesterday';
      } else if (isThisWeek(c.timestamp)) {
        label = format(c.timestamp, 'EEEE');
      } else {
        label = format(c.timestamp, 'MMMM d, yyyy');
      }
      
      const existing = groups.get(label) ?? [];
      groups.set(label, [...existing, c]);
    }
    
    return groups;
  }, [contributions]);

  return (
    <Box>
      {Array.from(grouped.entries()).map(([date, contribs]) => (
        <Box key={date} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {date} ({contribs.length} edits)
          </Typography>
          {contribs.map((c) => (
            <Card key={c.revisionId} sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <WikiLink href={c.articleUrl}>{c.articleTitle}</WikiLink>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {c.summary || 'No edit summary'} · {format(c.timestamp, 'h:mm a')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: c.byteDiff >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 500,
                    }}
                  >
                    {formatByteDiff(c.byteDiff)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ))}
    </Box>
  );
}

// === Stats Summary ===

interface StatsSummaryProps {
  contributions: readonly Contribution[];
}

function StatsSummary({ contributions }: StatsSummaryProps) {
  const summary = analyzeContributions(contributions);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={3}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{summary.totalEdits}</Typography>
            <Typography variant="caption" color="text.secondary">Total Edits</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">
              +{(summary.totalBytesAdded / 1000).toFixed(1)}K
            </Typography>
            <Typography variant="caption" color="text.secondary">Bytes Added</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{summary.majorExpansions}</Typography>
            <Typography variant="caption" color="text.secondary">Major Expansions</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{summary.mostEditedArticles.length}</Typography>
            <Typography variant="caption" color="text.secondary">Articles Touched</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// === Main Contributions Panel ===

export function ContributionsPanel() {
  const { data: dashboard } = useDashboard();
  
  const [filters, setFilters] = useState<ContributionFilters>({
    type: 'all',
    search: '',
    dateRange: 'all',
  });
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const contributions = dashboard?.recentContributions ?? [];

  // Filter and sort
  const filteredContributions = useMemo(() => {
    let result = [...contributions];

    // Filter by type
    if (filters.type !== 'all') {
      result = result.filter((c) => c.type === filters.type);
    }

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.articleTitle.toLowerCase().includes(search) ||
          c.summary.toLowerCase().includes(search)
      );
    }

    // Filter by date range
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        result = result.filter((c) => isToday(c.timestamp));
        break;
      case 'week':
        result = result.filter((c) => isThisWeek(c.timestamp));
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        result = result.filter((c) => c.timestamp >= monthAgo);
        break;
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'articleTitle':
          comparison = a.articleTitle.localeCompare(b.articleTitle);
          break;
        case 'byteDiff':
          comparison = a.byteDiff - b.byteDiff;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contributions, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Contributions"
        subtitle={`${filteredContributions.length} of ${contributions.length} edits`}
      />

      <StatsSummary contributions={filteredContributions} />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search contributions..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.type}
            label="Type"
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as any }))}
          >
            <MenuItem value="all">All types</MenuItem>
            <MenuItem value="major_expansion">Major Expansion</MenuItem>
            <MenuItem value="minor_edit">Minor Edit</MenuItem>
            <MenuItem value="new_article">New Article</MenuItem>
            <MenuItem value="talk_page">Talk Page</MenuItem>
            <MenuItem value="revert">Revert</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={filters.dateRange}
            label="Date"
            onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as any }))}
          >
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This week</MenuItem>
            <MenuItem value="month">This month</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
        >
          <ToggleButton value="table">
            <TableIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="timeline">
            <CalendarIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      {filteredContributions.length > 0 ? (
        viewMode === 'table' ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'articleTitle'}
                      direction={sortField === 'articleTitle' ? sortDirection : 'asc'}
                      onClick={() => handleSort('articleTitle')}
                    >
                      Article
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'type'}
                      direction={sortField === 'type' ? sortDirection : 'asc'}
                      onClick={() => handleSort('type')}
                    >
                      Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'byteDiff'}
                      direction={sortField === 'byteDiff' ? sortDirection : 'asc'}
                      onClick={() => handleSort('byteDiff')}
                    >
                      Size
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'timestamp'}
                      direction={sortField === 'timestamp' ? sortDirection : 'asc'}
                      onClick={() => handleSort('timestamp')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContributions.map((contribution) => (
                  <ContributionRow
                    key={contribution.revisionId}
                    contribution={contribution}
                    onSelect={() => {}}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TimelineView contributions={filteredContributions} />
        )
      ) : (
        <EmptyState
          title="No contributions found"
          description={filters.search || filters.type !== 'all' ? 'Try adjusting your filters' : 'Start editing to see your contributions here'}
        />
      )}
    </Box>
  );
}

export default ContributionsPanel;
