import { Page } from '@playwright/test';

export async function moveMouseAway(page: Page) {
  await page.mouse.move(9999, 9999);
}
