/**
 * Drafts Panel Component
 * Displays all drafts with filtering and drill-down
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
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Forum as ForumIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StatusChip, SectionHeader, WikiLink, EmptyState } from '../common';
import { useUIStore } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import type { Draft, DraftStatus } from '@domain/entities';

// === Types ===

type SortField = 'title' | 'status' | 'lastEditedAt' | 'submittedAt';
type SortDirection = 'asc' | 'desc';

interface DraftFilters {
  status: DraftStatus | 'all';
  search: string;
}

// === Draft Row ===

interface DraftRowProps {
  draft: Draft;
  onSelect: (draft: Draft) => void;
}

function DraftRow({ draft, onSelect }: DraftRowProps) {
  return (
    <TableRow
      hover
      sx={{ cursor: 'pointer' }}
      onClick={() => onSelect(draft)}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {draft.title}
          </Typography>
          {draft.coiDisclosed && (
            <Tooltip title="COI Disclosed">
              <Chip label="COI" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Tooltip>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
          {draft.notes}
        </Typography>
      </TableCell>
      <TableCell>
        <StatusChip status={draft.status} type="draft" />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {format(draft.lastEditedAt, 'MMM d, yyyy')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {format(draft.lastEditedAt, 'h:mm a')}
        </Typography>
      </TableCell>
      <TableCell>
        {draft.submittedAt ? (
          <>
            <Typography variant="body2">
              {format(draft.submittedAt, 'MMM d, yyyy')}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not submitted
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Open draft">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(draft.pageUrl, '_blank');
              }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Talk page">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(draft.talkPageUrl, '_blank');
              }}
            >
              <ForumIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {draft.afcLogUrl && (
            <Tooltip title="AfC log">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(draft.afcLogUrl!, '_blank');
                }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

// === Draft Detail Panel ===

interface DraftDetailProps {
  draft: Draft;
  onBack: () => void;
}

function DraftDetail({ draft, onBack }: DraftDetailProps) {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          onClick={onBack}
        >
          ← Back to drafts
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {draft.title}
              </Typography>
              <StatusChip status={draft.status} type="draft" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Open draft">
                <IconButton onClick={() => window.open(draft.pageUrl, '_blank')}>
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">{format(draft.createdAt, 'MMMM d, yyyy')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Last Edited</Typography>
              <Typography variant="body2">{format(draft.lastEditedAt, 'MMMM d, yyyy h:mm a')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Submitted</Typography>
              <Typography variant="body2">
                {draft.submittedAt ? format(draft.submittedAt, 'MMMM d, yyyy') : 'Not submitted'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">COI Status</Typography>
              <Typography variant="body2">
                {draft.coiDisclosed ? `Disclosed: ${draft.coiDetails}` : 'Not disclosed'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body2">{draft.notes || 'No notes'}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <WikiLink href={draft.pageUrl}>View Draft</WikiLink>
            <WikiLink href={draft.talkPageUrl}>Talk Page</WikiLink>
            {draft.afcLogUrl && <WikiLink href={draft.afcLogUrl}>AfC Log</WikiLink>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// === Main Drafts Panel ===

export function DraftsPanel() {
  const { drillDownPath, pushDrillDown, popDrillDown } = useUIStore();
  const { data: dashboard } = useDashboard();
  
  const [filters, setFilters] = useState<DraftFilters>({ status: 'all', search: '' });
  const [sortField, setSortField] = useState<SortField>('lastEditedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const drafts = dashboard?.drafts ?? [];

  // Filter and sort drafts
  const filteredDrafts = useMemo(() => {
    let result = [...drafts];

    // Apply filters
    if (filters.status !== 'all') {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.notes.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'lastEditedAt':
          comparison = a.lastEditedAt.getTime() - b.lastEditedAt.getTime();
          break;
        case 'submittedAt':
          const aTime = a.submittedAt?.getTime() ?? 0;
          const bTime = b.submittedAt?.getTime() ?? 0;
          comparison = aTime - bTime;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [drafts, filters, sortField, sortDirection]);

  // Handle drill-down
  const selectedDraftId = drillDownPath[0];
  const selectedDraft = selectedDraftId ? drafts.find((d) => d.id === selectedDraftId) : null;

  if (selectedDraft) {
    return (
      <Box sx={{ p: 2 }}>
        <DraftDetail draft={selectedDraft} onBack={popDrillDown} />
      </Box>
    );
  }

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
        title="Drafts"
        subtitle={`${filteredDrafts.length} of ${drafts.length} drafts`}
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search drafts..."
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="pending_review">Pending Review</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="in_development">In Development</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="declined">Declined</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {filteredDrafts.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Draft
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'status'}
                    direction={sortField === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'lastEditedAt'}
                    direction={sortField === 'lastEditedAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('lastEditedAt')}
                  >
                    Last Edited
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'submittedAt'}
                    direction={sortField === 'submittedAt' ? sortDirection : 'asc'}
                    onClick={() => handleSort('submittedAt')}
                  >
                    Submitted
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrafts.map((draft) => (
                <DraftRow
                  key={draft.id}
                  draft={draft}
                  onSelect={(d) => pushDrillDown(d.id)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title="No drafts found"
          description={filters.search || filters.status !== 'all' ? 'Try adjusting your filters' : 'Create a new draft to get started'}
        />
      )}
    </Box>
  );
}

export default DraftsPanel;
