import { test } from "../../fixtures/map-page-fixture";

test.describe("Map Session Management Tests", () => {
  test.beforeEach(async ({ mapPage }) => {
    await mapPage.navigateToMap();
  });

  test("should copy session link", async ({ mapPage }) => {
    await mapPage.copySessionLink();
  });

  test("should export session", async ({ mapPage }) => {
    await mapPage.exportSession("test@example.com");
  });
});
