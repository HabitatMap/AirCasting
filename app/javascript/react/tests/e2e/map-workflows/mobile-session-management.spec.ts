import { test } from "../../fixtures/mobile-page-fixture";
import mobileSessionData from "../../mock-data/mobile-session-data.json";

test("Test the mobile session managment workflow", async ({ page }) => {
  test.setTimeout(60000);

  await test.step("Navigate to initial page", async () => {
    await page.goto(
      `http://localhost:3000/?sessionId=${mobileSessionData.session.id}&streamId=${mobileSessionData.stream.sessionId}&isActive=${mobileSessionData.session.is_active}&sessionType=${mobileSessionData.session.type}&previousUserSettings=MAP_VIEW&currentUserSettings=MODAL_VIEW&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A${mobileSessionData.stream.latitude}%2C%22lng%22%3A${mobileSessionData.stream.longitude}%7D&currentZoom=5&thresholdMin=${mobileSessionData.stream.min}&thresholdLow=${mobileSessionData.stream.low}&thresholdMiddle=${mobileSessionData.stream.middle}&thresholdHigh=${mobileSessionData.stream.high}&thresholdMax=${mobileSessionData.stream.max}`
    );
  });

  await test.step("Wait for page to load", async () => {
    // Dismiss cookie banner before any interaction
    const allowCookies = page.getByRole("button", { name: "Allow all cookies" });
    try {
      await allowCookies.waitFor({ state: "visible", timeout: 3000 });
      await allowCookies.click();
    } catch {
      // Banner not present, continue
    }

    // Wait for loader overlay to disappear
    await page.waitForFunction(
      () => {
        const overlays = document.querySelectorAll(
          'div[style*="position: fixed"][style*="z-index: 5"]'
        );
        return overlays.length === 0;
      },
      { timeout: 30000 }
    );
  });

  await test.step("Interact with session dialog", async () => {
    // Wait for the session dialog to be visible after clicking the marker
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 60000 });

    // Interact with time controls within the specific dialog context
    await dialog.getByRole("button", { name: "HOUR" }).click();
    await dialog.getByRole("button", { name: "MINUTES" }).click();
    await dialog.getByRole("button", { name: "ALL" }).click();

    // DO NOT CLOSE DIALOG YET
  });

  await test.step(
    "Adjust measurement distribution and thresholds on main page (dialog open)",
    async () => {
      const distributeButton = page.getByRole("button", {
        name: "Distribute the measurement thresholds uniformly",
      });
      await distributeButton.waitFor({ state: "visible", timeout: 10000 });
      await distributeButton.click();

      const resetButton = page.getByRole("button", {
        name: "Reset the threshold values to default",
      });
      await resetButton.waitFor({ state: "visible", timeout: 10000 });
      await resetButton.click();
    }
  );

  // Now, close the dialog as a final step
  await test.step("Close session dialog", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await dialog.getByRole("button", { name: "Close icon" }).click();
  });
});
