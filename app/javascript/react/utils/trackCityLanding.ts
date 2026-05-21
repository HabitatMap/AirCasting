type ResolutionStatus = "success" | "fallback_geo" | "fallback_default";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

interface TrackCityLandingParams {
  cityRaw: string;
  cityResolved: string | null;
  resolutionStatus: ResolutionStatus;
  sessionType: string;
}

export const trackCityLanding = (params: TrackCityLandingParams): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "city_param_landing",
    city_raw: params.cityRaw,
    city_resolved: params.cityResolved,
    resolution_status: params.resolutionStatus,
    session_type: params.sessionType,
  });
};
