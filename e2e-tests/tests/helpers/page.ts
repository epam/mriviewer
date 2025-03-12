import { Page } from '@playwright/test';

export function openHomePage(page: Page) {
  return page.goto('http://host.docker.internal:3000');
}
