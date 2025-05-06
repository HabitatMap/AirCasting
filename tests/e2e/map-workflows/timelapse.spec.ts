import { test } from "@playwright/test";

test("Test timelapse workflow", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150"
  );
  await page.getByRole("combobox", { name: "Search for a location" }).click();
  await page
    .getByRole("combobox", { name: "Search for a location" })
    .fill("new");
  await page.getByRole("option", { name: "New York, NY, USA" }).click();
  await page.getByRole("button", { name: "Timelapse Clock icon" }).click();
  await page.goto(
    "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&currentCenter=%7B%22lat%22%3A40.69750662508967%2C%22lng%22%3A-73.979506%7D&currentZoom=10.595093703623567&boundEast=-73.39660444559586&boundNorth=40.94563062011679&boundSouth=40.44845502410125&boundWest=-74.56240755440415&previousUserSettings=MAP_VIEW&currentUserSettings=TIMELAPSE_VIEW"
  );
  await page.getByRole("button", { name: "Play icon" }).click();
  await page.getByRole("button", { name: "Skip right icon" }).click();
  await page.getByRole("button", { name: "Skip left icon" }).click();
  await page.getByRole("button", { name: "Fast forward icon" }).click();
  await page.getByRole("button", { name: "Rewind icon" }).click();
  await page.getByRole("button", { name: "3 days" }).click();
  await page.getByRole("button", { name: "7 days" }).click();
});
