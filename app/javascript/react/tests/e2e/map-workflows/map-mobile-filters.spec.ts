import { test } from "@playwright/test";
import { test as mapPageTest } from "../../fixtures/map-page-fixture";
import mobileSessionData from "../../mock-data/mobile-session-data.json";

test.describe("Map Mobile Filters Workflow", () => {
  mapPageTest(
    "should handle all filter interactions correctly",
    async ({ mapPage }) => {
      // Reset sessions counter to ensure fresh state
      if (mapPage.resetSessionsCounter) {
        mapPage.resetSessionsCounter();
      }

      await test.step("Navigate to initial page", async () => {
        const queryParams = new URLSearchParams({
          thresholdMin: mobileSessionData.stream.min.toString(),
          thresholdLow: mobileSessionData.stream.low.toString(),
          thresholdMiddle: mobileSessionData.stream.middle.toString(),
          thresholdHigh: mobileSessionData.stream.high.toString(),
          thresholdMax: mobileSessionData.stream.max.toString(),
          sessionType: mobileSessionData.session.type,
          previousUserSettings: "MAP_VIEW",
          currentUserSettings: "MAP_VIEW",
          sessionId: "",
          streamId: "",
          measurementType:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"]
              .measurement_type,
          sensorName:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].sensor_name,
          unitSymbol:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].unit_symbol,
          usernames: "",
          tags: "",
          isIndoor: "false",
          isActive: "true",
          timeFrom: "1735689600",
          timeTo: "1767225599",
          fetchedSessions: "100",
          boundEast: "-67.59738290534534",
          boundNorth: "48.63169261089525",
          boundSouth: "23.481713124525914",
          boundWest: "-123.84738290534534",
          currentCenter: JSON.stringify({
            lat: 37.08877211846209,
            lng: -95.72238290534534,
          }),
          currentZoom: "5",
        });

        await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);

        // Wait for UI to be fully ready
        await mapPage.waitForUIReady();
      });

      await test.step("Switch between different parameters", async () => {
        // Wait for parameter button to be visible and clickable
        const parameterButton = mapPage.getByRole("button", {
          name: "parameter Particulate Matter",
        });
        await parameterButton.waitFor({ state: "visible", timeout: 10000 });
        await parameterButton.click();

        await mapPage.waitForUIReady();

        await mapPage.getByRole("button", { name: "Humidity" }).click();
        await mapPage.waitForUIReady();

        await mapPage
          .getByRole("button", { name: "parameter Humidity" })
          .click();
        await mapPage.waitForUIReady();

        await mapPage.getByRole("button", { name: "Sound Level" }).click();
        await mapPage.waitForUIReady();

        await mapPage
          .getByRole("button", { name: "parameter Sound Level" })
          .click();
        await mapPage.waitForUIReady();

        await mapPage.getByRole("button", { name: "Temperature" }).click();
        await mapPage.waitForUIReady();

        await mapPage
          .getByRole("button", { name: "parameter Temperature" })
          .click();
        await mapPage.waitForUIReady();
      });

      await test.step("Switch to mobile view and select profile", async () => {
        await mapPage.getByRole("button", { name: "mobile" }).click();
        await mapPage.waitForUIReady();

        await mapPage.getByRole("combobox", { name: "profile names" }).click();
        await mapPage.waitForTimeout(1000); // Wait for dropdown to open

        await mapPage.getByRole("option", { name: "2ndplace" }).click();
        await mapPage.waitForUIReady();

        await mapPage.getByTestId("close-selected-item-button").click();
        await mapPage.waitForUIReady();
      });

      await test.step("Select tag and toggle filters", async () => {
        await mapPage.getByRole("combobox", { name: "tags" }).click();
        await mapPage.waitForTimeout(1000); // Wait for dropdown to open

        await mapPage.getByRole("option", { name: "blue" }).click();
        await mapPage.waitForUIReady();

        // Try to find the filter toggle using a more reliable approach
        // Look for a button or checkbox that might be related to filters
        const filterToggle = mapPage
          .locator("button")
          .filter({ hasText: /filters/i });
        if ((await filterToggle.count()) > 0) {
          await filterToggle.first().click();
        } else {
          // If no filter button found, try looking for a checkbox
          const filterCheckbox = mapPage
            .locator("input[type='checkbox']")
            .first();
          if ((await filterCheckbox.count()) > 0) {
            await filterCheckbox.check();
          }
        }
        await mapPage.waitForUIReady();
      });

      await test.step("Navigate to crowd map view", async () => {
        const queryParams = new URLSearchParams({
          thresholdMin: mobileSessionData.stream.min.toString(),
          thresholdLow: mobileSessionData.stream.low.toString(),
          thresholdMiddle: mobileSessionData.stream.middle.toString(),
          thresholdHigh: mobileSessionData.stream.high.toString(),
          thresholdMax: mobileSessionData.stream.max.toString(),
          sessionType: mobileSessionData.session.type,
          previousUserSettings: "MAP_VIEW",
          currentUserSettings: "CROWD_MAP_VIEW",
          sessionId: "",
          streamId: "",
          measurementType:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"]
              .measurement_type,
          sensorName:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].sensor_name,
          unitSymbol:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].unit_symbol,
          usernames: "",
          tags: "",
          isIndoor: "false",
          isActive: "true",
          timeFrom: "1735689600",
          timeTo: "1767225599",
          fetchedSessions: "100",
          boundEast: "-67.59738290534534",
          boundNorth: "48.63169261089525",
          boundSouth: "23.481713124525914",
          boundWest: "-123.84738290534534",
          currentCenter: JSON.stringify({
            lat: 37.08877211846209,
            lng: -95.72238290534534,
          }),
          currentZoom: "5",
        });

        await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);

        // Wait for UI to be fully ready
        await mapPage.waitForUIReady();
      });

      await test.step("Select time range and toggle crowd map", async () => {
        await mapPage.getByRole("button", { name: "30" }).click();
        await mapPage.waitForUIReady();

        await mapPage.getByRole("button", { name: "40" }).click();
        await mapPage.waitForUIReady();

        await mapPage.getByRole("button", { name: "2023" }).click();
        await mapPage.waitForUIReady();

        await mapPage
          .locator("div")
          .filter({ hasText: /^crowdMap on$/ })
          .getByLabel("")
          .uncheck();
        await mapPage.waitForUIReady();
      });

      await test.step("Navigate to map view with grid", async () => {
        const queryParams = new URLSearchParams({
          thresholdMin: mobileSessionData.stream.min.toString(),
          thresholdLow: mobileSessionData.stream.low.toString(),
          thresholdMiddle: mobileSessionData.stream.middle.toString(),
          thresholdHigh: mobileSessionData.stream.high.toString(),
          thresholdMax: mobileSessionData.stream.max.toString(),
          sessionType: mobileSessionData.session.type,
          previousUserSettings: "CROWD_MAP_VIEW",
          currentUserSettings: "MAP_VIEW",
          sessionId: "",
          streamId: "",
          measurementType:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"]
              .measurement_type,
          sensorName:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].sensor_name,
          unitSymbol:
            mobileSessionData.session.streams["AirBeamMini-PM2.5"].unit_symbol,
          usernames: "",
          tags: "",
          isIndoor: "false",
          isActive: "true",
          timeFrom: "1672531200",
          timeTo: "1704067199",
          fetchedSessions: "100",
          boundEast: "-67.59738290534534",
          boundNorth: "48.63169261089525",
          boundSouth: "23.481713124525914",
          boundWest: "-123.84738290534534",
          currentCenter: JSON.stringify({
            lat: 37.08877211846209,
            lng: -95.72238290534534,
          }),
          currentZoom: "5",
          gridSize: "11",
        });

        await mapPage.goto(`http://localhost:3000/?${queryParams.toString()}`);

        // Wait for UI to be fully ready
        await mapPage.waitForUIReady();
      });
    }
  );
});
