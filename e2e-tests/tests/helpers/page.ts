import { Page } from '@playwright/test';

export function openHomePage(page: Page) {
  return page.goto('http://mriviewer-app:3000');
}
