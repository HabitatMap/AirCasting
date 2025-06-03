import { test as base, Request, Route } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import fixedSessionData from "./mock-data/fixed-sessions.json";
import timelapseSessionData from "./mock-data/timelapse-sessions.json";

type TimelapsePageFixtures = {
  page: any;
};

export const test = base.extend<TimelapsePageFixtures>({
  page: async ({ page }, use) => {
    const mockUtils = new MockUtils(page);
    await mockUtils.setupMocks();

    // Catch-all logger for all requests
    await page.route("**/*", async (route: Route, request: Request) => {
      console.log("ALL REQUESTS:", request.url());
      route.continue();
    });

    // Mock fixed sessions endpoint
    await page.route(
      "**/fixed/active/sessions2.json*",
      async (route: Route, request: Request) => {
        console.log("Mocking /fixed/active/sessions2.json:", request.url());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            fetchableSessionsCount: 1,
            sessions: fixedSessionData.sessions,
          }),
        });
      }
    );

    // Mock timelapse data endpoint (return only the timelapse object)
    await page.route(
      "**/api/v3/timelapse.json*",
      async (route: Route, request: Request) => {
        console.log("Mocking /api/v3/timelapse.json:", request.url());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(timelapseSessionData.timelapse),
        });
      }
    );

    // Mock thresholds endpoint
    await page.route(
      "**/api/thresholds/*",
      async (route: Route, request: Request) => {
        console.log("Mocking /api/thresholds/*:", request.url());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(["0", "9", "35", "55", "150"]),
        });
      }
    );

    await use(page);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
