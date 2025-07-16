import { CookieManager } from "./cookieManager";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock Cookies utility
jest.mock("./cookies", () => ({
  remove: jest.fn(),
}));

// Mock gtag
Object.defineProperty(window, "gtag", {
  value: jest.fn(),
  writable: true,
});

describe("CookieManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("loadPreferences", () => {
    it("should return default preferences when no saved preferences exist", () => {
      const preferences = CookieManager.loadPreferences();

      expect(preferences).toEqual({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      });
    });

    it("should load saved preferences from localStorage", () => {
      const savedPreferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(savedPreferences)
      );

      const preferences = CookieManager.loadPreferences();

      expect(preferences).toEqual(savedPreferences);
    });
  });

  describe("hasPreferences", () => {
    it("should return false when no preferences are saved", () => {
      expect(CookieManager.hasPreferences()).toBe(false);
    });

    it("should return true when preferences are saved", () => {
      localStorageMock.getItem.mockReturnValue("{}");

      expect(CookieManager.hasPreferences()).toBe(true);
    });
  });

  describe("arePreferenceCookiesAllowed", () => {
    it("should return false when preferences are disabled", () => {
      const savedPreferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(savedPreferences)
      );

      expect(CookieManager.arePreferenceCookiesAllowed()).toBe(false);
    });

    it("should return true when preferences are enabled", () => {
      const savedPreferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: true,
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(savedPreferences)
      );

      expect(CookieManager.arePreferenceCookiesAllowed()).toBe(true);
    });
  });

  describe("applyPreferences", () => {
    it("should enable analytics when analytics is true", () => {
      const preferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
      });
    });

    it("should disable analytics when analytics is false", () => {
      const preferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
      });
    });

    it("should clear preference cookies when preferences are disabled", () => {
      const { remove } = require("./cookies");

      const preferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(remove).toHaveBeenCalledWith("mapBoundsEast");
      expect(remove).toHaveBeenCalledWith("mapBoundsNorth");
      expect(remove).toHaveBeenCalledWith("mapBoundsSouth");
      expect(remove).toHaveBeenCalledWith("mapBoundsWest");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "sessionsListScrollPosition"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "lastSelectedMobileTimeRange"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "lastSelectedTimeRange"
      );
    });
  });
});
