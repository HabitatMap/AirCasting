import { expect, test } from "../../fixtures/base-fixture";

test.describe("Basic Connection Tests", () => {
  test("should successfully connect to the application", async ({ page }) => {
    // Try to access the root URL
    await page.goto("http://localhost:3000");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Basic assertion
    await expect(page).toHaveTitle(/AirCasting/);

    // Take a screenshot for verification
    await page.screenshot({ path: "screenshots/connection-test.png" });
  });
});
