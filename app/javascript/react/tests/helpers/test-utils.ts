import { Page } from "@playwright/test";

export class TestUtils {
  constructor(private readonly page: Page) {}

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState("networkidle");
  }

  async closeOverlay() {
    await this.page
      .getByTestId("overlay")
      .getByRole("button", { name: "Close icon" })
      .click();
  }
}
