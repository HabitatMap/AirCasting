import { test as base } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import mobileSessionData from "./mock-data/mobile-session-data.json";

type MobilePageFixtures = {
  page: any;
};

export const test = base.extend<MobilePageFixtures>({
  page: async ({ page }, use) => {
    const mockUtils = new MockUtils(page);
    await mockUtils.setupMocks();

    // Add a catch-all logger for all requests
    await page.route("**/*", async (route, request) => {
      console.log("Intercepted:", request.url());
      route.continue();
    });

    // Mock sensors endpoint
    await page.route("**/api/sensors*", async (route) => {
      console.log("Mocking /api/sensors");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeamMini-PM2.5",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
          },
        ]),
      });
    });

    // Mock mobile sessions endpoint
    await page.route("**/api/mobile/sessions.json*", async (route) => {
      console.log("Mocking /api/mobile/sessions.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessions: [mobileSessionData.session],
          fetchableSessionsCount: 1588,
        }),
      });
    });

    // Mock mobile streams endpoint
    await page.route("**/api/mobile/streams/*", async (route) => {
      console.log("Mocking /api/mobile/streams/*");
      const streamData = mobileSessionData.session.streams["AirBeamMini-PM2.5"];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          title: mobileSessionData.session.title,
          username: mobileSessionData.session.username,
          sensorName: streamData.sensor_name,
          sensorUnit: streamData.unit_symbol,
          averageValue: streamData.average_value,
          id: mobileSessionData.session.id,
          streamId: streamData.id,
          startLatitude: streamData.start_latitude,
          startLongitude: streamData.start_longitude,
          endTime: 1747938020000,
          startTime: 1747936915000,
          minLatitude: streamData.min_latitude,
          minLongitude: streamData.min_longitude,
          maxLatitude: streamData.max_latitude,
          maxLongitude: streamData.max_longitude,
          notes: [],
          measurements: mobileSessionData.measurements,
        }),
      });
    });

    // Mock thresholds endpoint
    await page.route("**/api/thresholds/*", async (route) => {
      console.log("Mocking /api/thresholds/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(["0", "9", "35", "55", "150"]),
      });
    });

    await use(page);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
