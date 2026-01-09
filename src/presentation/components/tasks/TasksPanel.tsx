/**
 * Tasks Panel Component
 * Task management with CRUD operations, filtering, and prioritization
 * Uses React 19 Actions for form handling
 */

import { useState, useEffect, Fragment, useRef, memo } from 'react';
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
  Alert,
  CircularProgress,
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
import {
  useTaskStore,
  selectFilteredTasks,
  selectTaskStats,
  useTaskAction,
} from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { sortTasksByPriority } from '@application/services';
import { TASK_PRIORITY_DISPLAY } from '@domain/value-objects';
import type { Task, TaskStatus } from '@domain/entities';

// === Task Form Dialog (React 19 Actions) ===

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | undefined;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
}

function TaskFormDialog({ open, onClose, task, onSave }: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // React 19 Action - handles form submission with built-in pending state
  const { state, formAction, isPending } = useTaskAction((taskData) => {
    onSave(taskData);
    onClose();
    formRef.current?.reset();
  });

  // Reset form when dialog opens with new task
  useEffect(() => {
    if (open && formRef.current) {
      formRef.current.reset();
    }
  }, [open, task?.id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form ref={formRef} action={formAction}>
        <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {state.status === 'error' && <Alert severity="error">{state.error}</Alert>}

            <TextField
              name="title"
              label="Title"
              defaultValue={task?.title ?? ''}
              fullWidth
              required
              autoFocus
              disabled={isPending}
            />
            <TextField
              name="description"
              label="Description"
              defaultValue={task?.description ?? ''}
              fullWidth
              multiline
              rows={2}
              disabled={isPending}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    defaultValue={task?.priority ?? 'medium'}
                    label="Priority"
                    disabled={isPending}
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
                    name="status"
                    defaultValue={task?.status ?? 'not_started'}
                    label="Status"
                    disabled={isPending}
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
              name="dueDate"
              label="Due Date"
              type="date"
              defaultValue={task?.dueDate?.toISOString().split('T')[0] ?? ''}
              InputLabelProps={{ shrink: true }}
              disabled={isPending}
            />
            <TextField
              name="relatedArticles"
              label="Related Articles"
              defaultValue={task?.relatedArticles.join(', ') ?? ''}
              placeholder="Article 1, Article 2, ..."
              helperText="Comma-separated list of article titles"
              disabled={isPending}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? 'Saving...' : task ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
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

const TaskListItem = memo(function TaskListItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskListItemProps) {
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
            <IconButton
              size="small"
              onClick={() => onEdit(task)}
              aria-label={`Edit task: ${task.title}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete task: ${task.title}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemButton
        onClick={() => onToggleComplete(task.id)}
        sx={{ pr: 10 }}
        aria-label={`Toggle completion for: ${task.title}`}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          {isCompleted ? (
            <CheckIcon color="success" aria-label="Completed" />
          ) : isBlocked ? (
            <BlockIcon color="error" aria-label="Blocked" />
          ) : (
            <UncheckedIcon color="action" aria-label="Not started" />
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
              <FlagIcon
                sx={{ fontSize: 14, color: priorityColor }}
                aria-label={`Priority: ${task.priority}`}
              />
              {isOverdue && (
                <Chip
                  label="Overdue"
                  size="small"
                  color="error"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
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
});

// === Stats Summary ===

function TaskStats() {
  const stats = useTaskStore(selectTaskStats);

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">
              {stats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="info.main">
              {stats.inProgress}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In Progress
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="error.main">
              {stats.blocked}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Blocked
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="warning.main">
              {stats.highPriority}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High Priority
            </Typography>
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
          description={
            filter.search || filter.status !== 'all' || filter.priority !== 'all'
              ? 'Try adjusting your filters'
              : 'Add a task to get started'
          }
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
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
