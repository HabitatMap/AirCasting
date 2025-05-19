import { test as base } from "@playwright/test";
import { MockUtils } from "../helpers/mock-utils";
import { MapPage } from "../pages/map-page";

type MapPageFixtures = {
  mapPage: MapPage;
};

export const test = base.extend<MapPageFixtures>({
  mapPage: async ({ page }, use) => {
    const mockUtils = new MockUtils(page);
    await mockUtils.setupMocks();

    const mapPage = new MapPage(page);
    await use(mapPage);

    await mockUtils.clearMocks();
  },
});

export { expect } from "@playwright/test";
