/**
 * Tasks Panel Component
 * Task management with CRUD operations, filtering, and prioritization
 */

import { useState, useEffect, Fragment } from 'react';
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
  Flag as FlagIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StatusChip, SectionHeader, EmptyState } from '../common';
import { useTaskStore, selectFilteredTasks, selectTaskStats } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { sortTasksByPriority } from '@application/services';
import { TASK_PRIORITY_DISPLAY } from '@domain/value-objects';
import type { Task, TaskPriority, TaskStatus } from '@domain/entities';

// === Task Form Dialog ===

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | undefined;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
}

function TaskFormDialog({ open, onClose, task, onSave }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'not_started');
  const [dueDate, setDueDate] = useState(task?.dueDate?.toISOString().split('T')[0] ?? '');
  const [relatedArticles, setRelatedArticles] = useState(task?.relatedArticles.join(', ') ?? '');

  const handleSubmit = () => {
    if (!title.trim()) {return;}

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      relatedArticles: relatedArticles
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    });

    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('not_started');
    setDueDate('');
    setRelatedArticles('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Related Articles"
            value={relatedArticles}
            onChange={(e) => setRelatedArticles(e.target.value)}
            placeholder="Article 1, Article 2, ..."
            helperText="Comma-separated list of article titles"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!title.trim()}>
          {task ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// === Task List Item ===

interface TaskListItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TaskListItem({ task, onToggleComplete, onEdit, onDelete }: TaskListItemProps) {
  const priorityColor = TASK_PRIORITY_DISPLAY[task.priority].color;
  const isCompleted = task.status === 'completed';
  const isBlocked = task.status === 'blocked';
  const isOverdue = task.dueDate && task.dueDate < new Date() && !isCompleted;

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(task.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemButton onClick={() => onToggleComplete(task.id)} sx={{ pr: 10 }}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          {isCompleted ? (
            <CheckIcon color="success" />
          ) : isBlocked ? (
            <BlockIcon color="error" />
          ) : (
            <UncheckedIcon color="action" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? 'text.secondary' : 'text.primary',
                  fontWeight: 500,
                }}
              >
                {task.title}
              </Typography>
              <FlagIcon sx={{ fontSize: 14, color: priorityColor }} />
              {isOverdue && (
                <Chip label="Overdue" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <StatusChip status={task.status} type="task-status" />
              {task.dueDate && (
                <Typography variant="caption" color="text.secondary">
                  Due: {format(task.dueDate, 'MMM d, yyyy')}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

// === Stats Summary ===

function TaskStats() {
  const stats = useTaskStore(selectTaskStats);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>{stats.total}</Typography>
            <Typography variant="caption" color="text.secondary">Total</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">{stats.completed}</Typography>
            <Typography variant="caption" color="text.secondary">Completed</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="info.main">{stats.inProgress}</Typography>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="error.main">{stats.blocked}</Typography>
            <Typography variant="caption" color="text.secondary">Blocked</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="warning.main">{stats.highPriority}</Typography>
            <Typography variant="caption" color="text.secondary">High Priority</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// === Main Tasks Panel ===

export function TasksPanel() {
  const { tasks, filter, setFilter, addTask, updateTask, deleteTask, setTasks } = useTaskStore();
  const filteredTasks = useTaskStore(selectFilteredTasks);
  const sortedTasks = sortTasksByPriority(filteredTasks);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  // Initialize from dashboard if empty
  const { data: dashboard } = useDashboard();
  useEffect(() => {
    if (tasks.length === 0 && dashboard?.tasks) {
      setTasks([...dashboard.tasks]);
    }
  }, [dashboard, tasks.length, setTasks]);

  const handleToggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
      updateTask(id, { status: newStatus });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSave = (taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setEditingTask(undefined);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(undefined);
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Tasks"
        subtitle={`${filteredTasks.length} of ${tasks.length} tasks`}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            Add Task
          </Button>
        }
      />

      <TaskStats />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search tasks..."
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
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filter.status}
            label="Status"
            onChange={(e) => setFilter({ status: e.target.value as any })}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="not_started">Not Started</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filter.priority}
            label="Priority"
            onChange={(e) => setFilter({ priority: e.target.value as any })}
          >
            <MenuItem value="all">All priorities</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Task List */}
      {sortedTasks.length > 0 ? (
        <Paper variant="outlined">
          <List disablePadding>
            {sortedTasks.map((task, index) => (
              <Fragment key={task.id}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <TaskListItem
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={deleteTask}
                />
              </Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <EmptyState
          title="No tasks found"
          description={filter.search || filter.status !== 'all' || filter.priority !== 'all'
            ? 'Try adjusting your filters'
            : 'Add a task to get started'}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Task
            </Button>
          }
        />
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        task={editingTask}
        onSave={handleSave}
      />
    </Box>
  );
}

export default TasksPanel;
