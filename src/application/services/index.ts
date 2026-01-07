/**
 * Application Services
 * Orchestrates domain logic and coordinates between repositories
 * Single Responsibility: Each service handles one aggregate
 */

import type {
  EditorDashboard,
  Draft,
  Contribution,
  Task,
  FocusArea,
} from '@domain/entities';
import type {
  IDashboardRepository,
  DashboardConfig,
} from '@domain/repositories';

// === Dashboard Service ===

export class DashboardService {
  constructor(
    private readonly dashboardRepo: IDashboardRepository,
    private readonly config: DashboardConfig
  ) {}

  async getDashboard(): Promise<EditorDashboard> {
    return this.dashboardRepo.getDashboard(this.config.username);
  }

  async refreshDashboard(): Promise<EditorDashboard> {
    return this.dashboardRepo.refreshDashboard(this.config.username);
  }
}

// === Draft Analysis Service ===

export interface DraftSummary {
  readonly total: number;
  readonly pendingReview: number;
  readonly underReview: number;
  readonly inDevelopment: number;
  readonly accepted: number;
  readonly declined: number;
}

export function analyzeDrafts(drafts: readonly Draft[]): DraftSummary {
  return drafts.reduce(
    (acc, draft) => ({
      ...acc,
      total: acc.total + 1,
      pendingReview: acc.pendingReview + (draft.status === 'pending_review' ? 1 : 0),
      underReview: acc.underReview + (draft.status === 'under_review' ? 1 : 0),
      inDevelopment: acc.inDevelopment + (draft.status === 'in_development' ? 1 : 0),
      accepted: acc.accepted + (draft.status === 'accepted' ? 1 : 0),
      declined: acc.declined + (draft.status === 'declined' ? 1 : 0),
    }),
    {
      total: 0,
      pendingReview: 0,
      underReview: 0,
      inDevelopment: 0,
      accepted: 0,
      declined: 0,
    }
  );
}

// === Contribution Analysis Service ===

export interface ContributionSummary {
  readonly totalEdits: number;
  readonly totalBytesAdded: number;
  readonly majorExpansions: number;
  readonly minorEdits: number;
  readonly newArticles: number;
  readonly talkPagePosts: number;
  readonly reverts: number;
  readonly mostEditedArticles: readonly { title: string; editCount: number }[];
}

export function analyzeContributions(contributions: readonly Contribution[]): ContributionSummary {
  const articleCounts = new Map<string, number>();
  
  const base = contributions.reduce(
    (acc, contrib) => {
      articleCounts.set(
        contrib.articleTitle,
        (articleCounts.get(contrib.articleTitle) ?? 0) + 1
      );
      
      return {
        ...acc,
        totalEdits: acc.totalEdits + 1,
        totalBytesAdded: acc.totalBytesAdded + Math.max(0, contrib.byteDiff),
        majorExpansions: acc.majorExpansions + (contrib.type === 'major_expansion' ? 1 : 0),
        minorEdits: acc.minorEdits + (contrib.type === 'minor_edit' ? 1 : 0),
        newArticles: acc.newArticles + (contrib.type === 'new_article' ? 1 : 0),
        talkPagePosts: acc.talkPagePosts + (contrib.type === 'talk_page' ? 1 : 0),
        reverts: acc.reverts + (contrib.type === 'revert' ? 1 : 0),
      };
    },
    {
      totalEdits: 0,
      totalBytesAdded: 0,
      majorExpansions: 0,
      minorEdits: 0,
      newArticles: 0,
      talkPagePosts: 0,
      reverts: 0,
      mostEditedArticles: [] as { title: string; editCount: number }[],
    }
  );

  const mostEditedArticles = Array.from(articleCounts.entries())
    .map(([title, editCount]) => ({ title, editCount }))
    .sort((a, b) => b.editCount - a.editCount)
    .slice(0, 10);

  return { ...base, mostEditedArticles };
}

// === Task Filtering Service ===

export interface TaskFilters {
  readonly status?: Task['status'];
  readonly priority?: Task['priority'];
  readonly searchTerm?: string;
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): readonly Task[] {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(term);
      const matchesDesc = task.description.toLowerCase().includes(term);
      if (!matchesTitle && !matchesDesc) return false;
    }
    return true;
  });
}

export function sortTasksByPriority(tasks: readonly Task[]): readonly Task[] {
  const priorityOrder: Record<Task['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  
  return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// === Focus Area Progress Service ===

export interface FocusAreaProgress {
  readonly id: string;
  readonly name: string;
  readonly totalArticles: number;
  readonly completedArticles: number;
  readonly progressPercent: number;
}

export function calculateFocusAreaProgress(focusAreas: readonly FocusArea[]): readonly FocusAreaProgress[] {
  return focusAreas.map((area) => {
    const totalArticles = area.articles.length;
    const completedArticles = area.articles.filter(
      (a) => ['b_class', 'ga', 'fa'].includes(a.status)
    ).length;
    
    return {
      id: area.id,
      name: area.name,
      totalArticles,
      completedArticles,
      progressPercent: totalArticles > 0 ? Math.round((completedArticles / totalArticles) * 100) : 0,
    };
  });
}
