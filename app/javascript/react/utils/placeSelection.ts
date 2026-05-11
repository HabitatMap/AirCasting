import { GeocodeResult } from "./geocodeAddress";
import { determineZoomLevel } from "./determineZoomLevel";

export interface PlaceLike {
  formattedAddress?: string | null;
  displayName?: string | null;
  location?: google.maps.LatLng | google.maps.LatLngLiteral | null;
  viewport?: google.maps.LatLngBounds | null;
  types?: string[] | null;
  addressComponents?: google.maps.places.AddressComponent[] | null;
}

const latLngFromPlaceLocation = (
  loc: google.maps.LatLng | google.maps.LatLngLiteral
): { lat: number; lng: number } => {
  const lat =
    typeof (loc as google.maps.LatLng).lat === "function"
      ? (loc as google.maps.LatLng).lat()
      : (loc as google.maps.LatLngLiteral).lat;
  const lng =
    typeof (loc as google.maps.LatLng).lng === "function"
      ? (loc as google.maps.LatLng).lng()
      : (loc as google.maps.LatLngLiteral).lng;
  return { lat, lng };
};

export const geocodeResultFromFetchedPlace = (
  place: PlaceLike,
  fallbackLabel: string
): GeocodeResult | null => {
  if (!place.location) return null;

  const { lat, lng } = latLngFromPlaceLocation(place.location);

  const types =
    place.types && place.types.length > 0 ? place.types : ["geocode"];

  const addressComponents = (place.addressComponents ?? []).map((ac) => ({
    long_name: ac.longText ?? "",
    short_name: ac.shortText ?? "",
    types: ac.types ?? [],
  })) as google.maps.GeocoderAddressComponent[];

  const pseudoResult = {
    types,
    geometry: {
      location: new google.maps.LatLng(lat, lng),
      viewport: place.viewport ?? undefined,
    },
    formatted_address:
      place.formattedAddress ??
      place.displayName ??
      fallbackLabel,
    address_components: addressComponents,
  } as google.maps.GeocoderResult;

  const { zoom, bounds } = determineZoomLevel([pseudoResult]);

  const resolvedName =
    place.formattedAddress ??
    place.displayName ??
    fallbackLabel;

  return { lat, lng, zoom, bounds, resolvedName };
};
