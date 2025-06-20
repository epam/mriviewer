import { Page } from '@playwright/test';
import { Locator } from 'playwright';
import { TEST_IDS } from '../testIds';
import path from 'path';
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
  }

  async openDownloadFileModal() {
    await this.openDownloadFileModalButton.click();
  }

  async downloadNiftiFile() {
    await this.openDownloadFileModal();

    // Trigger download and wait for it
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.downloadFileButton.click()]);

    // Save the downloaded file to a known location
    const downloadPath = await download.path();
    const filename = download.suggestedFilename();
    const savePath = path.join(__dirname, 'downloads', filename);

    fs.mkdirSync(path.dirname(savePath), { recursive: true });
    fs.copyFileSync(downloadPath, savePath);

    const content = fs.readFileSync(savePath, 'utf-8');
    const stats = fs.statSync(savePath);

    return { content, name: filename, stats };
  }

  async switchTo3DViewer() {
    return this.switchTo3DButton.click();
  }
}
