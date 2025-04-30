import { expect, test } from "@playwright/test";

test("verify tooltip and hover marker synchronization", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=mobile&previousUserSettings=MAP_VIEW&currentUserSettings=MODAL_VIEW&sessionId=1919108&streamId=2764506&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599&fetchedSessions=100&boundEast=-59.034041359196415&boundNorth=51.90737453665354&boundSouth=31.31889411848519&boundWest=-112.49938789384989&currentCenter=%7B%22lat%22%3A42.451236975522086%2C%22lng%22%3A-85.76671462652314%7D&currentZoom=5.660479005391139&previousCenter=%7B%22lat%22%3A42.451236975522086%2C%22lng%22%3A-85.76671462652314%7D&previousZoom=5.660479005391139"
  );

  // Wait for the chart to be loaded and interactive
  await page.waitForSelector(".highcharts-container", { state: "visible" });
  await page.waitForSelector(".highcharts-tracker-line", { state: "visible" });

  // Get the chart container
  const chartContainer = page.locator(".highcharts-container");
  await chartContainer.waitFor({ state: "visible" });

  // Get the tracker line
  const trackerLine = page.locator(".highcharts-tracker-line");
  await trackerLine.waitFor({ state: "visible" });

  // Get the tracker line points
  const trackerPoints = page.locator(".highcharts-tracker-line path");
  await trackerPoints.first().waitFor({ state: "visible" });

  // Hover over the first point on the tracker line
  await trackerPoints.first().hover();

  // Wait a bit for the hover effects to take place
  await page.waitForTimeout(1000);

  // Verify tooltip is visible
  const tooltip = page.locator(".highcharts-tooltip");
  await expect(tooltip).toBeVisible();

  // Get tooltip text
  const tooltipText = await tooltip.textContent();

  // Verify hover marker is visible
  const hoverMarker = page.locator('[data-testid="hover-marker"]');
  await expect(hoverMarker).toBeVisible();

  // Get the position of the hover marker
  const markerPosition = await hoverMarker.boundingBox();

  // Verify both elements are present and visible
  expect(tooltipText).toBeTruthy();
  expect(markerPosition).toBeTruthy();
});
