import { expect, test } from "@playwright/test";

test("basic test", async ({ page }) => {
  await expect(true).toBeTruthy();
});
