import { expect, Page } from '@playwright/test';
import { Locator } from 'playwright';

export async function takeElementScreenshot(element: Locator) {
  await expect(element).toHaveScreenshot();
}

export async function takeAreaScreenshot(page: Page, area: { x: number; y: number; width: number; height: number }) {
  const screenshot = await page.screenshot({
    path: 'clip.png',
    clip: area,
  });
  expect(screenshot).toMatchSnapshot();
}
