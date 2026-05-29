import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hasSeenSplash', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Clear any persisted state so tests are isolated
    await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('create a task via inline input', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await expect(input).toBeVisible();

    await input.fill('Buy milk tomorrow !! #groceries');
    await page.waitForTimeout(400);
    await input.press('Enter');

    await expect(page.locator('[data-taskid] p').filter({ hasText: 'Buy milk' })).toBeVisible();
  });

  test('toggle task completion', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Task to complete');
    await input.press('Enter');

    const toggleBtn = page.getByLabel('Mark task complete');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    await expect(page.getByLabel('Mark task incomplete')).toBeVisible();
  });

  test('filter tasks by status', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Active task'); await input.press('Enter');
    await input.fill('Another task'); await input.press('Enter');

    const completeBtn = page.getByLabel('Mark task complete').first();
    await completeBtn.click();

    await page.getByRole('button', { name: 'completed' }).click();
    await expect(page.locator('[data-taskid] p').filter({ hasText: 'Active task' })).not.toBeVisible();
  });

  test('delete a task', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Task to delete');
    await input.press('Enter');

    const deleteBtn = page.getByLabel('Delete task').nth(1);
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-taskid] p').filter({ hasText: 'Task to delete' })).not.toBeVisible();
  });

  test('search tasks', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('UniqueSearchTerm'); await input.press('Enter');
    await input.fill('OtherTask'); await input.press('Enter');

    const searchInput = page.getByPlaceholder('Search tasks...');
    await searchInput.fill('UniqueSearchTerm');

    await expect(page.locator('[data-taskid] p').filter({ hasText: 'OtherTask' })).not.toBeVisible();
    await expect(page.locator('[data-taskid] p').filter({ hasText: 'UniqueSearchTerm' })).toBeVisible();
  });

  test('clear completed tasks', async ({ page }) => {
    const input = page.getByLabel('New task input');
    await input.fill('Clear me'); await input.press('Enter');
    await page.waitForTimeout(500);

    const toggleButtons = page.getByLabel('Mark task complete');
    await toggleButtons.first().waitFor({ state: 'visible' });
    await toggleButtons.first().click();
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Delete all completed tasks"]') as HTMLButtonElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-taskid]').filter({ hasText: 'Clear me' })).not.toBeVisible();
  });

  test('create and switch between task lists', async ({ page }) => {
    const listsBtn = page.getByRole('button', { name: /lists/ });
    await listsBtn.click();

    const listInput = page.getByPlaceholder('New list...');
    await listInput.fill('Test List');
    await page.waitForTimeout(300);
    await page.getByLabel('Add new list').click({ force: true });
    await page.waitForTimeout(500);

    const listTab = page.getByRole('button', { name: 'Test List' });
    await expect(listTab).toBeVisible({ timeout: 5000 });
    await listTab.click();
  });
});
