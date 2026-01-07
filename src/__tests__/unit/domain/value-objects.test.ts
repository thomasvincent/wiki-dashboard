/**
 * Unit Tests - Value Objects
 * Tests formatting and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatByteDiff,
  formatEditCount,
  getWikipediaUrl,
  getXToolsUrl,
  getContributionsUrl,
  getAfcLogUrl,
  DRAFT_STATUS_DISPLAY,
  TASK_PRIORITY_DISPLAY,
} from '@domain/value-objects';

describe('formatByteDiff', () => {
  it('should format positive bytes with plus sign', () => {
    expect(formatByteDiff(100)).toBe('+100');
    expect(formatByteDiff(500)).toBe('+500');
  });

  it('should format negative bytes without plus sign', () => {
    expect(formatByteDiff(-100)).toBe('-100');
    expect(formatByteDiff(-500)).toBe('-500');
  });

  it('should format zero as +0', () => {
    expect(formatByteDiff(0)).toBe('+0');
  });

  it('should format kilobytes', () => {
    expect(formatByteDiff(1500)).toBe('+1.5KB');
    expect(formatByteDiff(-2500)).toBe('-2.5KB');
  });

  it('should format megabytes', () => {
    expect(formatByteDiff(1500000)).toBe('+1.5MB');
    expect(formatByteDiff(-2500000)).toBe('-2.5MB');
  });
});

describe('formatEditCount', () => {
  it('should format small numbers as-is', () => {
    expect(formatEditCount(100)).toBe('100');
    expect(formatEditCount(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatEditCount(1000)).toBe('1.0K');
    expect(formatEditCount(1500)).toBe('1.5K');
    expect(formatEditCount(99999)).toBe('100.0K');
  });

  it('should format millions with M suffix', () => {
    expect(formatEditCount(1000000)).toBe('1.0M');
    expect(formatEditCount(2500000)).toBe('2.5M');
  });
});

describe('getWikipediaUrl', () => {
  it('should generate article URLs', () => {
    expect(getWikipediaUrl('Test Article')).toBe('https://en.wikipedia.org/wiki/Test_Article');
  });

  it('should generate user page URLs', () => {
    expect(getWikipediaUrl('Sparks19923', 'user')).toBe('https://en.wikipedia.org/wiki/User:Sparks19923');
  });

  it('should generate draft URLs', () => {
    expect(getWikipediaUrl('Joseph Bennion', 'draft')).toBe('https://en.wikipedia.org/wiki/Draft:Joseph_Bennion');
  });

  it('should generate talk page URLs', () => {
    expect(getWikipediaUrl('Deerfield Academy', 'talk')).toBe('https://en.wikipedia.org/wiki/Talk:Deerfield_Academy');
  });

  it('should encode special characters', () => {
    expect(getWikipediaUrl('Test & Article')).toBe('https://en.wikipedia.org/wiki/Test_%26_Article');
  });
});

describe('getXToolsUrl', () => {
  it('should generate XTools URL for username', () => {
    expect(getXToolsUrl('Sparks19923')).toBe('https://xtools.wmcloud.org/ec/en.wikipedia.org/Sparks19923');
  });

  it('should encode special characters in username', () => {
    expect(getXToolsUrl('Test User')).toBe('https://xtools.wmcloud.org/ec/en.wikipedia.org/Test%20User');
  });
});

describe('getContributionsUrl', () => {
  it('should generate contributions URL', () => {
    expect(getContributionsUrl('Sparks19923')).toBe('https://en.wikipedia.org/wiki/Special:Contributions/Sparks19923');
  });
});

describe('getAfcLogUrl', () => {
  it('should generate AfC log URL', () => {
    expect(getAfcLogUrl('Joseph Bennion')).toBe('https://en.wikipedia.org/wiki/Special:Log?type=review&page=Draft%3AJoseph%20Bennion');
  });
});

describe('Status Display Constants', () => {
  it('should have all draft statuses defined', () => {
    expect(DRAFT_STATUS_DISPLAY.pending_review).toBeDefined();
    expect(DRAFT_STATUS_DISPLAY.under_review).toBeDefined();
    expect(DRAFT_STATUS_DISPLAY.accepted).toBeDefined();
    expect(DRAFT_STATUS_DISPLAY.declined).toBeDefined();
    expect(DRAFT_STATUS_DISPLAY.in_development).toBeDefined();
    expect(DRAFT_STATUS_DISPLAY.abandoned).toBeDefined();
  });

  it('should have all task priorities defined', () => {
    expect(TASK_PRIORITY_DISPLAY.high).toBeDefined();
    expect(TASK_PRIORITY_DISPLAY.medium).toBeDefined();
    expect(TASK_PRIORITY_DISPLAY.low).toBeDefined();
  });

  it('should have label, color, and optionally icon for each status', () => {
    Object.values(DRAFT_STATUS_DISPLAY).forEach((status) => {
      expect(status.label).toBeDefined();
      expect(status.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
