import { test, expect } from '@playwright/test';

test.describe('Undo / Redo', () => {
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

  test('undo snackbar appears after deleting a task', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Task for undo');
    await input.press('Enter');
    await page.waitForTimeout(500);

    const deleteBtn = page.getByLabel('Delete task').nth(1);
    await deleteBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    const undoBtn = page.getByLabel('Undo last action');
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
  });

  test('undo restores a deleted task', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Undo me');
    await input.press('Enter');
    await page.waitForTimeout(500);

    await page.getByLabel('Delete task').nth(1).dispatchEvent('click');
    await page.waitForTimeout(1000);

    await page.getByLabel('Undo last action').click();
    await expect(page.locator('[data-taskid] p').filter({ hasText: 'Undo me' })).toBeVisible();
  });

  test('redo works after undo', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Redo me');
    await input.press('Enter');
    await page.waitForTimeout(500);

    await page.getByLabel('Delete task').nth(1).dispatchEvent('click');
    await page.waitForTimeout(1000);

    await page.getByLabel('Undo last action').click();
    await page.waitForTimeout(500);

    await page.getByLabel('Redo last action').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-taskid] p').filter({ hasText: 'Redo me' })).not.toBeVisible();
  });
});
