/**
 * Repository Interfaces (Ports)
 * Defines contracts for data access - implemented by infrastructure layer
 * Following Dependency Inversion Principle
 */

import type {
  WikiUser,
  Draft,
  Contribution,
  FocusArea,
  Task,
  CoiDisclosure,
  EditorStats,
  EditorDashboard,
} from '../entities';

export interface IUserRepository {
  getUser(username: string): Promise<WikiUser>;
  getEditCount(username: string): Promise<number>;
}

export interface IDraftRepository {
  getDrafts(username: string): Promise<readonly Draft[]>;
  getDraftByTitle(title: string): Promise<Draft | null>;
  getAfcStatus(draftTitle: string): Promise<string>;
}

export interface IContributionRepository {
  getRecentContributions(username: string, limit?: number): Promise<readonly Contribution[]>;
  getContributionsByDateRange(
    username: string,
    startDate: Date,
    endDate: Date
  ): Promise<readonly Contribution[]>;
  getContributionsForArticle(
    username: string,
    articleTitle: string
  ): Promise<readonly Contribution[]>;
}

export interface IStatsRepository {
  getEditorStats(username: string): Promise<EditorStats>;
  getDailyActivity(username: string, days?: number): Promise<EditorStats['recentActivity']>;
}

export interface ITaskRepository {
  getTasks(): Promise<readonly Task[]>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

export interface IFocusAreaRepository {
  getFocusAreas(): Promise<readonly FocusArea[]>;
  updateFocusArea(id: string, updates: Partial<FocusArea>): Promise<FocusArea>;
}

export interface ICoiDisclosureRepository {
  getDisclosures(username: string): Promise<readonly CoiDisclosure[]>;
}

// === Aggregate Repository ===

export interface IDashboardRepository {
  getDashboard(username: string): Promise<EditorDashboard>;
  refreshDashboard(username: string): Promise<EditorDashboard>;
}

// === Configuration ===
// Note: Username is managed by useSettingsStore (centralized, persisted)
// Do not add username here - it's passed dynamically to all repository methods

export interface DashboardConfig {
  readonly refreshIntervalMs: number;
  readonly maxRecentContributions: number;
  readonly activityDays: number;
}

export const DEFAULT_CONFIG: DashboardConfig = {
  refreshIntervalMs: 300_000, // 5 minutes
  maxRecentContributions: 50,
  activityDays: 30,
} as const;
