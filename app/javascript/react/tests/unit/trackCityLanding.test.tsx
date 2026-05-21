import { trackCityLanding } from "../../utils/trackCityLanding";

describe("trackCityLanding", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("pushes city_param_landing event with full payload", () => {
    trackCityLanding({
      cityRaw: "Berlin",
      cityResolved: "Berlin, Germany",
      resolutionStatus: "success",
      sessionType: "fixed",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "city_param_landing",
        city_raw: "Berlin",
        city_resolved: "Berlin, Germany",
        resolution_status: "success",
        session_type: "fixed",
      },
    ]);
  });

  it("initializes dataLayer if undefined", () => {
    delete (window as any).dataLayer;

    trackCityLanding({
      cityRaw: "x",
      cityResolved: null,
      resolutionStatus: "fallback_default",
      sessionType: "fixed",
    });

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
  });

  it("supports fallback_geo status with null resolved", () => {
    trackCityLanding({
      cityRaw: "asdfgh",
      cityResolved: null,
      resolutionStatus: "fallback_geo",
      sessionType: "mobile",
    });

    expect(window.dataLayer![0]).toMatchObject({
      city_resolved: null,
      resolution_status: "fallback_geo",
      session_type: "mobile",
    });
  });
});
