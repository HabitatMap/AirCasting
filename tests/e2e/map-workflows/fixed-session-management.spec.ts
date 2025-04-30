import { test } from "../../fixtures/map-page-fixture";

test.describe("FIxed Session Management Tests", () => {
  test("should handle session management actions", async ({ mapPage }) => {
    await test.step("Navigate to initial page", async () => {
      await mapPage.goto(
        "http://localhost:3000/?sessionId=&streamId=&isActive=true&sessionType=fixed&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150"
      );
    });

    await test.step("Interact with session header and images", async () => {
      await mapPage.getByRole("heading", { name: "Laval - Chomedey" }).click();
      await mapPage.locator("image").first().click();
      await mapPage.locator("image").nth(1).click();
    });

    await test.step("Change time range settings", async () => {
      await mapPage.clickTimeRangeButton("HOURS");
      await mapPage.clickTimeRangeButton("WEEK");
      await mapPage.clickTimeRangeButton("MONTH");
    });

    await test.step("Adjust threshold values", async () => {
      await mapPage.setThresholdValue("100");
      await mapPage.resetThresholdValues();
    });

    await test.step("Copy session link and export data", async () => {
      await mapPage.copySessionLink();
      await mapPage.clickOverlay(1);
      await mapPage.exportSession("test@example.com");
      await mapPage.clickOverlay(1);
    });

    await test.step("Navigate to calendar and back", async () => {
      await mapPage.clickCalendarIcon();
      await mapPage.waitForLoadState("networkidle");
      await mapPage.clickBackToSession();
      await mapPage.waitForLoadState("networkidle");
      await mapPage.clickCloseIcon();
    });
  });
});
