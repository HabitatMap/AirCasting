import {
  BANNER_CAMPAIGN,
  BANNER_SOURCE,
  BannerVariant,
} from "../components/organisms/Modals/InfoBanner/config";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

// Event names + params are the SHARED schema used by both AirCasting and
// HabitatMap. Keep identical to HabitatMap/docs/analytics-tracking.md §1.3 so a
// single set of GTM tags covers both sites.
export type BannerEventName =
  | "banner_shown"
  | "banner_dismissed"
  | "banner_clicked";

interface TrackBannerEventParams {
  event: BannerEventName;
  variant: BannerVariant;
  /** The HM post's URL slug — the join key shared across AC & HM. */
  postSlug: string;
}

/**
 * Push an InfoBanner A/B event to the GTM dataLayer. Fire-and-forget: if GTM is
 * not loaded (no cookie consent) the push is harmless and simply never forwarded.
 * Mirrors HabitatMap's airbeam-ab.js push shape.
 */
export const trackBannerEvent = ({
  event,
  variant,
  postSlug,
}: TrackBannerEventParams): void => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    banner_source: BANNER_SOURCE,
    banner_campaign: BANNER_CAMPAIGN,
    banner_variant: variant,
    post_slug: postSlug,
  });
};
