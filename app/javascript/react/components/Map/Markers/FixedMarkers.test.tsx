import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { renderWithProvider } from "../../../setupTests";
import { StatusEnum } from "../../../types/api";
import { UserSettings } from "../../../types/userStates";
import { FixedMarkers } from "./FixedMarkers";

// Mock the map hook
jest.mock("@vis.gl/react-google-maps", () => ({
  useMap: jest.fn(),
}));

// Mock map instance
const mockMap = {
  panTo: jest.fn(),
  setZoom: jest.fn(),
  getZoom: jest.fn(() => 14),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  getBounds: jest.fn(),
};

describe("FixedMarkers", () => {
  const mockStore = configureStore([]);

  const defaultProps = {
    sessions: [
      {
        id: 1,
        averageValue: 50,
        lastMeasurementValue: 55,
        point: {
          lat: 51.5074,
          lng: -0.1278,
          streamId: "1",
        },
      },
    ],
    onMarkerClick: jest.fn(),
    selectedStreamId: null,
    pulsatingSessionId: null,
  };

  const initialState = {
    cluster: {
      average: null,
      visible: false,
    },
    thresholds: {
      low: 30,
      middle: 50,
      high: 70,
    },
    map: {
      hoverStreamId: null,
    },
    fixedStream: {
      data: null,
      status: StatusEnum.Idle,
      isLoading: false,
    },
    markersLoading: {
      isLoading: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMap as jest.Mock).mockReturnValue(mockMap);
  });

  it("renders without crashing", () => {
    const store = mockStore(initialState);
    renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} />
      </Provider>
    );
  });

  it("handles selected stream correctly", () => {
    const store = mockStore({
      ...initialState,
      fixedStream: {
        data: {
          stream: {
            latitude: 51.5074,
            longitude: -0.1278,
          },
        },
        status: StatusEnum.Fulfilled,
      },
    });

    renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} selectedStreamId={1} />
      </Provider>
    );

    expect(mockMap.panTo).toHaveBeenCalled();
    expect(mockMap.setZoom).toHaveBeenCalled();
  });

  it("handles hover state correctly", () => {
    const store = mockStore({
      ...initialState,
      map: {
        hoverStreamId: 1,
      },
    });

    const { container } = renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} />
      </Provider>
    );

    // HoverMarker should be rendered when hoverStreamId matches a session
    expect(
      container.querySelector("[data-testid='hover-marker']")
    ).toBeTruthy();
  });

  it("cleans up on mode change", () => {
    const store = mockStore({
      ...initialState,
      userSettings: UserSettings.MapView,
    });

    const { rerender } = renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} />
      </Provider>
    );

    // Change to timelapse mode
    renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} />
      </Provider>
    );

    // Verify map was cleaned up
    expect(mockMap.removeListener).toHaveBeenCalled();
  });

  it("updates markers when sessions change", () => {
    const store = mockStore(initialState);
    const { rerender } = renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} />
      </Provider>
    );

    const newSessions = [
      ...defaultProps.sessions,
      {
        id: 2,
        averageValue: 60,
        lastMeasurementValue: 65,
        point: {
          lat: 51.6074,
          lng: -0.1378,
          streamId: "2",
        },
      },
    ];

    renderWithProvider(
      <Provider store={store}>
        <FixedMarkers {...defaultProps} sessions={newSessions} />
      </Provider>
    );
  });

  describe("cluster handling", () => {
    it("handles cluster click correctly", () => {
      const store = mockStore(initialState);

      renderWithProvider(
        <Provider store={store}>
          <FixedMarkers {...defaultProps} onClusterClick={jest.fn()} />
        </Provider>
      );

      // Simulate cluster click event
      const clusterEvent = new CustomEvent("cluster-click", {
        detail: {
          count: 2,
          position: { lat: 51.5074, lng: -0.1278 },
          markers: defaultProps.sessions,
        },
      });
      window.dispatchEvent(clusterEvent);

      const actions = store.getActions();
      expect(actions).toContainEqual(
        expect.objectContaining({
          type: "cluster/setVisibility",
        })
      );
    });
  });
});
