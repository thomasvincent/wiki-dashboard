/**
 * React 19 Actions
 * Modern form handling with built-in pending states and error handling
 * Uses useActionState for server-like mutations without manual loading flags
 */

import { useActionState, useOptimistic, useTransition } from 'react';
import type { Task, TaskPriority, TaskStatus, ResearchItem } from '@domain/entities';

// === Action State Types ===

export interface ActionState<T = null> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T;
  error: string | null;
}

function createInitialState<T = null>(): ActionState<T> {
  return {
    status: 'idle',
    data: null as T,
    error: null,
  };
}

// === Task Actions ===

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  relatedArticles: string;
}

export function useTaskAction(
  onSuccess: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void
) {
  const [state, formAction, isPending] = useActionState<ActionState<null>, FormData>(
    async (_prevState, formData) => {
      try {
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as TaskPriority;
        const status = formData.get('status') as TaskStatus;
        const dueDateStr = formData.get('dueDate') as string;
        const relatedArticlesStr = formData.get('relatedArticles') as string;

        if (!title?.trim()) {
          return {
            status: 'error' as const,
            data: null,
            error: 'Title is required',
          } as ActionState<null>;
        }

        const taskData = {
          title: title.trim(),
          description: description?.trim() ?? '',
          priority: priority ?? 'medium',
          status: status ?? 'not_started',
          dueDate: dueDateStr ? new Date(dueDateStr) : null,
          relatedArticles: relatedArticlesStr
            ? relatedArticlesStr
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
        };

        // Call the success handler
        onSuccess(taskData);

        return { status: 'success' as const, data: null, error: null } as ActionState<null>;
      } catch (err) {
        return {
          status: 'error' as const,
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save task',
        } as ActionState<null>;
      }
    },
    createInitialState<null>()
  );

  return { state, formAction, isPending };
}

// === Task Status Toggle Action ===

export function useTaskStatusAction(updateTask: (id: string, updates: Partial<Task>) => void) {
  const [isPending, startTransition] = useTransition();

  const toggleStatus = (task: Task) => {
    startTransition(() => {
      const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
      updateTask(task.id, { status: newStatus });
    });
  };

  return { toggleStatus, isPending };
}

// === Optimistic Task Updates ===

export function useOptimisticTasks(tasks: Task[]) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic<
    Task[],
    { type: 'add' | 'update' | 'delete'; task: Partial<Task> & { id: string } }
  >(tasks, (currentTasks, action) => {
    switch (action.type) {
      case 'add':
        return [
          ...currentTasks,
          {
            ...action.task,
            createdAt: new Date(),
            completedAt: null,
          } as Task,
        ];
      case 'update':
        return currentTasks.map((t) => (t.id === action.task.id ? { ...t, ...action.task } : t));
      case 'delete':
        return currentTasks.filter((t) => t.id !== action.task.id);
      default:
        return currentTasks;
    }
  });

  return { optimisticTasks, addOptimisticTask };
}

// === Research Item Actions ===

export interface ResearchFormData {
  title: string;
  url: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

export function useResearchAction(onSuccess: (item: Omit<ResearchItem, 'id' | 'addedAt'>) => void) {
  const [state, formAction, isPending] = useActionState<ActionState<null>, FormData>(
    async (_prevState, formData) => {
      try {
        const title = formData.get('title') as string;
        const url = formData.get('url') as string;
        const notes = formData.get('notes') as string;
        const priority = formData.get('priority') as ResearchItem['priority'];

        if (!title?.trim()) {
          return {
            status: 'error' as const,
            data: null,
            error: 'Title is required',
          } as ActionState<null>;
        }

        const itemData = {
          title: title.trim(),
          url: url?.trim() ?? '',
          notes: notes?.trim() ?? '',
          sources: [],
          priority: priority ?? 'medium',
          completed: false,
        };

        onSuccess(itemData);

        return { status: 'success' as const, data: null, error: null } as ActionState<null>;
      } catch (err) {
        return {
          status: 'error' as const,
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save research item',
        } as ActionState<null>;
      }
    },
    createInitialState<null>()
  );

  return { state, formAction, isPending };
}

// === Template Actions ===

export function useTemplateAction(
  onSuccess: (template: {
    name: string;
    category: string;
    content: string;
    shortcut: string | null;
  }) => void
) {
  const [state, formAction, isPending] = useActionState<ActionState<null>, FormData>(
    async (_prevState, formData) => {
      try {
        const name = formData.get('name') as string;
        const category = formData.get('category') as string;
        const content = formData.get('content') as string;
        const shortcut = formData.get('shortcut') as string;

        if (!name?.trim() || !content?.trim()) {
          return {
            status: 'error' as const,
            data: null,
            error: 'Name and content are required',
          } as ActionState<null>;
        }

        onSuccess({
          name: name.trim(),
          category: category ?? 'custom',
          content: content.trim(),
          shortcut: shortcut?.trim() || null,
        });

        return { status: 'success' as const, data: null, error: null } as ActionState<null>;
      } catch (err) {
        return {
          status: 'error' as const,
          data: null,
          error: err instanceof Error ? err.message : 'Failed to save template',
        } as ActionState<null>;
      }
    },
    createInitialState<null>()
  );

  return { state, formAction, isPending };
}

// === Delete Confirmation Action ===

export function useDeleteAction<T extends { id: string }>(onDelete: (id: string) => void) {
  const [isPending, startTransition] = useTransition();

  const deleteItem = (item: T) => {
    startTransition(() => {
      onDelete(item.id);
    });
  };

  return { deleteItem, isPending };
}

// === Settings Actions ===

export function useSettingsAction(onSave: (username: string) => Promise<boolean>) {
  type SettingsData = { username: string } | null;
  const [state, formAction, isPending] = useActionState<ActionState<SettingsData>, FormData>(
    async (_prevState, formData) => {
      try {
        const username = formData.get('username') as string;

        if (!username?.trim()) {
          return {
            status: 'error' as const,
            data: null,
            error: 'Username is required',
          } as ActionState<SettingsData>;
        }

        const isValid = await onSave(username.trim());

        if (!isValid) {
          return {
            status: 'error' as const,
            data: null,
            error: 'Username not found on Wikipedia',
          } as ActionState<SettingsData>;
        }

        return {
          status: 'success' as const,
          data: { username: username.trim() },
          error: null,
        } as ActionState<SettingsData>;
      } catch (err) {
        return {
          status: 'error' as const,
          data: null,
          error: err instanceof Error ? err.message : 'Failed to validate username',
        } as ActionState<SettingsData>;
      }
    },
    createInitialState<SettingsData>()
  );

  return { state, formAction, isPending };
}
