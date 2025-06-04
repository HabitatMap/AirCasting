import { expect, test } from "../../fixtures/map-page-fixture";
import fixedSessionData from "../../mock-data/fixed-session-data.json";
import profilesData from "../../mock-data/profiles.json";

test.describe("Map Fixed Filters Workflow", () => {
  test("should handle all filter interactions correctly", async ({
    mapPage,
    page,
  }) => {
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
      const dormantCheckbox = page.getByRole("checkbox").first();

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
        const queryParams = new URLSearchParams({
          thresholdMin: fixedSessionData.stream.min.toString(),
          thresholdLow: fixedSessionData.stream.low.toString(),
          thresholdMiddle: fixedSessionData.stream.middle.toString(),
          thresholdHigh: fixedSessionData.stream.high.toString(),
          thresholdMax: fixedSessionData.stream.max.toString(),
          sessionType: fixedSessionData.session.type,
          previousUserSettings: "MAP_VIEW",
          currentUserSettings: "MAP_VIEW",
          sessionId: "",
          streamId: "",
          measurementType: "Particulate Matter",
          sensorName: "Government-PM2.5",
          unitSymbol: "µg/m³",
          usernames: "",
          tags: "",
          isIndoor: "false",
          isActive: "false",
          timeFrom: "1735689600",
          timeTo: "1767225599",
        });

        await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);
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
        const queryParams = new URLSearchParams({
          thresholdMin: fixedSessionData.stream.min.toString(),
          thresholdLow: fixedSessionData.stream.low.toString(),
          thresholdMiddle: fixedSessionData.stream.middle.toString(),
          thresholdHigh: fixedSessionData.stream.high.toString(),
          thresholdMax: fixedSessionData.stream.max.toString(),
          sessionType: fixedSessionData.session.type,
          previousUserSettings: "MAP_VIEW",
          currentUserSettings: "MAP_VIEW",
          sessionId: "",
          streamId: "",
          measurementType: "Particulate Matter",
          sensorName: "Government-PM2.5",
          unitSymbol: "µg/m³",
          usernames: "",
          tags: "",
          isIndoor: "false",
          isActive: "true",
          timeFrom: "1735689600",
          timeTo: "1767225599",
        });

        await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);
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
        name: profilesData.profiles[0].username,
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
      const queryParams = new URLSearchParams({
        thresholdMin: fixedSessionData.stream.min.toString(),
        thresholdLow: fixedSessionData.stream.low.toString(),
        thresholdMiddle: fixedSessionData.stream.middle.toString(),
        thresholdHigh: fixedSessionData.stream.high.toString(),
        thresholdMax: fixedSessionData.stream.max.toString(),
        sessionType: fixedSessionData.session.type,
        previousUserSettings: "MAP_VIEW",
        currentUserSettings: "MAP_VIEW",
        sessionId: "",
        streamId: "",
        measurementType: "Particulate Matter",
        sensorName: "AirBeam-PM2.5",
        unitSymbol: "µg/m³",
        usernames: "",
        tags: "",
        isIndoor: "true",
        isActive: "false",
        timeFrom: "1735689600",
        timeTo: "1767225599",
      });

      await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);
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
      const queryParams = new URLSearchParams({
        thresholdMin: fixedSessionData.stream.min.toString(),
        thresholdLow: fixedSessionData.stream.low.toString(),
        thresholdMiddle: fixedSessionData.stream.middle.toString(),
        thresholdHigh: fixedSessionData.stream.high.toString(),
        thresholdMax: fixedSessionData.stream.max.toString(),
        sessionType: fixedSessionData.session.type,
        previousUserSettings: "MAP_VIEW",
        currentUserSettings: "MAP_VIEW",
        sessionId: "",
        streamId: "",
        measurementType: "Particulate Matter",
        sensorName: "AirBeam-PM2.5",
        unitSymbol: "µg/m³",
        usernames: "DGL53AirBeam",
        tags: "",
        isIndoor: "false",
        isActive: "true",
        timeFrom: "1735689600",
        timeTo: "1767225599",
      });

      await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);
      await mapPage.waitForLoadState("networkidle");
    });

    await test.step("Switch between different parameters", async () => {
      await mapPage
        .getByRole("button", { name: "parameter Particulate Matter" })
        .click();
      await mapPage.waitForLoadState("networkidle");

      await mapPage.getByRole("button", { name: "Humidity" }).click();
      await mapPage.waitForLoadState("networkidle");

      await mapPage.getByRole("button", { name: "parameter Humidity" }).click();
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
  });
});
