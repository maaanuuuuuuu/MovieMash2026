import { expect, test } from '@playwright/test';

test('filter menu opens as a mobile sheet and changes the comparison filter', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Change genre filter/ }).click();
  const menu = page.getByRole('group', { name: 'Choose a genre filter' });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('link', { name: /^Science Fiction,/ })).toBeVisible();

  const viewport = page.viewportSize();
  const box = await menu.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();

  if (!viewport || !box) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(8);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 8);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

  await page.getByRole('link', { name: /^Action,/ }).click();
  await expect(page.getByRole('heading', { name: 'Action movies' })).toBeVisible();
});

test('filter menu opens as a compact desktop panel on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 760 });
  await page.goto('/#/ranking');

  await page.getByRole('button', { name: /Change genre filter/ }).click();
  const menu = page.getByRole('group', { name: 'Choose a genre filter' });
  await expect(menu).toBeVisible();

  const box = await menu.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  expect(box.y).toBeLessThan(140);
  expect(box.width).toBeGreaterThan(600);
  await expect(page.getByRole('link', { name: /^Western,/ })).toBeVisible();
});
