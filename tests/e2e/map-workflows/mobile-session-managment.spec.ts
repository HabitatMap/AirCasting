import { test } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/?sessionId=&streamId=&isActive=true&sessionType=fixed&boundEast=-67.59738290534534&boundNorth=48.63169261089525&boundSouth=23.481713124525914&boundWest=-123.84738290534534&currentCenter=%7B%22lat%22%3A37.08877211846209%2C%22lng%22%3A-95.72238290534534%7D&currentZoom=5&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150"
  );
  await page.getByRole("button", { name: "mobile" }).click();
  await page.getByText("55 µg/m³").click();
  await page.getByRole("button", { name: "HOUR" }).click();
  await page.getByRole("button", { name: "MINUTES" }).click();
  await page.getByRole("button", { name: "ALL" }).click();
  await page
    .getByRole("button", { name: "Distribute the measurement" })
    .click();
  await page
    .getByRole("button", { name: "Reset the threshold values to" })
    .click();
  await page.getByRole("button", { name: "Open note" }).click();
  await page.getByRole("button", { name: "Open note" }).click();
  await page
    .getByTestId("overlay")
    .getByRole("button", { name: "Close icon" })
    .click();
});
