import { expect, test } from '@playwright/test';

test('ranking rows stay in place when hovered', async ({ page }) => {
  await page.goto('/#/ranking');

  const row = page.getByRole('button', { name: /^Open fight history for / }).first();
  await expect(row).toBeVisible();

  const before = await row.boundingBox();
  expect(before).not.toBeNull();

  if (!before) {
    return;
  }

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);

  await expect(row).toHaveCSS('transform', 'none');
  const after = await row.boundingBox();
  expect(after).not.toBeNull();

  if (!after) {
    return;
  }

  expect(after.x).toBeCloseTo(before.x, 1);
});
