import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { InfoBanner } from "../../components/organisms/Modals/InfoBanner/InfoBanner";
import * as logic from "../../components/organisms/Modals/InfoBanner/logic";

// t() echoes the key so we can assert on it.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../components/organisms/Modals/InfoBanner/logic", () => ({
  shouldShow: jest.fn(),
  pickPost: jest.fn(),
  pickVariant: jest.fn(),
  recordShown: jest.fn(),
  recordDismissed: jest.fn(),
  recordClicked: jest.fn(),
  // Identity by default so href assertions read the raw post URL; the dedicated
  // withRef unit tests (InfoBannerLogic) cover param building.
  withRef: jest.fn((url: string) => url),
}));

const mocked = logic as jest.Mocked<typeof logic>;

const POST_WITH_IMAGE = {
  postSlug: "candles",
  url: "https://example.com/candles",
  title: "Candles and your health",
  image: "https://cdn.example.com/candles.jpg",
};

const POST_NO_IMAGE = {
  postSlug: "brussels",
  url: "https://example.com/brussels",
  title: "Clean air in Brussels",
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default to the "full" variant so existing image/button expectations hold;
  // the minimal-variant test overrides this.
  mocked.pickVariant.mockReturnValue("full");
  mocked.withRef.mockImplementation((url: string) => url);
  (window as any).dataLayer = [];
});

const eventsOf = (name: string) =>
  ((window as any).dataLayer as Array<Record<string, unknown>>).filter(
    (e) => e.event === name
  );

describe("InfoBanner", () => {
  it("renders nothing when shouldShow is false", () => {
    mocked.shouldShow.mockReturnValue(false);
    const { container } = render(<InfoBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(mocked.recordShown).not.toHaveBeenCalled();
  });

  it("renders the image variant and records the show", () => {
    mocked.shouldShow.mockReturnValue(true);
    mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

    const { container } = render(<InfoBanner />);

    expect(screen.getByText(POST_WITH_IMAGE.title)).toBeInTheDocument();
    expect(
      container.querySelector(`img[src="${POST_WITH_IMAGE.image}"]`)
    ).toBeInTheDocument();
    expect(mocked.recordShown).toHaveBeenCalledWith(POST_WITH_IMAGE);
  });

  it("points the read link at the post URL and opens a new tab", () => {
    mocked.shouldShow.mockReturnValue(true);
    mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

    render(<InfoBanner />);

    const link = screen.getByRole("link", { name: "infoBanner.readMore" });
    expect(link).toHaveAttribute("href", POST_WITH_IMAGE.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the compact variant (no hero image) when the post has no image", () => {
    mocked.shouldShow.mockReturnValue(true);
    mocked.pickPost.mockReturnValue(POST_NO_IMAGE);

    const { container } = render(<InfoBanner />);

    expect(screen.getByText(POST_NO_IMAGE.title)).toBeInTheDocument();
    // Only the HabitatMap logo img — no post hero image.
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2); // logo + close icon, no hero
  });

  it("dismisses on close click and hides the banner", () => {
    mocked.shouldShow.mockReturnValue(true);
    mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

    render(<InfoBanner />);

    fireEvent.click(
      screen.getByRole("button", { name: "infoBanner.dismiss" })
    );

    expect(mocked.recordDismissed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(POST_WITH_IMAGE.title)).not.toBeInTheDocument();
  });

  it("records a click-through when the article link is clicked", () => {
    mocked.shouldShow.mockReturnValue(true);
    mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

    render(<InfoBanner />);

    fireEvent.click(
      screen.getByRole("link", { name: "infoBanner.readMore" })
    );

    expect(mocked.recordClicked).toHaveBeenCalledTimes(1);
  });

  describe("minimal variant", () => {
    it("renders no hero image and no read-more button, just a clickable title", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("minimal");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      const { container } = render(<InfoBanner />);

      // No hero image even though the post has one — logo + close icon only.
      expect(
        container.querySelector(`img[src="${POST_WITH_IMAGE.image}"]`)
      ).not.toBeInTheDocument();
      expect(container.querySelectorAll("img")).toHaveLength(2);

      // No "read more" button — the title itself is the link.
      expect(
        screen.queryByRole("link", { name: "infoBanner.readMore" })
      ).not.toBeInTheDocument();

      const link = screen.getByRole("link", { name: POST_WITH_IMAGE.title });
      expect(link).toHaveAttribute("href", POST_WITH_IMAGE.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("records a click-through when the card link is clicked", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("minimal");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      render(<InfoBanner />);

      fireEvent.click(
        screen.getByRole("link", { name: POST_WITH_IMAGE.title })
      );

      expect(mocked.recordClicked).toHaveBeenCalledTimes(1);
    });

    it("dismisses on close click without following the card link", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("minimal");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      render(<InfoBanner />);

      fireEvent.click(
        screen.getByRole("button", { name: "infoBanner.dismiss" })
      );

      expect(mocked.recordDismissed).toHaveBeenCalledTimes(1);
      expect(mocked.recordClicked).not.toHaveBeenCalled();
      expect(
        screen.queryByText(POST_WITH_IMAGE.title)
      ).not.toBeInTheDocument();
    });
  });

  describe("GA4 / dataLayer tracking", () => {
    it("pushes banner_shown once on mount with the shared schema", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("minimal");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      render(<InfoBanner />);

      const shown = eventsOf("banner_shown");
      expect(shown).toHaveLength(1);
      expect(shown[0]).toMatchObject({
        banner_source: "aircasting",
        banner_campaign: "blog_promo",
        banner_variant: "minimal",
        post_slug: POST_WITH_IMAGE.postSlug,
      });
    });

    it("pushes banner_clicked on click-through", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("full");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      render(<InfoBanner />);
      fireEvent.click(
        screen.getByRole("link", { name: "infoBanner.readMore" })
      );

      expect(eventsOf("banner_clicked")).toMatchObject([
        { banner_variant: "full", post_slug: POST_WITH_IMAGE.postSlug },
      ]);
    });

    it("pushes banner_dismissed on close", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("full");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);

      render(<InfoBanner />);
      fireEvent.click(
        screen.getByRole("button", { name: "infoBanner.dismiss" })
      );

      expect(eventsOf("banner_dismissed")).toMatchObject([
        { banner_variant: "full", post_slug: POST_WITH_IMAGE.postSlug },
      ]);
    });

    it("builds the outbound href via withRef", () => {
      mocked.shouldShow.mockReturnValue(true);
      mocked.pickVariant.mockReturnValue("full");
      mocked.pickPost.mockReturnValue(POST_WITH_IMAGE);
      mocked.withRef.mockReturnValue("https://example.com/tagged");

      render(<InfoBanner />);

      expect(mocked.withRef).toHaveBeenCalledWith(
        POST_WITH_IMAGE.url,
        "full",
        POST_WITH_IMAGE.postSlug
      );
      expect(
        screen.getByRole("link", { name: "infoBanner.readMore" })
      ).toHaveAttribute("href", "https://example.com/tagged");
    });
  });
});
