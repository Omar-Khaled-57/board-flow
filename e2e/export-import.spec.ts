import { test, expect } from '@playwright/test';

test.describe('Export / Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenSplash', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('opens options page', async ({ page }) => {
    await page.getByRole('link', { name: 'Options' }).click();
    await page.waitForURL('/options');
    await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();
  });

  test('can click export tasks button', async ({ page }) => {
    await page.getByRole('link', { name: 'Options' }).click();
    await page.waitForURL('/options');

    const exportBtn = page.getByRole('button', { name: 'Export Tasks' });
    await expect(exportBtn).toBeVisible();
  });

  test('can click import tasks button', async ({ page }) => {
    await page.getByRole('link', { name: 'Options' }).click();
    await page.waitForURL('/options');

    const importBtn = page.getByRole('button', { name: 'Import Tasks' });
    await expect(importBtn).toBeVisible();
  });

  test('has hidden file input for import', async ({ page }) => {
    await page.getByRole('link', { name: 'Options' }).click();
    await page.waitForURL('/options');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', 'application/json');
  });

  test('import/export section is present', async ({ page }) => {
    await page.getByRole('link', { name: 'Options' }).click();
    await page.waitForURL('/options');

    await expect(page.getByText('Import / Export')).toBeVisible();
  });
});
