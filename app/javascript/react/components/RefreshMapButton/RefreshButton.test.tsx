import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

import { RefreshMapButton } from ".";

describe("RefreshMapButton", () => {
  it("should render RefreshMapButton", () => {
    render(<RefreshMapButton />);
    expect(screen.getByText("Refresh Map")).toBeInTheDocument();
  });

  // test("refresh button renders", () => {
  //   expect(true).toBe(true);
  // });

  // test("Renders the main page", () => {
  // render(<RefreshMapButton />);
  //   expect(true).toBeTruthy();
  // });
});
