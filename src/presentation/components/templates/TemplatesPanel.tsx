/**
 * Templates Panel Component
 * Quick edit templates for common editing tasks
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
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { SectionHeader, EmptyState } from '../common';
import { useTemplateStore } from '@presentation/hooks';
import type { EditTemplate, TemplateCategory } from '@domain/entities';

// === Category display config ===
const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; color: string }> = {
  'edit-summary': { label: 'Edit Summary', color: '#1976d2' },
  'talk-page': { label: 'Talk Page', color: '#9c27b0' },
  'welcome': { label: 'Welcome', color: '#2e7d32' },
  'afc-decline': { label: 'AFC Decline', color: '#d32f2f' },
  'warning': { label: 'Warning', color: '#ed6c02' },
  'custom': { label: 'Custom', color: '#757575' },
};

// === Template Form Dialog ===

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  template?: EditTemplate | undefined;
  onSave: (template: Omit<EditTemplate, 'id' | 'usageCount' | 'createdAt'>) => void;
}

function TemplateFormDialog({ open, onClose, template, onSave }: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category ?? 'edit-summary');
  const [content, setContent] = useState(template?.content ?? '');
  const [shortcut, setShortcut] = useState(template?.shortcut ?? '');

  const handleSubmit = () => {
    if (!name.trim() || !content.trim()) return;

    onSave({
      name: name.trim(),
      category,
      content: content.trim(),
      shortcut: shortcut.trim() || null,
    });

    onClose();
    // Reset form
    setName('');
    setCategory('edit-summary');
    setContent('');
    setShortcut('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{template ? 'Edit Template' : 'Add Template'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            placeholder="Template content (supports wiki markup)"
          />
          <TextField
            label="Shortcut"
            value={shortcut}
            onChange={(e) => setShortcut(e.target.value)}
            placeholder="e.g., ft, ce"
            helperText="Optional keyboard shortcut (2-3 letters)"
            inputProps={{ maxLength: 4 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || !content.trim()}
        >
          {template ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// === Template Card ===

interface TemplateCardProps {
  template: EditTemplate;
  onEdit: (template: EditTemplate) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
}

function TemplateCard({ template, onEdit, onDelete, onCopy }: TemplateCardProps) {
  const config = CATEGORY_CONFIG[template.category];

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={500} noWrap>
              {template.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Chip
                label={config.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: `${config.color}20`,
                  color: config.color,
                }}
              />
              {template.shortcut && (
                <Chip
                  label={template.shortcut}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={() => onCopy(template.content)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(template)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(template.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mt: 1,
            bgcolor: 'grey.50',
            maxHeight: 80,
            overflow: 'auto',
          }}
        >
          <Typography
            variant="caption"
            component="pre"
            sx={{
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              m: 0,
            }}
          >
            {template.content}
          </Typography>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Used {template.usageCount} times
        </Typography>
      </CardContent>
    </Card>
  );
}

// === Main Templates Panel ===

export function TemplatesPanel() {
  const {
    templates,
    filter,
    setFilter,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  } = useTemplateStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EditTemplate | undefined>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (filter.category !== 'all' && template.category !== filter.category) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        template.name.toLowerCase().includes(search) ||
        template.content.toLowerCase().includes(search) ||
        template.shortcut?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleEdit = (template: EditTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleSave = (templateData: Omit<EditTemplate, 'id' | 'usageCount' | 'createdAt'>) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
    } else {
      addTemplate(templateData);
    }
    setEditingTemplate(undefined);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(undefined);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSnackbarOpen(true);
    // Find and increment usage count
    const template = templates.find(t => t.content === content);
    if (template) {
      incrementUsage(template.id);
    }
  };

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<TemplateCategory, EditTemplate[]>);

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Templates"
        subtitle={`${filteredTemplates.length} templates`}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Template
          </Button>
        }
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search templates..."
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filter.category}
            label="Category"
            onChange={(e) => setFilter({ category: e.target.value as TemplateCategory | 'all' })}
          >
            <MenuItem value="all">All categories</MenuItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        filter.category === 'all' ? (
          // Grouped view
          Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                {CATEGORY_CONFIG[category as TemplateCategory].label}
              </Typography>
              <Grid container spacing={2}>
                {categoryTemplates.map(template => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <TemplateCard
                      template={template}
                      onEdit={handleEdit}
                      onDelete={deleteTemplate}
                      onCopy={handleCopy}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        ) : (
          // Flat view when filtered
          <Grid container spacing={2}>
            {filteredTemplates.map(template => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <TemplateCard
                  template={template}
                  onEdit={handleEdit}
                  onDelete={deleteTemplate}
                  onCopy={handleCopy}
                />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        <EmptyState
          title="No templates found"
          description={filter.search || filter.category !== 'all'
            ? 'Try adjusting your filters'
            : 'Add templates to speed up your editing'}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Template
            </Button>
          }
          icon={<TemplateIcon sx={{ fontSize: 48 }} />}
        />
      )}

      {/* Form Dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        template={editingTemplate}
        onSave={handleSave}
      />

      {/* Copy Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Copied to clipboard"
      />
    </Box>
  );
}

export default TemplatesPanel;
