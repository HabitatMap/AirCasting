import * as Cookies from "./cookies";
import { UrlParamsTypes } from "./mapParamsHandler";

export const updateMapBounds = (
  map: google.maps.Map | null,
  newSearchParams: URLSearchParams
) => {
  const bounds = map?.getBounds();
  if (!bounds) return;

  const north = bounds.getNorthEast().lat();
  const south = bounds.getSouthWest().lat();
  const east = bounds.getNorthEast().lng();
  const west = bounds.getSouthWest().lng();

  newSearchParams.set(UrlParamsTypes.boundEast, east.toString());
  newSearchParams.set(UrlParamsTypes.boundNorth, north.toString());
  newSearchParams.set(UrlParamsTypes.boundSouth, south.toString());
  newSearchParams.set(UrlParamsTypes.boundWest, west.toString());

  Cookies.set(UrlParamsTypes.boundEast, east.toString());
  Cookies.set(UrlParamsTypes.boundNorth, north.toString());
  Cookies.set(UrlParamsTypes.boundSouth, south.toString());
  Cookies.set(UrlParamsTypes.boundWest, west.toString());

  return newSearchParams;
};
