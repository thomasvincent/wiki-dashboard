/**
 * Domain Entities - Core business objects for Wikipedia Editor Dashboard
 * Following DDD principles with immutable value objects
 */

// === Value Objects ===

export type DraftStatus = 
  | 'pending_review'
  | 'under_review' 
  | 'accepted'
  | 'declined'
  | 'in_development'
  | 'abandoned';

export type ContributionType = 
  | 'major_expansion'
  | 'minor_edit'
  | 'new_article'
  | 'revert'
  | 'talk_page';

export type FocusAreaStatus = 
  | 'active'
  | 'planned'
  | 'completed'
  | 'blocked';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

// === Entities ===

export interface WikiUser {
  readonly username: string;
  readonly userId: number;
  readonly registrationDate: Date;
  readonly editCount: number;
  readonly groups: readonly string[];
}

export interface Draft {
  readonly id: string;
  readonly title: string;
  readonly pageUrl: string;
  readonly talkPageUrl: string;
  readonly status: DraftStatus;
  readonly createdAt: Date;
  readonly lastEditedAt: Date;
  readonly submittedAt: Date | null;
  readonly coiDisclosed: boolean;
  readonly coiDetails: string | null;
  readonly notes: string;
  readonly afcLogUrl: string | null;
}

export interface Contribution {
  readonly revisionId: number;
  readonly articleTitle: string;
  readonly articleUrl: string;
  readonly timestamp: Date;
  readonly type: ContributionType;
  readonly byteDiff: number;
  readonly summary: string;
  readonly isMinor: boolean;
  readonly tags: readonly string[];
}

export interface FocusArea {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: FocusAreaStatus;
  readonly articles: readonly FocusAreaArticle[];
  readonly wikiProjects: readonly string[];
}

export interface FocusAreaArticle {
  readonly title: string;
  readonly url: string;
  readonly status: 'stub' | 'start' | 'c_class' | 'b_class' | 'ga' | 'fa' | 'draft';
  readonly lastEdited: Date | null;
}

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: Date | null;
  readonly relatedArticles: readonly string[];
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

export interface CoiDisclosure {
  readonly id: string;
  readonly subject: string;
  readonly relationship: string;
  readonly disclosureUrl: string;
  readonly disclosedAt: Date;
  readonly isActive: boolean;
}

export interface EditorStats {
  readonly totalEdits: number;
  readonly articlesCreated: number;
  readonly majorExpansions: number;
  readonly minorEdits: number;
  readonly talkPagePosts: number;
  readonly recentActivity: readonly DailyActivity[];
}

export interface DailyActivity {
  readonly date: Date;
  readonly editCount: number;
  readonly bytesAdded: number;
}

// === Watchlist & Notifications ===

export interface WatchlistItem {
  readonly title: string;
  readonly ns: number;
  readonly lastRevisionId: number;
  readonly lastEditor: string;
  readonly timestamp: Date;
  readonly oldLength: number;
  readonly newLength: number;
  readonly comment: string;
  readonly unread: boolean;
}

export type NotificationType =
  | 'thank'
  | 'mention'
  | 'message'
  | 'review'
  | 'edit-milestone'
  | 'welcome'
  | 'edit-thank';

export interface WikiNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly timestamp: Date;
  readonly title: string | null;
  readonly agent: string | null;
  readonly read: boolean;
  readonly message: string;
  readonly url: string | null;
}

// === Gamification & Achievements ===

export type MilestoneType =
  | 'edit-count'
  | 'article-created'
  | 'first-ga'
  | 'first-fa'
  | 'thanks-received'
  | 'streak';

export interface Milestone {
  readonly type: MilestoneType;
  readonly name: string;
  readonly count: number;
  readonly achievedAt: Date | null;
  readonly icon: string;
  readonly description: string;
}

export interface EditStreak {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly lastEditDate: Date | null;
  readonly streakStartDate: Date | null;
}

export interface Barnstar {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly givenBy: string;
  readonly date: Date;
  readonly reason: string;
}

// === Article Quality ===

export type ArticleClass =
  | 'stub'
  | 'start'
  | 'C'
  | 'B'
  | 'GA'
  | 'FA'
  | 'FL'
  | 'A'
  | 'List'
  | 'Unassessed';

export type ArticleImportance = 'low' | 'mid' | 'high' | 'top' | 'unknown';

export interface QualityAssessment {
  readonly title: string;
  readonly class: ArticleClass;
  readonly importance: ArticleImportance;
  readonly projects: readonly string[];
  readonly assessedAt: Date | null;
}

export interface QualityNomination {
  readonly id: string;
  readonly title: string;
  readonly type: 'GA' | 'FA' | 'FL' | 'DYK' | 'ITN' | 'peer-review';
  readonly status: 'pending' | 'under-review' | 'passed' | 'failed';
  readonly nominatedAt: Date;
  readonly resolvedAt: Date | null;
  readonly url: string;
}

// === Templates ===

export type TemplateCategory =
  | 'edit-summary'
  | 'talk-page'
  | 'welcome'
  | 'afc-decline'
  | 'warning'
  | 'custom';

export interface EditTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: TemplateCategory;
  readonly content: string;
  readonly shortcut: string | null;
  readonly usageCount: number;
  readonly createdAt: Date;
}

// === Research Queue ===

export type ResearchPriority = 'high' | 'medium' | 'low';

export interface ResearchItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly notes: string;
  readonly sources: readonly string[];
  readonly addedAt: Date;
  readonly priority: ResearchPriority;
  readonly completed: boolean;
}

// === Collaboration ===

export interface WikiProject {
  readonly name: string;
  readonly shortname: string;
  readonly url: string;
  readonly memberCount: number | null;
  readonly activeDiscussions: number;
}

export interface Editathon {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly url: string;
  readonly participantCount: number;
  readonly articleCount: number;
}

// === Impact Metrics ===

export interface PageViewStats {
  readonly title: string;
  readonly views: number;
  readonly period: string;
  readonly dailyViews: readonly { date: string; views: number }[];
}

export interface ImpactMetrics {
  readonly articlesCreated: number;
  readonly totalPageViews: number;
  readonly averageViewsPerArticle: number;
  readonly articleSurvivalRate: number;
  readonly mostViewedArticles: readonly PageViewStats[];
}

// === Namespace Stats ===

export interface NamespaceStats {
  readonly namespace: number;
  readonly namespaceName: string;
  readonly editCount: number;
  readonly percentage: number;
}

export interface HeatmapData {
  readonly year: number;
  readonly data: readonly { date: string; count: number }[];
  readonly totalEdits: number;
}

// === Aggregate Root ===

export interface EditorDashboard {
  readonly user: WikiUser;
  readonly stats: EditorStats;
  readonly drafts: readonly Draft[];
  readonly recentContributions: readonly Contribution[];
  readonly focusAreas: readonly FocusArea[];
  readonly tasks: readonly Task[];
  readonly coiDisclosures: readonly CoiDisclosure[];
  readonly lastUpdated: Date;
}
