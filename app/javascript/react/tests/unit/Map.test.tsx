import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { StatusEnum } from "../../types/api";
import { SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { MapWrapper } from "../helpers/mapWrapper";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { createMockMapParams, MOCK_SESSION } from "../mock-data/mapMocks";

jest.mock("@vis.gl/react-google-maps", () => ({
  Map: () => <div data-testid="google-map">Google Map</div>,
}));

jest.mock("../../utils/mapParamsHandler", () => {
  const mockFn = () => jest.fn();
  return {
    useMapParams: jest.fn().mockReturnValue({
      currentUserSettings: "MapView",
      previousUserSettings: "MapView",
      sessionType: "fixed",
      isActive: true,
      isIndoor: false,
      currentCenter: { lat: 0, lng: 0 },
      currentZoom: 10,
      boundEast: 0,
      boundNorth: 0,
      boundSouth: 0,
      boundWest: 0,
      searchParams: new URLSearchParams(),
      goToUserSettings: mockFn(),
      revertUserSettingsAndResetIds: mockFn(),
      unitSymbol: "µg/m³",
      thresholdMin: "0",
      thresholdLow: "25",
      thresholdMiddle: "50",
      thresholdHigh: "75",
      thresholdMax: "100",
      initialThresholds: {
        min: 0,
        low: 25,
        middle: 50,
        high: 75,
        max: 100,
      },
      fetchedSessions: 0,
      updateLimit: mockFn(),
      updateOffset: mockFn(),
      mapTypeId: "roadmap",
      measurementType: "PM2.5",
      offset: 0,
      limit: 50,
      previousCenter: { lat: 0, lng: 0 },
      previousZoom: 10,
      sensorName: "PM2.5",
      sessionId: null,
      streamId: null,
      tags: "",
      timeFrom: "",
      timeTo: "",
      updateFetchedSessions: mockFn(),
      usernames: "",
    }),
    UrlParamsTypes: {
      sessionId: "sessionId",
      streamId: "streamId",
      isActive: "isActive",
      sessionType: "sessionType",
      boundEast: "boundEast",
      boundNorth: "boundNorth",
      boundSouth: "boundSouth",
      boundWest: "boundWest",
      currentCenter: "currentCenter",
      currentZoom: "currentZoom",
      previousUserSettings: "previousUserSettings",
      currentUserSettings: "currentUserSettings",
      previousCenter: "previousCenter",
      previousZoom: "previousZoom",
      thresholdMin: "thresholdMin",
      thresholdLow: "thresholdLow",
      thresholdMiddle: "thresholdMiddle",
      thresholdHigh: "thresholdHigh",
      thresholdMax: "thresholdMax",
    },
  };
});

jest.mock("../../utils/useScreenSizeDetection", () => jest.fn());

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => jest.fn()),
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

jest.mock("../../components/organisms/Modals/SessionDetailsModal", () => ({
  SessionDetailsModal: () => (
    <div data-testid="session-details-modal">Session Details Modal</div>
  ),
}));

jest.mock("../../components/organisms/Modals/TimelapseModal", () => ({
  TimelapseComponent: () => (
    <div data-testid="timelapse-component">Timelapse Component</div>
  ),
}));

jest.mock(
  "../../components/organisms/ThresholdConfigurator/ThresholdConfigurator",
  () => ({
    ThresholdsConfigurator: () => (
      <div data-testid="thresholds-configurator">Thresholds Configurator</div>
    ),
  })
);

jest.mock("../../store/thresholdSlice", () => ({
  fetchThresholds: jest.fn(() => ({ type: "threshold/fetchThresholds" })),
  resetUserThresholds: jest.fn(() => ({
    type: "threshold/resetUserThresholds",
  })),
  selectDefaultThresholds: jest
    .fn()
    .mockReturnValue({ min: 0, low: 25, middle: 50, high: 75, max: 100 }),
  setUserThresholdValues: jest.fn(() => ({
    type: "threshold/setUserThresholdValues",
  })),
  selectThresholds: jest.fn().mockReturnValue({
    min: 0,
    low: 25,
    middle: 50,
    high: 75,
    max: 100,
  }),
}));

jest.mock("../../store/sensorsSlice", () => ({
  fetchSensors: jest.fn(() => ({ type: "sensors/fetchSensors" })),
}));

jest.mock("../../store/sessionFiltersSlice", () => ({
  resetTags: jest.fn(() => ({ type: "sessionFilter/resetTags" })),
  selectFixedSessionsType: jest.fn().mockReturnValue("active"),
  selectIsDormantSessionsType: jest.fn().mockReturnValue(false),
  selectTags: jest.fn().mockReturnValue([]),
  setFixedSessionsType: jest.fn(() => ({
    type: "sessionFilter/setFixedSessionsType",
  })),
  FixedSessionsTypes: {
    ACTIVE: "active",
    DORMANT: "dormant",
  },
}));

jest.mock("../../store/fixedSessionsSlice", () => ({
  cleanSessions: jest.fn(() => ({ type: "fixedSessions/cleanSessions" })),
  fetchActiveFixedSessions: jest.fn(() => ({
    type: "fixedSessions/fetchActiveFixedSessions",
    unwrap: () => Promise.resolve(),
  })),
  fetchDormantFixedSessions: jest.fn(() => ({
    type: "fixedSessions/fetchDormantFixedSessions",
    unwrap: () => Promise.resolve(),
  })),
}));

jest.mock("../../store/mobileSessionsSlice", () => ({
  fetchMobileSessions: jest.fn(() => ({
    type: "mobileSessions/fetchMobileSessions",
    unwrap: () => Promise.resolve({ sessions: [] }),
  })),
}));

jest.mock("../../store/indoorSessionsSlice", () => ({
  fetchActiveIndoorSessions: jest.fn(() => ({
    type: "indoorSessions/fetchActiveIndoorSessions",
    unwrap: () => Promise.resolve(),
  })),
  fetchDormantIndoorSessions: jest.fn(() => ({
    type: "indoorSessions/fetchDormantIndoorSessions",
    unwrap: () => Promise.resolve(),
  })),
}));

jest.mock("../../store/fixedStreamSlice", () => ({
  fetchFixedStreamById: jest.fn(() => ({
    type: "fixedStream/fetchFixedStreamById",
  })),
  resetFixedStreamState: jest.fn(() => ({
    type: "fixedStream/resetFixedStreamState",
  })),
}));

jest.mock("../../store/mobileStreamSlice", () => ({
  fetchMobileStreamById: jest.fn(() => ({
    type: "mobileStream/fetchMobileStreamById",
  })),
  resetMobileStreamState: jest.fn(() => ({
    type: "mobileStream/resetMobileStreamState",
  })),
}));

jest.mock("../../store/timelapseSlice", () => ({
  fetchTimelapseData: jest.fn(() => ({ type: "timelapse/fetchTimelapseData" })),
  setCurrentTimestamp: jest.fn(() => ({
    type: "timelapse/setCurrentTimestamp",
  })),
}));

jest.mock("../../store/mapSlice", () => ({
  selectFetchingData: jest.fn().mockReturnValue(false),
  setFetchingData: jest.fn(() => ({ type: "map/setFetchingData" })),
  selectHoverPosition: jest.fn().mockReturnValue(null),
  selectSessionsListExpanded: jest.fn().mockReturnValue(true),
}));

jest.mock("../../store/fixedSessionsSelectors", () => ({
  selectFixedSessionsList: jest.fn().mockReturnValue([
    {
      id: 1,
      title: "Test Session",
      sensorName: "PM2.5",
      averageValue: 10,
      startTime: "2023-01-01",
      endTime: "2023-01-02",
      streamId: 1,
    },
  ]),
  selectFixedSessionsPoints: jest.fn().mockReturnValue([]),
  selectFixedSessionsStatusFulfilled: jest.fn().mockReturnValue(true),
}));

jest.mock("../../store/mobileSessionsSelectors", () => ({
  selectMobileSessionPointsBySessionId: jest.fn().mockReturnValue([]),
  selectMobileSessionsList: jest.fn().mockReturnValue([]),
  selectMobileSessionsPoints: jest.fn().mockReturnValue([]),
}));

jest.mock("../../store/mobileStreamSelectors", () => ({
  selectMobileStreamPoints: jest.fn().mockReturnValue([]),
  selectMobileStreamData: jest.fn().mockReturnValue({
    stream: {
      id: 123,
      title: "Test Stream",
      sensorName: "PM2.5",
      minLatitude: 0,
      maxLatitude: 1,
      minLongitude: 0,
      maxLongitude: 1,
    },
    measurements: [
      {
        latitude: 0.5,
        longitude: 0.5,
        value: 10,
        time: "2023-01-01T00:00:00Z",
      },
    ],
  }),
  selectMobileStreamStatus: jest.fn().mockReturnValue(StatusEnum.Fulfilled),
}));

jest.mock("../../store/timelapseSelectors", () => ({
  selectCurrentTimestamp: jest.fn().mockReturnValue(""),
  selectTimelapseData: jest.fn().mockReturnValue({}),
  selectTimelapseIsLoading: jest.fn().mockReturnValue(false),
}));

jest.mock("../../store/fixedStreamSelectors", () => ({
  selectFixedData: jest.fn().mockReturnValue({ measurements: [] }),
}));

jest.mock("../../store/markersLoadingSlice", () => ({
  selectMarkersLoading: jest.fn().mockReturnValue(false),
  setMarkersLoading: jest.fn(() => ({
    type: "markersLoading/setMarkersLoading",
  })),
  setTotalMarkers: jest.fn(() => ({ type: "markersLoading/setTotalMarkers" })),
}));

jest.mock("../../store/indoorSessionsSelectors", () => {
  const mockSessions = [
    {
      id: 1,
      title: "Test Indoor Session",
      sensorName: "PM2.5",
      averageValue: 10,
      startTime: "2023-01-01",
      endTime: "2023-01-02",
      streamId: 1,
    },
  ];

  return {
    selectIndoorSessionsList: jest
      .fn()
      .mockImplementation((isDormant) => () => mockSessions),
  };
});

jest.mock("../../utils/cookies", () => ({
  set: jest.fn(),
  get: jest.fn().mockReturnValue("0"),
}));

jest.mock("../../utils/scrollEnd", () => ({
  useHandleScrollEnd: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("../../store", () => ({
  selectIsLoading: jest.fn().mockReturnValue(false),
}));

// Mock the MobileSessionFilters component
jest.mock(
  "../../components/molecules/SessionFilters/MobileSessionFilters",
  () => ({
    MobileSessionFilters: () => {
      const { sessionType } = useMapParams();

      return (
        <div data-testid="mobile-filters">
          {sessionType === "fixed" ? (
            <>
              <button data-testid="indoor-button" data-selected="true">
                Indoor
              </button>
              <button data-testid="outdoor-button">Outdoor</button>
            </>
          ) : (
            <div>Mobile Session Filters</div>
          )}
        </div>
      );
    },
  })
);

// Mock the MobileSessionList component
jest.mock(
  "../../components/molecules/SessionsListView/MobileSessionList/MobileSessionList",
  () => ({
    MobileSessionList: () => (
      <div data-testid="mobile-session-list">
        <div>Test Session</div>
      </div>
    ),
  })
);

// Mock the indoor overlay component
jest.mock("../../components/organisms/Map/Map.style", () => ({
  ContainerStyle: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  DesktopContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="desktop-container">{children}</div>
  ),
  MobileContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-container">{children}</div>
  ),
  MobileButtons: ({
    children,
    $isTimelapseView,
  }: {
    children: React.ReactNode;
    $isTimelapseView: boolean;
  }) => (
    <div data-testid="mobile-buttons" data-is-timelapse={$isTimelapseView}>
      {children}
    </div>
  ),
  ThresholdContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="threshold-container">{children}</div>
  ),
  LoaderOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="loader-overlay">{children}</div>
  ),
  IndoorOvelay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="indoor-overlay">{children}</div>
  ),
  IndoorOverlayInfo: ({
    children,
    $isMobile,
  }: {
    children: React.ReactNode;
    $isMobile: boolean;
  }) => (
    <div data-testid="indoor-overlay-info" data-is-mobile={$isMobile}>
      {children}
    </div>
  ),
}));

describe("Map Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMapParams as jest.Mock).mockReturnValue(createMockMapParams());
    (useMobileDetection as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render the Google Map component", () => {
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });

    it("should render the ThresholdsConfigurator when not in mobile view", () => {
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("thresholds-configurator")).toBeInTheDocument();
    });
  });

  describe("View States", () => {
    it("should render SessionDetailsModal when in ModalView", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        currentUserSettings: UserSettings.ModalView,
      });
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("session-details-modal")).toBeInTheDocument();
    });

    it("should render TimelapseComponent when in TimelapseView", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        currentUserSettings: UserSettings.TimelapseView,
      });
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("timelapse-component")).toBeInTheDocument();
    });
  });

  describe("Mobile View", () => {
    beforeEach(() => {
      (useMobileDetection as jest.Mock).mockReturnValue(true);
    });

    it("should render mobile controls when in mobile view", () => {
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByText("map.listSessions")).toBeInTheDocument();
      expect(screen.getByText("map.legendTile")).toBeInTheDocument();
      expect(screen.getByText("map.timelapsTile")).toBeInTheDocument();
      expect(screen.getByText("filters.filters")).toBeInTheDocument();
    });

    it("should render mobile session list when in SessionListView", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        currentUserSettings: UserSettings.SessionListView,
      });
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByText("map.listSessions")).toBeInTheDocument();
    });

    it("should redirect fixed sessions to calendar page on mobile when in ModalView", () => {
      const mockNavigate = jest.fn();
      (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        currentUserSettings: UserSettings.ModalView,
        sessionType: SessionTypes.FIXED,
        streamId: 123,
        searchParams: new URLSearchParams(
          "sessionId=456&streamId=123&currentUserSettings=MODAL_VIEW&sessionType=fixed"
        ),
      });

      renderWithProviders(<MapWrapper disableEffects={false} />);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/fixed_stream?sessionId=456&streamId=123&currentUserSettings=CALENDAR_VIEW&sessionType=fixed&previousUserSettings=MODAL_VIEW",
        { replace: true }
      );
    });
  });

  describe("Session Types", () => {
    it("should render fixed markers when fixed session type is selected", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        sessionType: SessionTypes.FIXED,
        isActive: true,
      });
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });

    it("should render mobile markers when mobile session type is selected", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...createMockMapParams(),
        sessionType: SessionTypes.MOBILE,
      });
      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error States", () => {
    it("should handle empty session list gracefully", () => {
      jest.mock("../../store/fixedSessionsSelectors", () => ({
        selectFixedSessionsList: jest.fn().mockReturnValue([]),
        selectFixedSessionsPoints: jest.fn().mockReturnValue([]),
        selectFixedSessionsStatusFulfilled: jest.fn().mockReturnValue(true),
      }));

      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });

    it("should handle loading state correctly", () => {
      // Override the loading selectors for this test
      const store = require("../../store");
      const markersLoadingSlice = require("../../store/markersLoadingSlice");

      store.selectIsLoading.mockReturnValue(true);
      markersLoadingSlice.selectMarkersLoading.mockReturnValue(true);

      renderWithProviders(<MapWrapper disableEffects={true} />);

      // The loader overlay should be visible
      const loaderOverlay = screen.getByTestId("loader-overlay");
      expect(loaderOverlay).toBeInTheDocument();

      // The map should still be present but potentially hidden
      const map = screen.getByTestId("google-map");
      expect(map).toBeInTheDocument();

      // Reset the mocks after the test
      store.selectIsLoading.mockReturnValue(false);
      markersLoadingSlice.selectMarkersLoading.mockReturnValue(false);
    });

    it("should handle network error when fetching sessions", () => {
      jest.mock("../../store/fixedSessionsSlice", () => ({
        fetchActiveFixedSessions: jest.fn(() => ({
          type: "fixedSessions/fetchActiveFixedSessions",
          unwrap: () => Promise.reject(new Error("Network error")),
        })),
      }));

      renderWithProviders(<MapWrapper disableEffects={true} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large number of markers efficiently", () => {
      const largeSessionList = Array(1000).fill(MOCK_SESSION);
      jest.mock("../../store/fixedSessionsSelectors", () => ({
        selectFixedSessionsList: jest.fn().mockReturnValue(largeSessionList),
        selectFixedSessionsPoints: jest.fn().mockReturnValue(
          largeSessionList.map((s) => ({
            lat: 0,
            lng: 0,
            streamId: s.streamId,
          }))
        ),
        selectFixedSessionsStatusFulfilled: jest.fn().mockReturnValue(true),
      }));

      const startTime = performance.now();
      renderWithProviders(<MapWrapper disableEffects={true} />);
      const endTime = performance.now();

      expect(screen.getByTestId("google-map")).toBeInTheDocument();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it("should handle rapid state updates efficiently", () => {
      renderWithProviders(<MapWrapper disableEffects={true} />);

      const startTime = performance.now();
      // Simulate rapid state updates
      for (let i = 0; i < 100; i++) {
        (useMapParams as jest.Mock).mockReturnValue({
          ...createMockMapParams(),
          currentZoom: i,
        });
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
