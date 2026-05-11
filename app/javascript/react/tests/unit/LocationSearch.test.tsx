import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

import { LocationSearch } from "../../components/molecules/LocationSearch/LocationSearch";
import useAutocompleteSuggestions from "../../utils/useAutocompleteSuggestions";
import useRecentSearches from "../../utils/useRecentSearches";
import { renderWithProviders } from "../helpers/renderWithProviders";

jest.mock("../../utils/mapParamsHandler", () => {
  const actual = jest.requireActual(
    "../../utils/mapParamsHandler"
  ) as typeof import("../../utils/mapParamsHandler");
  return {
    ...actual,
    useMapParams: jest.fn(() => ({
      setUrlParams: jest.fn(),
    })),
  };
});

const defaultBounds = {
  toJSON: () => ({ south: 0, west: 0, north: 1, east: 1 }),
};

const mockMapInstance = {
  getBounds: jest.fn(() => defaultBounds),
  addListener: jest.fn((_event: string, _handler: () => void) => ({
    remove: jest.fn(),
  })),
  fitBounds: jest.fn(),
  setZoom: jest.fn(),
  panTo: jest.fn(),
};

jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: jest.fn(() => mockMapInstance),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (str: string) => str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));

jest.mock("../../utils/useAutocompleteSuggestions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../utils/useRecentSearches", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../utils/geolocation", () => ({
  getBrowserLocation: jest.fn(),
}));

const mockUseAutocomplete =
  useAutocompleteSuggestions as jest.MockedFunction<
    typeof useAutocompleteSuggestions
  >;
const mockUseRecent = useRecentSearches as jest.MockedFunction<
  typeof useRecentSearches
>;

describe("LocationSearch", () => {
  beforeEach(() => {
    mockUseAutocomplete.mockImplementation(() => ({
      input: "",
      setInput: jest.fn(),
      suggestions: [],
      status: "idle",
      reset: jest.fn(),
      selectSuggestion: jest.fn(),
    }));
    mockUseRecent.mockReturnValue({
      recents: [],
      addRecent: jest.fn(),
      clearRecents: jest.fn(),
    });
    const { useMap } = jest.requireMock("@vis.gl/react-google-maps") as {
      useMap: jest.Mock;
    };
    useMap.mockImplementation(() => mockMapInstance);
  });

  it("renders search input with accessible label", () => {
    renderWithProviders(<LocationSearch isTimelapseView={false} />);

    expect(
      screen.getByRole("combobox", { name: "map.searchInputLabel" })
    ).toBeInTheDocument();
  });

  it("forwards typing to autocomplete hook setInput", () => {
    const setInput = jest.fn();
    mockUseAutocomplete.mockImplementation(() => ({
      input: "",
      setInput,
      suggestions: [],
      status: "idle",
      reset: jest.fn(),
      selectSuggestion: jest.fn(),
    }));

    renderWithProviders(<LocationSearch isTimelapseView={false} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "War" },
    });

    expect(setInput).toHaveBeenCalledWith("War");
  });

  it("passes map bounds as locationBias to useAutocompleteSuggestions", async () => {
    const bias = {
      toJSON: jest.fn(() => ({ south: 10, west: 20, north: 30, east: 40 })),
    };
    const customMap = {
      getBounds: jest.fn(() => bias),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      fitBounds: jest.fn(),
      setZoom: jest.fn(),
      panTo: jest.fn(),
    };
    const { useMap } = jest.requireMock("@vis.gl/react-google-maps") as {
      useMap: jest.Mock;
    };
    useMap.mockImplementation(() => customMap);

    mockUseAutocomplete.mockImplementation((_opts) => ({
      input: "",
      setInput: jest.fn(),
      suggestions: [],
      status: "idle",
      reset: jest.fn(),
      selectSuggestion: jest.fn(),
    }));

    renderWithProviders(<LocationSearch isTimelapseView={false} />);

    await waitFor(() => {
      expect(mockUseAutocomplete).toHaveBeenCalledWith(
        expect.objectContaining({ locationBias: bias })
      );
    });
  });
});
