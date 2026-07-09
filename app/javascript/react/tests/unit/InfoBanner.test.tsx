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
  recordShown: jest.fn(),
  recordDismissed: jest.fn(),
  recordClicked: jest.fn(),
}));

const mocked = logic as jest.Mocked<typeof logic>;

const POST_WITH_IMAGE = {
  slug: "candles",
  url: "https://example.com/candles",
  title: "Candles and your health",
  image: "https://cdn.example.com/candles.jpg",
};

const POST_NO_IMAGE = {
  slug: "brussels",
  url: "https://example.com/brussels",
  title: "Clean air in Brussels",
};

beforeEach(() => {
  jest.clearAllMocks();
});

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
});
