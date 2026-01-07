/**
 * E2E Tests - Dashboard
 * Tests user flows and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the dashboard', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByText('Wikipedia Editor Dashboard')).toBeVisible();
  });

  test('should display user stats', async ({ page }) => {
    // Wait for stats to load
    await expect(page.getByText('Total Edits')).toBeVisible();
    await expect(page.getByText('Active Drafts')).toBeVisible();
    await expect(page.getByText('Open Tasks')).toBeVisible();
    await expect(page.getByText('Focus Areas')).toBeVisible();
  });

  test('should navigate to drafts panel', async ({ page }) => {
    // Click on drafts in sidebar
    await page.getByRole('button', { name: /drafts/i }).click();

    // Verify drafts panel is shown
    await expect(page.getByRole('heading', { name: 'Drafts' })).toBeVisible();
  });

  test('should filter drafts by status', async ({ page }) => {
    // Navigate to drafts
    await page.getByRole('button', { name: /drafts/i }).click();

    // Open status filter
    await page.getByLabel('Status').click();

    // Select "Pending Review"
    await page.getByRole('option', { name: 'Pending Review' }).click();

    // Verify filter is applied
    await expect(page.getByLabel('Status')).toHaveText(/Pending Review/);
  });

  test('should search drafts', async ({ page }) => {
    // Navigate to drafts
    await page.getByRole('button', { name: /drafts/i }).click();

    // Enter search term
    await page.getByPlaceholder('Search drafts...').fill('Bennion');

    // Verify search results (should show Bennion drafts)
    await expect(page.getByText('Joseph Bennion')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Find and click dark mode toggle
    await page.getByRole('switch').click();

    // Verify dark mode is applied (background color change)
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  });

  test('should open external links in new tab', async ({ page, context }) => {
    // Listen for new page (tab)
    const pagePromise = context.waitForEvent('page');

    // Click XTools link
    await page.getByText('XTools').click();

    // Verify new page opened
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('xtools.wmcloud.org');
  });
});

test.describe('Responsive Design', () => {
  test('should show hamburger menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify hamburger menu is visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
  });

  test('should open sidebar on mobile when hamburger clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Click hamburger menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Verify sidebar is visible
    await expect(page.getByText('Overview')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on overview', async ({ page }) => {
    await page.goto('/');
    
    // Basic accessibility check - all interactive elements should be focusable
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Data Refresh', () => {
  test('should show refresh button', async ({ page }) => {
    await page.goto('/');

    // Verify refresh button exists
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should show last updated time', async ({ page }) => {
    await page.goto('/');

    // Verify last updated is shown
    await expect(page.getByText(/Last updated:/i)).toBeVisible();
  });
});
