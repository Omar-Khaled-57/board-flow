import { test, expect } from '@playwright/test';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenSplash', 'true');
    });
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('create a new note', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.waitForURL(/\/notes\//);
    await expect(page.getByText('Untitled')).toBeVisible();
  });

  test('empty state shows when no notes exist', async ({ page }) => {
    await expect(page.getByText('No notes right now')).toBeVisible();
  });

  test('search filters notes', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.waitForURL(/\/notes\//);
    await page.goBack();
    await page.waitForLoadState('networkidle');

    const search = page.getByPlaceholder('Search notes...');
    await search.fill('nonexistent');
    await expect(page.getByText('No notes right now')).toBeVisible();
  });

  test('navigate to note details and back', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.waitForURL(/\/notes\//);

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Notes', exact: true })).toBeVisible();
  });
});
