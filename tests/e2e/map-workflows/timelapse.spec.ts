import fixedSessionData from "../../fixtures/mock-data/fixed-sessions.json";
import { expect, test } from "../../fixtures/timelapse-page-fixture";

test("timelapse workflow", async ({ page }) => {
  const firstSession = fixedSessionData.sessions[0];
  const { latitude, longitude } = firstSession;

  await test.step("Navigate to initial page", async () => {
    await page.goto(
      `http://localhost:3000/map?lat=${latitude}&lng=${longitude}&zoom=15`
    );
    await page.waitForLoadState("networkidle");
  });

  await test.step("Click timelapse button to open timelapse view", async () => {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/v3/timelapse.json") &&
          response.status() === 200
      ),
      page.getByRole("button", { name: "Timelapse" }).click(),
    ]);
    await page.waitForLoadState("networkidle");
  });

  await test.step("Interact with timelapse controls", async () => {
    // Wait for the timelapse dialog to be visible
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 60000 });

    // Wait for initial playback to start
    await page.waitForTimeout(2000);

    // Verify timelapse is playing
    const playButton = dialog.getByRole("button", { name: "Play icon" });
    await expect(playButton).toBeVisible();

    // Change time range to 3 days
    await dialog.getByRole("button", { name: "3 days" }).click();
    await page.waitForTimeout(2000); // Wait for playback to adjust

    // Skip forward
    await dialog.getByRole("button", { name: "Skip right icon" }).click();
    await page.waitForTimeout(500);

    // Skip backward
    await dialog.getByRole("button", { name: "Skip left icon" }).click();
    await page.waitForTimeout(500);

    // Change speed
    await dialog.getByRole("button", { name: "Fast forward icon" }).click();
    await page.waitForTimeout(1000);

    // Stop timelapse
    const rewindButton = dialog.getByRole("button", { name: "Rewind icon" });
    await rewindButton.waitFor({ state: "visible", timeout: 60000 });
    await rewindButton.waitFor({ state: "attached", timeout: 60000 });
    await expect(rewindButton).toBeEnabled({ timeout: 60000 });
    await rewindButton.click();
    await page.waitForTimeout(500);

    // Close the dialog
    await dialog.getByRole("button", { name: "Close icon" }).click();
  });
});
