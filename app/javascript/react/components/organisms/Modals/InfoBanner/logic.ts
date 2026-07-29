import {
  AB_SPLIT_MINIMAL,
  BLOG_POSTS,
  BannerVariant,
  CLICKED_DAYS,
  COOLDOWN_DAYS,
  DISMISS_DAYS,
  LINK_REF,
  SHOW_PROBABILITY,
  STORAGE_KEYS,
  BlogPost,
} from "./config";

const DAY_MS = 24 * 60 * 60 * 1000;

// localStorage may be disabled (private mode, quota, SSR) — never throw.
const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage disabled / quota — ignore */
  }
};

/** True if `key` holds a timestamp newer than `days` ago (i.e. still suppressing). */
const isWithin = (key: string, days: number): boolean => {
  const raw = safeGet(key);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < days * DAY_MS;
};

/**
 * Decide whether the banner should appear on this page load.
 * Suppressed by an active cooldown / dismissal / click-through; otherwise
 * gated by a random probability so it stays occasional.
 */
export const shouldShow = (): boolean => {
  if (BLOG_POSTS.length === 0) return false;
  if (isWithin(STORAGE_KEYS.clickedAt, CLICKED_DAYS)) return false;
  if (isWithin(STORAGE_KEYS.dismissedAt, DISMISS_DAYS)) return false;
  if (isWithin(STORAGE_KEYS.lastShown, COOLDOWN_DAYS)) return false;
  return Math.random() < SHOW_PROBABILITY;
};

/**
 * Roll the A/B variant fresh on every show (not persisted), so the split stays
 * ~50/50 across all impressions and a returning user may see either version.
 */
export const pickVariant = (): BannerVariant =>
  Math.random() < AB_SPLIT_MINIMAL ? "minimal" : "full";

/**
 * Append attribution params to a blog URL so the click can be traced through to
 * a HabitatMap purchase. Preserves any existing query string; falls back to the
 * raw URL if it can't be parsed.
 */
export const withRef = (
  url: string,
  variant: BannerVariant,
  postSlug: string
): string => {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", LINK_REF.utmSource);
    u.searchParams.set("utm_medium", LINK_REF.utmMedium);
    u.searchParams.set("utm_campaign", LINK_REF.utmCampaign);
    u.searchParams.set("utm_content", variant);
    u.searchParams.set("ac_post", postSlug);
    return u.toString();
  } catch {
    return url;
  }
};

/** Pick a random post, avoiding the one shown last time when possible. */
export const pickPost = (): BlogPost => {
  const lastPostSlug = safeGet(STORAGE_KEYS.lastPostSlug);
  const candidates =
    BLOG_POSTS.length > 1
      ? BLOG_POSTS.filter((p) => p.postSlug !== lastPostSlug)
      : BLOG_POSTS;
  const pool = candidates.length > 0 ? candidates : BLOG_POSTS;
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Record that the banner was actually shown (starts the cooldown). */
export const recordShown = (post: BlogPost): void => {
  safeSet(STORAGE_KEYS.lastShown, String(Date.now()));
  safeSet(STORAGE_KEYS.lastPostSlug, post.postSlug);
};

export const recordDismissed = (): void => {
  safeSet(STORAGE_KEYS.dismissedAt, String(Date.now()));
};

export const recordClicked = (): void => {
  safeSet(STORAGE_KEYS.clickedAt, String(Date.now()));
};
