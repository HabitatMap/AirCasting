import { act } from "@testing-library/react";
import React from "react";
import { testRenderer } from "../../../setupTests";
import { FixedSession } from "../../../types/sessionType";
import { FixedMarkers } from "./FixedMarkers";

// Mock the useMap hook
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => ({
    panTo: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn(() => 14),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getBounds: jest.fn(),
    fitBounds: jest.fn(),
    panToBounds: jest.fn(),
    controls: [],
    data: jest.fn(),
    getCenter: jest.fn(),
    setMap: jest.fn(),
  }),
}));

// Mock the store hooks
jest.mock("../../../store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: jest.fn((selector) => ({
    cluster: { visible: false, clusterAverage: 0, clusterSize: 0 },
    thresholds: { low: 0, middle: 50, high: 100 },
    map: { hoverStreamId: null },
  })),
}));

// Mock the selectors
jest.mock("../../../store/fixedStreamSelectors", () => ({
  selectFixedStreamData: jest.fn(),
  selectFixedStreamStatus: jest.fn(),
}));

// Add this mock
jest.mock("../../../utils/mapParamsHandler", () => ({
  useMapParams: () => ({
    unitSymbol: "µg/m³",
    currentUserSettings: "map",
    min: 0,
    max: 100,
  }),
}));

// At the top level, create a shared mock
const mockClusterer = {
  addMarker: jest.fn(),
  removeMarker: jest.fn(),
  clearMarkers: jest.fn(),
  render: jest.fn(),
  addListener: jest.fn(),
  removeMarkers: jest.fn(),
  addMarkers: jest.fn(),
  setMap: jest.fn(),
  getMap: jest.fn(),
  onAdd: jest.fn(),
  onRemove: jest.fn(),
  markers: [],
};

// Update MarkerClusterer mock
jest.mock("@googlemaps/markerclusterer", () => ({
  MarkerClusterer: jest.fn().mockImplementation((map, markers) => {
    if (markers) {
      mockClusterer.addMarkers(markers);
    }
    return mockClusterer;
  }),
  GridAlgorithm: jest.fn().mockImplementation(() => ({
    calculate: jest.fn().mockReturnValue([]),
  })),
}));

// Add this mock before describe block
jest.mock("../../../utils/mapEventListeners", () => ({
  __esModule: true,
  default: () => ({
    clearListeners: jest.fn(),
  }),
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

  it("creates markers for each session", async () => {
    await act(async () => {
      testRenderer(
        <FixedMarkers
          sessions={mockSessions}
          onMarkerClick={mockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );
    });

    expect(mockClusterer.addMarkers).toHaveBeenCalled();

    // Get the last call to addMarkers
    const lastCall =
      mockClusterer.addMarkers.mock.calls[
        mockClusterer.addMarkers.mock.calls.length - 1
      ];
    if (lastCall && lastCall[0]) {
      expect(lastCall[0].length).toBe(mockSessions.length);
    } else {
      fail("Last addMarkers call did not contain markers array");
    }
  });

  it("creates a cluster when markers are close together", async () => {
    const closeMarkers: FixedSession[] = [
      {
        id: 1,
        point: { lat: 40.7128, lng: -74.006, streamId: "1" },
        averageValue: 50,
        lastMeasurementValue: 55,
        time: 1714857600,
      },
      {
        id: 2,
        point: { lat: 40.7129, lng: -74.007, streamId: "2" }, // Very close to first marker
        averageValue: 75,
        lastMeasurementValue: 80,
        time: 1714857600,
      },
    ];

    await act(async () => {
      testRenderer(
        <FixedMarkers
          sessions={closeMarkers}
          onMarkerClick={mockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );
    });

    expect(mockClusterer.addMarkers).toHaveBeenCalled();
  });

  it("updates clusters when markers change", async () => {
    const { rerender } = testRenderer(
      <FixedMarkers
        sessions={mockSessions}
        onMarkerClick={mockOnMarkerClick}
        selectedStreamId={null}
        pulsatingSessionId={null}
      />
    );

    // Update with new sessions
    const newSessions = [
      ...mockSessions,
      {
        id: 3,
        point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
        averageValue: 60,
        lastMeasurementValue: 65,
        time: 1714857600,
      },
    ];

    await act(async () => {
      rerender(
        <FixedMarkers
          sessions={newSessions}
          onMarkerClick={mockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );
    });

    expect(mockClusterer.clearMarkers).toHaveBeenCalled();
    expect(mockClusterer.addMarkers).toHaveBeenCalled();
  });

  // Add more tests here for other functionalities
});
