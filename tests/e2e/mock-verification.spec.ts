import { expect, test } from "@playwright/test";
import { test as mapPageTest } from "../fixtures/map-page-fixture";

test.describe("Mock Data Verification", () => {
  mapPageTest(
    "should use mock data for API calls",
    async ({ mapPage, page }) => {
      // Enable request logging
      page.on("request", (request) =>
        console.log(`>> ${request.method()} ${request.url()}`)
      );
      page.on("response", (response) =>
        console.log(`<< ${response.status()} ${response.url()}`)
      );

      // Test mobile sessions endpoint
      await test.step("Verify mobile sessions mock", async () => {
        await mapPage.navigateToMap();

        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/mobile/sessions.json")
        );

        await mapPage.getByRole("button", { name: "mobile" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.sessions).toBeDefined();
        expect(data.sessions[0].title).toBe("Test Mobile Session");
      });

      // Test active fixed sessions endpoint
      await test.step("Verify active fixed sessions mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/fixed/active/sessions2.json")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.sessions).toBeDefined();
        expect(data.sessions[0].title).toBe("Laval - Chomedey");
      });

      // Test dormant fixed sessions endpoint
      await test.step("Verify dormant fixed sessions mock", async () => {
        // First click the fixed button to ensure we're in fixed mode
        await mapPage.getByRole("button", { name: "fixed" }).click();

        // Wait for the active sessions to load first
        await page.waitForResponse((response) =>
          response.url().includes("/fixed/active/sessions2.json")
        );

        // Now wait for the dormant sessions response
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/fixed/dormant/sessions.json")
        );

        // Click the fixed button again to trigger dormant sessions
        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.sessions).toBeDefined();
        expect(data.sessions[0].title).toBe("Laval - Chomedey");
      });

      // Test parameters endpoint
      await test.step("Verify parameters mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/parameters.json")
        );

        await mapPage
          .getByRole("button", { name: "parameter Particulate Matter" })
          .click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.parameters).toBeDefined();
        expect(data.parameters[0].name).toBe("Particulate Matter");
        expect(data.parameters[0].sensors).toHaveLength(2);
      });

      // Test usernames autocomplete endpoint
      await test.step("Verify usernames autocomplete mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/autocomplete/usernames")
        );

        await mapPage.getByRole("combobox", { name: "profile names" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.usernames).toBeDefined();
        expect(data.usernames).toContain("Amy");
        expect(data.usernames).toContain("Bob");
      });

      // Test tags autocomplete endpoint
      await test.step("Verify tags autocomplete mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/autocomplete/tags")
        );

        await mapPage.getByRole("button", { name: "Tags" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.tags).toBeDefined();
        expect(data.tags).toContain("Tag1");
        expect(data.tags).toContain("Tag2");
      });

      // Test sensors endpoint
      await test.step("Verify sensors mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/sensors")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data).toBeDefined();
        expect(data).toHaveLength(5); // We have 5 sensors in our mock
        expect(data[0].name).toBe("AirBeam-PM2.5");
        expect(data[0].unit_symbol).toBe("µg/m³");
      });

      // Test thresholds endpoint
      await test.step("Verify thresholds mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/thresholds/AirBeam-PM2.5")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data).toBeDefined();
        expect(data.unit_symbol).toBe("µg/m³");
        expect(data.threshold_very_low).toBe(0.0);
        expect(data.threshold_low).toBe(12.0);
        expect(data.threshold_medium).toBe(35.0);
        expect(data.threshold_high).toBe(55.0);
        expect(data.threshold_very_high).toBe(150.0);
      });

      // Test stream daily averages endpoint
      await test.step("Verify stream daily averages mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/stream_daily_averages")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.averages).toBeDefined();
        expect(Array.isArray(data.averages)).toBe(true);
      });

      // Test measurements endpoint
      await test.step("Verify measurements mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/measurements")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.measurements).toBeDefined();
        expect(Array.isArray(data.measurements)).toBe(true);
      });

      // Test timelapse data endpoint
      await test.step("Verify timelapse data mock", async () => {
        const responsePromise = page.waitForResponse((response) =>
          response.url().includes("/timelapse.json")
        );

        await mapPage.getByRole("button", { name: "fixed" }).click();
        const response = await responsePromise;

        const data = await response.json();
        expect(data.timelapse).toBeDefined();
        expect(Array.isArray(data.timelapse)).toBe(true);
      });
    }
  );
});
