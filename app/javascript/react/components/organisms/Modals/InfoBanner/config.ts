// ---------------------------------------------------------------------------
// InfoBanner configuration — the ONE place to tune everything.
//
// The InfoBanner surfaces a HabitatMap blog post on the map, occasionally and
// non-intrusively. Adjust the numbers below to change how often it appears and
// edit BLOG_POSTS to change what it links to. No other file needs touching.
// ---------------------------------------------------------------------------

/**
 * Chance (0–1) that the banner is eligible to appear on any given page load,
 * assuming no cooldown/dismiss/click suppression is active. Lower = rarer.
 * "Gentle" default: ~1 in 3 loads.
 */
export const SHOW_PROBABILITY = 1;//0.35;

/**
 * After the banner is shown, don't show it again for this many days
 * (even across page loads where the probability roll would pass).
 */
export const COOLDOWN_DAYS = 0;//7;

/** After the user closes (✕) the banner, suppress it for this many days. */
export const DISMISS_DAYS = 0;//30;

/** After the user clicks through to an article, suppress it for this many days. */
export const CLICKED_DAYS = 0;//60;

/** localStorage keys — namespaced to avoid clashes with other features. */
export const STORAGE_KEYS = {
  lastShown: "ac_blog_last_shown",
  dismissedAt: "ac_blog_dismissed_at",
  clickedAt: "ac_blog_clicked_at",
  lastPostSlug: "ac_blog_last_post_slug",
} as const;

// ---------------------------------------------------------------------------
// A/B test — two banner presentations.
//   "full"    = image (when the post has one) + a "read more" button.
//   "minimal" = no image, no button; kicker + title only, the whole card is
//               one clickable link with a hover affordance.
// The variant is rolled fresh on every show (NOT persisted) — a returning user
// may see a different version across visits, keeping the split ~50/50 across all
// impressions.
// ---------------------------------------------------------------------------

export type BannerVariant = "full" | "minimal";

/** Probability (0–1) that any given show uses the "minimal" variant. */
export const AB_SPLIT_MINIMAL = 0.5;

// ---------------------------------------------------------------------------
// Shared analytics schema — MUST stay identical to HabitatMap.
// Source of truth: HabitatMap/docs/analytics-tracking.md §1.3.
// This banner is Test A: banner_source "aircasting", banner_campaign "blog_promo".
// ---------------------------------------------------------------------------

/** `banner_source` — which property shows the banner. */
export const BANNER_SOURCE = "aircasting";

/** `banner_campaign` — the experiment id (Test A). */
export const BANNER_CAMPAIGN = "blog_promo";

/**
 * Attribution params appended to the outbound blog link so HabitatMap's GTM /
 * GA4 can trace the visit (and any resulting AirBeam purchase) back to the
 * banner. `utm_content` carries the variant and `ac_post` the post slug (= the
 * HM post's URL slug). See HabitatMap/docs/analytics-tracking.md §3.3.
 */
export const LINK_REF = {
  utmSource: BANNER_SOURCE,
  utmMedium: "info_banner",
  utmCampaign: BANNER_CAMPAIGN,
} as const;

export interface BlogPost {
  /**
   * The HabitatMap post's URL slug (= their `page.slug`, the last path segment
   * of `url`). This is the canonical id: it's the analytics join key shared with
   * HabitatMap (sent as `post_slug` + `ac_post`) AND the local dedup key. MUST
   * match HM exactly — set it explicitly, don't derive. See
   * HabitatMap/docs/analytics-tracking.md §1.3.
   */
  postSlug: string;
  /** Full HabitatMap blog URL. */
  url: string;
  /** Post title shown in the banner. */
  title: string;
  /**
   * Optional hero thumbnail. Either a HabitatMap image URL (values below) or a
   * locally bundled asset (import it at the top of this file and reference it).
   * Posts without an image render the lighter, text-only variant automatically.
   */
  image?: string;
}

// How the image URLs below were found: each HabitatMap blog post exposes its
// hero image in the page's <meta property="og:image"> tag. Grab it with:
//   curl -sL <post-url> | grep -oiE '<meta property="og:image"[^>]*content="[^"]*"'
// The `?nf_resize=smartcrop&w=680&h=280` suffix is HabitatMap's (Netlify) image
// CDN resizing it to a banner-sized crop so we don't pull the full-res original.
//
// Prefer to bundle assets instead of hotlinking? Download each image into
// assets/images/blog/, import it here, and set `image` to the import.
const CDN_CROP = "?nf_resize=smartcrop&w=680&h=280";

/**
 * Hardcoded list of posts. Keep it to ~3–5. One is chosen at random on each
 * real show (never repeating the previous one).
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    postSlug: "what-do-those-colored-circles-mean-understanding-air-quality-on-the-aircasting-map",
    url: "https://deploy-preview-244--habitatmap.netlify.app/blog/what-do-those-colored-circles-mean-understanding-air-quality-on-the-aircasting-map",
    title: "What do those colored dots mean? Understanding the Air Quality Index",
    image: `https://www.habitatmap.org/images/uploads/aircastingmapdots.png${CDN_CROP}`,
  },
  {
    postSlug: "when-fresh-scents-turn-toxic-how-candles-and-incense-impact-your-health",
    url: "https://deploy-preview-244--habitatmap.netlify.app/blog/when-fresh-scents-turn-toxic-how-candles-and-incense-impact-your-health",
    title:
      "When fresh scents turn toxic: how candles and incense impact your health",
    image: `https://www.habitatmap.org/images/uploads/burning-candles-zz-230419-5dd288.avif${CDN_CROP}`,
  },
  {
    postSlug: "nyc-community-organizations-use-aircasting-to-study-hyperlocal-air-quality-1",
    url: "https://deploy-preview-244--habitatmap.netlify.app/blog/nyc-community-organizations-use-aircasting-to-study-hyperlocal-air-quality-1",
    title: "NYC Community Organizations Use AirCasting to Study Hyperlocal Air Quality",
    image: `https://www.habitatmap.org/images/uploads/williamsburghexagonmap.png${CDN_CROP}`,
  },
];
