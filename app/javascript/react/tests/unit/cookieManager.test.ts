import "@testing-library/jest-dom";
import { CookieManager } from "../../utils/cookieManager";

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
jest.mock("../../utils/cookies", () => ({
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
      localStorageMock.getItem.mockReturnValue("{}\n");

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
    it("should send all 4 V2 consent params in a single gtag call", () => {
      const preferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("should deny all params when analytics and marketing are false", () => {
      const preferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });

    it("should grant only analytics when marketing is false", () => {
      const preferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });

    it("should grant ad params when marketing is true", () => {
      const preferences = {
        necessary: true,
        analytics: false,
        marketing: true,
        preferences: false,
      };

      CookieManager.applyPreferences(preferences);

      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("should clear preference cookies when preferences are disabled", () => {
      const { remove } = require("../../utils/cookies");

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
