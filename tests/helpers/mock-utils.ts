import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export class MockUtils {
  constructor(private readonly page: Page) {}

  async setupMocks() {
    // Always mock /parameters.json regardless of domain
    await this.page.route("**/parameters.json", async (route) => {
      const mockData = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "../fixtures/mock-data/parameters.json"),
          "utf-8"
        )
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockData),
      });
    });

    // Enable request interception for all API endpoints
    await this.page.route("**/api/**", async (route) => {
      const url = route.request().url();

      // Mock export session data endpoint
      if (url.includes("/sessions/export.json")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Export started" }),
        });
        return;
      }

      // Mock crowd map endpoint
      if (url.includes("/averages2.json")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ averages: [] }),
        });
        return;
      }

      // Mock active fixed sessions endpoint
      if (url.includes("/fixed/active/sessions2.json")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/fixed-sessions.json"),
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
            path.join(__dirname, "../fixtures/mock-data/fixed-sessions.json"),
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

      // Mock fixed stream by id endpoint
      if (url.match(/\/fixed_streams\/[0-9]+/)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ stream: { id: 1, name: "Fixed Stream" } }),
        });
        return;
      }

      // Mock mobile sessions endpoint
      if (url.includes("/mobile/sessions.json")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/mobile-sessions.json"),
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

      // Mock mobile stream by id endpoint
      if (url.match(/\/mobile\/streams\/[0-9]+/)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ stream: { id: 1, name: "Mobile Stream" } }),
        });
        return;
      }

      // Mock rectangle data endpoint
      if (url.includes("/region.json")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ region: {} }),
        });
        return;
      }

      // Mock selected data range of stream endpoint
      if (url.includes("/stream_daily_averages")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ averages: [] }),
        });
        return;
      }

      // Mock thresholds endpoint
      if (url.includes("/thresholds/")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/thresholds.json"),
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

      // Mock usernames autocomplete endpoint
      if (url.includes("/autocomplete/usernames")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ usernames: ["Amy", "Bob"] }),
        });
        return;
      }

      // Mock tags autocomplete endpoint
      if (url.includes("/autocomplete/tags")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ tags: ["Tag1", "Tag2"] }),
        });
        return;
      }

      // Mock sensors endpoint
      if (url.includes("/sensors")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/sensors.json"),
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

      // Mock timelapse data endpoint
      if (url.includes("/timelapse.json")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ timelapse: [] }),
        });
        return;
      }

      // Mock indoor active sessions endpoint
      if (url.includes("/fixed/active/sessions2.json")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/fixed-sessions.json"),
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

      // Mock indoor dormant sessions endpoint
      if (url.includes("/fixed/dormant/sessions.json")) {
        const mockData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "../fixtures/mock-data/fixed-sessions.json"),
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

      // Mock measurements endpoint
      if (url.includes("/measurements")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ measurements: [] }),
        });
        return;
      }

      // Continue with other requests
      await route.continue();
    });
  }

  async clearMocks() {
    // No need to do anything here as the route handlers are automatically cleared
    // when the page context is disposed
  }
}
