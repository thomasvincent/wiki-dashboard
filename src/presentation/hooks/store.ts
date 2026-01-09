/**
 * Zustand Store
 * Global state management with persistence
 * Follows single source of truth principle
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  EditTemplate,
  TemplateCategory,
  ResearchItem,
  ResearchPriority,
  Draft,
  FocusArea,
  CoiDisclosure,
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
  | 'collaboration'
  | 'settings';

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
        expandedNavGroups: [
          'dashboard',
          'my-work',
          'monitoring',
          'analytics',
          'tools',
          'community',
          'account',
        ],

        // Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        setActiveSection: (section) => set({ activeSection: section, drillDownPath: [] }),
        pushDrillDown: (path) =>
          set((state) => ({ drillDownPath: [...state.drillDownPath, path] })),
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
// NOTE: Dashboard data is now managed entirely by React Query (see queries.ts)
// The useDashboard() hook provides: data, isLoading, error, dataUpdatedAt
// This eliminates the anti-pattern of syncing server state to Zustand

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
        task.title.toLowerCase().includes(search) || task.description.toLowerCase().includes(search)
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
  const highPriority = state.tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'completed'
  ).length;

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

// === Auth Store ===

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  userId: number | null;
  accessToken: string | null;
  accessSecret: string | null;
  editCount: number | null;
  groups: string[];
  registrationDate: string | null;
}

interface AuthActions {
  login: (data: {
    username: string;
    userId: number;
    accessToken: string;
    accessSecret: string;
    editCount?: number;
    groups?: string[];
    registrationDate?: string;
  }) => void;
  logout: () => void;
  updateUserInfo: (data: { editCount?: number; groups?: string[] }) => void;
  setUsername: (username: string) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        // State
        isAuthenticated: false,
        username: null,
        userId: null,
        accessToken: null,
        accessSecret: null,
        editCount: null,
        groups: [],
        registrationDate: null,

        // Actions
        login: (data) =>
          set({
            isAuthenticated: true,
            username: data.username,
            userId: data.userId,
            accessToken: data.accessToken,
            accessSecret: data.accessSecret,
            editCount: data.editCount ?? null,
            groups: data.groups ?? [],
            registrationDate: data.registrationDate ?? null,
          }),
        logout: () =>
          set({
            isAuthenticated: false,
            username: null,
            userId: null,
            accessToken: null,
            accessSecret: null,
            editCount: null,
            groups: [],
            registrationDate: null,
          }),
        updateUserInfo: (data) =>
          set((state) => ({
            editCount: data.editCount ?? state.editCount,
            groups: data.groups ?? state.groups,
          })),
        setUsername: (username) =>
          set({
            username,
            isAuthenticated: false, // Not truly authenticated without OAuth
          }),
      }),
      { name: 'wiki-dashboard-auth' }
    ),
    { name: 'AuthStore' }
  )
);

// === Settings Store ===

interface SettingsState {
  configuredUsername: string;
  refreshInterval: number; // in minutes
  showNotifications: boolean;
  compactMode: boolean;
}

interface SettingsActions {
  setConfiguredUsername: (username: string) => void;
  setRefreshInterval: (minutes: number) => void;
  setShowNotifications: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SettingsState = {
  configuredUsername: 'Tvincent724',
  refreshInterval: 5,
  showNotifications: true,
  compactMode: false,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,

        setConfiguredUsername: (username) => set({ configuredUsername: username }),
        setRefreshInterval: (minutes) => set({ refreshInterval: minutes }),
        setShowNotifications: (show) => set({ showNotifications: show }),
        setCompactMode: (compact) => set({ compactMode: compact }),
        resetSettings: () => set(DEFAULT_SETTINGS),
      }),
      { name: 'wiki-dashboard-settings' }
    ),
    { name: 'SettingsStore' }
  )
);

// === Draft Store ===

interface DraftState {
  drafts: Draft[];
}

interface DraftActions {
  setDrafts: (drafts: Draft[]) => void;
  addDraft: (draft: Omit<Draft, 'id'>) => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  deleteDraft: (id: string) => void;
}

const DEFAULT_DRAFTS: Draft[] = [
  {
    id: '1',
    title: 'Joseph Bennion',
    pageUrl: 'https://en.wikipedia.org/wiki/Draft:Joseph_Bennion',
    talkPageUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Joseph_Bennion',
    status: 'pending_review',
    createdAt: new Date('2026-01-01'),
    lastEditedAt: new Date('2026-01-01'),
    submittedAt: new Date('2026-01-01'),
    coiDisclosed: true,
    coiDetails: 'Personal acquaintance',
    notes: 'Submitted via AfC wizard',
    afcLogUrl: 'https://en.wikipedia.org/wiki/Special:Log?type=review&page=Draft%3AJoseph+Bennion',
  },
  {
    id: '2',
    title: 'Lee Udall Bennion',
    pageUrl: 'https://en.wikipedia.org/wiki/Draft:Lee_Udall_Bennion',
    talkPageUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Lee_Udall_Bennion',
    status: 'under_review',
    createdAt: new Date('2026-01-01'),
    lastEditedAt: new Date('2026-01-01'),
    submittedAt: new Date('2026-01-01'),
    coiDisclosed: true,
    coiDetails: 'Personal acquaintance',
    notes: 'Reviewer feedback received on secondary sources',
    afcLogUrl:
      'https://en.wikipedia.org/wiki/Special:Log?type=review&page=Draft%3ALee+Udall+Bennion',
  },
  {
    id: '3',
    title: 'Jeffery Hotel',
    pageUrl: 'https://en.wikipedia.org/wiki/User:Sparks19923/Jeffery_Hotel',
    talkPageUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923/Jeffery_Hotel',
    status: 'in_development',
    createdAt: new Date('2025-12-31'),
    lastEditedAt: new Date('2025-12-31'),
    submittedAt: null,
    coiDisclosed: true,
    coiDetails: 'Distant descendant of founder',
    notes: 'NRHP-listed hotel',
    afcLogUrl: null,
  },
];

export const useDraftStore = create<DraftState & DraftActions>()(
  devtools(
    persist(
      (set) => ({
        drafts: DEFAULT_DRAFTS,

        setDrafts: (drafts) => set({ drafts }),
        addDraft: (draftData) =>
          set((state) => ({
            drafts: [...state.drafts, { ...draftData, id: crypto.randomUUID() }],
          })),
        updateDraft: (id, updates) =>
          set((state) => ({
            drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
          })),
        deleteDraft: (id) =>
          set((state) => ({
            drafts: state.drafts.filter((d) => d.id !== id),
          })),
      }),
      { name: 'wiki-dashboard-drafts' }
    ),
    { name: 'DraftStore' }
  )
);

// === Focus Area Store ===

interface FocusAreaState {
  focusAreas: FocusArea[];
}

interface FocusAreaActions {
  setFocusAreas: (focusAreas: FocusArea[]) => void;
  addFocusArea: (focusArea: Omit<FocusArea, 'id'>) => void;
  updateFocusArea: (id: string, updates: Partial<FocusArea>) => void;
  deleteFocusArea: (id: string) => void;
}

const DEFAULT_FOCUS_AREAS: FocusArea[] = [
  {
    id: '1',
    name: 'Boarding Schools',
    description: 'Educational institutions - prep schools',
    status: 'active',
    articles: [
      {
        title: 'Wasatch Academy',
        url: 'https://en.wikipedia.org/wiki/Wasatch_Academy',
        status: 'start',
        lastEdited: new Date('2025-12-28'),
      },
      {
        title: 'Deerfield Academy',
        url: 'https://en.wikipedia.org/wiki/Deerfield_Academy',
        status: 'start',
        lastEdited: new Date('2026-01-06'),
      },
    ],
    wikiProjects: ['WikiProject Schools'],
  },
  {
    id: '2',
    name: 'Cherokee History',
    description: 'Cherokee history and Native American leaders',
    status: 'active',
    articles: [
      {
        title: 'Yonaguska',
        url: 'https://en.wikipedia.org/wiki/Yonaguska',
        status: 'start',
        lastEdited: new Date('2025-12-30'),
      },
      { title: 'Middle Towns (Cherokee)', url: '', status: 'draft', lastEdited: null },
      { title: 'Lower Towns (Cherokee)', url: '', status: 'draft', lastEdited: null },
    ],
    wikiProjects: ['WikiProject Indigenous peoples of North America'],
  },
  {
    id: '3',
    name: 'California Gold Rush',
    description: 'Historic buildings and districts in Gold Country',
    status: 'planned',
    articles: [
      { title: 'Jeffery Hotel', url: '', status: 'draft', lastEdited: null },
      {
        title: 'Coulterville Main Street Historic District',
        url: '',
        status: 'draft',
        lastEdited: null,
      },
    ],
    wikiProjects: ['WikiProject California', 'WikiProject National Register of Historic Places'],
  },
  {
    id: '4',
    name: 'Sanpete County, Utah',
    description: 'Utah regional content - Feb 2026 targets',
    status: 'planned',
    articles: [
      { title: 'Liberal Hall', url: '', status: 'draft', lastEdited: null },
      {
        title: 'First Presbyterian Church (Mt. Pleasant)',
        url: '',
        status: 'draft',
        lastEdited: null,
      },
    ],
    wikiProjects: ['WikiProject Utah'],
  },
];

export const useFocusAreaStore = create<FocusAreaState & FocusAreaActions>()(
  devtools(
    persist(
      (set) => ({
        focusAreas: DEFAULT_FOCUS_AREAS,

        setFocusAreas: (focusAreas) => set({ focusAreas }),
        addFocusArea: (focusAreaData) =>
          set((state) => ({
            focusAreas: [...state.focusAreas, { ...focusAreaData, id: crypto.randomUUID() }],
          })),
        updateFocusArea: (id, updates) =>
          set((state) => ({
            focusAreas: state.focusAreas.map((f) => (f.id === id ? { ...f, ...updates } : f)),
          })),
        deleteFocusArea: (id) =>
          set((state) => ({
            focusAreas: state.focusAreas.filter((f) => f.id !== id),
          })),
      }),
      { name: 'wiki-dashboard-focus-areas' }
    ),
    { name: 'FocusAreaStore' }
  )
);

// === COI Disclosure Store ===

interface CoiState {
  disclosures: CoiDisclosure[];
}

interface CoiActions {
  setDisclosures: (disclosures: CoiDisclosure[]) => void;
  addDisclosure: (disclosure: Omit<CoiDisclosure, 'id'>) => void;
  updateDisclosure: (id: string, updates: Partial<CoiDisclosure>) => void;
  deleteDisclosure: (id: string) => void;
}

const DEFAULT_COI_DISCLOSURES: CoiDisclosure[] = [
  {
    id: '1',
    subject: 'Wasatch Academy',
    relationship: 'Alumnus & Advancement Committee member',
    disclosureUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923',
    disclosedAt: new Date('2025-12-31'),
    isActive: true,
  },
  {
    id: '2',
    subject: 'Jeffery Hotel',
    relationship: 'Distant descendant of founder',
    disclosureUrl: 'https://en.wikipedia.org/wiki/User_talk:Sparks19923',
    disclosedAt: new Date('2025-12-31'),
    isActive: true,
  },
  {
    id: '3',
    subject: 'Joseph Bennion',
    relationship: 'Personal acquaintance',
    disclosureUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Joseph_Bennion',
    disclosedAt: new Date('2026-01-01'),
    isActive: true,
  },
  {
    id: '4',
    subject: 'Lee Udall Bennion',
    relationship: 'Personal acquaintance',
    disclosureUrl: 'https://en.wikipedia.org/wiki/Draft_talk:Lee_Udall_Bennion',
    disclosedAt: new Date('2026-01-01'),
    isActive: true,
  },
];

export const useCoiStore = create<CoiState & CoiActions>()(
  devtools(
    persist(
      (set) => ({
        disclosures: DEFAULT_COI_DISCLOSURES,

        setDisclosures: (disclosures) => set({ disclosures }),
        addDisclosure: (disclosureData) =>
          set((state) => ({
            disclosures: [...state.disclosures, { ...disclosureData, id: crypto.randomUUID() }],
          })),
        updateDisclosure: (id, updates) =>
          set((state) => ({
            disclosures: state.disclosures.map((d) => (d.id === id ? { ...d, ...updates } : d)),
          })),
        deleteDisclosure: (id) =>
          set((state) => ({
            disclosures: state.disclosures.filter((d) => d.id !== id),
          })),
      }),
      { name: 'wiki-dashboard-coi' }
    ),
    { name: 'CoiStore' }
  )
);
