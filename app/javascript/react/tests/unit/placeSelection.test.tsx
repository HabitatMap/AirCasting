import "@testing-library/jest-dom";

import { geocodeResultFromFetchedPlace } from "../../utils/placeSelection";

describe("geocodeResultFromFetchedPlace", () => {
  it("maps fetched place fields to GeocodeResult (locality → zoom 11)", () => {
    const result = geocodeResultFromFetchedPlace(
      {
        formattedAddress: "Berlin, Germany",
        location: { lat: 52.52, lng: 13.405 },
        viewport: undefined,
        types: ["locality"],
        addressComponents: [],
      },
      "Berlin"
    );

    expect(result).toMatchObject({
      lat: 52.52,
      lng: 13.405,
      resolvedName: "Berlin, Germany",
      zoom: 11,
    });
  });

  it("returns null when location is missing", () => {
    expect(
      geocodeResultFromFetchedPlace(
        { formattedAddress: "X", types: ["locality"] },
        "X"
      )
    ).toBeNull();
  });

  it("returns null when latitude or longitude is not finite", () => {
    expect(
      geocodeResultFromFetchedPlace(
        {
          formattedAddress: "Bad",
          location: { lat: NaN, lng: 13.405 },
          types: ["locality"],
        },
        "Bad"
      )
    ).toBeNull();
  });
});
