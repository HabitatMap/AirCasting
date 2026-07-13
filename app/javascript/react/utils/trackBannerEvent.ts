import { BannerVariant } from "../components/organisms/Modals/InfoBanner/config";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type BannerEventName =
  | "info_banner_shown"
  | "info_banner_dismissed"
  | "info_banner_clicked";

interface TrackBannerEventParams {
  event: BannerEventName;
  variant: BannerVariant;
  postSlug: string;
}

/**
 * Push an InfoBanner A/B event to the GTM dataLayer. Fire-and-forget: if GTM is
 * not loaded (no cookie consent) the push is harmless and simply never forwarded.
 * Mirrors the trackCityEvent util.
 */
export const trackBannerEvent = ({
  event,
  variant,
  postSlug,
}: TrackBannerEventParams): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    banner_variant: variant,
    post_slug: postSlug,
  });
};
