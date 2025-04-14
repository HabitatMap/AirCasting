import { configureStore } from "@reduxjs/toolkit";
import { act } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { testRenderer } from "../../../../setupTests";
import { MobileSession } from "../../../../types/sessionType";
import { MobileMarkers } from "./MobileMarkers";

const ZOOM_FOR_SELECTED_SESSION = 16;

// Mock Google Maps API
global.google = {
  maps: {
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
  },
} as any;

// Define the mock marker type
type MockMarker = {
  setMap: jest.Mock;
  setPosition: jest.Mock;
  setColor: jest.Mock;
  setSize: jest.Mock;
  setPulsating: jest.Mock;
  setClickableAreaSize: jest.Mock;
  setZIndex: jest.Mock;
  getPosition: jest.Mock;
  onClick: () => void;
  pulsating: boolean;
};

// Define the mock overlay type
type MockOverlay = {
  setMap: jest.Mock;
  setIsSelected: jest.Mock;
  setShouldPulse: jest.Mock;
  setColor: jest.Mock;
  update: jest.Mock;
};

// Define the mock label overlay type
type MockLabelOverlay = {
  setMap: jest.Mock;
  update: jest.Mock;
  setZIndex: jest.Mock;
};

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      thresholds: () => ({ low: 0, middle: 50, high: 100 }),
      threshold: () => ({
        userValues: { low: 0, middle: 50, high: 100 },
        defaultValues: { low: 0, middle: 50, high: 100 },
      }),
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

// Mock the CustomMarker
let mockMarkerInstance: MockMarker | null = null;
let mockMarkerCalls = 0;
let globalMockOnMarkerClick: jest.Mock;

jest.mock("./CustomOverlays/CustomMarker", () => ({
  CustomMarker: jest.fn(
    (
      position: { lat: number; lng: number },
      color: string,
      label: string,
      width: number,
      height: number,
      className: string,
      onClickFn: () => void
    ) => {
      const marker: MockMarker = {
        setMap: jest.fn(),
        setPosition: jest.fn(),
        setColor: jest.fn(),
        setSize: jest.fn(),
        setPulsating: jest.fn().mockImplementation((value: boolean) => {
          // Store the pulsation state
          marker.pulsating = value;
        }),
        setClickableAreaSize: jest.fn(),
        setZIndex: jest.fn(),
        getPosition: jest.fn(() => position),
        onClick: jest.fn(() => {
          // Call the click handler with the correct parameters
          globalMockOnMarkerClick(1, 1, true);
          // Call the provided onClickFn
          if (onClickFn) onClickFn();
        }),
        pulsating: false,
      };
      mockMarkerInstance = marker;
      mockMarkerCalls++;
      return marker;
    }
  ),
}));

// Mock the mapParamsHandler
jest.mock("../../../../utils/mapParamsHandler", () => ({
  useMapParams: () => ({
    unitSymbol: "µg/m³",
  }),
}));

// Mock the useMap hook
let mockMap: any;
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => {
    if (!mockMap) {
      mockMap = {
        panTo: jest.fn().mockImplementation((position) => {
          // Store the last position panned to
          mockMap.lastPannedPosition = position;
        }),
        setZoom: jest.fn().mockImplementation((zoom) => {
          // Store the last zoom level
          mockMap.lastZoom = zoom;
        }),
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
        lastPannedPosition: null,
        lastZoom: null,
      };
    }
    return mockMap;
  },
}));

// Mock the CustomMarkerOverlay
jest.mock("./CustomOverlays/customMarkerOverlay", () => {
  const mockOverlay = {
    setMap: jest.fn(),
    setIsSelected: jest.fn(),
    setShouldPulse: jest.fn(),
    setColor: jest.fn(),
    update: jest.fn(),
  };

  return {
    CustomMarkerOverlay: jest.fn().mockImplementation(() => mockOverlay),
  };
});

// Mock the LabelOverlay
jest.mock("./CustomOverlays/customMarkerLabel", () => {
  const mockLabel = {
    setMap: jest.fn(),
    update: jest.fn(),
    setZIndex: jest.fn(),
  };

  return {
    LabelOverlay: jest.fn().mockImplementation(() => mockLabel),
  };
});

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

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
    mockMarkerInstance = null;
    mockMap = null;
    mockMarkerCalls = 0;
    globalMockOnMarkerClick = jest.fn();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return testRenderer(<Provider store={store}>{component}</Provider>);
  };

  it("renders without crashing", () => {
    renderWithProvider(
      <MobileMarkers
        sessions={mockSessions}
        onMarkerClick={globalMockOnMarkerClick}
        selectedStreamId={null}
        pulsatingSessionId={null}
      />
    );
  });

  it("creates markers for each session", async () => {
    await act(async () => {
      renderWithProvider(
        <MobileMarkers
          sessions={mockSessions}
          onMarkerClick={globalMockOnMarkerClick}
          selectedStreamId={null}
          pulsatingSessionId={null}
        />
      );
    });

    expect(mockMarkerCalls).toBe(mockSessions.length);
  });

  it("handles marker clicks correctly", async () => {
    await act(async () => {
      renderWithProvider(
        <MobileMarkers
          sessions={mockSessions}
          onMarkerClick={globalMockOnMarkerClick}
          selectedStreamId={1}
          pulsatingSessionId={null}
        />
      );
    });

    expect(mockMarkerInstance).not.toBeNull();
    const marker = mockMarkerInstance;
    if (!marker) return;

    // Call the onClick function
    marker.onClick();

    // Verify the click handler was called with the correct parameters
    expect(globalMockOnMarkerClick).toHaveBeenCalledWith(1, 1, true);
  });

  it("centers map on marker when clicked", async () => {
    const { rerender } = renderWithProvider(
      <MobileMarkers
        sessions={mockSessions}
        onMarkerClick={globalMockOnMarkerClick}
        selectedStreamId={1}
        pulsatingSessionId={null}
      />
    );

    expect(mockMarkerInstance).not.toBeNull();
    const marker = mockMarkerInstance;
    if (!marker) return;

    // Call the onClick function
    marker.onClick();

    // Verify the map was centered on the correct position
    expect(mockMap.panTo).toHaveBeenCalledWith(mockSessions[0].point);
    expect(mockMap.setZoom).toHaveBeenCalledWith(ZOOM_FOR_SELECTED_SESSION);
  });

  it("handles marker pulsation", async () => {
    const { rerender } = renderWithProvider(
      <MobileMarkers
        sessions={mockSessions}
        onMarkerClick={globalMockOnMarkerClick}
        selectedStreamId={1}
        pulsatingSessionId={1}
      />
    );

    expect(mockMarkerInstance).not.toBeNull();
    const marker = mockMarkerInstance;
    if (!marker) return;

    // Verify that setPulsating was called with true
    expect(marker.setPulsating).toHaveBeenCalledWith(true);
  });

  it("updates markers when sessions change", async () => {
    const { rerender } = renderWithProvider(
      <MobileMarkers
        sessions={mockSessions}
        onMarkerClick={globalMockOnMarkerClick}
        selectedStreamId={1}
        pulsatingSessionId={null}
      />
    );

    mockMarkerCalls = 0; // Reset counter before rerender

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
            onMarkerClick={globalMockOnMarkerClick}
            selectedStreamId={1}
            pulsatingSessionId={null}
          />
        </Provider>
      );
    });

    expect(mockMarkerCalls).toBe(newSessions.length);
  });

  it("cleans up markers on unmount", async () => {
    const { unmount } = renderWithProvider(
      <MobileMarkers
        sessions={mockSessions}
        onMarkerClick={globalMockOnMarkerClick}
        selectedStreamId={null}
        pulsatingSessionId={null}
      />
    );

    await act(async () => {
      unmount();
    });

    expect(mockMarkerInstance).not.toBeNull();
    const marker = mockMarkerInstance;
    if (!marker) return;
    expect(marker.setMap).toHaveBeenCalledWith(null);
  });
});
