import { test, expect } from '@playwright/test';
import { openHomePage } from './helpers/page';
import { HomePage } from './helpers/page-objects/home-page';
import { takeAreaScreenshot, takeElementScreenshot } from './helpers/screenshots';
import { ViewerPage2d } from './helpers/page-objects/viewer-page-2d';

const DCM_FILE_PATHS = [
  'dcm/1-01.dcm',
  'dcm/1-02.dcm',
  'dcm/1-03.dcm',
  'dcm/1-04.dcm',
  'dcm/1-05.dcm',
  'dcm/1-06.dcm',
  'dcm/1-07.dcm',
  'dcm/1-08.dcm',
  'dcm/1-09.dcm',
  'dcm/1-10.dcm',
  'dcm/1-11.dcm',
  'dcm/1-12.dcm',
  'dcm/1-13.dcm',
  'dcm/1-14.dcm',
  'dcm/1-15.dcm',
  'dcm/1-16.dcm',
  'dcm/1-17.dcm',
  'dcm/1-18.dcm',
  'dcm/1-19.dcm',
];

const VIEWPORT_SIZE = { width: 1600, height: 1024 };

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

test.describe('Displaying a 2D model', () => {
  test.use({ viewport: VIEWPORT_SIZE });

  test.beforeEach(async ({ page }) => {
    await openHomePage(page);
  });

  test('should open from device', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.showOpenFromDeviceModal();

    await takeElementScreenshot(homePage.openFromDeviceModal);
  });

  // TODO discuss tests naming with QA (should start from "should" word)
  test('should check the modal "16-bit images can hold more colors per channel than 8-bit"', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.openFileFromDevice(DCM_FILE_PATHS);

    await takeElementScreenshot(homePage.imageQualityModal);
  });

  test('should check the image', async ({ page }) => {
    const homePage = new HomePage(page);
    const viewerPage2d = new ViewerPage2d(page);

    await homePage.open16BitsFileFromDevice(DCM_FILE_PATHS);

    await takeElementScreenshot(viewerPage2d.canvas);
  });

  test('should check the slider', async ({ page }) => {
    const homePage = new HomePage(page);
    const viewerPage2d = new ViewerPage2d(page);

    await homePage.open16BitsFileFromDevice(DCM_FILE_PATHS);

    await takeElementScreenshot(viewerPage2d.rightSettingsPanel);
  });

  test('should check the upper toolbar', async ({ page }) => {
    const homePage = new HomePage(page);
    const viewerPage2d = new ViewerPage2d(page);

    await homePage.open16BitsFileFromDevice(DCM_FILE_PATHS);

    await takeElementScreenshot(viewerPage2d.topToolbar);
  });

  test('should check the left toolbar', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.open16BitsFileFromDevice(DCM_FILE_PATHS);

    // There is no one wrapper element for left toolbar, so we take a screenshot of the canvas area
    await takeAreaScreenshot(page, {
      x: 0,
      y: 0,
      width: 100,
      height: VIEWPORT_SIZE.height,
    });
  });
});
