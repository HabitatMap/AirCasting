import { geocodeCity } from "../../utils/geocodeCity";

jest.mock("../../utils/determineZoomLevel", () => ({
  determineZoomLevel: jest.fn(() => ({ zoom: 11, bounds: undefined })),
}));

const mockGeocode = jest.fn();

beforeEach(() => {
  mockGeocode.mockReset();
  (global as any).google = {
    maps: {
      Geocoder: jest.fn(() => ({ geocode: mockGeocode })),
    },
  };
});

describe("geocodeCity", () => {
  it("returns lat/lng/zoom/resolvedName on success", async () => {
    mockGeocode.mockResolvedValue({
      results: [
        {
          geometry: {
            location: { toJSON: () => ({ lat: 52.52, lng: 13.405 }) },
          },
          formatted_address: "Berlin, Germany",
          types: ["locality"],
          address_components: [],
        },
      ],
    });

    const result = await geocodeCity("Berlin");

    expect(result).toEqual({
      lat: 52.52,
      lng: 13.405,
      zoom: 11,
      bounds: undefined,
      resolvedName: "Berlin, Germany",
    });
  });

  it("returns null when results array empty", async () => {
    mockGeocode.mockResolvedValue({ results: [] });
    const result = await geocodeCity("asdfgh");
    expect(result).toBeNull();
  });

  it("returns null when geocoder throws", async () => {
    mockGeocode.mockRejectedValue(new Error("ZERO_RESULTS"));
    const result = await geocodeCity("nope");
    expect(result).toBeNull();
  });
});
