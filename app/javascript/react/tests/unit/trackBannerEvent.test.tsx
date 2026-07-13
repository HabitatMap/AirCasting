import { trackBannerEvent } from "../../utils/trackBannerEvent";

describe("trackBannerEvent", () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
  });

  it("pushes info_banner_shown with variant + slug", () => {
    trackBannerEvent({
      event: "info_banner_shown",
      variant: "minimal",
      postSlug: "candles-incense",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "info_banner_shown",
        banner_variant: "minimal",
        post_slug: "candles-incense",
      },
    ]);
  });

  it("pushes info_banner_clicked and info_banner_dismissed", () => {
    trackBannerEvent({
      event: "info_banner_clicked",
      variant: "full",
      postSlug: "aqi-colored-dots",
    });
    trackBannerEvent({
      event: "info_banner_dismissed",
      variant: "full",
      postSlug: "aqi-colored-dots",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "info_banner_clicked",
        banner_variant: "full",
        post_slug: "aqi-colored-dots",
      },
      {
        event: "info_banner_dismissed",
        banner_variant: "full",
        post_slug: "aqi-colored-dots",
      },
    ]);
  });

  it("initializes dataLayer if undefined", () => {
    delete (window as any).dataLayer;

    trackBannerEvent({
      event: "info_banner_shown",
      variant: "full",
      postSlug: "x",
    });

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.dataLayer).toHaveLength(1);
  });
});
