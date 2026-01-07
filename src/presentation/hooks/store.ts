/**
 * Zustand Store
 * Global state management with persistence
 * Follows single source of truth principle
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { EditorDashboard, Task, TaskStatus, TaskPriority } from '@domain/entities';

// === UI State ===

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  activeSection: 'overview' | 'drafts' | 'contributions' | 'tasks' | 'focus-areas' | 'coi';
  drillDownPath: string[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setActiveSection: (section: UIState['activeSection']) => void;
  pushDrillDown: (path: string) => void;
  popDrillDown: () => void;
  clearDrillDown: () => void;
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
        
        // Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        setActiveSection: (section) => set({ activeSection: section, drillDownPath: [] }),
        pushDrillDown: (path) => set((state) => ({ drillDownPath: [...state.drillDownPath, path] })),
        popDrillDown: () => set((state) => ({ drillDownPath: state.drillDownPath.slice(0, -1) })),
        clearDrillDown: () => set({ drillDownPath: [] }),
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
