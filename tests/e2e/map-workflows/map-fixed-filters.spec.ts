import { expect, test } from "@playwright/test";
import { test as mapPageTest } from "../../fixtures/map-page-fixture";
import fixedSessionData from "../../fixtures/mock-data/fixed-session-data.json";
import parametersData from "../../fixtures/mock-data/parameters.json";
import profilesData from "../../fixtures/mock-data/profiles.json";
import sensorsData from "../../fixtures/mock-data/sensors.json";
import tagsData from "../../fixtures/mock-data/tags.json";
import thresholdsData from "../../fixtures/mock-data/thresholds.json";

test.describe("Map Fixed Filters Workflow", () => {
  mapPageTest(
    "should handle all filter interactions correctly",
    async ({ mapPage, page }) => {
      // Mock all API responses
      await page.route("**/api/profiles", async (route) => {
        console.log("📡 Intercepted profiles API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(profilesData),
        });
      });

      await page.route("**/api/tags", async (route) => {
        console.log("📡 Intercepted tags API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(tagsData),
        });
      });

      await page.route("**/api/sessions", async (route) => {
        console.log("📡 Intercepted sessions API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(fixedSessionData),
        });
      });

      await page.route("**/api/parameters", async (route) => {
        console.log("📡 Intercepted parameters API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(parametersData),
        });
      });

      await page.route("**/api/sensors", async (route) => {
        console.log("📡 Intercepted sensors API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(sensorsData),
        });
      });

      await page.route("**/api/thresholds", async (route) => {
        console.log("📡 Intercepted thresholds API call");
        await route.fulfill({
          status: 200,
          body: JSON.stringify(thresholdsData),
        });
      });

      await test.step("Navigate to map and wait for load", async () => {
        await mapPage.navigateToMap();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Switch to fixed view", async () => {
        await mapPage.getByRole("button", { name: "fixed" }).click();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Select Particulate Matter parameter", async () => {
        await mapPage
          .getByRole("button", { name: "parameter Particulate Matter" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "Particulate Matter", exact: true })
          .click();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Toggle dormant stations", async () => {
        const dormantCheckbox = mapPage
          .locator("div")
          .filter({
            hasText:
              /^mobilefixedparameterParticulate MattersensorGovernment-PM2\.5dormant stations off$/,
          })
          .getByLabel("");

        // Wait for checkbox to be visible and stable
        await dormantCheckbox.waitFor({ state: "visible", timeout: 10000 });

        // Check current state and toggle if needed
        const isChecked = await dormantCheckbox.isChecked();
        if (!isChecked) {
          await dormantCheckbox.check();
        }

        await mapPage.waitForLoadState("networkidle");
      });

      await test.step(
        "Navigate to fixed session view with inactive stations",
        async () => {
          await mapPage.goto(
            `http://localhost:3000/?thresholdMin=${fixedSessionData.stream.min}&thresholdLow=${fixedSessionData.stream.low}&thresholdMiddle=${fixedSessionData.stream.middle}&thresholdHigh=${fixedSessionData.stream.high}&thresholdMax=${fixedSessionData.stream.max}&sessionType=${fixedSessionData.session.type}&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=false&timeFrom=1735689600&timeTo=1767225599`
          );
          await mapPage.waitForLoadState("networkidle");
        }
      );

      await test.step("Toggle dormant stations back on", async () => {
        const dormantCheckbox = mapPage
          .locator("div")
          .filter({ hasText: /^dormant stations on$/ })
          .getByLabel("");

        // Wait for checkbox to be visible and stable
        await dormantCheckbox.waitFor({ state: "visible", timeout: 10000 });

        // Check current state and toggle if needed
        const isChecked = await dormantCheckbox.isChecked();
        if (isChecked) {
          await dormantCheckbox.uncheck();
        }

        await mapPage.waitForLoadState("networkidle");
      });

      await test.step(
        "Navigate to fixed session view with active stations",
        async () => {
          await mapPage.goto(
            `http://localhost:3000/?thresholdMin=${fixedSessionData.stream.min}&thresholdLow=${fixedSessionData.stream.low}&thresholdMiddle=${fixedSessionData.stream.middle}&thresholdHigh=${fixedSessionData.stream.high}&thresholdMax=${fixedSessionData.stream.max}&sessionType=${fixedSessionData.session.type}&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599`
          );
          await mapPage.waitForLoadState("networkidle");
        }
      );

      await test.step("Switch sensor type", async () => {
        await mapPage
          .getByRole("button", { name: "sensor Government-PM2.5" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("button", { name: "AirBeam-PM2.5" }).click();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Select profile and tag", async () => {
        // Select username from mock data
        const profileCombobox = mapPage.getByRole("combobox", {
          name: "profile names",
        });
        await profileCombobox.waitFor({ state: "visible" });
        await profileCombobox.click();

        // Use mock profile data
        const profileOption = mapPage.getByRole("option", {
          name: profilesData.profiles[0].username, // "Amy" from our mock data
        });
        await profileOption.waitFor({ state: "visible" });
        await profileOption.click();

        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Switch to indoor view", async () => {
        await mapPage.getByRole("button", { name: "indoor" }).click();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Toggle filters", async () => {
        await mapPage
          .locator("#react-app div")
          .filter({
            hasText:
              "FiltersTimelapseCopy linkmobilefixedparameterParticulate MattersensorAirBeam-",
          })
          .getByLabel("")
          .check();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Navigate to indoor fixed session view", async () => {
        await mapPage.goto(
          `http://localhost:3000/?thresholdMin=${fixedSessionData.stream.min}&thresholdLow=${fixedSessionData.stream.low}&thresholdMiddle=${fixedSessionData.stream.middle}&thresholdHigh=${fixedSessionData.stream.high}&thresholdMax=${fixedSessionData.stream.max}&sessionType=${fixedSessionData.session.type}&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=DGL53AirBeam&tags=&isIndoor=true&isActive=false&timeFrom=1735689600&timeTo=1767225599`
        );
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Navigate through years", async () => {
        await mapPage.getByRole("button", { name: "filters.nextYear" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("button", { name: "filters.nextYear" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("button", { name: "2020" }).click();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step(
        "Switch to outdoor view and toggle dormant stations",
        async () => {
          await mapPage.getByRole("button", { name: "outdoor" }).click();
          await mapPage.waitForLoadState("networkidle");

          await mapPage
            .locator("div")
            .filter({ hasText: /^dormant stations on$/ })
            .getByLabel("")
            .uncheck();
          await mapPage.waitForLoadState("networkidle");
        }
      );

      await test.step("Navigate to outdoor fixed session view", async () => {
        await mapPage.goto(
          `http://localhost:3000/?thresholdMin=${fixedSessionData.stream.min}&thresholdLow=${fixedSessionData.stream.low}&thresholdMiddle=${fixedSessionData.stream.middle}&thresholdHigh=${fixedSessionData.stream.high}&thresholdMax=${fixedSessionData.stream.max}&sessionType=${fixedSessionData.session.type}&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=DGL53AirBeam&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599`
        );
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Switch between different parameters", async () => {
        await mapPage
          .getByRole("button", { name: "parameter Particulate Matter" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("button", { name: "Humidity" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "parameter Humidity" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("button", { name: "Nitrogen Dioxide" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "parameter Nitrogen Dioxide" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "Temperature", exact: true })
          .click();

        await mapPage.waitForTimeout(1000);

        const temperatureParameterButton = mapPage.getByRole("button", {
          name: "parameter Temperature",
        });
        await expect(temperatureParameterButton).toBeVisible({
          timeout: 15000,
        });

        await temperatureParameterButton.click();
        await mapPage.waitForLoadState("networkidle");

        const humidityOption = mapPage.getByRole("button", {
          name: "Humidity",
          exact: true,
        });
        await expect(humidityOption).toBeVisible({ timeout: 5000 });
        await humidityOption.click();
        await mapPage.waitForLoadState("networkidle");
      });
    }
  );

  mapPageTest(
    "should handle profile and tag selection with close button",
    async ({ mapPage, page }) => {
      // Mock API responses for profiles and tags
      await page.route("**/api/profiles", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(profilesData),
        });
      });

      await page.route("**/api/tags", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(tagsData),
        });
      });

      await test.step("Navigate to map and wait for load", async () => {
        await mapPage.goto(
          `http://localhost:3000/map?session_type=fixed&is_indoor=false&is_active=true&sensor_name=AirBeam-PM2.5&measurement_type=Particulate Matter&unit_symbol=µg/m³&threshold_min=0&threshold_low=12&threshold_middle=35&threshold_high=55&threshold_max=150&time_from=2024-03-20T10:00:00Z&time_to=2024-03-20T11:00:00Z&north=45.5472&south=45.5472&east=-73.7472&west=-73.7472&usernames=&tags=`
        );
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step("Select profile and verify close button", async () => {
        // Select username
        const profileCombobox = mapPage.getByRole("combobox", {
          name: "profile names",
        });
        await profileCombobox.waitFor({ state: "visible" });
        await profileCombobox.click();

        // Use first profile from mock data
        const profileOption = mapPage.getByRole("option", {
          name: profilesData.profiles[0].username,
        });
        await profileOption.waitFor({ state: "visible" });
        await profileOption.click();

        await mapPage.waitForLoadState("networkidle");

        // Verify close button appears
        const closeButton = mapPage.getByTestId("close-selected-item-button");
        await closeButton.waitFor({ state: "visible" });

        // Click close button
        await closeButton.click();

        // Verify profile is removed
        await expect(closeButton).not.toBeVisible();
      });

      await test.step("Select tag and verify close button", async () => {
        // Select tag
        const tagCombobox = mapPage.getByRole("combobox", { name: "tags" });
        await tagCombobox.waitFor({ state: "visible" });
        await tagCombobox.click();

        // Use first tag from mock data
        const tagOption = mapPage.getByRole("option", {
          name: tagsData.tags[0],
        });
        await tagOption.waitFor({ state: "visible" });
        await tagOption.click();

        // Verify close button appears
        const closeButton = mapPage.getByTestId("close-selected-item-button");
        await closeButton.waitFor({ state: "visible" });

        // Click close button
        await closeButton.click();

        // Verify tag is removed
        await expect(closeButton).not.toBeVisible();
      });
    }
  );
});
