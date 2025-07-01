import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export class MockUtils {
  constructor(private readonly page: Page) {}

  async setupMocks() {
    // Block all requests to staging server and redirect to local mocks
    await this.page.route("**/staging.aircasting.org/**", async (route) => {
      const url = route.request().url();
      console.log(`Intercepting staging request: ${url}`);

      // Handle API requests
      if (url.includes("/api/")) {
        // Mock mobile sessions endpoint
        if (url.includes("/mobile/sessions.json")) {
          const mockData = JSON.parse(
            fs.readFileSync(
              path.join(__dirname, "../mock-data/mobile-sessions.json"),
              "utf-8"
            )
          );
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockData),
          });
          return;
        }

        // Mock active fixed sessions endpoint
        if (url.includes("/fixed/active/sessions2.json")) {
          const mockData = JSON.parse(
            fs.readFileSync(
              path.join(__dirname, "../mock-data/fixed-sessions.json"),
              "utf-8"
            )
          );
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockData),
          });
          return;
        }

        // Mock dormant fixed sessions endpoint
        if (url.includes("/fixed/dormant/sessions.json")) {
          const mockData = JSON.parse(
            fs.readFileSync(
              path.join(__dirname, "../mock-data/fixed-sessions.json"),
              "utf-8"
            )
          );
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockData),
          });
          return;
        }

        // Mock fixed stream endpoint
        if (url.includes("/fixed_streams/")) {
          const mockData = {
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
              min: 0,
              low: 9,
              middle: 35,
              high: 55,
              max: 150,
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
          };
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockData),
          });
          return;
        }

        // Mock sensors endpoint
        if (url.includes("/sensors")) {
          const mockData = JSON.parse(
            fs.readFileSync(
              path.join(__dirname, "../mock-data/sensors.json"),
              "utf-8"
            )
          );
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockData.sensors),
          });
          return;
        }

        // Mock thresholds endpoint
        if (url.includes("/thresholds/")) {
          const mockData = JSON.parse(
            fs.readFileSync(
              path.join(__dirname, "../mock-data/thresholds.json"),
              "utf-8"
            )
          );
          const sensorName = url.split("/thresholds/")[1].split("?")[0];
          const thresholds =
            mockData.thresholds[sensorName] ||
            mockData.thresholds["AirBeam-PM2.5"];
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(thresholds),
          });
          return;
        }

        // Mock other API endpoints
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
        return;
      }

      // Block all other staging requests
      console.log(`Blocking staging request: ${url}`);
      await route.abort();
    });

    // Mock parameters.json regardless of domain
    await this.page.route("**/parameters.json", async (route) => {
      console.log(`Intercepting parameters request: ${route.request().url()}`);
      const mockData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "../mock-data/parameters.json"),
          "utf-8"
        )
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockData),
      });
    });

    // Block Google Analytics and other tracking requests
    await this.page.route("**/google-analytics.com/**", async (route) => {
      console.log(
        `Blocking Google Analytics request: ${route.request().url()}`
      );
      await route.abort();
    });
    await this.page.route("**/google.com/**", async (route) => {
      console.log(`Blocking Google request: ${route.request().url()}`);
      await route.abort();
    });
  }

  async clearMocks() {
    // No need to do anything here as the route handlers are automatically cleared
    // when the page context is disposed
  }
}
