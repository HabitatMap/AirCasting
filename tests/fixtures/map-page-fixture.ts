import { MapPage } from "../pages/map-page";
import { test as base } from "./base-fixture";

export interface MapPageFixtures {
  mapPage: MapPage;
}

export const test = base.extend<MapPageFixtures>({
  mapPage: async ({ page }, use) => {
    const mapPage = new MapPage(page);
    await use(mapPage);
  },
});
