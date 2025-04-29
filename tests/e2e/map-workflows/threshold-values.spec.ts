import { test } from "../../fixtures/map-page-fixture";

test.describe("Map Threshold and Measurement Tests", () => {
  test.beforeEach(async ({ mapPage }) => {
    await mapPage.navigateToMap();
  });

  test("should handle threshold value changes", async ({ mapPage }) => {
    await mapPage.setThresholdValue("89");
    await mapPage.resetThresholdValues();
  });

  test("should distribute measurements", async ({ mapPage }) => {
    await mapPage.distributeMeasurements();
    await mapPage.resetThresholdValues();
  });
});
