import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import React from "react";
import { renderWithProvider } from "../../../setupTests";

import { RefreshMapButton } from ".";

// Mock the translation hook
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "navbar.refreshMap" ? "Refresh Map" : key),
  }),
}));

describe("RefreshMapButton", () => {
  it("should render RefreshMapButton", () => {
    renderWithProvider(<RefreshMapButton />);
    expect(screen.getByText("Refresh Map")).toBeInTheDocument();
  });
});
