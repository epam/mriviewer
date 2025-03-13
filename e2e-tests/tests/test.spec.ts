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

test('should open dialog with demo data', async ({ page }) => {
  await openHomePage(page);
  await page.getByText('Demo Data').click();

  await expect(page).toHaveScreenshot();
});
