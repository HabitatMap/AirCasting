import { test as base, Page } from "@playwright/test";
import { Action } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { StatusEnum } from "../../types/api";
import { FixedTimeRange } from "../../types/timeRange";
import { MockUtils } from "../helpers/mock-utils";
import { createMockStore } from "../helpers/mockStore";
import calendarData from "../mock-data/calendar-data.json";
import parametersData from "../mock-data/parameters.json";
import profilesData from "../mock-data/profiles.json";
import sensorsData from "../mock-data/sensors.json";
import tagsData from "../mock-data/tags.json";
import thresholdsData from "../mock-data/thresholds.json";

// Define a type for our store
type MockReduxStore = {
  getState: () => Partial<RootState>;
  dispatch: <A extends Action>(action: A) => A;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (reducer: any) => void;
  [Symbol.observable]: () => {
    subscribe: (observer: any) => {
      unsubscribe: () => void;
    };
    [Symbol.observable]: () => any;
  };
};

declare global {
  interface Window {
    __REDUX_STORE__: MockReduxStore;
  }
}

type CalendarFixtures = {
  calendarPage: Page;
};

export const test = base.extend<CalendarFixtures>({
  calendarPage: async ({ page }, use) => {
    // Set up mocks before the test
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

    // Mock parameters endpoint
    await page.route("**/api/parameters**", async (route) => {
      console.log("[MOCK] Using mock data for /api/parameters");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(parametersData),
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

    // Mock autocomplete usernames endpoint
    await page.route("**/api/autocomplete/usernames*", async (route) => {
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

    // Mock mobile autocomplete tags endpoint
    await page.route("**/api/mobile/autocomplete/tags*", async (route) => {
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
    });

    // Set up initial Redux state
    const store = createMockStore({
      movingCalendarStream: {
        data: [
          {
            date: "2024-03-01",
            value: 95,
          },
          {
            date: "2024-03-02",
            value: 95,
          },
          {
            date: "2024-03-03",
            value: 95,
          },
        ],
        status: StatusEnum.Fulfilled,
        error: null,
      },
      fixedStream: {
        data: {
          stream: {
            title: "Test Calendar Session",
            profile: "test-profile",
            lastUpdate: "2024-03-03T00:00:00Z",
            sensorName: "Government-PM2.5",
            unitSymbol: "µg/m³",
            updateFrequency: "1h",
            active: true,
            sessionId: 1875408,
            startTime: "2024-03-01T00:00:00Z",
            endTime: "2024-03-31T23:59:59Z",
            min: calendarData.thresholds.min,
            low: calendarData.thresholds.low,
            middle: calendarData.thresholds.middle,
            high: calendarData.thresholds.high,
            max: calendarData.thresholds.max,
            latitude: 40.69750662508967,
            longitude: -73.979506,
          },
          measurements: [
            {
              time: new Date("2024-03-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
          streamDailyAverages: [
            {
              date: "2024-03-01",
              value: 95,
            },
            {
              date: "2024-03-02",
              value: 95,
            },
            {
              date: "2024-03-03",
              value: 95,
            },
          ],
          lastMonthMeasurements: [
            {
              time: new Date("2024-02-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
        },
        fetchedStartTime: null,
        minMeasurementValue: null,
        maxMeasurementValue: null,
        averageMeasurementValue: null,
        status: StatusEnum.Fulfilled,
        error: null,
        isLoading: false,
        lastSelectedTimeRange: FixedTimeRange.Day,
        measurements: {},
        fetchedTimeRanges: {},
      },
    });

    // Inject the store into the page
    await page.addInitScript((storeState) => {
      console.log(
        "Injecting store state:",
        JSON.stringify(storeState, null, 2)
      );

      // Create a full Redux store mock that includes getState and dispatch methods
      window.__REDUX_STORE__ = {
        getState: () => storeState as Partial<RootState>,
        dispatch: (action) => {
          console.log("Dispatched action:", action);
          return action;
        },
        subscribe: () => {
          return () => {}; // noop unsubscribe function
        },
        replaceReducer: () => {},
        [Symbol.observable]: () => ({
          subscribe: () => ({
            unsubscribe: () => {},
          }),
          [Symbol.observable]: function () {
            return this;
          },
        }),
      };
    }, store.getState());

    // Mock calendar data endpoint
    await page.route("**/calendar_data.json", async (route) => {
      console.log("[MOCK] Using mock data for /calendar_data.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(calendarData),
      });
    });

    // Mock thresholds endpoint for specific sensor
    await page.route("**/thresholds/AirBeam-PM2.5", async (route) => {
      console.log("[MOCK] Using mock data for /thresholds/AirBeam-PM2.5");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          unit_symbol: "µg/m³",
          threshold_very_low: calendarData.thresholds.min,
          threshold_low: calendarData.thresholds.low,
          threshold_medium: calendarData.thresholds.middle,
          threshold_high: calendarData.thresholds.high,
          threshold_very_high: calendarData.thresholds.max,
        }),
      });
    });

    // Mock thresholds endpoint for Government-PM2.5
    await page.route("**/thresholds/Government-PM2.5", async (route) => {
      console.log("[MOCK] Using mock data for /thresholds/Government-PM2.5");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          unit_symbol: "µg/m³",
          threshold_very_low: calendarData.thresholds.min,
          threshold_low: calendarData.thresholds.low,
          threshold_medium: calendarData.thresholds.middle,
          threshold_high: calendarData.thresholds.high,
          threshold_very_high: calendarData.thresholds.max,
        }),
      });
    });

    // Mock session data endpoint
    await page.route("**/sessions/export.json", async (route) => {
      console.log("[MOCK] Using mock data for /sessions/export.json");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session: {
            id: 1875408,
            title: "Test Calendar Session",
            start_time: "2024-03-01T00:00:00Z",
            end_time: "2024-03-31T23:59:59Z",
            type: "fixed",
            is_indoor: false,
            is_active: true,
          },
        }),
      });
    });

    // Mock stream daily averages endpoint with proper response format
    await page.route("**/stream_daily_averages**", async (route) => {
      const url = route.request().url();
      console.log("[MOCK] Intercepted stream_daily_averages request:", url);

      // Create a large dataset with daily entries from Dec 2023 to May 2024
      const dailyAverages: Array<{ date: string; value: number }> = [];

      // Generate data for each day from December 2023 to May 2024
      const startDate = new Date("2023-12-01");
      const endDate = new Date("2024-05-31");
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Generate a value between 2 and 12 (more realistic air quality readings)
        const value = Math.floor(Math.random() * 10) + 2;

        // Format the date as YYYY-MM-DD
        const date = currentDate.toISOString().split("T")[0];

        // Add the daily average
        dailyAverages.push({ date, value });

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const response = {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(dailyAverages),
      };

      console.log(
        "[MOCK] Sending stream_daily_averages response with",
        dailyAverages.length,
        "data points"
      );
      await route.fulfill(response);
    });

    // Mock measurements endpoint
    await page.route("**/measurements", async (route) => {
      console.log("[MOCK] Using mock data for /measurements");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          measurements: [
            {
              time: new Date("2024-03-01T00:00:00Z").getTime(),
              value: 95,
              latitude: 40.69750662508967,
              longitude: -73.979506,
              streamId: 2597281,
            },
            {
              time: new Date("2024-03-02T00:00:00Z").getTime(),
              value: 95,
              latitude: 40.69750662508967,
              longitude: -73.979506,
              streamId: 2597281,
            },
            {
              time: new Date("2024-03-03T00:00:00Z").getTime(),
              value: 95,
              latitude: 40.69750662508967,
              longitude: -73.979506,
              streamId: 2597281,
            },
          ],
        }),
      });
    });

    // Mock fixed stream data endpoint
    await page.route("**/fixed/streams/*", async (route) => {
      console.log("[MOCK] Using mock data for /fixed/streams/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stream: {
            title: "Test Calendar Session",
            profile: "test-profile",
            lastUpdate: "2024-03-03T00:00:00Z",
            sensorName: "Government-PM2.5",
            unitSymbol: "µg/m³",
            updateFrequency: "1h",
            active: true,
            sessionId: 1875408,
            startTime: "2024-03-01T00:00:00Z",
            endTime: "2024-03-31T23:59:59Z",
            min: calendarData.thresholds.min,
            low: calendarData.thresholds.low,
            middle: calendarData.thresholds.middle,
            high: calendarData.thresholds.high,
            max: calendarData.thresholds.max,
            latitude: 40.69750662508967,
            longitude: -73.979506,
          },
          measurements: [
            {
              time: new Date("2024-03-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
          streamDailyAverages: [
            {
              date: "2024-03-01",
              value: 95,
            },
            {
              date: "2024-03-02",
              value: 95,
            },
            {
              date: "2024-03-03",
              value: 95,
            },
          ],
          lastMonthMeasurements: [
            {
              time: new Date("2024-02-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
        }),
      });
    });

    // Mock fixed_streams endpoint (alternative path)
    await page.route("**/fixed_streams/*", async (route) => {
      console.log("[MOCK] Using mock data for /fixed_streams/*");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          stream: {
            title: "Test Calendar Session",
            profile: "test-profile",
            lastUpdate: "2024-03-03T00:00:00Z",
            sensorName: "Government-PM2.5",
            unitSymbol: "µg/m³",
            updateFrequency: "1h",
            active: true,
            sessionId: 1875408,
            startTime: "2024-03-01T00:00:00Z",
            endTime: "2024-03-31T23:59:59Z",
            min: calendarData.thresholds.min,
            low: calendarData.thresholds.low,
            middle: calendarData.thresholds.middle,
            high: calendarData.thresholds.high,
            max: calendarData.thresholds.max,
            latitude: 40.69750662508967,
            longitude: -73.979506,
          },
          measurements: [
            {
              time: new Date("2024-03-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-03-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
          streamDailyAverages: [
            {
              date: "2024-03-01",
              value: 95,
            },
            {
              date: "2024-03-02",
              value: 95,
            },
            {
              date: "2024-03-03",
              value: 95,
            },
          ],
          lastMonthMeasurements: [
            {
              time: new Date("2024-02-01T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-02T00:00:00Z").getTime(),
              value: 95,
            },
            {
              time: new Date("2024-02-03T00:00:00Z").getTime(),
              value: 95,
            },
          ],
        }),
      });
    });

    // Add debug logging for calendar component
    await page.addInitScript(() => {
      // Ensure document is available before setting up the observer
      if (typeof document !== "undefined") {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  const element = node as Element;
                  if (element.getAttribute("data-testid") === "calendar-cell") {
                    console.log("Calendar cell added:", element);
                    console.log(
                      "Calendar cell value:",
                      element.querySelector(".value")?.textContent
                    );
                  }
                }
              });
            }
          });
        });

        // Only observe when document.body is available
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
          console.log("MutationObserver successfully set up");
        } else {
          console.log("Document body not available yet for MutationObserver");
          // Add a listener to set up observer once DOM is ready
          window.addEventListener("DOMContentLoaded", () => {
            if (document.body) {
              observer.observe(document.body, {
                childList: true,
                subtree: true,
              });
              console.log("MutationObserver set up after DOMContentLoaded");
            }
          });
        }
      }
    });

    await use(page);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
