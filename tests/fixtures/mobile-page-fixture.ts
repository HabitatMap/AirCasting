import { test as base, Page, Request, Route } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import mobileSessionData from "./mock-data/mobile-session-data.json";
import profilesData from "./mock-data/profiles.json";
import tagsData from "./mock-data/tags.json";

type MobilePageFixtures = {
  page: Page;
};

export const test = base.extend<MobilePageFixtures>({
  page: async ({ page }, use) => {
    const mockUtils = new MockUtils(page);
    await mockUtils.setupMocks();

    // Add a catch-all logger for all requests
    await page.route("**/*", async (route: Route, request: Request) => {
      console.log("Intercepted:", request.url());
      route.continue();
    });

    // Mock sensors endpoint with full list
    await page.route("**/api/sensors*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeam-PM10",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
          },
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeam-PM2.5",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
          },
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeam-PM1",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
          },
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeam-RH",
            measurement_type: "Humidity",
            unit_symbol: "%",
          },
          {
            id: null,
            session_count: 0,
            sensor_name: "AirBeam-F",
            measurement_type: "Temperature",
            unit_symbol: "F",
          },
          {
            sensor_name: "5m2-RH",
            measurement_type: "Humidity",
            unit_symbol: "%",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "AirBerBeam2-RH",
            measurement_type: "Humidity",
            unit_symbol: "%",
            session_count: 2,
            id: null,
          },
          {
            sensor_name: "Air0",
            measurement_type: "12",
            unit_symbol: "µg/m³",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "AirBeam2-Fm2-PM1",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "eamrBeam2-RH",
            measurement_type: "Humidity",
            unit_symbol: "%",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "AijBeam2-PM10",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "M903",
            measurement_type: "Light Scatter",
            unit_symbol: "Mm-1",
            session_count: 230,
            id: null,
          },
          {
            sensor_name: "AirBeam2",
            measurement_type: "A Matter",
            unit_symbol: "µg/m³",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "AirBeam2.5rBeam2-RH",
            measurement_type: "Humidity",
            unit_symbol: "%",
            session_count: 1,
            id: null,
          },
          {
            sensor_name: "am-F",
            measurement_type: "Temperature",
            unit_symbol: "F",
            session_count: 2,
            id: null,
          },
          {
            sensor_name: "AirBeam2-am2-F",
            measurement_type: "Temperature",
            unit_symbol: "F",
            session_count: 2,
            id: null,
          },
        ]),
      });
    });

    // Mock mobile sessions endpoint
    await page.route("**/api/mobile/sessions.json*", async (route: Route) => {
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
    await page.route("**/api/mobile/streams/*", async (route: Route) => {
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
    await page.route("**/api/thresholds/*", async (route: Route) => {
      console.log("Mocking /api/thresholds/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(["0", "9", "35", "55", "150"]),
      });
    });

    // Mock profiles endpoint
    await page.route("**/api/profiles*", async (route: Route) => {
      console.log("Mocking /api/profiles");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(profilesData),
      });
    });

    // Mock tags endpoint
    await page.route("**/api/tags*", async (route: Route) => {
      console.log("Mocking /api/tags");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tagsData),
      });
    });

    // Mock /api/mobile/autocomplete/tags endpoint
    await page.route(
      "**/api/mobile/autocomplete/tags*",
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            "A:",
            "Airdata",
            "amas",
            "at",
            "Avg:",
            "blue",
            "Canadian",
            "cc70",
            "chicken",
            "dee8",
            "diesel",
            "forest",
            "gr",
          ]),
        });
      }
    );

    // Mock /api/autocomplete/usernames endpoint
    await page.route("**/api/autocomplete/usernames*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          "04ncrane",
          "A2OSI",
          "Adyson Chambers",
          "AlejandraFrias",
          "Ammy",
          "Brooks Teacher",
          "Caley Wade Grange ",
          "Carlos M",
          "Cincyairdo",
          "Delila",
          "Eli_C354",
        ]),
      });
    });

    // Mock /api/autocomplete endpoint
    await page.route("**/api/autocomplete*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          suggestions: ["autocomplete1", "autocomplete2", "autocomplete3"],
        }),
      });
    });

    await use(page);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
