import { test, expect } from '@playwright/test';
import { openHomePage } from './helpers/page';

test('has title', async ({ page }) => {
  await openHomePage(page);

  await expect(page).toHaveTitle(/MRI Viewer Dicom 2d\/3d browser/);
});

test('should open initial screen view', async ({ page }) => {
  await openHomePage(page);

  await expect(page).toHaveScreenshot();
});
