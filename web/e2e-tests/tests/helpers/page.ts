import { Page } from '@playwright/test';

export function openHomePage(page: Page) {
  return page.goto(process.env.MRI_VIEWER_BASE_URL || 'http://mriviewer-app:3000');
}
