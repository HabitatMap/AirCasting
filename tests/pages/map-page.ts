import { Locator, Page } from "@playwright/test";

export class MapPage {
  constructor(private readonly page: Page) {}

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  getByRole(
    role:
      | "button"
      | "combobox"
      | "option"
      | "heading"
      | "spinbutton"
      | "textbox"
      | "link",
    options?: { name: string; exact?: boolean }
  ): Locator {
    return this.page.getByRole(role, options);
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async waitForLoadState(
    state: "networkidle" | "load" | "domcontentloaded" = "networkidle"
  ) {
    await this.page.waitForLoadState(state);
  }

  async navigateToMap() {
    await this.page.goto("http://localhost:3000");
    await this.waitForLoadState();
  }

  async goto(url: string) {
    await this.page.goto(url);
    await this.waitForLoadState();
  }

  async clickTimeRangeButton(timeRange: "HOURS" | "WEEK" | "MONTH") {
    await this.page.getByRole("button", { name: timeRange }).click();
  }

  async setThresholdValue(value: string) {
    const thresholdInput = this.page.getByRole("spinbutton").nth(3);
    await thresholdInput.click();
    await thresholdInput.fill(value);
    await thresholdInput.press("Enter");
  }

  async resetThresholdValues() {
    await this.page
      .getByRole("button", { name: "Reset the threshold values to" })
      .click();
  }

  async distributeMeasurements() {
    await this.page
      .getByRole("button", { name: "Distribute the measurement" })
      .click();
  }

  async copySessionLink() {
    await this.page
      .getByRole("button", { name: "Copy the link to the session" })
      .click();
    await this.page
      .getByRole("button", { name: "Copy link", exact: true })
      .click();
  }

  async exportSession(email: string) {
    await this.page
      .getByRole("button", { name: "Export the session you are" })
      .click();
    const emailInput = this.page.getByRole("textbox", {
      name: "email address",
    });
    await emailInput.click();
    await emailInput.fill(email);
    await this.page.getByRole("button", { name: "email data" }).click();
  }

  async searchLocation(location: string) {
    await this.page
      .getByRole("combobox", { name: "Search for a location" })
      .click();
    await this.page
      .getByRole("combobox", { name: "Search for a location" })
      .fill(location);
    await this.page
      .getByRole("option", { name: `${location}, NY, USA` })
      .click();
  }

  async toggleSensor(sensorName: string) {
    await this.page
      .getByRole("button", { name: `sensor ${sensorName}` })
      .click();
  }

  async toggleIndoorOutdoor(isIndoor: boolean) {
    await this.page
      .getByRole("button", { name: isIndoor ? "indoor" : "outdoor" })
      .click();
  }

  async refreshMap() {
    await this.page.getByRole("button", { name: "Refresh map" }).click();
  }

  async clickImage(index: number) {
    await this.page.locator("image").nth(index).click();
  }

  async doubleClickImage(index: number) {
    await this.page.locator("image").nth(index).dblclick();
  }

  async clickScrollbarThumb() {
    await this.page.locator(".highcharts-scrollbar-thumb").click();
  }

  async clickBackground() {
    await this.page.locator(".highcharts-background").click();
  }

  async clickOverlay(index: number) {
    await this.page.getByTestId("overlay").nth(index).click();
  }

  async clickCalendarIcon() {
    await this.page.getByRole("link", { name: "Calendar icon" }).click();
  }

  async clickBackToSession() {
    // Wait for the URL to contain the fixed_stream path with CALENDAR_VIEW
    await this.page.waitForURL(/.*fixed_stream.*CALENDAR_VIEW.*/);

    // Wait for the page to be fully loaded
    await this.waitForLoadState();

    // Wait for any loading indicators to disappear
    await this.page.waitForSelector(".highcharts-loading", { state: "hidden" });

    // Use the exact locator structure that matches the button with both image and text
    const backButton = this.page
      .locator("#react-app div")
      .filter({ hasText: "Back to sessionAirBeamUser" })
      .getByLabel("Map page", { exact: true });

    await backButton.waitFor({ state: "visible", timeout: 10000 });
    await backButton.click();

    // Wait for navigation back to the main page with MODAL_VIEW
    await this.page.waitForURL(/.*MODAL_VIEW.*/);
    await this.waitForLoadState();
  }

  async clickCloseIcon() {
    await this.page
      .getByTestId("overlay")
      .getByRole("button", { name: "Close icon" })
      .click();
  }
}
