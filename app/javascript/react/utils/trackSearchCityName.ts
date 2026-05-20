declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type SearchCityNameSource = "autocomplete" | "recent";

interface TrackSearchCityNameParams {
  query: string;
  placeId?: string;
  lat: number;
  lng: number;
  source: SearchCityNameSource;
}

export const trackSearchCityName = (
  params: TrackSearchCityNameParams
): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "search_city_name",
    query: params.query,
    place_id: params.placeId,
    lat: params.lat,
    lng: params.lng,
    source: params.source,
  });
};
