import { expect, test } from "@playwright/test";

test("Test the mobile session managment workflow", async ({ page }) => {
  await test.step("Navigate to initial page", async () => {
    await page.goto(
      "http://localhost:3000/?sessionId=&streamId=&isActive=true&sessionType=fixed&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150"
    );
  });

  await test.step(
    "Switch to mobile view and interact with time controls",
    async () => {
      await page.getByRole("button", { name: "mobile" }).click();

      await page.waitForResponse(
        (response) =>
          response.url().includes("/mobile/sessions.json") &&
          response.status() === 200
      );

      await page.waitForSelector('[role="region"][aria-label="Map"]', {
        state: "visible",
      });

      await page.waitForSelector(
        'div[style*="position: absolute"][style*="cursor: pointer"][style*="width: 12px"][style*="height: 12px"]',
        {
          state: "visible",
          timeout: 60000,
        }
      );

      await page.waitForTimeout(1000);

      await page
        .locator(
          'div[style*="position: absolute"][style*="cursor: pointer"][style*="width: 12px"][style*="height: 12px"]'
        )
        .first()
        .click({ force: true });

      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 60000 });

      await expect(dialog.locator("h2")).toHaveText("Test - Jacob's House");

      await dialog.getByRole("button", { name: "HOUR" }).click();
      await dialog.getByRole("button", { name: "MINUTES" }).click();
      await dialog.getByRole("button", { name: "ALL" }).click();
    }
  );

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

  await test.step("Close session dialog", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await dialog.getByRole("button", { name: "Close icon" }).click();
  });
});
