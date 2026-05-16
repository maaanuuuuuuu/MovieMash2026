import { expect, test, type Page } from '@playwright/test';

async function visibleCardLabels(page: Page) {
  return page.getByRole('button', { name: /^Choose / }).evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('aria-label')?.replace('Choose ', '') ?? ''),
  );
}

async function swipeFirstPoster(page: Page) {
  const poster = page.locator('.item-card__poster-wrap').first();
  const box = await poster.boundingBox();

  if (!box) {
    throw new Error('Missing poster box');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 150, startY + 16, { steps: 8 });
  await page.mouse.up();
}

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

test('genre ranking filters render scoped lists', async ({ page }) => {
  await page.goto('/#/action/ranking');
  await expect(page.getByRole('heading', { name: 'Your ranking' })).toBeVisible();
  await expect(page.getByText('Action filter')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(119);
  await page.getByLabel('Back to comparisons').click();
  await expect(page.getByRole('heading', { name: 'Action movies' })).toBeVisible();

  await page.goto('/#/comedy/ranking');
  await expect(page.getByRole('heading', { name: 'Your ranking' })).toBeVisible();
  await expect(page.getByText('Comedy filter')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(98);
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

test('not-seen swipe can be undone before persistence', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Choose / }).first()).toBeVisible();
  const originalLabels = await visibleCardLabels(page);

  await swipeFirstPoster(page);
  await expect(page.getByLabel('Undo not seen')).toBeVisible();
  await expect(page.getByText('0 picks')).toBeVisible();

  await page.getByLabel('Undo not seen').click();
  await expect(page.getByLabel('Undo not seen')).toBeHidden();
  await expect.poll(() => visibleCardLabels(page)).toEqual(originalLabels);
  await expect(page.getByText('0 picks')).toBeVisible();
});

test('not-seen swipe persists when the next duel is played', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Choose / }).first()).toBeVisible();

  await swipeFirstPoster(page);
  await expect(page.getByLabel('Undo not seen')).toBeVisible();
  await page.getByRole('button', { name: /^Choose / }).first().click();

  await expect(page.getByLabel('Undo not seen')).toBeHidden();
  await expect(page.getByText('2 picks')).toBeVisible();
  await expect(page.getByText('396 active')).toBeVisible();
});
