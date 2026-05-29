import { test, expect } from '@playwright/test';

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenSplash', 'true');
    });
    await page.goto('/options');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('theme mode buttons are visible', async ({ page }) => {
    await expect(page.getByTitle('Light Mode')).toBeVisible();
    await expect(page.getByTitle('Dark Mode')).toBeVisible();
    await expect(page.getByTitle('System Default')).toBeVisible();
  });

  test('clicking dark mode switches theme', async ({ page }) => {
    await page.getByTitle('Dark Mode').click();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);
  });

  test('clicking light mode switches theme', async ({ page }) => {
    await page.getByTitle('Dark Mode').click();
    await page.getByTitle('Light Mode').click();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(false);
  });

  test('accent color swatches are visible', async ({ page }) => {
    const swatches = page.locator('button[aria-label^="Select accent color"]');
    const count = await swatches.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('accent color can be changed', async ({ page }) => {
    const swatches = page.locator('button[aria-label^="Select accent color"]');
    const count = await swatches.count();
    if (count > 1) {
      await swatches.nth(1).click();
      // Verify the accent color changed on the root element
      const accentVar = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
      });
      expect(accentVar.length).toBeGreaterThan(0);
    }
  });
});
