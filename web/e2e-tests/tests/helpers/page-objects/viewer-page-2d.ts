import { expect, Page } from '@playwright/test';
import { Locator } from 'playwright';
import { TEST_IDS } from '../testIds';
import * as fs from 'node:fs';

export class ViewerPage2d {
  readonly page: Page;
  readonly canvas: Locator;
  readonly canvas3D: Locator;
  readonly rightSettingsPanel: Locator;
  readonly topToolbar: Locator;
  readonly openDownloadFileModalButton: Locator;
  readonly downloadFileModal: Locator;
  readonly downloadFileButton: Locator;
  readonly switchTo3DButton: Locator;
  readonly appLogo: Locator;
  readonly leftToolbar: Locator;
  readonly zoomTools: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.getByTestId(TEST_IDS.CANVAS);
    this.canvas3D = page.getByTestId(TEST_IDS.CANVAS_3D);
    this.rightSettingsPanel = page.getByTestId(TEST_IDS.RIGHT_SETTINGS_PANEL);
    this.topToolbar = page.getByTestId(TEST_IDS.TOP_TOOLBAR);
    this.openDownloadFileModalButton = page.getByTestId(TEST_IDS.OPEN_DOWNLOAD_FILE_MODAL_BUTTON);
    this.downloadFileModal = page.getByTestId(TEST_IDS.DOWNLOAD_FILE_MODAL);
    this.downloadFileButton = page.getByTestId(TEST_IDS.DOWNLOAD_FILE_BUTTON);
    this.switchTo3DButton = page.getByTestId(TEST_IDS.SWITCH_TO_3D_VIEWER_BUTTON);
    this.appLogo = page.getByTestId(TEST_IDS.APP_LOGO);
    this.leftToolbar = page.getByTestId(TEST_IDS.LEFT_TOOLBAR);
    this.zoomTools = page.getByTestId(TEST_IDS.ZOOM_TOOLS);
  }

  async openDownloadFileModal() {
    await this.openDownloadFileModalButton.click();
  }

  async downloadNiftiFile() {
    await this.openDownloadFileModal();

    // Trigger download and wait for it
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.downloadFileButton.click()]);

    // Playwright owns this temporary file and cleans it up after the test.
    const downloadPath = await download.path();
    const filename = download.suggestedFilename();
    const content = fs.readFileSync(downloadPath, 'utf-8');
    const stats = fs.statSync(downloadPath);

    return { content, name: filename, stats };
  }

  async getBoundingBoxes(container: Locator) {
    const boxes = await Promise.all((await container.getByRole('button').all()).map((button) => button.boundingBox()));
    return boxes.filter((box): box is NonNullable<typeof box> => box !== null);
  }

  async switchTo3DViewer() {
    await this.switchTo3DButton.click();
    await this.waitForRendered3DVolume();
  }

  async waitForRendered3DVolume() {
    await expect
      .poll(async () => {
        // Read the composited screenshot: WebGL contexts may clear their drawing
        // buffer after presenting a frame, making readPixels return a blank image.
        const screenshot = await this.canvas3D.screenshot();
        return this.page.evaluate(async (png) => {
          const image = new Image();
          image.src = `data:image/png;base64,${png}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          // The right settings panel overlays the canvas. Sample the central
          // volume area so UI controls cannot make a blank render pass.
          const pixels = context.getImageData(
            Math.floor(canvas.width * 0.25),
            Math.floor(canvas.height * 0.25),
            Math.floor(canvas.width * 0.35),
            Math.floor(canvas.height * 0.5)
          ).data;
          const colors = new Set<number>();
          for (let i = 0; i < pixels.length; i += 4) {
            colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
            if (colors.size > 2) return colors.size;
          }
          return colors.size;
        }, screenshot.toString('base64'));
      })
      .toBeGreaterThan(2);
  }
}
