import { act } from "@testing-library/react";
import React from "react";
import { testRenderer } from "../../../../setupTests";
import { FixedSession } from "../../../../types/sessionType";
import { FixedMarkers } from "./FixedMarkers";

const ZOOM_FOR_SELECTED_SESSION = 15;

// Define the marker type used in FixedMarkers
type FixedMarker = google.maps.Marker & {
  value: number;
  sessionId: number;
  userData: { streamId: string };
  clustered: boolean;
};

// Define the mock clusterer type
type MockClusterer = {
  addMarker: jest.Mock;
  removeMarker: jest.Mock;
  clearMarkers: jest.Mock;
  render: jest.Mock;
  addListener: jest.Mock;
  removeMarkers: jest.Mock;
  addMarkers: jest.Mock;
  setMap: jest.Mock;
  getMap: jest.Mock;
  onAdd: jest.Mock;
  onRemove: jest.Mock;
  markers: any[];
  click: jest.Mock;
  [key: string]: jest.Mock | any[];
};

// Create a function to get a new mock clusterer instance
function createMockClusterer(): MockClusterer {
  const mockClusterer: MockClusterer = {
    addMarker: jest.fn(),
    removeMarker: jest.fn(),
    clearMarkers: jest.fn(),
    render: jest.fn(),
    addListener: jest.fn((event: string, callback: Function) => {
      // Store the callback for later use
      (mockClusterer as any)[event] = callback;
      return { remove: jest.fn() };
    }),
    removeMarkers: jest.fn(),
    addMarkers: jest.fn((markers) => {
      mockClusterer.markers = markers;
    }),
    setMap: jest.fn(),
    getMap: jest.fn(),
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    markers: [],
    click: jest.fn((marker) => {
      // Call the click handler if it exists
      const clickHandler = (mockClusterer as any).click;
      if (clickHandler) {
        clickHandler(marker);
      }
    }),
  };
  return mockClusterer;
}

// Mock the useMap hook
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => ({
    panTo: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn(() => 14),
    addListener: jest.fn((event, callback) => {
      // Store the callback for later use
      (window as any).mapListeners = (window as any).mapListeners || {};
      (window as any).mapListeners[event] = callback;
      return { remove: jest.fn() };
    }),
    removeListener: jest.fn(),
    getBounds: jest.fn(() => ({
      getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
      getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
      contains: jest.fn(() => true),
    })),
    fitBounds: jest.fn(),
    panToBounds: jest.fn(),
    controls: [],
    data: jest.fn(),
    getCenter: jest.fn(),
    setMap: jest.fn(),
  }),
}));

// Mock the store hooks
jest.mock("../../../../store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: jest.fn((selector) => ({
    cluster: { visible: false, clusterAverage: 0, clusterSize: 0 },
    thresholds: { low: 0, middle: 50, high: 100 },
    map: { hoverStreamId: null },
  })),
}));

// Mock the selectors
jest.mock("../../../../store/fixedStreamSelectors", () => ({
  selectFixedStreamData: jest.fn(),
  selectFixedStreamStatus: jest.fn(),
}));

// Add this mock
jest.mock("../../../../utils/mapParamsHandler", () => ({
  useMapParams: () => ({
    unitSymbol: "µg/m³",
    currentUserSettings: "map",
    min: 0,
    max: 100,
  }),
}));

// Mock CustomMarkerOverlay
jest.mock("./CustomOverlays/CustomMarkerOverlay", () => {
  const CustomMarkerOverlay = jest
    .fn()
    .mockImplementation((position, color, isSelected, shouldPulse) => ({
      setMap: jest.fn(),
      setShouldPulse: jest.fn(),
      setIsSelected: jest.fn(),
      setColor: jest.fn(),
      update: jest.fn(),
      position,
      color,
      isSelected,
      shouldPulse,
    }));

  return {
    __esModule: true,
    default: CustomMarkerOverlay,
    CustomMarkerOverlay,
  };
});

// Mock the MarkerClusterer
jest.mock("@googlemaps/markerclusterer", () => {
  const mockClusterer = createMockClusterer();
  return {
    MarkerClusterer: jest.fn().mockImplementation(() => mockClusterer),
    GridAlgorithm: jest.fn(),
  };
});

// Add this mock before describe block
jest.mock("../../../../utils/mapEventListeners", () => ({
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

  let mockClusterer: MockClusterer;

  beforeEach(() => {
    jest.clearAllMocks();
    const { MarkerClusterer } = require("@googlemaps/markerclusterer");
    mockClusterer = new MarkerClusterer();

    // Set up the click handler
    mockClusterer.addListener("click", (marker: any) => {
      if (marker.userData && marker.userData.streamId) {
        mockOnMarkerClick(Number(marker.userData.streamId), marker.sessionId);
      }
    });
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

  describe("threshold-based color changes", () => {
    it("updates marker colors when thresholds change", async () => {
      // Initial render with default thresholds
      const { rerender } = testRenderer(
        <FixedMarkers
          sessions={mockSessions}
          onMarkerClick={mockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );

      // Mock the useAppSelector to return different thresholds
      jest
        .spyOn(require("../../../../store/hooks"), "useAppSelector")
        .mockImplementation((selector) => {
          if (
            selector ===
            require("../../../../store/thresholdSlice").selectThresholds
          ) {
            return { low: 30, middle: 60, high: 90, min: 0, max: 100 };
          }
          return {
            cluster: { visible: false, clusterAverage: 0, clusterSize: 0 },
            thresholds: { low: 30, middle: 60, high: 90, min: 0, max: 100 },
            map: { hoverStreamId: null },
          };
        });

      await act(async () => {
        rerender(
          <FixedMarkers
            sessions={mockSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={null}
          />
        );
      });

      // Verify that updateMarkerOverlays was called with new thresholds
      expect(mockClusterer.addMarkers).toHaveBeenCalled();
    });

    it("handles markers in different threshold ranges", async () => {
      const sessionsInDifferentRanges: FixedSession[] = [
        {
          id: 1,
          point: { lat: 40.7128, lng: -74.006, streamId: "1" },
          averageValue: 20, // Low range
          lastMeasurementValue: 20,
          time: 1714857600,
        },
        {
          id: 2,
          point: { lat: 34.0522, lng: -118.2437, streamId: "2" },
          averageValue: 50, // Middle range
          lastMeasurementValue: 50,
          time: 1714857600,
        },
        {
          id: 3,
          point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
          averageValue: 80, // High range
          lastMeasurementValue: 80,
          time: 1714857600,
        },
      ];

      await act(async () => {
        testRenderer(
          <FixedMarkers
            sessions={sessionsInDifferentRanges}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={null}
          />
        );
      });

      expect(mockClusterer.addMarkers).toHaveBeenCalled();
      const lastCall =
        mockClusterer.addMarkers.mock.calls[
          mockClusterer.addMarkers.mock.calls.length - 1
        ];
      expect(lastCall[0].length).toBe(sessionsInDifferentRanges.length);
    });

    it("handles edge cases in threshold ranges", async () => {
      const edgeCaseSessions: FixedSession[] = [
        {
          id: 1,
          point: { lat: 40.7128, lng: -74.006, streamId: "1" },
          averageValue: 0, // Minimum value
          lastMeasurementValue: 0,
          time: 1714857600,
        },
        {
          id: 2,
          point: { lat: 34.0522, lng: -118.2437, streamId: "2" },
          averageValue: 100, // Maximum value
          lastMeasurementValue: 100,
          time: 1714857600,
        },
        {
          id: 3,
          point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
          averageValue: -10, // Below minimum
          lastMeasurementValue: -10,
          time: 1714857600,
        },
        {
          id: 4,
          point: { lat: 42.3601, lng: -71.0589, streamId: "4" },
          averageValue: 110, // Above maximum
          lastMeasurementValue: 110,
          time: 1714857600,
        },
      ];

      await act(async () => {
        testRenderer(
          <FixedMarkers
            sessions={edgeCaseSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={null}
          />
        );
      });

      expect(mockClusterer.addMarkers).toHaveBeenCalled();
      const lastCall =
        mockClusterer.addMarkers.mock.calls[
          mockClusterer.addMarkers.mock.calls.length - 1
        ];
      expect(lastCall[0].length).toBe(edgeCaseSessions.length);
    });
  });

  describe("marker pulsation", () => {
    it("pulsates marker when hovering over session list tile", async () => {
      // Initial render without pulsation
      const { rerender } = testRenderer(
        <FixedMarkers
          sessions={mockSessions}
          onMarkerClick={mockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );

      // Rerender with pulsatingSessionId set to first session
      await act(async () => {
        rerender(
          <FixedMarkers
            sessions={mockSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={1} // First session's ID
          />
        );
      });

      // Rerender with pulsatingSessionId set to second session
      await act(async () => {
        rerender(
          <FixedMarkers
            sessions={mockSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={2} // Second session's ID
          />
        );
      });

      // Rerender with pulsatingSessionId set back to null
      await act(async () => {
        rerender(
          <FixedMarkers
            sessions={mockSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={null}
          />
        );
      });
    });

    it("handles pulsation with clustered markers", async () => {
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
          point: { lat: 40.7129, lng: -74.007, streamId: "2" },
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
            pulsatingSessionId={1}
          />
        );
      });
    });
  });

  describe("marker click behavior", () => {
    let mockClusterer: MockClusterer;
    let mockOnMarkerClick: jest.Mock;
    let mockMap: any;

    beforeEach(() => {
      jest.clearAllMocks();
      const { MarkerClusterer } = require("@googlemaps/markerclusterer");
      mockClusterer = new MarkerClusterer();
      mockOnMarkerClick = jest.fn();

      // Set up the mock map
      mockMap = {
        panTo: jest.fn(),
        setZoom: jest.fn(),
        getZoom: jest.fn(() => 14),
        addListener: jest.fn((event, callback) => {
          (window as any).mapListeners = (window as any).mapListeners || {};
          (window as any).mapListeners[event] = callback;
          return { remove: jest.fn() };
        }),
        getBounds: jest.fn(() => ({
          getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
          getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
          contains: jest.fn(() => true),
        })),
      };

      // Mock the useMap hook to return our mock map
      jest
        .spyOn(require("@vis.gl/react-google-maps"), "useMap")
        .mockReturnValue(mockMap);
    });

    it("opens session details modal when clicking a marker", async () => {
      // Set up the click handler
      mockClusterer.addListener("click", (marker: any) => {
        if (marker.userData && marker.userData.streamId) {
          mockOnMarkerClick(Number(marker.userData.streamId), marker.sessionId);
        }
      });

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

      // Create a mock marker
      const mockMarker = {
        position: mockSessions[0].point,
        userData: { streamId: mockSessions[0].point.streamId },
        sessionId: mockSessions[0].id,
        getPosition: jest.fn(() => mockSessions[0].point),
      };

      // Simulate marker click
      const clickHandler = (mockClusterer as any).click;
      if (clickHandler) {
        clickHandler(mockMarker);
      }

      // Verify that onMarkerClick was called with the correct streamId and sessionId
      expect(mockOnMarkerClick).toHaveBeenCalledWith(
        Number(mockSessions[0].point.streamId),
        mockSessions[0].id
      );
    });

    it("centers map on marker when clicked", async () => {
      mockClusterer.addListener("click", (marker: any) => {
        if (marker.userData && marker.userData.streamId) {
          mockOnMarkerClick(Number(marker.userData.streamId), marker.sessionId);
          mockMap.panTo(marker.position);
          mockMap.setZoom(ZOOM_FOR_SELECTED_SESSION);
        }
      });

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

      const mockMarker = {
        position: mockSessions[0].point,
        userData: { streamId: mockSessions[0].point.streamId },
        sessionId: mockSessions[0].id,
        getPosition: jest.fn(() => mockSessions[0].point),
      };

      const clickHandler = (mockClusterer as any).click;
      if (clickHandler) {
        clickHandler(mockMarker);
      }

      // Verify that map was centered on the marker's position
      expect(mockMap.panTo).toHaveBeenCalledWith(mockSessions[0].point);
      expect(mockMap.setZoom).toHaveBeenCalledWith(ZOOM_FOR_SELECTED_SESSION);
    });
  });
});
