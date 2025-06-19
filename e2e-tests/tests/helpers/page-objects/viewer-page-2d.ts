import { Page } from '@playwright/test';
import { Locator } from 'playwright';
import { TEST_IDS } from '../testIds';

export class ViewerPage2d {
  readonly page: Page;
  readonly canvas: Locator;
  readonly rightSettingsPanel: Locator;
  readonly topToolbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.getByTestId(TEST_IDS.CANVAS);
    this.rightSettingsPanel = page.getByTestId(TEST_IDS.RIGHT_SETTINGS_PANEL);
    this.topToolbar = page.getByTestId(TEST_IDS.TOP_TOOLBAR);
  }
}
