import { configureStore } from "@reduxjs/toolkit";
import { act, render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import type { MobileSession } from "../../../../types/sessionType";
import { MobileMarkers } from "./MobileMarkers";

const ZOOM_FOR_SELECTED_SESSION = 16;

// Mock Google Maps API
global.google = {
  maps: {
    OverlayView: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      draw: jest.fn(),
      onAdd: jest.fn(),
      onRemove: jest.fn(),
    })),
    LatLngBounds: jest.fn().mockImplementation((southwest, northeast) => ({
      extend: jest.fn(),
      getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
      getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
      contains: jest.fn(() => true),
    })),
    LatLng: jest.fn().mockImplementation((lat, lng) => ({
      lat: () => lat,
      lng: () => lng,
    })),
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      remove: jest.fn(),
    },
    Rectangle: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      getBounds: jest.fn(),
    })),
  },
} as any;

// Mock CustomMarker
let mockMarkerInstances: any[] = [];
let mockMarkerClickHandlers: Function[] = [];

jest.mock("./CustomOverlays/CustomMarker", () => {
  return {
    CustomMarker: jest
      .fn()
      .mockImplementation(
        (
          position,
          color,
          label,
          width,
          height,
          className,
          _,
          __,
          clickHandler
        ) => {
          // Store the click handler for later use
          mockMarkerClickHandlers.push(clickHandler);

          const marker = {
            setMap: jest.fn(),
            setPosition: jest.fn(),
            setColor: jest.fn(),
            setSize: jest.fn(),
            setPulsating: jest.fn().mockImplementation((value: boolean) => {
              marker.pulsating = value;
            }),
            setClickableAreaSize: jest.fn(),
            setZIndex: jest.fn(),
            getPosition: jest.fn(() => position),
            onClick: () => {
              if (typeof clickHandler === "function") {
                clickHandler();
              }
            },
            pulsating: false,
            position,
          };
          mockMarkerInstances.push(marker);
          return marker;
        }
      ),
  };
});

// Mock CustomMarkerOverlay
jest.mock("./CustomOverlays/customMarkerOverlay", () => {
  return {
    CustomMarkerOverlay: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      setIsSelected: jest.fn(),
      setShouldPulse: jest.fn(),
      setColor: jest.fn(),
      update: jest.fn(),
    })),
  };
});

// Mock LabelOverlay
jest.mock("./CustomOverlays/customMarkerLabel", () => {
  return {
    LabelOverlay: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      update: jest.fn(),
      setZIndex: jest.fn(),
    })),
  };
});

// Mock useMap hook
let mockMap: any;
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => {
    if (!mockMap) {
      mockMap = {
        panTo: jest.fn(),
        setZoom: jest.fn(),
        getZoom: jest.fn(() => 14),
        addListener: jest.fn(),
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
        setCenter: jest.fn(),
      };
    }
    return mockMap;
  },
}));

// Mock useMapParams
jest.mock("../../../../utils/mapParamsHandler", () => ({
  useMapParams: () => ({
    unitSymbol: "µg/m³",
  }),
}));

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      threshold: () => ({
        userValues: { low: 0, middle: 50, high: 100, max: 150 },
        defaultValues: { low: 0, middle: 50, high: 100, max: 150 },
      }),
      thresholds: () => ({ low: 0, middle: 50, high: 100 }),
      markersLoading: () => false,
      mobileStream: () => ({
        data: {
          minLatitude: 34,
          maxLatitude: 40,
          minLongitude: -118,
          maxLongitude: -74,
        },
        status: "success",
      }),
      mobileStreamData: () => ({
        minLatitude: 34,
        maxLatitude: 40,
        minLongitude: -118,
        maxLongitude: -74,
      }),
      mobileStreamStatus: () => "success",
    },
  });
};

describe("MobileMarkers", () => {
  const mockSessions: MobileSession[] = [
    {
      id: 1,
      point: { lat: 40.7128, lng: -74.006, streamId: "1" },
      lastMeasurementValue: 55,
      time: 1714857600,
    },
    {
      id: 2,
      point: { lat: 34.0522, lng: -118.2437, streamId: "2" },
      lastMeasurementValue: 80,
      time: 1714857600,
    },
  ];

  let store: ReturnType<typeof createMockStore>;
  let mockOnMarkerClick: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
    mockMarkerInstances = [];
    mockMarkerClickHandlers = [];
    mockMap = {
      panTo: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(() => 14),
      addListener: jest.fn(),
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
      setCenter: jest.fn(),
    };
    mockOnMarkerClick = jest.fn();
  });

  const renderComponent = (props: any) => {
    return render(
      <Provider store={store}>
        <MobileMarkers {...props} />
      </Provider>
    );
  };

  it("renders without crashing", () => {
    renderComponent({
      sessions: mockSessions,
      onMarkerClick: mockOnMarkerClick,
      selectedStreamId: null,
      pulsatingSessionId: null,
    });
  });

  it("creates markers for each session", async () => {
    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: null,
      });
    });

    // Check if CustomMarker was called for each session
    expect(
      require("./CustomOverlays/CustomMarker").CustomMarker
    ).toHaveBeenCalledTimes(mockSessions.length);
    expect(mockMarkerInstances.length).toBe(mockSessions.length);
  });

  it("sets markers on the map", async () => {
    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: null,
      });
    });

    // Check if setMap was called for each marker
    mockMarkerInstances.forEach((marker) => {
      expect(marker.setMap).toHaveBeenCalled();
    });
  });

  it("sets pulsating state for markers with matching pulsatingSessionId", async () => {
    const pulsatingId = 1;

    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: pulsatingId,
      });
    });

    // Find the marker that should be pulsating
    const pulsatingMarker = mockMarkerInstances.find(
      (_, index) => mockSessions[index].id === pulsatingId
    );

    // Check if setPulsating was called with true for the matching marker
    expect(pulsatingMarker?.setPulsating).toHaveBeenCalledWith(true);
    expect(pulsatingMarker?.pulsating).toBe(true);

    // Other markers should not be pulsating
    mockMarkerInstances.forEach((marker, index) => {
      if (mockSessions[index].id !== pulsatingId) {
        expect(marker.pulsating).toBe(false);
      }
    });
  });

  it("handles marker click events", async () => {
    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: null,
      });
    });

    // Directly invoke the click handler that was passed to the CustomMarker
    await act(async () => {
      // Make sure we have click handlers
      expect(mockMarkerClickHandlers.length).toBeGreaterThan(0);
      // Call the first marker's click handler
      mockMarkerClickHandlers[0]();
    });

    // Check if onMarkerClick was called
    expect(mockOnMarkerClick).toHaveBeenCalled();
    expect(mockMap.setCenter).toHaveBeenCalled();
    expect(mockMap.setZoom).toHaveBeenCalledWith(ZOOM_FOR_SELECTED_SESSION);
  });

  it("updates markers when sessions change", async () => {
    const { rerender } = renderComponent({
      sessions: mockSessions,
      onMarkerClick: mockOnMarkerClick,
      selectedStreamId: null,
      pulsatingSessionId: null,
    });

    const initialMarkerCount = mockMarkerInstances.length;

    // Add a new session
    const newSessions = [
      ...mockSessions,
      {
        id: 3,
        point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
        lastMeasurementValue: 65,
        time: 1714857600,
      },
    ];

    await act(async () => {
      rerender(
        <Provider store={store}>
          <MobileMarkers
            sessions={newSessions}
            onMarkerClick={mockOnMarkerClick}
            selectedStreamId={null}
            pulsatingSessionId={null}
          />
        </Provider>
      );
    });

    // Check if a new marker was created
    expect(mockMarkerInstances.length).toBeGreaterThan(initialMarkerCount);
  });

  it("cleans up markers on unmount", async () => {
    const { unmount } = renderComponent({
      sessions: mockSessions,
      onMarkerClick: mockOnMarkerClick,
      selectedStreamId: null,
      pulsatingSessionId: null,
    });

    await act(async () => {
      unmount();
    });

    // Check if setMap(null) was called for each marker
    mockMarkerInstances.forEach((marker) => {
      expect(marker.setMap).toHaveBeenCalledWith(null);
    });
  });

  it("centers map on bounds when selectedStreamId changes", async () => {
    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: 1,
        pulsatingSessionId: null,
      });
    });
    // Check if fitBounds or setCenter was called
    expect(
      mockMap.fitBounds.mock.calls.length > 0 ||
        mockMap.setCenter.mock.calls.length > 0
    ).toBe(true);
  });

  it("handles overlapping markers correctly", async () => {
    // Create sessions with very close coordinates to trigger the overlapping logic
    const overlappingSessions = [
      {
        id: 1,
        point: { lat: 40.7128, lng: -74.006, streamId: "1" },
        lastMeasurementValue: 55,
        time: 1714857600,
      },
      {
        id: 2,
        point: { lat: 40.7129, lng: -74.0061, streamId: "2" },
        lastMeasurementValue: 80,
        time: 1714857600,
      },
    ];

    mockMap = {
      ...mockMap,
      getZoom: jest.fn(() => 18),
    };

    await act(async () => {
      renderComponent({
        sessions: overlappingSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: null,
      });
    });

    expect(mockMarkerInstances.length).toBe(overlappingSessions.length);
  });

  it("updates marker colors based on threshold values", async () => {
    await act(async () => {
      renderComponent({
        sessions: mockSessions,
        onMarkerClick: mockOnMarkerClick,
        selectedStreamId: null,
        pulsatingSessionId: null,
      });
    });

    mockMarkerInstances.forEach((marker) => {
      expect(marker.setColor).toHaveBeenCalled();
    });
  });
});
