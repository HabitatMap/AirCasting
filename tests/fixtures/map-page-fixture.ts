import { test as base } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import { MapPage } from "../pages/map-page";
import fixedSessionData from "./mock-data/fixed-session-data.json";

type MapPageFixtures = {
  mapPage: MapPage;
};

export const test = base.extend<MapPageFixtures>({
  mapPage: async ({ page }, use) => {
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
            sensor_name: "Government-PM2.5",
            measurement_type: "Particulate Matter",
            unit_symbol: "µg/m³",
            session_count: 1607,
            id: null,
          },
        ]),
      });
    });

    // Mock active sessions endpoint
    await page.route("**/fixed/active/sessions2.json*", async (route) => {
      console.log("Mocking /fixed/active/sessions2.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          fetchableSessionsCount: 1,
          sessions: [
            {
              id: 1874470,
              uuid: "9538b47e-4dad-4d8b-90a1-5defa12c26ce",
              end_time_local: "2025-05-23T07:00:00.000Z",
              start_time_local: "2024-04-24T12:00:00.000Z",
              last_measurement_value: 4,
              is_indoor: false,
              latitude: 45.5472,
              longitude: -73.7472,
              title: "Laval - Chomedey",
              username: "username",
              is_active: true,
              last_hourly_average_value: 4,
              streams: {
                "Government-PM2.5": {
                  measurement_short_type: "PM",
                  sensor_name: "Government-PM2.5",
                  unit_symbol: "µg/m³",
                  id: 2595727,
                  stream_daily_average: 3,
                },
              },
            },
          ],
        }),
      });
    });

    // Mock session data endpoint
    await page.route("**/sessions/export.json", async (route) => {
      console.log("Mocking /sessions/export.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: fixedSessionData.session }),
      });
    });

    // Mock stream data endpoint with correct structure and field names
    await page.route("**/fixed_streams/*", async (route) => {
      console.log("Mocking /fixed_streams/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stream: {
            active: true,
            title: "Laval - Chomedey",
            latitude: 45.5472,
            longitude: -73.7472,
            profile: "US EPA AirNow",
            sensor_name: "Government-PM2.5",
            unit_symbol: "µg/m³",
            update_frequency: "1 hour",
            last_update: "2025-05-23T07:00:00.000Z",
            session_id: 1874470,
            end_time: "2025-05-23T07:00:00.000Z",
            start_time: "2024-04-24T12:00:00.000Z",
            min: 0.0,
            low: 9.0,
            middle: 35.0,
            high: 55.0,
            max: 150.0,
          },
          measurements: [
            { time: 1747810800000, value: 5.0 },
            { time: 1747814400000, value: 5.4 },
            { time: 1747818000000, value: 5.3 },
            { time: 1747821600000, value: 6.3 },
            { time: 1747825200000, value: 4.8 },
            { time: 1747828800000, value: 3.9 },
            { time: 1747832400000, value: 3.5 },
            { time: 1747836000000, value: 3.1 },
            { time: 1747839600000, value: 2.8 },
            { time: 1747843200000, value: 2.6 },
            { time: 1747846800000, value: 2.6 },
            { time: 1747850400000, value: 2.5 },
            { time: 1747854000000, value: 2.5 },
            { time: 1747857600000, value: 2.6 },
            { time: 1747861200000, value: 2.5 },
            { time: 1747864800000, value: 2.5 },
            { time: 1747868400000, value: 2.7 },
            { time: 1747872000000, value: 2.8 },
            { time: 1747875600000, value: 3.1 },
            { time: 1747879200000, value: 2.9 },
            { time: 1747882800000, value: 2.6 },
            { time: 1747886400000, value: 2.3 },
            { time: 1747890000000, value: 2.2 },
            { time: 1747893600000, value: 2.5 },
            { time: 1747897200000, value: 2.6 },
            { time: 1747900800000, value: 3.2 },
            { time: 1747904400000, value: 3.7 },
            { time: 1747908000000, value: 3.9 },
            { time: 1747911600000, value: 3.7 },
            { time: 1747915200000, value: 3.6 },
            { time: 1747918800000, value: 3.3 },
            { time: 1747922400000, value: 3.3 },
            { time: 1747926000000, value: 3.4 },
            { time: 1747929600000, value: 2.8 },
            { time: 1747933200000, value: 2.7 },
            { time: 1747936800000, value: 2.9 },
            { time: 1747940400000, value: 2.1 },
            { time: 1747944000000, value: 2.8 },
            { time: 1747947600000, value: 3.2 },
            { time: 1747951200000, value: 3.4 },
            { time: 1747954800000, value: 3.4 },
            { time: 1747958400000, value: 2.8 },
            { time: 1747962000000, value: 2.1 },
            { time: 1747965600000, value: 1.6 },
            { time: 1747969200000, value: 1.9 },
            { time: 1747972800000, value: 3.0 },
            { time: 1747976400000, value: 3.3 },
            { time: 1747980000000, value: 3.3 },
            { time: 1747983600000, value: 4.1 },
          ],
          stream_daily_averages: [
            { date: "2025-02-01", value: 6 },
            { date: "2025-02-02", value: 10 },
            { date: "2025-02-03", value: 16 },
            { date: "2025-02-04", value: 3 },
            { date: "2025-02-05", value: 4 },
            { date: "2025-02-06", value: 10 },
            { date: "2025-02-07", value: 5 },
            { date: "2025-02-08", value: 5 },
            { date: "2025-02-09", value: 7 },
            { date: "2025-02-10", value: 4 },
            { date: "2025-02-11", value: 5 },
            { date: "2025-02-12", value: 7 },
            { date: "2025-02-13", value: 5 },
            { date: "2025-02-14", value: 4 },
            { date: "2025-02-15", value: 7 },
            { date: "2025-02-16", value: 4 },
            { date: "2025-02-17", value: 2 },
            { date: "2025-02-18", value: 3 },
            { date: "2025-02-19", value: 4 },
            { date: "2025-02-20", value: 5 },
            { date: "2025-02-21", value: 2 },
            { date: "2025-02-22", value: 8 },
            { date: "2025-02-23", value: 13 },
            { date: "2025-02-24", value: 11 },
            { date: "2025-02-25", value: 18 },
            { date: "2025-02-26", value: 6 },
            { date: "2025-02-27", value: 10 },
            { date: "2025-02-28", value: 4 },
            { date: "2025-03-01", value: 4 },
            { date: "2025-03-02", value: 7 },
            { date: "2025-03-03", value: 7 },
            { date: "2025-03-04", value: 10 },
            { date: "2025-03-05", value: 14 },
            { date: "2025-03-06", value: 2 },
            { date: "2025-03-07", value: 2 },
            { date: "2025-03-08", value: 2 },
            { date: "2025-03-09", value: 3 },
            { date: "2025-03-10", value: 8 },
            { date: "2025-03-11", value: 11 },
            { date: "2025-03-12", value: 5 },
            { date: "2025-03-13", value: 16 },
            { date: "2025-03-14", value: 25 },
            { date: "2025-03-15", value: 14 },
            { date: "2025-03-16", value: 8 },
            { date: "2025-03-17", value: 3 },
            { date: "2025-03-18", value: 6 },
            { date: "2025-03-19", value: 9 },
            { date: "2025-03-20", value: 5 },
            { date: "2025-03-21", value: 3 },
            { date: "2025-03-22", value: 4 },
            { date: "2025-03-23", value: 4 },
            { date: "2025-03-24", value: 7 },
            { date: "2025-03-25", value: 4 },
            { date: "2025-03-26", value: 4 },
            { date: "2025-03-27", value: 4 },
            { date: "2025-03-28", value: 4 },
            { date: "2025-03-29", value: 4 },
            { date: "2025-03-30", value: 4 },
            { date: "2025-03-31", value: 6 },
            { date: "2025-04-01", value: 3 },
            { date: "2025-04-02", value: 4 },
            { date: "2025-04-03", value: 3 },
            { date: "2025-04-07", value: 3 },
            { date: "2025-04-08", value: 3 },
            { date: "2025-04-09", value: 3 },
            { date: "2025-04-10", value: 5 },
            { date: "2025-04-11", value: 7 },
            { date: "2025-04-12", value: 7 },
            { date: "2025-04-13", value: 5 },
            { date: "2025-04-14", value: 6 },
            { date: "2025-04-15", value: 5 },
            { date: "2025-04-16", value: 1 },
            { date: "2025-04-17", value: 3 },
            { date: "2025-04-18", value: 6 },
            { date: "2025-04-19", value: 11 },
            { date: "2025-04-20", value: 2 },
            { date: "2025-04-21", value: 4 },
            { date: "2025-04-22", value: 3 },
            { date: "2025-04-23", value: 2 },
            { date: "2025-04-24", value: 4 },
            { date: "2025-04-25", value: 4 },
            { date: "2025-04-26", value: 4 },
            { date: "2025-04-27", value: 1 },
            { date: "2025-04-28", value: 4 },
            { date: "2025-04-29", value: 6 },
            { date: "2025-04-30", value: 2 },
            { date: "2025-05-01", value: 3 },
            { date: "2025-05-02", value: 5 },
            { date: "2025-05-03", value: 3 },
            { date: "2025-05-04", value: 8 },
            { date: "2025-05-05", value: 4 },
            { date: "2025-05-06", value: 3 },
            { date: "2025-05-07", value: 2 },
            { date: "2025-05-08", value: 3 },
            { date: "2025-05-09", value: 4 },
            { date: "2025-05-10", value: 4 },
            { date: "2025-05-11", value: 3 },
            { date: "2025-05-12", value: 4 },
            { date: "2025-05-13", value: 6 },
            { date: "2025-05-14", value: 7 },
            { date: "2025-05-15", value: 5 },
            { date: "2025-05-16", value: 7 },
            { date: "2025-05-17", value: 10 },
            { date: "2025-05-18", value: 3 },
            { date: "2025-05-19", value: 1 },
            { date: "2025-05-20", value: 2 },
            { date: "2025-05-21", value: 3 },
            { date: "2025-05-22", value: 3 },
            { date: "2025-05-23", value: 3 },
          ],
        }),
      });
    });

    // Mock measurements endpoint with time range specific data
    await page.route("**/measurements", async (route) => {
      console.log("Mocking /measurements", route.request().url());
      const url = new URL(route.request().url());
      const timeRange = url.searchParams.get("timeRange");
      let measurements = [
        {
          time: Date.now(),
          value: 42,
          latitude: 40.7,
          longitude: -73.9,
          streamId: 1,
        },
      ];
      if (timeRange === "HOURS") {
        measurements = Array.from({ length: 24 }, (_, i) => ({
          time: Date.now() - (23 - i) * 3600 * 1000,
          value: 40 + (i % 5),
          latitude: 40.7,
          longitude: -73.9,
          streamId: 1,
        }));
      } else if (timeRange === "WEEK") {
        measurements = Array.from({ length: 168 }, (_, i) => ({
          time: Date.now() - (167 - i) * 3600 * 1000,
          value: 35 + (i % 10),
          latitude: 40.7,
          longitude: -73.9,
          streamId: 1,
        }));
      } else if (timeRange === "MONTH") {
        measurements = Array.from({ length: 720 }, (_, i) => ({
          time: Date.now() - (719 - i) * 3600 * 1000,
          value: 30 + (i % 15),
          latitude: 40.7,
          longitude: -73.9,
          streamId: 1,
        }));
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ measurements }),
      });
    });

    // Mock stream daily averages endpoint with time range specific data
    await page.route("**/stream_daily_averages**", async (route) => {
      console.log("Mocking /stream_daily_averages", route.request().url());
      const url = new URL(route.request().url());
      const timeRange = url.searchParams.get("timeRange");
      let dailyAverages = [
        { date: "2024-03-01", value: 25 },
        { date: "2024-03-02", value: 30 },
      ];
      if (timeRange === "HOURS") {
        dailyAverages = dailyAverages.slice(0, 1);
      } else if (timeRange === "WEEK") {
        dailyAverages = dailyAverages.slice(0, 7);
      } else if (timeRange === "MONTH") {
        dailyAverages = dailyAverages.slice(0, 30);
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dailyAverages),
      });
    });

    // Mock thresholds endpoint
    await page.route("**/thresholds/*", async (route) => {
      console.log("Mocking /thresholds/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(["0", "9", "35", "55", "150"]),
      });
    });

    const mapPage = new MapPage(page);
    await use(mapPage);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
