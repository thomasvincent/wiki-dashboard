/**
 * Unit Tests - Application Services
 * Tests business logic functions
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeDrafts,
  analyzeContributions,
  filterTasks,
  sortTasksByPriority,
  calculateFocusAreaProgress,
} from '@application/services';
import type { Draft, Contribution, Task, FocusArea } from '@domain/entities';

// === Test Fixtures ===

const createDraft = (overrides: Partial<Draft> = {}): Draft => ({
  id: '1',
  title: 'Test Draft',
  pageUrl: 'https://example.com',
  talkPageUrl: 'https://example.com/talk',
  status: 'in_development',
  createdAt: new Date(),
  lastEditedAt: new Date(),
  submittedAt: null,
  coiDisclosed: false,
  coiDetails: null,
  notes: '',
  afcLogUrl: null,
  ...overrides,
});

const createContribution = (overrides: Partial<Contribution> = {}): Contribution => ({
  revisionId: 1,
  articleTitle: 'Test Article',
  articleUrl: 'https://example.com',
  timestamp: new Date(),
  type: 'minor_edit',
  byteDiff: 100,
  summary: 'Test edit',
  isMinor: false,
  tags: [],
  ...overrides,
});

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  priority: 'medium',
  status: 'not_started',
  dueDate: null,
  relatedArticles: [],
  createdAt: new Date(),
  completedAt: null,
  ...overrides,
});

const createFocusArea = (overrides: Partial<FocusArea> = {}): FocusArea => ({
  id: '1',
  name: 'Test Area',
  description: 'Test description',
  status: 'active',
  articles: [],
  wikiProjects: [],
  ...overrides,
});

// === Tests ===

describe('analyzeDrafts', () => {
  it('should count drafts by status', () => {
    const drafts: Draft[] = [
      createDraft({ id: '1', status: 'pending_review' }),
      createDraft({ id: '2', status: 'pending_review' }),
      createDraft({ id: '3', status: 'under_review' }),
      createDraft({ id: '4', status: 'in_development' }),
      createDraft({ id: '5', status: 'accepted' }),
    ];

    const summary = analyzeDrafts(drafts);

    expect(summary.total).toBe(5);
    expect(summary.pendingReview).toBe(2);
    expect(summary.underReview).toBe(1);
    expect(summary.inDevelopment).toBe(1);
    expect(summary.accepted).toBe(1);
    expect(summary.declined).toBe(0);
  });

  it('should handle empty array', () => {
    const summary = analyzeDrafts([]);

    expect(summary.total).toBe(0);
    expect(summary.pendingReview).toBe(0);
  });
});

describe('analyzeContributions', () => {
  it('should count contributions by type', () => {
    const contributions: Contribution[] = [
      createContribution({ revisionId: 1, type: 'major_expansion', byteDiff: 5000 }),
      createContribution({ revisionId: 2, type: 'major_expansion', byteDiff: 3000 }),
      createContribution({ revisionId: 3, type: 'minor_edit', byteDiff: 100 }),
      createContribution({ revisionId: 4, type: 'new_article', byteDiff: 10000 }),
      createContribution({ revisionId: 5, type: 'talk_page', byteDiff: 500 }),
    ];

    const summary = analyzeContributions(contributions);

    expect(summary.totalEdits).toBe(5);
    expect(summary.majorExpansions).toBe(2);
    expect(summary.minorEdits).toBe(1);
    expect(summary.newArticles).toBe(1);
    expect(summary.talkPagePosts).toBe(1);
  });

  it('should calculate total bytes added (positive only)', () => {
    const contributions: Contribution[] = [
      createContribution({ revisionId: 1, byteDiff: 1000 }),
      createContribution({ revisionId: 2, byteDiff: -500 }), // Should not count
      createContribution({ revisionId: 3, byteDiff: 2000 }),
    ];

    const summary = analyzeContributions(contributions);

    expect(summary.totalBytesAdded).toBe(3000);
  });

  it('should track most edited articles', () => {
    const contributions: Contribution[] = [
      createContribution({ revisionId: 1, articleTitle: 'Article A' }),
      createContribution({ revisionId: 2, articleTitle: 'Article A' }),
      createContribution({ revisionId: 3, articleTitle: 'Article A' }),
      createContribution({ revisionId: 4, articleTitle: 'Article B' }),
      createContribution({ revisionId: 5, articleTitle: 'Article B' }),
      createContribution({ revisionId: 6, articleTitle: 'Article C' }),
    ];

    const summary = analyzeContributions(contributions);

    expect(summary.mostEditedArticles[0]).toEqual({ title: 'Article A', editCount: 3 });
    expect(summary.mostEditedArticles[1]).toEqual({ title: 'Article B', editCount: 2 });
    expect(summary.mostEditedArticles[2]).toEqual({ title: 'Article C', editCount: 1 });
  });
});

describe('filterTasks', () => {
  const tasks: Task[] = [
    createTask({ id: '1', title: 'High priority task', priority: 'high', status: 'not_started' }),
    createTask({ id: '2', title: 'Medium priority task', priority: 'medium', status: 'in_progress' }),
    createTask({ id: '3', title: 'Low priority task', priority: 'low', status: 'completed' }),
    createTask({ id: '4', title: 'Another high task', priority: 'high', status: 'blocked' }),
  ];

  it('should filter by status', () => {
    const filtered = filterTasks(tasks, { status: 'in_progress' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('2');
  });

  it('should filter by priority', () => {
    const filtered = filterTasks(tasks, { priority: 'high' });
    expect(filtered).toHaveLength(2);
  });

  it('should filter by search term in title', () => {
    const filtered = filterTasks(tasks, { searchTerm: 'high' });
    expect(filtered).toHaveLength(2);
  });

  it('should combine multiple filters', () => {
    const filtered = filterTasks(tasks, { priority: 'high', status: 'not_started' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('1');
  });

  it('should return all tasks with no filters', () => {
    const filtered = filterTasks(tasks, {});
    expect(filtered).toHaveLength(4);
  });
});

describe('sortTasksByPriority', () => {
  it('should sort tasks with high priority first', () => {
    const tasks: Task[] = [
      createTask({ id: '1', priority: 'low' }),
      createTask({ id: '2', priority: 'high' }),
      createTask({ id: '3', priority: 'medium' }),
    ];

    const sorted = sortTasksByPriority(tasks);

    expect(sorted[0]?.priority).toBe('high');
    expect(sorted[1]?.priority).toBe('medium');
    expect(sorted[2]?.priority).toBe('low');
  });

  it('should not mutate original array', () => {
    const tasks: Task[] = [
      createTask({ id: '1', priority: 'low' }),
      createTask({ id: '2', priority: 'high' }),
    ];

    const sorted = sortTasksByPriority(tasks);

    expect(tasks[0]?.priority).toBe('low'); // Original unchanged
    expect(sorted[0]?.priority).toBe('high');
  });
});

describe('calculateFocusAreaProgress', () => {
  it('should calculate progress percentage', () => {
    const focusAreas: FocusArea[] = [
      createFocusArea({
        id: '1',
        name: 'Test Area',
        articles: [
          { title: 'A', url: '', status: 'b_class', lastEdited: null },
          { title: 'B', url: '', status: 'start', lastEdited: null },
          { title: 'C', url: '', status: 'ga', lastEdited: null },
          { title: 'D', url: '', status: 'draft', lastEdited: null },
        ],
      }),
    ];

    const progress = calculateFocusAreaProgress(focusAreas);

    expect(progress[0]?.totalArticles).toBe(4);
    expect(progress[0]?.completedArticles).toBe(2); // b_class and ga
    expect(progress[0]?.progressPercent).toBe(50);
  });

  it('should handle empty articles', () => {
    const focusAreas: FocusArea[] = [
      createFocusArea({ id: '1', articles: [] }),
    ];

    const progress = calculateFocusAreaProgress(focusAreas);

    expect(progress[0]?.totalArticles).toBe(0);
    expect(progress[0]?.progressPercent).toBe(0);
  });
});
