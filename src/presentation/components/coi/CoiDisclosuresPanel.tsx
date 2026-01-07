/**
 * COI Disclosures Panel Component
 * Tracks conflict of interest disclosures for Wikipedia editing
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SectionHeader, WikiLink, EmptyState } from '../common';
import { useDashboard } from '@presentation/hooks/queries';
import type { CoiDisclosure } from '@domain/entities';

// === COI Info Alert ===

function CoiInfoAlert() {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>About COI Disclosures</AlertTitle>
      <Typography variant="body2">
        Wikipedia's <WikiLink href="https://en.wikipedia.org/wiki/Wikipedia:Conflict_of_interest">
          conflict of interest policy
        </WikiLink> requires editors to disclose any close connection to articles they edit.
        This includes employment, family relationships, paid editing, and financial interests.
      </Typography>
    </Alert>
  );
}

// === Summary Stats ===

interface SummaryStatsProps {
  disclosures: readonly CoiDisclosure[];
}

function SummaryStats({ disclosures }: SummaryStatsProps) {
  const active = disclosures.filter((d) => d.isActive).length;
  const inactive = disclosures.filter((d) => !d.isActive).length;
  const total = disclosures.length;

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{total}</Typography>
            <Typography variant="caption" color="text.secondary">Total Disclosures</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">{active}</Typography>
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="text.secondary">{inactive}</Typography>
            <Typography variant="caption" color="text.secondary">Inactive</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// === Disclosure Row ===

interface DisclosureRowProps {
  disclosure: CoiDisclosure;
}

function DisclosureRow({ disclosure }: DisclosureRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {disclosure.subject}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {disclosure.relationship}
        </Typography>
      </TableCell>
      <TableCell>
        {disclosure.isActive ? (
          <Chip
            icon={<CheckIcon />}
            label="Active"
            size="small"
            color="success"
            variant="outlined"
          />
        ) : (
          <Chip
            icon={<CancelIcon />}
            label="Inactive"
            size="small"
            variant="outlined"
          />
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {format(disclosure.disclosedAt, 'MMM d, yyyy')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="View disclosure">
          <IconButton
            size="small"
            onClick={() => window.open(disclosure.disclosureUrl, '_blank')}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// === Main COI Panel ===

export function CoiDisclosuresPanel() {
  const { data: dashboard } = useDashboard();
  const disclosures = dashboard?.coiDisclosures ?? [];

  // Sort by date (most recent first)
  const sortedDisclosures = [...disclosures].sort(
    (a, b) => b.disclosedAt.getTime() - a.disclosedAt.getTime()
  );

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="COI Disclosures"
        subtitle={`${disclosures.length} conflict of interest disclosures`}
      />

      <CoiInfoAlert />

      <SummaryStats disclosures={disclosures} />

      {sortedDisclosures.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Disclosed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDisclosures.map((disclosure) => (
                <DisclosureRow key={disclosure.id} disclosure={disclosure} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title="No COI disclosures"
          description="You haven't made any conflict of interest disclosures yet"
          icon={<InfoIcon sx={{ fontSize: 48 }} />}
        />
      )}

      {/* Best Practices Card */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            COI Best Practices
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Always disclose connections on your user talk page and relevant article talk pages
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Consider using the Articles for Creation (AfC) process for new articles
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Suggest changes on talk pages rather than making direct edits when possible
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Be transparent about any financial or personal interests
            </Typography>
            <Typography component="li" variant="body2">
              Keep disclosures up to date as circumstances change
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <WikiLink href="https://en.wikipedia.org/wiki/Wikipedia:Plain_and_simple_conflict_of_interest_guide">
              Read the plain and simple COI guide →
            </WikiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CoiDisclosuresPanel;
