import React from "react";
import { testRenderer } from "../../../setupTests";
import { FixedSession } from "../../../types/sessionType";
import { FixedMarkers } from "./FixedMarkers";

// Mock the useMap hook
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => ({
    panTo: jest.fn(),
    setZoom: jest.fn(),
  }),
}));

// Mock the store hooks
jest.mock("../../../store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock the selectors
jest.mock("../../../store/fixedStreamSelectors", () => ({
  selectFixedStreamData: jest.fn(),
  selectFixedStreamStatus: jest.fn(),
}));

describe("FixedMarkers", () => {
  const mockSessions: FixedSession[] = [
    {
      id: 1,
      point: { lat: 40.7128, lng: -74.006, streamId: "1" },
      averageValue: 50,
      lastMeasurementValue: 55,
      time: 1714857600,
    },
    {
      id: 2,
      point: { lat: 34.0522, lng: -118.2437, streamId: "2" },
      averageValue: 75,
      lastMeasurementValue: 80,
      time: 1714857600,
    },
  ];

  const mockOnMarkerClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    testRenderer(
      <FixedMarkers
        sessions={mockSessions}
        onMarkerClick={mockOnMarkerClick}
        selectedStreamId={null}
        pulsatingSessionId={null}
      />
    );
  });

  it("creates markers for each session", () => {
    const { container } = testRenderer(
      <FixedMarkers
        sessions={mockSessions}
        onMarkerClick={mockOnMarkerClick}
        selectedStreamId={null}
        pulsatingSessionId={null}
      />
    );

    // Check if markers are created (this is a basic check, as the actual markers might not be in the DOM)
    expect(container.innerHTML).not.toBe("");
  });

  // Add more tests here for other functionalities
});
