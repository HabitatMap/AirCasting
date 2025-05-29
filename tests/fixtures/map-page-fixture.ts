import { test as base } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import { MapPage } from "../pages/map-page";
import dormantSessionsData from "./mock-data/dormant-sessions.json";
import fixedSessionData from "./mock-data/fixed-session-data.json";
import fixedSessionsData from "./mock-data/fixed-sessions.json";
import parametersData from "./mock-data/parameters.json";
import profilesData from "./mock-data/profiles.json";
import sensorsData from "./mock-data/sensors.json";
import tagsData from "./mock-data/tags.json";
import thresholdsData from "./mock-data/thresholds.json";

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

    const mapPage = new MapPage(page);
    await use(mapPage);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
