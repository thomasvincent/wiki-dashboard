/**
 * Domain Entities - Core business objects for Wikipedia Editor Dashboard
 * Following DDD principles with immutable value objects
 * Uses Discriminated Unions for type-safe state handling
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

export type FocusAreaStatus = 'active' | 'planned' | 'completed' | 'blocked';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

// === User Entity with Discriminated Union ===
// Authenticated users have guaranteed metadata

interface WikiUserBase {
  readonly username: string;
}

export interface AuthenticatedWikiUser extends WikiUserBase {
  readonly kind: 'authenticated';
  readonly userId: number;
  readonly registrationDate: Date;
  readonly editCount: number;
  readonly groups: readonly string[];
  readonly accessToken: string;
  readonly accessSecret: string;
}

export interface UnauthenticatedWikiUser extends WikiUserBase {
  readonly kind: 'unauthenticated';
  readonly userId: number;
  readonly registrationDate: Date;
  readonly editCount: number;
  readonly groups: readonly string[];
}

export type WikiUserState = AuthenticatedWikiUser | UnauthenticatedWikiUser;

// Legacy interface for backwards compatibility
export interface WikiUser {
  readonly username: string;
  readonly userId: number;
  readonly registrationDate: Date;
  readonly editCount: number;
  readonly groups: readonly string[];
}

// Type guard for authenticated users
export function isAuthenticated(user: WikiUserState): user is AuthenticatedWikiUser {
  return user.kind === 'authenticated';
}

// === Draft with Discriminated Union ===
// Different statuses have different guaranteed properties

interface DraftBase {
  readonly id: string;
  readonly title: string;
  readonly pageUrl: string;
  readonly talkPageUrl: string;
  readonly createdAt: Date;
  readonly lastEditedAt: Date;
  readonly coiDisclosed: boolean;
  readonly coiDetails: string | null;
  readonly notes: string;
}

export interface InDevelopmentDraft extends DraftBase {
  readonly status: 'in_development';
  readonly submittedAt: null;
  readonly afcLogUrl: null;
}

export interface SubmittedDraft extends DraftBase {
  readonly status: 'pending_review' | 'under_review';
  readonly submittedAt: Date; // Guaranteed when submitted
  readonly afcLogUrl: string; // Has log URL when in AFC
}

export interface AcceptedDraft extends DraftBase {
  readonly status: 'accepted';
  readonly submittedAt: Date;
  readonly afcLogUrl: string;
  readonly acceptedAt: Date;
  readonly articleUrl: string; // Final article URL
}

export interface DeclinedDraft extends DraftBase {
  readonly status: 'declined';
  readonly submittedAt: Date;
  readonly afcLogUrl: string;
  readonly declinedAt: Date;
  readonly declineReason: string;
}

export interface AbandonedDraft extends DraftBase {
  readonly status: 'abandoned';
  readonly submittedAt: Date | null;
  readonly afcLogUrl: string | null;
  readonly abandonedAt: Date;
}

export type DraftVariant =
  | InDevelopmentDraft
  | SubmittedDraft
  | AcceptedDraft
  | DeclinedDraft
  | AbandonedDraft;

// Type guards for draft statuses
export function isSubmittedDraft(d: DraftVariant): d is SubmittedDraft {
  return d.status === 'pending_review' || d.status === 'under_review';
}

export function isAcceptedDraft(d: DraftVariant): d is AcceptedDraft {
  return d.status === 'accepted';
}

// Legacy interface for backwards compatibility
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

// === Contribution with Discriminated Union ===
// Different edit types have different guaranteed properties

interface ContributionBase {
  readonly revisionId: number;
  readonly articleTitle: string;
  readonly articleUrl: string;
  readonly timestamp: Date;
  readonly byteDiff: number;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface NewArticleContribution extends ContributionBase {
  readonly type: 'new_article';
  readonly isMinor: false; // New articles are never minor
  readonly parentId: 0; // No parent revision
}

export interface MajorExpansionContribution extends ContributionBase {
  readonly type: 'major_expansion';
  readonly isMinor: false;
  readonly parentId: number;
}

export interface MinorEditContribution extends ContributionBase {
  readonly type: 'minor_edit';
  readonly isMinor: true;
  readonly parentId: number;
}

export interface RevertContribution extends ContributionBase {
  readonly type: 'revert';
  readonly isMinor: boolean;
  readonly parentId: number;
  readonly revertedRevisionId: number;
}

export interface TalkPageContribution extends ContributionBase {
  readonly type: 'talk_page';
  readonly isMinor: boolean;
  readonly parentId: number;
}

export type ContributionVariant =
  | NewArticleContribution
  | MajorExpansionContribution
  | MinorEditContribution
  | RevertContribution
  | TalkPageContribution;

// Type guards for contribution types
export function isNewArticle(c: ContributionVariant): c is NewArticleContribution {
  return c.type === 'new_article';
}

export function isRevert(c: ContributionVariant): c is RevertContribution {
  return c.type === 'revert';
}

// Legacy interface for backwards compatibility
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

// === Notification with Discriminated Union ===
// Different notification types have different guaranteed properties

interface NotificationBase {
  readonly id: string;
  readonly timestamp: Date;
  readonly read: boolean;
  readonly message: string;
}

export interface ThankNotification extends NotificationBase {
  readonly type: 'thank' | 'edit-thank';
  readonly agent: string; // Always has who thanked
  readonly title: string; // Always has article title
  readonly revisionId: number;
  readonly url: string;
}

export interface MentionNotification extends NotificationBase {
  readonly type: 'mention';
  readonly agent: string; // Who mentioned you
  readonly title: string; // Where mentioned
  readonly url: string;
}

export interface MessageNotification extends NotificationBase {
  readonly type: 'message';
  readonly agent: string; // Who left message
  readonly title: string; // Your talk page
  readonly sectionTitle: string | null;
  readonly url: string;
}

export interface ReviewNotification extends NotificationBase {
  readonly type: 'review';
  readonly title: string; // Article/draft reviewed
  readonly result: 'accept' | 'decline' | 'comment';
  readonly reviewer: string;
  readonly url: string;
}

export interface MilestoneNotification extends NotificationBase {
  readonly type: 'edit-milestone';
  readonly editCount: number;
  readonly title: null;
  readonly agent: null;
  readonly url: null;
}

export interface WelcomeNotification extends NotificationBase {
  readonly type: 'welcome';
  readonly title: null;
  readonly agent: null;
  readonly url: string;
}

export type NotificationVariant =
  | ThankNotification
  | MentionNotification
  | MessageNotification
  | ReviewNotification
  | MilestoneNotification
  | WelcomeNotification;

// Type guards for notification types
export function isThankNotification(n: NotificationVariant): n is ThankNotification {
  return n.type === 'thank' || n.type === 'edit-thank';
}

export function isReviewNotification(n: NotificationVariant): n is ReviewNotification {
  return n.type === 'review';
}

// Legacy interface for backwards compatibility
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
