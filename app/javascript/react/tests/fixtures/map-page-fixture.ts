import { test as base, Route } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import dormantSessionsData from "../mock-data/dormant-sessions.json";
import fixedSessionData from "../mock-data/fixed-session-data.json";
import fixedSessionsData from "../mock-data/fixed-sessions.json";
import mobileSessionData from "../mock-data/mobile-session-data.json";
import parametersData from "../mock-data/parameters.json";
import profilesData from "../mock-data/profiles.json";
import sensorsData from "../mock-data/sensors.json";
import tagsData from "../mock-data/tags.json";
import thresholdsData from "../mock-data/thresholds.json";
import { MapPage } from "../pages/map-page";

type MapPageFixtures = {
  mapPage: MapPage;
};

export const test = base.extend<MapPageFixtures>({
  mapPage: async ({ page }, use) => {
    const mockUtils = new MockUtils(page);
    await mockUtils.setupMocks();

    // Add catch-all logger at the very top
    await page.route("**/*", async (route, request) => {
      // If this is not fulfilled by a mock, log a warning
      if (!route.request().url().includes("localhost")) {
        console.warn("[MOCK WARNING] Not mocked, real request:", request.url());
      } else {
        console.log("Intercepted:", request.url());
      }
      route.continue();
    });

    // Mock sensors endpoint
    await page.route("**/api/sensors**", async (route) => {
      console.log("[MOCK] Using mock data for /api/sensors");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sensorsData.sensors),
      });
    });

    // Mock active sessions endpoint
    await page.route("**/api/fixed/active/sessions2.json**", async (route) => {
      console.log(
        "[MOCK] Using mock data for /api/fixed/active/sessions2.json"
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixedSessionsData),
      });
    });

    // Mock session data endpoint
    await page.route("**/sessions/export.json", async (route) => {
      console.log("[MOCK] Using mock data for /sessions/export.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: fixedSessionData.session }),
      });
    });

    // Mock stream data endpoint
    await page.route("**/fixed_streams/*", async (route) => {
      console.log("[MOCK] Using mock data for /fixed_streams/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stream: {
            ...fixedSessionData.stream,
            active: true,
            title: fixedSessionData.session.title,
            profile: "US EPA AirNow",
            sensor_name: "Government-PM2.5",
            unit_symbol: "µg/m³",
            update_frequency: "1 hour",
            last_update: new Date().toISOString(),
            session_id: fixedSessionData.session.id,
            end_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            start_time: new Date().toISOString(),
          },
          measurements: fixedSessionData.measurements,
          stream_daily_averages: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000)
              .toISOString()
              .split("T")[0],
            value: Math.floor(Math.random() * 20) + 1,
          })),
        }),
      });
    });

    // Mock measurements endpoint with time range specific data
    await page.route("**/measurements", async (route) => {
      console.log("[MOCK] Using mock data for /measurements");
      const url = new URL(route.request().url());
      const timeRange = url.searchParams.get("timeRange");

      const generateMeasurements = (count: number) =>
        Array.from({ length: count }, (_, i) => ({
          time: Date.now() - (count - 1 - i) * 3600 * 1000,
          value: Math.floor(Math.random() * 20) + 1,
          latitude: fixedSessionData.stream.latitude,
          longitude: fixedSessionData.stream.longitude,
          streamId: fixedSessionData.stream.sessionId,
        }));

      const measurements =
        {
          HOURS: generateMeasurements(24),
          WEEK: generateMeasurements(168),
          MONTH: generateMeasurements(720),
        }[timeRange || "HOURS"] || generateMeasurements(24);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ measurements }),
      });
    });

    // Mock stream daily averages endpoint
    await page.route("**/stream_daily_averages**", async (route) => {
      console.log("[MOCK] Using mock data for /stream_daily_averages");
      const url = new URL(route.request().url());
      const timeRange = url.searchParams.get("timeRange");

      const generateDailyAverages = (count: number) =>
        Array.from({ length: count }, (_, i) => ({
          date: new Date(Date.now() - (count - 1 - i) * 86400000)
            .toISOString()
            .split("T")[0],
          value: Math.floor(Math.random() * 20) + 1,
        }));

      const dailyAverages =
        {
          HOURS: generateDailyAverages(1),
          WEEK: generateDailyAverages(7),
          MONTH: generateDailyAverages(30),
        }[timeRange || "HOURS"] || generateDailyAverages(1);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dailyAverages),
      });
    });

    // Mock thresholds endpoint
    await page.route("**/api/thresholds**", async (route) => {
      console.log("[MOCK] Using mock data for /api/thresholds");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(thresholdsData),
      });
    });

    // Add an additional route for /api/thresholds/*
    await page.route("**/api/thresholds/*", async (route) => {
      console.log("[MOCK] Using mock data for /api/thresholds/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(thresholdsData),
      });
    });

    // Mock parameters endpoint
    await page.route("**/api/parameters**", async (route) => {
      console.log("[MOCK] Using mock data for /api/parameters");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(parametersData),
      });
    });

    // Mock profiles endpoint
    await page.route("**/api/profiles**", async (route) => {
      console.log("[MOCK] Using mock data for /api/profiles");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(profilesData),
      });
    });

    // Mock tags endpoint
    await page.route("**/api/tags**", async (route) => {
      console.log("[MOCK] Using mock data for /api/tags");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tagsData),
      });
    });

    // Mock dormant sessions endpoint
    await page.route("**/api/fixed/dormant/sessions.json**", async (route) => {
      console.log(
        "[MOCK] Using mock data for /api/fixed/dormant/sessions.json"
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dormantSessionsData),
      });
    });

    // Mock mobile sessions endpoint with session counter
    let sessionsReturned = false;
    await page.route("**/api/mobile/sessions.json*", async (route) => {
      console.log("[MOCK] Using mock data for /api/mobile/sessions.json");
      if (!sessionsReturned) {
        sessionsReturned = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sessions: [mobileSessionData.session],
            fetchableSessionsCount: 1,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sessions: [],
            fetchableSessionsCount: 1,
          }),
        });
      }
    });

    // Mock /api/averages2.json endpoint
    await page.route("**/api/averages2.json*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            value: 6.162962962962963,
            west: -94.84244791666667,
            east: -94.46831597222221,
            south: 38.52315566126471,
            north: 38.813896458708214,
          },
          {
            value: 6.825525040387722,
            west: -88.48220486111111,
            east: -88.10807291666666,
            south: 42.01204523058679,
            north: 42.3027860280303,
          },
          {
            value: 1.6754555198285102,
            west: -88.48220486111111,
            east: -88.10807291666666,
            south: 42.302786028030305,
            north: 42.59352682547381,
          },
          {
            value: 4.469683050068902,
            west: -88.10807291666667,
            east: -87.73394097222221,
            south: 41.72130443314329,
            north: 42.01204523058679,
          },
          {
            value: 7.0339248434238,
            west: -88.10807291666667,
            east: -87.73394097222221,
            south: 42.01204523058679,
            north: 42.3027860280303,
          },
          {
            value: 0.0,
            west: -88.10807291666667,
            east: -87.73394097222221,
            south: 42.302786028030305,
            north: 42.59352682547381,
          },
          {
            value: 3.726023359493018,
            west: -88.10807291666667,
            east: -87.73394097222221,
            south: 42.88426762291732,
            north: 43.175008420360825,
          },
          {
            value: 252.266658205356,
            west: -87.73394097222223,
            east: -87.35980902777777,
            south: 37.94167406637769,
            north: 38.2324148638212,
          },
          {
            value: 4.489980111276151,
            west: -87.73394097222223,
            east: -87.35980902777777,
            south: 41.72130443314329,
            north: 42.01204523058679,
          },
          {
            value: 9.252805912948261,
            west: -84.74088541666667,
            east: -84.36675347222221,
            south: 39.104637256151726,
            north: 39.39537805359523,
          },
        ]),
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
            "Greenfield",
            "GT",
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
          "2ndplace",
          "Amy",
          "John",
          "scoobydoo",
          "testuser",
        ]),
      });
    });

    const mapPage = new MapPage(page);

    // Add a method to reset the sessions counter for each test
    mapPage.resetSessionsCounter = () => {
      sessionsReturned = false;
    };

    await use(mapPage);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
