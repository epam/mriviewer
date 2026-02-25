import { Page } from '@playwright/test';
import { Locator } from 'playwright';
import { TEST_IDS } from '../testIds';
import { getTestFile } from '../files';

export class HomePage {
  readonly page: Page;
  readonly openFromDeviceButton: Locator;
  readonly openFromDeviceModal: Locator;
  readonly openFileFromDeviceButton: Locator;
  readonly openFromDeviceInput: Locator;
  readonly imageQualityModal: Locator;
  readonly imageQualityModalYesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openFromDeviceButton = page.getByTestId(TEST_IDS.OPEN_FROM_DEVICE_BUTTON);
    this.openFromDeviceModal = page.getByTestId(TEST_IDS.OPEN_FROM_DEVICE_MODAL);
    this.openFileFromDeviceButton = page.getByTestId(TEST_IDS.OPEN_FILE_FROM_DEVICE_BUTTON);
    this.openFromDeviceInput = page.getByTestId(TEST_IDS.OPEN_FROM_DEVICE_INPUT);
    this.imageQualityModal = page.getByTestId(TEST_IDS.IMAGE_QUALITY_MODAL);
    this.imageQualityModalYesButton = page.getByTestId(TEST_IDS.IMAGE_QUALITY_MODAL_YES_BUTTON);
  }

  async showOpenFromDeviceModal() {
    await this.openFromDeviceButton.click();
  }

  async openFileFromDevice(filePaths: string | string[]) {
    await this.showOpenFromDeviceModal();
    await this.openFileFromDeviceButton.click();
    await this.openFromDeviceInput.setInputFiles(
      Array.isArray(filePaths) ? filePaths.map((filePath) => getTestFile(filePath)) : getTestFile(filePaths)
    );
  }

  async open16BitsFileFromDevice(filePaths: string | string[]) {
    await this.openFileFromDevice(filePaths);
    await this.imageQualityModalYesButton.click();
    await this.imageQualityModal.waitFor({ state: 'hidden' });
  }
}
