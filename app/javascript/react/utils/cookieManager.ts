// TypeScript declarations for Google Analytics
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: Record<string, string>
    ) => void;
  }
}

import * as Cookies from "./cookies";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export class CookieManager {
  private static STORAGE_KEY = "cookiePreferences";

  // Load preferences from localStorage
  static loadPreferences(): CookiePreferences {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          necessary: true,
          analytics: parsed.analytics || false,
          marketing: parsed.marketing || false,
          preferences: parsed.preferences || false,
        };
      } catch (error) {
        console.error("Error parsing saved preferences:", error);
      }
    }

    // Default preferences
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
  }

  // Save preferences to localStorage
  static savePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
  }

  // Apply preferences to actual cookies/tracking
  static applyPreferences(preferences: CookiePreferences): void {
    // Apply analytics preferences
    if (preferences.analytics) {
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
      });
    } else {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
    }

    // Apply marketing preferences
    if (preferences.marketing) {
      window.gtag?.("consent", "update", {
        ad_storage: "granted",
      });
    } else {
      window.gtag?.("consent", "update", {
        ad_storage: "denied",
      });
    }

    // Apply preference cookies
    if (preferences.preferences) {
      // Preferences are enabled by default, no action needed
    } else {
      // Clear preference-related cookies and localStorage items
      Cookies.remove("mapBoundsEast");
      Cookies.remove("mapBoundsNorth");
      Cookies.remove("mapBoundsSouth");
      Cookies.remove("mapBoundsWest");
      localStorage.removeItem("sessionsListScrollPosition");
      localStorage.removeItem("lastSelectedMobileTimeRange");
      localStorage.removeItem("lastSelectedTimeRange");
    }
  }

  // Enable all cookies
  static enableAll(): void {
    const allEnabled: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };

    this.savePreferences(allEnabled);
    this.applyPreferences(allEnabled);
  }

  // Disable non-necessary cookies
  static disableNonNecessary(): void {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };

    this.savePreferences(onlyNecessary);
    this.applyPreferences(onlyNecessary);
  }

  // Check if preferences have been set
  static hasPreferences(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // Update a specific preference
  static updatePreference(key: keyof CookiePreferences, value: boolean): void {
    const preferences = this.loadPreferences();
    preferences[key] = value;

    this.savePreferences(preferences);
    this.applyPreferences(preferences);
  }

  // Check if preference cookies are allowed
  static arePreferenceCookiesAllowed(): boolean {
    const preferences = this.loadPreferences();
    return preferences.preferences;
  }
}
