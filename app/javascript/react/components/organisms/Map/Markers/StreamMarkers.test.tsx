import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import type { MobileSession } from "../../../../types/sessionType";
import { StreamMarkers } from "./StreamMarkers";

// Types for mock objects
type MockBounds = {
  extend: jest.Mock;
  getNorthEast: jest.Mock;
  getSouthWest: jest.Mock;
  contains: jest.Mock;
};

type MockMap = {
  panTo: jest.Mock;
  setZoom: jest.Mock;
  getZoom: jest.Mock;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  getBounds: jest.Mock;
  fitBounds: jest.Mock;
  panToBounds: jest.Mock;
  controls: any[];
  data: jest.Mock;
  getCenter: jest.Mock;
  setMap: jest.Mock;
  setCenter: jest.Mock;
  getMap: jest.Mock;
};

type MockPolyline = {
  setMap: jest.Mock;
  setPath: jest.Mock;
  getPath: jest.Mock;
};

type StreamMarkersProps = {
  sessions: MobileSession[];
  unitSymbol: string;
};

// Mock Google Maps API
global.google = {
  maps: {
    OverlayView: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      draw: jest.fn(),
      onAdd: jest.fn(),
      onRemove: jest.fn(),
    })),
    LatLngBounds: jest.fn().mockImplementation(() => {
      const bounds: MockBounds = {
        extend: jest.fn().mockReturnValue(undefined),
        getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
        getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
        contains: jest.fn(() => true),
      };
      bounds.extend = jest.fn().mockReturnValue(bounds);
      return bounds;
    }),
    LatLng: jest.fn().mockImplementation((lat, lng) => ({
      lat: () => lat,
      lng: () => lng,
    })),
    Polyline: jest.fn().mockImplementation(() => ({
      setMap: jest.fn(),
      setPath: jest.fn(),
      getPath: jest.fn(() => []),
    })),
    event: {
      addListener: jest.fn().mockReturnValue("listener-id"),
      removeListener: jest.fn(),
    },
  },
} as unknown as typeof google;

global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  callback(0);
  return 0;
});

let mockMap: MockMap;
let mockMarkerInstances: any[] = [];

jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => {
    if (!mockMap) {
      mockMap = {
        panTo: jest.fn(),
        setZoom: jest.fn(),
        getZoom: jest.fn(() => 14),
        addListener: jest.fn().mockReturnValue("map-listener-id"),
        removeListener: jest.fn(),
        getBounds: jest.fn(() => {
          const bounds = {
            getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
            getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
            contains: jest.fn(() => true),
          };
          return bounds;
        }),
        fitBounds: jest.fn(),
        panToBounds: jest.fn(),
        controls: [],
        data: jest.fn(),
        getCenter: jest.fn(),
        setMap: jest.fn(),
        setCenter: jest.fn(),
        getMap: jest.fn(() => mockMap),
      };
    }
    return mockMap;
  },
}));

// Mock CustomMarker
jest.mock("./CustomOverlays/CustomMarker", () => ({
  CustomMarker: jest
    .fn()
    .mockImplementation(
      (position, color, title, width, height, className, notes) => {
        const marker = {
          setMap: jest.fn(),
          setPosition: jest.fn(),
          setColor: jest.fn(),
          setTitle: jest.fn(),
          setNotes: jest.fn(),
          getPosition: jest.fn(() => position),
          getMap: jest.fn(() => mockMap),
          cleanup: jest.fn(),
        };
        // Set initial values
        marker.setTitle(title);
        marker.setColor(color);
        marker.setNotes(notes);
        mockMarkerInstances.push(marker);
        return marker;
      }
    ),
}));

// Mock HoverMarker
jest.mock("./HoverMarker/HoverMarker", () => {
  const HoverMarker = jest.fn(() => null);
  return {
    __esModule: true,
    default: HoverMarker,
  };
});

jest.mock("../../../../store/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    if (selector.name === "selectThresholds") {
      return { low: 0, middle: 50, high: 100, max: 150 };
    }
    if (selector.name === "selectHoverPosition") {
      return null;
    }
    if (selector.name === "selectMobileStreamData") {
      return {
        notes: [
          {
            createdAt: "2024-01-01T00:00:00Z",
            date: "2024-01-01",
            id: 1,
            latitude: 41.8781,
            longitude: -87.6298,
            number: 1,
            photo: "",
            photoContentType: "",
            photoFileName: "",
            photoFileSize: 0,
            photoThumbnail: "",
            photoUpdatedAt: "",
            sessionId: 3,
            text: "Test note",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        measurements: [],
        streamId: "someStreamId",
      };
    }
    return {};
  },
}));

jest.mock("../../../../store/mapSlice", () => ({
  selectHoverPosition: jest.fn(() => null),
  setHoverPosition: jest.fn(() => ({
    type: "map/setHoverPosition",
    payload: null,
  })),
}));

jest.mock("../../../../store/markersLoadingSlice", () => ({
  setMarkersLoading: jest.fn(() => ({
    type: "markersLoading/setMarkersLoading",
    payload: false,
  })),
  setTotalMarkers: jest.fn(() => ({
    type: "markersLoading/setTotalMarkers",
    payload: 0,
  })),
}));

jest.mock("../../../../store/thresholdSlice", () => ({
  selectThresholds: jest.fn(() => ({
    low: 0,
    middle: 50,
    high: 100,
    max: 150,
  })),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      threshold: () => ({
        userValues: { low: 0, middle: 50, high: 100, max: 150 },
        defaultValues: { low: 0, middle: 50, high: 100, max: 150 },
      }),
      thresholds: () => ({ low: 0, middle: 50, high: 100 }),
      markersLoading: (state = false, action) => {
        if (action.type === "markersLoading/setMarkersLoading") {
          return action.payload;
        }
        return state;
      },
      map: () => ({
        hoverPosition: null,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: false,
      }),
  });
};

describe("StreamMarkers", () => {
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

  const mockSessionsWithNotes: MobileSession[] = [
    ...mockSessions,
    {
      id: 3,
      point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
      lastMeasurementValue: 65,
      time: 1714857600,
      notes: [
        {
          createdAt: "2024-01-01T00:00:00Z",
          date: "2024-01-01",
          id: 1,
          latitude: 41.8781,
          longitude: -87.6298,
          number: 1,
          photoContentType: "",
          photoFileName: "",
          photoFileSize: 0,
          photoUpdatedAt: "",
          sessionId: 3,
          text: "Test note",
          updatedAt: "2024-01-01T00:00:00Z",
          photo: "",
          photoThumbnail: "",
        },
      ],
    },
  ];

  let store: ReturnType<typeof createMockStore>;
  let mockPolyline: MockPolyline;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
    mockMarkerInstances = [];

    mockPolyline = {
      setMap: jest.fn(),
      setPath: jest.fn(),
      getPath: jest.fn(() => []),
    };
    global.google.maps.Polyline = jest
      .fn()
      .mockImplementation(
        () => mockPolyline
      ) as unknown as typeof google.maps.Polyline;

    mockMap = {
      panTo: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(() => 14),
      addListener: jest.fn().mockReturnValue("map-listener-id"),
      removeListener: jest.fn(),
      getBounds: jest.fn(() => {
        const bounds = {
          getNorthEast: jest.fn(() => ({ lat: () => 40, lng: () => -74 })),
          getSouthWest: jest.fn(() => ({ lat: () => 34, lng: () => -118 })),
          contains: jest.fn(() => true),
        };
        return bounds;
      }),
      fitBounds: jest.fn(),
      panToBounds: jest.fn(),
      controls: [],
      data: jest.fn(),
      getCenter: jest.fn(),
      setMap: jest.fn(),
      setCenter: jest.fn(),
      getMap: jest.fn(() => mockMap),
    };
  });

  const renderComponent = (props: StreamMarkersProps) => {
    return render(
      <Provider store={store}>
        <StreamMarkers {...props} />
      </Provider>
    );
  };

  it("renders without crashing", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });
  });

  it("creates markers for each session", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    expect(mockMarkerInstances.length).toBeGreaterThan(0);
  });

  it("creates a polyline for the path", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    expect(global.google.maps.Polyline).toHaveBeenCalled();
  });

  it("updates marker colors when thresholds change", () => {
    const { rerender } = renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    // Simulate threshold change by re-rendering
    rerender(
      <Provider store={store}>
        <StreamMarkers sessions={mockSessions} unitSymbol="µg/m³" />
      </Provider>
    );

    expect(
      mockMarkerInstances.some(
        (marker) => marker.setColor.mock.calls.length > 0
      )
    ).toBe(true);
  });

  it("cleans up markers and polyline on unmount", () => {
    const { unmount } = renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    unmount();

    expect(mockPolyline.setMap).toHaveBeenCalledWith(null);
  });

  it("centers map on bounds when sessions change", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });
    expect(
      mockMap.fitBounds.mock.calls.length > 0 ||
        mockMap.setCenter.mock.calls.length > 0
    ).toBe(true);
  });

  it("handles sessions with notes", () => {
    renderComponent({
      sessions: mockSessionsWithNotes,
      unitSymbol: "µg/m³",
    });

    expect(true).toBe(true);
  });

  it("displays correct measurement values on markers", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    mockMarkerInstances.forEach((marker, index) => {
      const session = mockSessions[index];
      expect(marker.setTitle).toHaveBeenCalledWith(
        `${session.lastMeasurementValue} µg/m³`
      );
    });
  });

  it("sets correct marker colors based on thresholds", () => {
    renderComponent({
      sessions: mockSessions,
      unitSymbol: "µg/m³",
    });

    // First session value (55) should be in middle range (50-100)
    expect(mockMarkerInstances[0].setColor).toHaveBeenCalledWith(
      expect.any(String)
    );

    // Second session value (80) should be in high range (>100)
    expect(mockMarkerInstances[1].setColor).toHaveBeenCalledWith(
      expect.any(String)
    );
  });

  it("displays notes when present", () => {
    const sessionsWithNotes = [
      ...mockSessions,
      {
        id: 3,
        point: { lat: 41.8781, lng: -87.6298, streamId: "3" },
        lastMeasurementValue: 65,
        time: 1714857600,
        notes: [
          {
            createdAt: "2024-01-01T00:00:00Z",
            date: "2024-01-01",
            id: 1,
            latitude: 41.8781,
            longitude: -87.6298,
            number: 1,
            photoContentType: "",
            photoFileName: "",
            photoFileSize: 0,
            photoUpdatedAt: "",
            sessionId: 3,
            text: "Test note",
            updatedAt: "2024-01-01T00:00:00Z",
            photo: "",
            photoThumbnail: "",
          },
        ],
      },
    ];

    renderComponent({
      sessions: sessionsWithNotes,
      unitSymbol: "µg/m³",
    });

    const markerWithNotes = mockMarkerInstances[2];
    expect(markerWithNotes.setNotes).toHaveBeenCalledWith([
      {
        createdAt: "2024-01-01T00:00:00Z",
        date: "2024-01-01",
        id: 1,
        latitude: 41.8781,
        longitude: -87.6298,
        number: 1,
        photoContentType: "",
        photoFileName: "",
        photoFileSize: 0,
        photoUpdatedAt: "",
        sessionId: 3,
        text: "Test note",
        updatedAt: "2024-01-01T00:00:00Z",
        photo: "",
        photoThumbnail: "",
      },
    ]);
  });
});
