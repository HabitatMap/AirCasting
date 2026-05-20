import { trackSearchCityName } from "../../utils/trackSearchCityName";

describe("trackSearchCityName", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("pushes search_city_name event with autocomplete source", () => {
    trackSearchCityName({
      query: "Warsaw",
      placeId: "ChIJ123",
      lat: 52.2297,
      lng: 21.0122,
      source: "autocomplete",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "search_city_name",
        query: "Warsaw",
        place_id: "ChIJ123",
        lat: 52.2297,
        lng: 21.0122,
        source: "autocomplete",
      },
    ]);
  });

  it("pushes search_city_name event with recent source", () => {
    trackSearchCityName({
      query: "Berlin",
      placeId: "ChIJ456",
      lat: 52.52,
      lng: 13.405,
      source: "recent",
    });

    expect(window.dataLayer![0]).toMatchObject({
      event: "search_city_name",
      source: "recent",
      query: "Berlin",
    });
  });

  it("initializes dataLayer if undefined", () => {
    delete (window as any).dataLayer;

    trackSearchCityName({
      query: "Paris",
      lat: 48.8566,
      lng: 2.3522,
      source: "autocomplete",
    });

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
  });

  it("omits place_id when not provided", () => {
    trackSearchCityName({
      query: "Madrid",
      lat: 40.4168,
      lng: -3.7038,
      source: "autocomplete",
    });

    expect(window.dataLayer![0]).toMatchObject({
      event: "search_city_name",
      query: "Madrid",
      place_id: undefined,
    });
  });
});
