import { expect, Page } from '@playwright/test';
import { Locator } from 'playwright';
import { moveMouseAway } from './mouse';

export async function takeElementScreenshot(page: Page, element: Locator) {
  await moveMouseAway(page);
  await expect(element).toHaveScreenshot();
}

export async function takeAreaScreenshot(page: Page, area: { x: number; y: number; width: number; height: number }) {
  const screenshot = await page.screenshot({
    path: 'clip.png',
    clip: area,
  });
  expect(screenshot).toMatchSnapshot();
}
