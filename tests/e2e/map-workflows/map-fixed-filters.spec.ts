import { test } from "@playwright/test";
import { test as mapPageTest } from "../../fixtures/map-page-fixture";

test.describe("Map Fixed Filters Workflow", () => {
  mapPageTest(
    "should handle all filter interactions correctly",
    async ({ mapPage }) => {
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
        await mapPage
          .locator("div")
          .filter({
            hasText:
              /^mobilefixedparameterParticulate MattersensorGovernment-PM2\.5dormant stations off$/,
          })
          .getByLabel("")
          .check();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step(
        "Navigate to fixed session view with inactive stations",
        async () => {
          await mapPage.goto(
            "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=fixed&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=false&timeFrom=1735689600&timeTo=1767225599"
          );
          await mapPage.waitForLoadState("networkidle");
        }
      );

      await test.step("Toggle dormant stations back on", async () => {
        await mapPage
          .locator("div")
          .filter({ hasText: /^dormant stations on$/ })
          .getByLabel("")
          .uncheck();
        await mapPage.waitForLoadState("networkidle");
      });

      await test.step(
        "Navigate to fixed session view with active stations",
        async () => {
          await mapPage.goto(
            "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=fixed&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599"
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
        await mapPage.getByRole("combobox", { name: "profile names" }).click();
        await mapPage.getByRole("option", { name: "Amy" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByTestId("close-selected-item-button").click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage.getByRole("combobox", { name: "tags" }).click();
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
          "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=fixed&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=true&isActive=false&timeFrom=1735689600&timeTo=1767225599"
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
          "http://localhost:3000/?thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=fixed&previousUserSettings=MAP_VIEW&currentUserSettings=MAP_VIEW&sessionId=&streamId=&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&usernames=&tags=&isIndoor=false&isActive=true&timeFrom=1735689600&timeTo=1767225599"
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

        await mapPage.getByRole("button", { name: "Temperature" }).click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "parameter Temperature" })
          .waitFor({ state: "visible" });
        await mapPage
          .getByRole("button", { name: "parameter Temperature" })
          .waitFor({ state: "attached" });
        await mapPage
          .getByRole("button", { name: "parameter Temperature" })
          .click();
        await mapPage.waitForLoadState("networkidle");

        await mapPage
          .getByRole("button", { name: "Humidity" })
          .waitFor({ state: "visible" });
        await mapPage
          .getByRole("button", { name: "Humidity" })
          .waitFor({ state: "attached" });
        await mapPage.getByRole("button", { name: "Humidity" }).click();
        await mapPage.waitForLoadState("networkidle");
      });
    }
  );
});
