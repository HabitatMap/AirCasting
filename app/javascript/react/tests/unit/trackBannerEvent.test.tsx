import { trackBannerEvent } from "../../utils/trackBannerEvent";

describe("trackBannerEvent", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("pushes banner_shown with the shared schema (source + campaign + variant + slug)", () => {
    trackBannerEvent({
      event: "banner_shown",
      variant: "minimal",
      postSlug: "candles-incense",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "banner_shown",
        banner_source: "aircasting",
        banner_campaign: "blog_promo",
        banner_variant: "minimal",
        post_slug: "candles-incense",
      },
    ]);
  });

  it("pushes banner_clicked and banner_dismissed", () => {
    trackBannerEvent({
      event: "banner_clicked",
      variant: "full",
      postSlug: "aqi-colored-dots",
    });
    trackBannerEvent({
      event: "banner_dismissed",
      variant: "full",
      postSlug: "aqi-colored-dots",
    });

    expect(window.dataLayer!.map((e) => e.event)).toEqual([
      "banner_clicked",
      "banner_dismissed",
    ]);
    expect(window.dataLayer![0]).toMatchObject({
      banner_source: "aircasting",
      banner_campaign: "blog_promo",
      banner_variant: "full",
      post_slug: "aqi-colored-dots",
    });
  });

  it("initializes dataLayer if undefined", () => {
    delete (window as any).dataLayer;

    trackBannerEvent({
      event: "banner_shown",
      variant: "full",
      postSlug: "x",
    });

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
  });
});
