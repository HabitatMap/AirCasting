import { determineZoomLevel } from "./determineZoomLevel";

export interface GeocodeResult {
  lat: number;
  lng: number;
  zoom: number;
  bounds?: google.maps.LatLngBounds;
  resolvedName: string;
}

export const geocodeAddress = async (
  address: string
): Promise<GeocodeResult | null> => {
  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ address });
    if (!response.results.length) return null;
    const top = response.results[0];
    const { lat, lng } = top.geometry.location.toJSON();
    const { zoom, bounds } = determineZoomLevel(response.results);
    return { lat, lng, zoom, bounds, resolvedName: top.formatted_address };
  } catch {
    return null;
  }
};
