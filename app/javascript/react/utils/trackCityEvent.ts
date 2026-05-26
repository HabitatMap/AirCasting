declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type CityEventSource =
  | "ad_landing"
  | "ad_landing_fallback"
  | "autocomplete"
  | "recent";

export type CityResolutionStatus =
  | "success"
  | "fallback_geo"
  | "fallback_default";

interface TrackCityEventParams {
  city: string;
  cityRaw?: string;
  source: CityEventSource;
  resolutionStatus?: CityResolutionStatus;
  lat?: number;
  lng?: number;
  placeId?: string;
  sessionType?: string;
}

export const trackCityEvent = (params: TrackCityEventParams): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "city_view",
    city: params.city,
    city_raw: params.cityRaw,
    source: params.source,
    resolution_status: params.resolutionStatus,
    lat: params.lat,
    lng: params.lng,
    place_id: params.placeId,
    session_type: params.sessionType,
  });
};
