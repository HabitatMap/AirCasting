// Logic tests for the InfoBanner display gate. The ./config module is mocked
// with fixed values so these tests are independent of the live tuning in
// config.ts (probability / cooldown windows / post list).

const MOCK_POSTS = [
  { slug: "a", url: "https://example.com/a", title: "A", image: "a.jpg" },
  { slug: "b", url: "https://example.com/b", title: "B" },
  { slug: "c", url: "https://example.com/c", title: "C" },
];

const STORAGE_KEYS = {
  lastShown: "ac_blog_last_shown",
  dismissedAt: "ac_blog_dismissed_at",
  clickedAt: "ac_blog_clicked_at",
  lastSlug: "ac_blog_last_slug",
  variant: "ac_blog_ab_variant",
};

jest.mock(
  "../../components/organisms/Modals/InfoBanner/config",
  () => ({
    SHOW_PROBABILITY: 0.5,
    COOLDOWN_DAYS: 7,
    DISMISS_DAYS: 30,
    CLICKED_DAYS: 60,
    AB_SPLIT_MINIMAL: 0.5,
    STORAGE_KEYS,
    BLOG_POSTS: MOCK_POSTS,
  }),
  { virtual: false }
);

import {
  pickPost,
  pickVariant,
  recordClicked,
  recordDismissed,
  recordShown,
  shouldShow,
} from "../../components/organisms/Modals/InfoBanner/logic";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000; // fixed "now"

beforeEach(() => {
  window.localStorage.clear();
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const daysAgo = (n: number) => String(NOW - n * DAY_MS);

describe("shouldShow", () => {
  it("returns true when nothing suppresses and the roll passes", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.1); // < 0.5
    expect(shouldShow()).toBe(true);
  });

  it("returns false when the probability roll fails", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.9); // >= 0.5
    expect(shouldShow()).toBe(false);
  });

  it("is suppressed during the cooldown after being shown", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.setItem(STORAGE_KEYS.lastShown, daysAgo(3)); // < 7d
    expect(shouldShow()).toBe(false);
  });

  it("shows again once the cooldown has elapsed", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.setItem(STORAGE_KEYS.lastShown, daysAgo(8)); // > 7d
    expect(shouldShow()).toBe(true);
  });

  it("is suppressed for the dismiss window after being closed", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.setItem(STORAGE_KEYS.dismissedAt, daysAgo(10)); // < 30d
    expect(shouldShow()).toBe(false);
  });

  it("is suppressed for the clicked window after a click-through", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.setItem(STORAGE_KEYS.clickedAt, daysAgo(40)); // < 60d
    expect(shouldShow()).toBe(false);
  });

  it("ignores a non-numeric stored timestamp (treats as not suppressing)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    window.localStorage.setItem(STORAGE_KEYS.lastShown, "garbage");
    expect(shouldShow()).toBe(true);
  });

  it("does not throw when localStorage.getItem is unavailable", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => shouldShow()).not.toThrow();
    expect(shouldShow()).toBe(true);
  });
});

describe("pickPost", () => {
  it("returns a post from the list", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(MOCK_POSTS).toContainEqual(pickPost());
  });

  it("never repeats the last shown slug", () => {
    window.localStorage.setItem(STORAGE_KEYS.lastSlug, "a");
    // Sweep the random space; "a" must never be chosen.
    for (let r = 0; r < 1; r += 0.05) {
      jest.spyOn(Math, "random").mockReturnValue(r);
      expect(pickPost().slug).not.toBe("a");
    }
  });
});

describe("pickVariant", () => {
  it("rolls 'minimal' when the random draw is below the split", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.1); // < 0.5
    expect(pickVariant()).toBe("minimal");
    expect(window.localStorage.getItem(STORAGE_KEYS.variant)).toBe("minimal");
  });

  it("rolls 'full' when the random draw is at/above the split", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.9); // >= 0.5
    expect(pickVariant()).toBe("full");
    expect(window.localStorage.getItem(STORAGE_KEYS.variant)).toBe("full");
  });

  it("is sticky: returns the persisted variant regardless of the roll", () => {
    window.localStorage.setItem(STORAGE_KEYS.variant, "minimal");
    // Roll would pick 'full', but the stored value wins.
    jest.spyOn(Math, "random").mockReturnValue(0.9);
    expect(pickVariant()).toBe("minimal");
  });

  it("ignores a corrupt stored value and re-rolls", () => {
    window.localStorage.setItem(STORAGE_KEYS.variant, "garbage");
    jest.spyOn(Math, "random").mockReturnValue(0.1);
    expect(pickVariant()).toBe("minimal");
  });
});

describe("recorders", () => {
  it("recordShown stamps lastShown (now) and lastSlug", () => {
    recordShown(MOCK_POSTS[1]);
    expect(window.localStorage.getItem(STORAGE_KEYS.lastShown)).toBe(
      String(NOW)
    );
    expect(window.localStorage.getItem(STORAGE_KEYS.lastSlug)).toBe("b");
  });

  it("recordDismissed stamps dismissedAt", () => {
    recordDismissed();
    expect(window.localStorage.getItem(STORAGE_KEYS.dismissedAt)).toBe(
      String(NOW)
    );
  });

  it("recordClicked stamps clickedAt", () => {
    recordClicked();
    expect(window.localStorage.getItem(STORAGE_KEYS.clickedAt)).toBe(
      String(NOW)
    );
  });

  it("does not throw when localStorage.setItem rejects (quota)", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordShown(MOCK_POSTS[0])).not.toThrow();
  });
});
