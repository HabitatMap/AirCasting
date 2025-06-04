import { test } from "../../fixtures/map-page-fixture";
import fixedSessionData from "../../mock-data/fixed-session-data.json";

test.describe("Fixed Session Management Tests", () => {
  test("should handle session management actions", async ({ mapPage }) => {
    await test.step("Navigate to initial page", async () => {
      await mapPage.goto(
        `http://localhost:3000/?sessionId=${fixedSessionData.session.id}&streamId=${fixedSessionData.stream.sessionId}&isActive=${fixedSessionData.session.is_active}&sessionType=${fixedSessionData.session.type}&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A${fixedSessionData.stream.latitude}%2C%22lng%22%3A${fixedSessionData.stream.longitude}%7D&currentZoom=5&thresholdMin=${fixedSessionData.stream.min}&thresholdLow=${fixedSessionData.stream.low}&thresholdMiddle=${fixedSessionData.stream.middle}&thresholdHigh=${fixedSessionData.stream.high}&thresholdMax=${fixedSessionData.stream.max}`
      );
      await mapPage.waitForLoadingOverlay();
    });

    await test.step("Interact with session header and images", async () => {
      await mapPage
        .getByRole("heading", { name: fixedSessionData.session.title })
        .click();
      await mapPage.waitForLoadingOverlay();
      await mapPage.locator("image").first().click();
      await mapPage.waitForLoadingOverlay();
      await mapPage.locator("image").nth(1).click();
      await mapPage.waitForLoadingOverlay();
    });

    await test.step("Change time range settings", async () => {
      await mapPage.clickTimeRangeButton("HOURS");
      await mapPage.waitForLoadingOverlay();
      await mapPage.clickTimeRangeButton("WEEK");
      await mapPage.waitForLoadingOverlay();
      await mapPage.clickTimeRangeButton("MONTH");
      await mapPage.waitForLoadingOverlay();
    });

    await test.step("Adjust threshold values", async () => {
      await mapPage.setThresholdValue("100");
      await mapPage.waitForLoadingOverlay();
      await mapPage.resetThresholdValues();
      await mapPage.waitForLoadingOverlay();
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
