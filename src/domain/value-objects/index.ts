/**
 * Value Objects - Immutable objects with display logic
 * Encapsulates formatting and validation rules
 */

import type { DraftStatus, ContributionType, TaskPriority, TaskStatus, FocusAreaStatus } from '@domain/entities';

// === Status Display Mappings ===

export const DRAFT_STATUS_DISPLAY: Record<DraftStatus, { label: string; color: string; icon: string }> = {
  pending_review: { label: 'Pending Review', color: '#ed6c02', icon: 'HourglassEmpty' },
  under_review: { label: 'Under Review', color: '#0288d1', icon: 'RateReview' },
  accepted: { label: 'Accepted', color: '#2e7d32', icon: 'CheckCircle' },
  declined: { label: 'Declined', color: '#d32f2f', icon: 'Cancel' },
  in_development: { label: 'In Development', color: '#9c27b0', icon: 'Construction' },
  abandoned: { label: 'Abandoned', color: '#757575', icon: 'Archive' },
} as const;

export const CONTRIBUTION_TYPE_DISPLAY: Record<ContributionType, { label: string; color: string; icon: string }> = {
  major_expansion: { label: 'Major Expansion', color: '#2e7d32', icon: 'Add' },
  minor_edit: { label: 'Minor Edit', color: '#757575', icon: 'Edit' },
  new_article: { label: 'New Article', color: '#1976d2', icon: 'NoteAdd' },
  revert: { label: 'Revert', color: '#ed6c02', icon: 'Undo' },
  talk_page: { label: 'Talk Page', color: '#9c27b0', icon: 'Forum' },
} as const;

export const TASK_PRIORITY_DISPLAY: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: 'High', color: '#d32f2f' },
  medium: { label: 'Medium', color: '#ed6c02' },
  low: { label: 'Low', color: '#757575' },
} as const;

export const TASK_STATUS_DISPLAY: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  not_started: { label: 'Not Started', color: '#757575', icon: 'RadioButtonUnchecked' },
  in_progress: { label: 'In Progress', color: '#0288d1', icon: 'Pending' },
  completed: { label: 'Completed', color: '#2e7d32', icon: 'CheckCircle' },
  blocked: { label: 'Blocked', color: '#d32f2f', icon: 'Block' },
} as const;

export const FOCUS_AREA_STATUS_DISPLAY: Record<FocusAreaStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#2e7d32' },
  planned: { label: 'Planned', color: '#0288d1' },
  completed: { label: 'Completed', color: '#757575' },
  blocked: { label: 'Blocked', color: '#d32f2f' },
} as const;

// === Utility Functions ===

export function formatByteDiff(bytes: number): string {
  const absBytes = Math.abs(bytes);
  const sign = bytes >= 0 ? '+' : '';
  
  if (absBytes >= 1_000_000) {
    return `${sign}${(bytes / 1_000_000).toFixed(1)}MB`;
  }
  if (absBytes >= 1_000) {
    return `${sign}${(bytes / 1_000).toFixed(1)}KB`;
  }
  return `${sign}${bytes}`;
}

export function formatEditCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

export function getWikipediaUrl(title: string, namespace: 'article' | 'user' | 'draft' | 'talk' = 'article'): string {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
  const base = 'https://en.wikipedia.org/wiki';
  
  switch (namespace) {
    case 'user':
      return `${base}/User:${encodedTitle}`;
    case 'draft':
      return `${base}/Draft:${encodedTitle}`;
    case 'talk':
      return `${base}/Talk:${encodedTitle}`;
    default:
      return `${base}/${encodedTitle}`;
  }
}

export function getXToolsUrl(username: string): string {
  return `https://xtools.wmcloud.org/ec/en.wikipedia.org/${encodeURIComponent(username)}`;
}

export function getContributionsUrl(username: string): string {
  return `https://en.wikipedia.org/wiki/Special:Contributions/${encodeURIComponent(username)}`;
}

export function getAfcLogUrl(draftTitle: string): string {
  const encodedTitle = encodeURIComponent(`Draft:${draftTitle}`);
  return `https://en.wikipedia.org/wiki/Special:Log?type=review&page=${encodedTitle}`;
}
