import { trackCityEvent } from "../../utils/trackCityEvent";

describe("trackCityEvent", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("pushes city_view event with ad_landing source and full payload", () => {
    trackCityEvent({
      city: "Berlin",
      cityRaw: "Berlin",
      source: "ad_landing",
      resolutionStatus: "success",
      lat: 52.52,
      lng: 13.405,
      sessionType: "fixed",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "city_view",
        city: "Berlin",
        city_raw: "Berlin",
        source: "ad_landing",
        resolution_status: "success",
        lat: 52.52,
        lng: 13.405,
        place_id: undefined,
        session_type: "fixed",
      },
    ]);
  });

  it("pushes city_view with ad_landing_fallback source and fallback_geo status", () => {
    trackCityEvent({
      city: "asdfgh",
      cityRaw: "asdfgh",
      source: "ad_landing_fallback",
      resolutionStatus: "fallback_geo",
      sessionType: "mobile",
    });

    expect(window.dataLayer![0]).toMatchObject({
      event: "city_view",
      source: "ad_landing_fallback",
      resolution_status: "fallback_geo",
      session_type: "mobile",
      lat: undefined,
      lng: undefined,
    });
  });

  it("pushes city_view with autocomplete source", () => {
    trackCityEvent({
      city: "Warsaw",
      cityRaw: "Warsaw, Poland",
      source: "autocomplete",
      lat: 52.2297,
      lng: 21.0122,
      placeId: "ChIJ123",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "city_view",
        city: "Warsaw",
        city_raw: "Warsaw, Poland",
        source: "autocomplete",
        resolution_status: undefined,
        lat: 52.2297,
        lng: 21.0122,
        place_id: "ChIJ123",
        session_type: undefined,
      },
    ]);
  });

  it("pushes city_view with recent source", () => {
    trackCityEvent({
      city: "Berlin",
      cityRaw: "Berlin, Germany",
      source: "recent",
      lat: 52.52,
      lng: 13.405,
      placeId: "ChIJ456",
    });

    expect(window.dataLayer![0]).toMatchObject({
      event: "city_view",
      source: "recent",
      city: "Berlin",
      city_raw: "Berlin, Germany",
    });
  });

  it("initializes dataLayer if undefined", () => {
    delete (window as any).dataLayer;

    trackCityEvent({
      city: "Paris",
      source: "autocomplete",
      lat: 48.8566,
      lng: 2.3522,
    });

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
  });

  it("omits place_id when not provided", () => {
    trackCityEvent({
      city: "Madrid",
      source: "autocomplete",
      lat: 40.4168,
      lng: -3.7038,
    });

    expect(window.dataLayer![0]).toMatchObject({
      event: "city_view",
      city: "Madrid",
      place_id: undefined,
    });
  });
});
