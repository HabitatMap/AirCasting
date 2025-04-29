import { test } from "../../fixtures/map-page-fixture";

test.describe("Map Time Range Tests", () => {
  test.beforeEach(async ({ mapPage }) => {
    await mapPage.navigateToMap();
  });

  test("should handle time range changes", async ({ mapPage }) => {
    await mapPage.clickTimeRangeButton("WEEK");
    await mapPage.clickTimeRangeButton("MONTH");
  });
});
