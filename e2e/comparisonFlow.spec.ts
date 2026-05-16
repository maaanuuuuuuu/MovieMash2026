import { expect, test } from '@playwright/test';

test('comparison flow reaches the ranking page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Choose / }).first()).toBeVisible();
  await expect(page.getByLabel('Open ranking')).toBeHidden();

  await page.getByRole('button', { name: /^Choose / }).first().click();
  await expect(page.getByText('1 picks')).toBeVisible();

  await expect(page.getByLabel('Open ranking')).toBeVisible({ timeout: 6000 });
  await page.getByLabel('Open ranking').click();
  await expect(page.getByRole('heading', { name: 'Your ranking' })).toBeVisible();
  await expect(page.getByRole('listitem').first()).toBeVisible();
});

test('catalog ranking routes render scoped lists', async ({ page }) => {
  await page.goto('/#/action/ranking');
  await expect(page.getByRole('heading', { name: 'Your ranking' })).toBeVisible();
  await expect(page.getByText('Action cut')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(41);
  await page.getByLabel('Back to comparisons').click();
  await expect(page.getByRole('heading', { name: 'Pure action movies' })).toBeVisible();

  await page.goto('/#/comedy/ranking');
  await expect(page.getByRole('heading', { name: 'Your ranking' })).toBeVisible();
  await expect(page.getByText('Comedy cut')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(78);
  await page.getByLabel('Back to comparisons').click();
  await expect(page.getByRole('heading', { name: 'Comedy movies' })).toBeVisible();
});

test('app remains usable after a loaded session goes offline', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Choose / }).first()).toBeVisible();

  await page.waitForFunction(() => {
    return (
      !('serviceWorker' in navigator) ||
      (window as Window & { __movieMashOfflineReady?: boolean }).__movieMashOfflineReady === true
    );
  }, undefined, { timeout: 15000 });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Choose / }).first()).toBeVisible();
  await context.setOffline(false);
});
