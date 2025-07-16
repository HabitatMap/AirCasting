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

    return {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
  }

  static savePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
  }

  static applyPreferences(preferences: CookiePreferences): void {
    if (preferences.analytics) {
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
      });
    } else {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
      this.clearAnalyticsCookies();
    }

    if (preferences.marketing) {
      window.gtag?.("consent", "update", {
        ad_storage: "granted",
      });
    } else {
      window.gtag?.("consent", "update", {
        ad_storage: "denied",
      });
      this.clearMarketingCookies();
    }

    if (preferences.preferences) {
    } else {
      Cookies.remove("mapBoundsEast");
      Cookies.remove("mapBoundsNorth");
      Cookies.remove("mapBoundsSouth");
      Cookies.remove("mapBoundsWest");
      localStorage.removeItem("sessionsListScrollPosition");
      localStorage.removeItem("lastSelectedMobileTimeRange");
      localStorage.removeItem("lastSelectedTimeRange");
    }

    this.dispatchConsentChangeEvent();
  }

  private static clearAnalyticsCookies(): void {
    const domains = ["", ".aircasting.org", ".google.com", ".google.pl"];
    const analyticsCookies = [
      "_ga",
      "_gid",
      "_gat",
      "_ga_P2QSTCN3VQ",
      "_ga_0DS6PXGHQF",
    ];

    domains.forEach((domain) => {
      analyticsCookies.forEach((cookieName) => {
        if (domain === "") {
          Cookies.remove(cookieName);
        } else {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
        }
      });
    });

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("_ga") || key.startsWith("ga_")) {
        localStorage.removeItem(key);
      }
    });
  }

  private static clearMarketingCookies(): void {
    const domains = ["", ".aircasting.org", ".google.com", ".google.pl"];
    const marketingCookies = [
      "_gcl_au",
      "AEC",
      "APISID",
      "__Secure-1PAPISID",
      "__Secure-1PSID",
      "__Secure-3PAPISID",
      "__Secure-3PSID",
      "__Secure-ENID",
    ];

    domains.forEach((domain) => {
      marketingCookies.forEach((cookieName) => {
        if (domain === "") {
          Cookies.remove(cookieName);
        } else {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
        }
      });
    });

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("_gcl") || key.startsWith("ads_")) {
        localStorage.removeItem(key);
      }
    });
  }

  private static dispatchConsentChangeEvent(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cookieConsentChanged"));
    }
  }

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

  static hasPreferences(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  static updatePreference(key: keyof CookiePreferences, value: boolean): void {
    const preferences = this.loadPreferences();
    preferences[key] = value;

    this.savePreferences(preferences);
    this.applyPreferences(preferences);
  }

  static arePreferenceCookiesAllowed(): boolean {
    const preferences = this.loadPreferences();
    return preferences.preferences;
  }
}
