import { test as base, Page } from "@playwright/test";

export interface TestFixtures {
  page: Page;
}

export const test = base.extend<TestFixtures>({
  page: async ({ page }, use) => {
    // Add any common page setup here
    await use(page);
  },
});

export { expect } from "@playwright/test";
