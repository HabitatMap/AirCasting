declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

interface TrackRecentSearchUsedParams {
  query: string;
  position: number;
  totalRecents: number;
}

export const trackRecentSearchUsed = (
  params: TrackRecentSearchUsedParams
): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "recent_search_used",
    query: params.query,
    position: params.position,
    total_recents: params.totalRecents,
  });
};
