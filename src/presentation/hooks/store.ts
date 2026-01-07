/**
 * Zustand Store
 * Global state management with persistence
 * Follows single source of truth principle
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type {
  EditorDashboard,
  Task,
  TaskStatus,
  TaskPriority,
  EditTemplate,
  TemplateCategory,
  ResearchItem,
  ResearchPriority,
} from '@domain/entities';

// === Section Types ===

export type ActiveSection =
  | 'overview'
  | 'drafts'
  | 'contributions'
  | 'tasks'
  | 'focus-areas'
  | 'coi'
  | 'watchlist'
  | 'notifications'
  | 'analytics'
  | 'achievements'
  | 'impact'
  | 'templates'
  | 'research'
  | 'quality'
  | 'collaboration';

// === UI State ===

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeSection: ActiveSection;
  drillDownPath: string[];
  expandedNavGroups: string[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setActiveSection: (section: ActiveSection) => void;
  pushDrillDown: (path: string) => void;
  popDrillDown: () => void;
  clearDrillDown: () => void;
  toggleNavGroup: (groupId: string) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        sidebarOpen: true,
        darkMode: false,
        activeSection: 'overview',
        drillDownPath: [],
        expandedNavGroups: ['dashboard', 'my-work', 'monitoring', 'analytics', 'tools', 'community'],

        // Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        setActiveSection: (section) => set({ activeSection: section, drillDownPath: [] }),
        pushDrillDown: (path) => set((state) => ({ drillDownPath: [...state.drillDownPath, path] })),
        popDrillDown: () => set((state) => ({ drillDownPath: state.drillDownPath.slice(0, -1) })),
        clearDrillDown: () => set({ drillDownPath: [] }),
        toggleNavGroup: (groupId) =>
          set((state) => ({
            expandedNavGroups: state.expandedNavGroups.includes(groupId)
              ? state.expandedNavGroups.filter((g) => g !== groupId)
              : [...state.expandedNavGroups, groupId],
          })),
      }),
      { name: 'wiki-dashboard-ui' }
    ),
    { name: 'UIStore' }
  )
);

// === Dashboard Data State ===

interface DashboardState {
  dashboard: EditorDashboard | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

interface DashboardActions {
  setDashboard: (dashboard: EditorDashboard) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDashboard: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  devtools(
    (set) => ({
      // State
      dashboard: null,
      isLoading: false,
      error: null,
      lastRefresh: null,
      
      // Actions
      setDashboard: (dashboard) => set({ dashboard, lastRefresh: new Date(), error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clearDashboard: () => set({ dashboard: null, error: null }),
    }),
    { name: 'DashboardStore' }
  )
);

// === Task State (Local) ===

interface TaskState {
  tasks: Task[];
  filter: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    search: string;
  };
}

interface TaskActions {
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  clearFilters: () => void;
}

export const useTaskStore = create<TaskState & TaskActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        tasks: [],
        filter: {
          status: 'all',
          priority: 'all',
          search: '',
        },
        
        // Actions
        setTasks: (tasks) => set({ tasks }),
        addTask: (taskData) =>
          set((state) => ({
            tasks: [
              ...state.tasks,
              {
                ...taskData,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                completedAt: null,
              },
            ],
          })),
        updateTask: (id, updates) =>
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...updates,
                    completedAt: updates.status === 'completed' ? new Date() : t.completedAt,
                  }
                : t
            ),
          })),
        deleteTask: (id) =>
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
          })),
        setFilter: (filter) =>
          set((state) => ({
            filter: { ...state.filter, ...filter },
          })),
        clearFilters: () =>
          set({
            filter: { status: 'all', priority: 'all', search: '' },
          }),
      }),
      { name: 'wiki-dashboard-tasks' }
    ),
    { name: 'TaskStore' }
  )
);

// === Selectors (Derived State) ===

export const selectFilteredTasks = (state: TaskState): Task[] => {
  return state.tasks.filter((task) => {
    if (state.filter.status !== 'all' && task.status !== state.filter.status) {
      return false;
    }
    if (state.filter.priority !== 'all' && task.priority !== state.filter.priority) {
      return false;
    }
    if (state.filter.search) {
      const search = state.filter.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)
      );
    }
    return true;
  });
};

export const selectTaskStats = (state: TaskState) => {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.status === 'completed').length;
  const inProgress = state.tasks.filter((t) => t.status === 'in_progress').length;
  const blocked = state.tasks.filter((t) => t.status === 'blocked').length;
  const highPriority = state.tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return { total, completed, inProgress, blocked, highPriority };
};

// === Template Store ===

interface TemplateState {
  templates: EditTemplate[];
  filter: {
    category: TemplateCategory | 'all';
    search: string;
  };
}

interface TemplateActions {
  setTemplates: (templates: EditTemplate[]) => void;
  addTemplate: (template: Omit<EditTemplate, 'id' | 'usageCount' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<EditTemplate>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  setFilter: (filter: Partial<TemplateState['filter']>) => void;
}

const DEFAULT_TEMPLATES: EditTemplate[] = [
  {
    id: '1',
    name: 'Fixed typo',
    category: 'edit-summary',
    content: 'Fixed typo',
    shortcut: 'ft',
    usageCount: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Added references',
    category: 'edit-summary',
    content: 'Added references from reliable sources',
    shortcut: 'ar',
    usageCount: 0,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Copyedit',
    category: 'edit-summary',
    content: 'Copyedit for clarity and grammar',
    shortcut: 'ce',
    usageCount: 0,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Welcome message',
    category: 'welcome',
    content: '{{subst:Welcome}} ~~~~',
    shortcut: null,
    usageCount: 0,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'AFC - No references',
    category: 'afc-decline',
    content: '{{AFC submission/decline|reason=The draft does not cite any reliable sources.}}',
    shortcut: null,
    usageCount: 0,
    createdAt: new Date(),
  },
];

export const useTemplateStore = create<TemplateState & TemplateActions>()(
  devtools(
    persist(
      (set) => ({
        templates: DEFAULT_TEMPLATES,
        filter: { category: 'all', search: '' },

        setTemplates: (templates) => set({ templates }),
        addTemplate: (templateData) =>
          set((state) => ({
            templates: [
              ...state.templates,
              {
                ...templateData,
                id: crypto.randomUUID(),
                usageCount: 0,
                createdAt: new Date(),
              },
            ],
          })),
        updateTemplate: (id, updates) =>
          set((state) => ({
            templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          })),
        deleteTemplate: (id) =>
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
          })),
        incrementUsage: (id) =>
          set((state) => ({
            templates: state.templates.map((t) =>
              t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
            ),
          })),
        setFilter: (filter) =>
          set((state) => ({
            filter: { ...state.filter, ...filter },
          })),
      }),
      { name: 'wiki-dashboard-templates' }
    ),
    { name: 'TemplateStore' }
  )
);

// === Research Queue Store ===

interface ResearchState {
  items: ResearchItem[];
  filter: {
    priority: ResearchPriority | 'all';
    completed: boolean | 'all';
    search: string;
  };
}

interface ResearchActions {
  addItem: (item: Omit<ResearchItem, 'id' | 'addedAt'>) => void;
  updateItem: (id: string, updates: Partial<ResearchItem>) => void;
  removeItem: (id: string) => void;
  toggleComplete: (id: string) => void;
  reorderItems: (items: ResearchItem[]) => void;
  setFilter: (filter: Partial<ResearchState['filter']>) => void;
}

export const useResearchStore = create<ResearchState & ResearchActions>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        filter: { priority: 'all', completed: 'all', search: '' },

        addItem: (itemData) =>
          set((state) => ({
            items: [
              ...state.items,
              {
                ...itemData,
                id: crypto.randomUUID(),
                addedAt: new Date(),
              },
            ],
          })),
        updateItem: (id, updates) =>
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
          })),
        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          })),
        toggleComplete: (id) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, completed: !item.completed } : item
            ),
          })),
        reorderItems: (items) => set({ items }),
        setFilter: (filter) =>
          set((state) => ({
            filter: { ...state.filter, ...filter },
          })),
      }),
      { name: 'wiki-dashboard-research' }
    ),
    { name: 'ResearchStore' }
  )
);

// === Notification Store ===

interface NotificationState {
  unreadCount: number;
}

interface NotificationActions {
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  devtools(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    }),
    { name: 'NotificationStore' }
  )
);
