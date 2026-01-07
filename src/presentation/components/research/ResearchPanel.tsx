/**
 * Research Queue Panel Component
 * Manage research items for article improvement
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Science as ResearchIcon,
  OpenInNew as OpenIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as PendingIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SectionHeader, EmptyState } from '../common';
import { useResearchStore } from '@presentation/hooks';
import type { ResearchItem, ResearchPriority } from '@domain/entities';

// === Priority config ===
const PRIORITY_CONFIG: Record<ResearchPriority, { label: string; color: string }> = {
  high: { label: 'High', color: '#d32f2f' },
  medium: { label: 'Medium', color: '#ed6c02' },
  low: { label: 'Low', color: '#757575' },
};

// === Research Form Dialog ===

interface ResearchFormProps {
  open: boolean;
  onClose: () => void;
  item?: ResearchItem | undefined;
  onSave: (item: Omit<ResearchItem, 'id' | 'addedAt'>) => void;
}

function ResearchFormDialog({ open, onClose, item, onSave }: ResearchFormProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [url, setUrl] = useState(item?.url ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [sources, setSources] = useState(item?.sources.join('\n') ?? '');
  const [priority, setPriority] = useState<ResearchPriority>(item?.priority ?? 'medium');

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      url: url.trim(),
      notes: notes.trim(),
      sources: sources.split('\n').map(s => s.trim()).filter(Boolean),
      priority,
      completed: item?.completed ?? false,
    });

    onClose();
    // Reset form
    setTitle('');
    setUrl('');
    setNotes('');
    setSources('');
    setPriority('medium');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item ? 'Edit Research Item' : 'Add Research Item'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="Article or topic to research"
          />
          <TextField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            placeholder="https://en.wikipedia.org/wiki/..."
          />
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value as ResearchPriority)}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Research notes, things to look for..."
          />
          <TextField
            label="Sources"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="One source per line&#10;https://example.com/source1&#10;Book Title by Author"
            helperText="Enter one source per line"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()}>
          {item ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// === Research Item Row ===

interface ResearchItemRowProps {
  item: ResearchItem;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ResearchItem) => void;
  onDelete: (id: string) => void;
}

function ResearchItemRow({ item, onToggleComplete, onEdit, onDelete }: ResearchItemRowProps) {
  const priorityConfig = PRIORITY_CONFIG[item.priority];

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {item.url && (
            <Tooltip title="Open">
              <IconButton
                size="small"
                onClick={() => window.open(item.url, '_blank')}
              >
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(item)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(item.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemButton onClick={() => onToggleComplete(item.id)} sx={{ pr: 14 }}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          {item.completed ? (
            <CompleteIcon color="success" />
          ) : (
            <PendingIcon color="action" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? 'text.secondary' : 'text.primary',
                  fontWeight: 500,
                }}
              >
                {item.title}
              </Typography>
              <FlagIcon sx={{ fontSize: 14, color: priorityConfig.color }} />
              {item.sources.length > 0 && (
                <Chip
                  label={`${item.sources.length} sources`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          }
          secondary={
            <Box component="span">
              {item.notes && (
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
                  {item.notes}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Added {format(item.addedAt, 'MMM d, yyyy')}
              </Typography>
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

// === Main Research Panel ===

export function ResearchPanel() {
  const { items, filter, setFilter, addItem, updateItem, removeItem, toggleComplete } = useResearchStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResearchItem | undefined>();

  // Filter items
  const filteredItems = items.filter(item => {
    if (filter.priority !== 'all' && item.priority !== filter.priority) return false;
    if (filter.completed !== 'all' && item.completed !== filter.completed) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        item.title.toLowerCase().includes(search) ||
        item.notes.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const pendingCount = items.filter(i => !i.completed).length;
  const completedCount = items.filter(i => i.completed).length;

  const handleEdit = (item: ResearchItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = (itemData: Omit<ResearchItem, 'id' | 'addedAt'>) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }
    setEditingItem(undefined);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(undefined);
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Research Queue"
        subtitle={`${pendingCount} pending, ${completedCount} completed`}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Item
          </Button>
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600}>
                {items.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600} color="primary.main">
                {pendingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600} color="error.main">
                {items.filter(i => i.priority === 'high' && !i.completed).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {completedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search research items..."
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filter.priority}
            label="Priority"
            onChange={(e) => setFilter({ priority: e.target.value as ResearchPriority | 'all' })}
          >
            <MenuItem value="all">All priorities</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filter.completed}
            label="Status"
            onChange={(e) => setFilter({ completed: e.target.value as boolean | 'all' })}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={false as unknown as string}>Pending</MenuItem>
            <MenuItem value={true as unknown as string}>Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Research List */}
      {filteredItems.length > 0 ? (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredItems.map((item, index) => (
              <Box key={item.id}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <ResearchItemRow
                  item={item}
                  onToggleComplete={toggleComplete}
                  onEdit={handleEdit}
                  onDelete={removeItem}
                />
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <EmptyState
          title="No research items"
          description={filter.search || filter.priority !== 'all' || filter.completed !== 'all'
            ? 'Try adjusting your filters'
            : 'Add articles to research for future edits'}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Item
            </Button>
          }
          icon={<ResearchIcon sx={{ fontSize: 48 }} />}
        />
      )}

      {/* Form Dialog */}
      <ResearchFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        item={editingItem}
        onSave={handleSave}
      />
    </Box>
  );
}

export default ResearchPanel;
