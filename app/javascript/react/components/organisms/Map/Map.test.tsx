import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { MapWrapper } from "../../../test/utils/map-wrapper";
import { SessionTypes } from "../../../types/filters";
import { UserSettings } from "../../../types/userStates";
import { useMapParams } from "../../../utils/mapParamsHandler";
import useMobileDetection from "../../../utils/useScreenSizeDetection";

jest.mock("@vis.gl/react-google-maps", () => ({
  Map: () => <div data-testid="google-map">Google Map</div>,
}));

jest.mock("../../../utils/mapParamsHandler", () => ({
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
    goToUserSettings: jest.fn(),
    revertUserSettingsAndResetIds: jest.fn(),
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
    updateLimit: jest.fn(),
    updateOffset: jest.fn(),
    mapTypeId: "roadmap",
    measurementType: "Particulate Matter",
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
    updateFetchedSessions: jest.fn(),
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
}));

jest.mock("../../../utils/useScreenSizeDetection", () => jest.fn());

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

jest.mock("../../organisms/Modals/SessionDetailsModal", () => ({
  SessionDetailsModal: () => (
    <div data-testid="session-details-modal">Session Details Modal</div>
  ),
}));

jest.mock("../../organisms/Modals/TimelapseModal", () => ({
  TimelapseComponent: () => (
    <div data-testid="timelapse-component">Timelapse Component</div>
  ),
}));

jest.mock(
  "../../organisms/ThresholdConfigurator/ThresholdConfigurator",
  () => ({
    ThresholdsConfigurator: () => (
      <div data-testid="thresholds-configurator">Thresholds Configurator</div>
    ),
  })
);

jest.mock("../../../store/thresholdSlice", () => ({
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

jest.mock("../../../store/sensorsSlice", () => ({
  fetchSensors: jest.fn(() => ({ type: "sensors/fetchSensors" })),
}));

jest.mock("../../../store/sessionFiltersSlice", () => ({
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

jest.mock("../../../store/fixedSessionsSlice", () => ({
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

jest.mock("../../../store/mobileSessionsSlice", () => ({
  fetchMobileSessions: jest.fn(() => ({
    type: "mobileSessions/fetchMobileSessions",
    unwrap: () => Promise.resolve({ sessions: [] }),
  })),
}));

jest.mock("../../../store/indoorSessionsSlice", () => ({
  fetchActiveIndoorSessions: jest.fn(() => ({
    type: "indoorSessions/fetchActiveIndoorSessions",
    unwrap: () => Promise.resolve(),
  })),
  fetchDormantIndoorSessions: jest.fn(() => ({
    type: "indoorSessions/fetchDormantIndoorSessions",
    unwrap: () => Promise.resolve(),
  })),
}));

jest.mock("../../../store/fixedStreamSlice", () => ({
  fetchFixedStreamById: jest.fn(() => ({
    type: "fixedStream/fetchFixedStreamById",
  })),
  resetFixedStreamState: jest.fn(() => ({
    type: "fixedStream/resetFixedStreamState",
  })),
}));

jest.mock("../../../store/mobileStreamSlice", () => ({
  fetchMobileStreamById: jest.fn(() => ({
    type: "mobileStream/fetchMobileStreamById",
  })),
  resetMobileStreamState: jest.fn(() => ({
    type: "mobileStream/resetMobileStreamState",
  })),
}));

jest.mock("../../../store/timelapseSlice", () => ({
  fetchTimelapseData: jest.fn(() => ({ type: "timelapse/fetchTimelapseData" })),
  setCurrentTimestamp: jest.fn(() => ({
    type: "timelapse/setCurrentTimestamp",
  })),
}));

jest.mock("../../../store/mapSlice", () => ({
  selectFetchingData: jest.fn().mockReturnValue(false),
  setFetchingData: jest.fn(() => ({ type: "map/setFetchingData" })),
  selectHoverPosition: jest.fn().mockReturnValue(null),
  selectSessionsListExpanded: jest.fn().mockReturnValue(true),
}));

jest.mock("../../../store/fixedSessionsSelectors", () => ({
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

jest.mock("../../../store/mobileSessionsSelectors", () => ({
  selectMobileSessionPointsBySessionId: jest.fn().mockReturnValue([]),
  selectMobileSessionsList: jest.fn().mockReturnValue([]),
  selectMobileSessionsPoints: jest.fn().mockReturnValue([]),
}));

jest.mock("../../../store/mobileStreamSelectors", () => ({
  selectMobileStreamPoints: jest.fn().mockReturnValue([]),
}));

jest.mock("../../../store/timelapseSelectors", () => ({
  selectCurrentTimestamp: jest.fn().mockReturnValue(""),
  selectTimelapseData: jest.fn().mockReturnValue({}),
  selectTimelapseIsLoading: jest.fn().mockReturnValue(false),
}));

jest.mock("../../../store/fixedStreamSelectors", () => ({
  selectFixedData: jest.fn().mockReturnValue({ measurements: [] }),
}));

jest.mock("../../../store/markersLoadingSlice", () => ({
  selectMarkersLoading: jest.fn().mockReturnValue(false),
  setMarkersLoading: jest.fn(() => ({
    type: "markersLoading/setMarkersLoading",
  })),
  setTotalMarkers: jest.fn(() => ({ type: "markersLoading/setTotalMarkers" })),
}));

jest.mock("../../../store/indoorSessionsSelectors", () => ({
  selectIndoorSessionsList: jest.fn().mockImplementation((isDormant) => () => [
    {
      id: 1,
      title: "Test Indoor Session",
      sensorName: "PM2.5",
      averageValue: 10,
      startTime: "2023-01-01",
      endTime: "2023-01-02",
      streamId: 1,
    },
  ]),
}));

jest.mock("../../../utils/cookies", () => ({
  set: jest.fn(),
  get: jest.fn().mockReturnValue("0"),
}));

jest.mock("../../../utils/scrollEnd", () => ({
  useHandleScrollEnd: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("../../../store", () => ({
  selectIsLoading: jest.fn().mockReturnValue(false),
}));

// Create a mock store with required reducers
const createMockStore = () => {
  return configureStore({
    reducer: {
      fixedSessions: () => ({
        points: [],
        list: [],
        status: "idle",
        activeSessions: [],
        dormantSessions: [],
        isActiveSessionsFetched: false,
        isDormantSessionsFetched: false,
        fetchableSessionsCount: 0,
        error: null,
      }),
      mobileSessions: () => ({
        points: [],
        list: [],
        status: "idle",
        sessions: [],
        fetchableSessionsCount: 0,
        error: null,
      }),
      fixedStream: () => ({
        data: {
          measurements: [],
          averageValue: 0,
          endTime: "",
          id: 0,
          maxLatitude: 0,
          maxLongitude: 0,
          minLatitude: 0,
          minLongitude: 0,
          notes: [],
          sensorName: "",
          sensorUnit: "",
          startLatitude: 0,
          startLongitude: 0,
          startTime: "",
          streamId: 0,
          title: "",
          username: "",
        },
        status: "idle",
        error: null,
        isLoading: false,
      }),
      mobileStream: () => ({
        data: {
          measurements: [],
          averageValue: 0,
          endTime: "",
          id: 0,
          maxLatitude: 0,
          maxLongitude: 0,
          minLatitude: 0,
          minLongitude: 0,
          notes: [],
          sensorName: "",
          sensorUnit: "",
          startLatitude: 0,
          startLongitude: 0,
          startTime: "",
          streamId: 0,
          title: "",
          username: "",
        },
        minMeasurementValue: 0,
        maxMeasurementValue: 0,
        averageMeasurementValue: 0,
        status: "idle",
        error: null,
        isLoading: false,
        lastSelectedTimeRange: "all",
      }),
      timelapse: () => ({
        data: {},
        status: "idle",
        currentTimestamp: "",
        isLoading: false,
      }),
      map: () => ({
        fetchingData: false,
        hoverStreamId: null,
        hoverPosition: null,
        sessionsListExpanded: true,
      }),
      markersLoading: () => ({ loading: false }),
      sessionFilter: () => ({
        type: "fixed",
        isDormant: false,
        tags: [],
        fixedSessionsType: "active",
      }),
      threshold: () => ({
        defaultValues: { min: 0, low: 25, middle: 50, high: 75, max: 100 },
        userValues: { min: 0, low: 25, middle: 50, high: 75, max: 100 },
        status: "idle",
        error: null,
        sliderWidth: 0,
        thumbPositions: { low: 0, middle: 50, high: 100 },
        errorMessage: "",
        isThresholdsSet: true,
        isDefaultThresholdsSet: true,
      }),
      crowdMap: () => ({
        status: "idle",
        rectangles: [],
        fetchingData: false,
      }),
      realtimeMapUpdates: () => ({ realtimeMapUpdates: false }),
      cluster: () => ({
        visible: false,
        clusterAverage: 0,
        clusterSize: 0,
      }),
      indoorSessions: () => ({
        sessions: [],
        status: "idle",
        error: null,
      }),
      sensors: () => ({
        data: [],
        status: "idle",
        error: null,
      }),
      loading: () => ({
        fixedSessions: false,
        mobileSessions: false,
        fixedStream: false,
        mobileStream: false,
        timelapse: false,
        crowdMap: false,
        indoorSessions: false,
      }),
      mapParams: () => ({
        isIndoor: true,
        currentUserSettings: "MapView",
        sessionType: "fixed",
        isActive: true,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

// Mock the MobileSessionFilters component
jest.mock("../../molecules/SessionFilters/MobileSessionFilters", () => ({
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
}));

// Mock the MobileSessionList component
jest.mock(
  "../../molecules/SessionsListView/MobileSessionList/MobileSessionList",
  () => ({
    MobileSessionList: () => (
      <div data-testid="mobile-session-list">
        <div>Test Session</div>
      </div>
    ),
  })
);

// Mock the indoor overlay component
jest.mock("./Map.style", () => ({
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
  const mockMapParams = {
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
    searchParams: new URLSearchParams(
      "thresholdMin=0&thresholdLow=25&thresholdMiddle=50&thresholdHigh=75&thresholdMax=100"
    ),
    goToUserSettings: jest.fn(),
    revertUserSettingsAndResetIds: jest.fn(),
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
    updateLimit: jest.fn(),
    updateOffset: jest.fn(),
    mapTypeId: "roadmap",
    measurementType: "Particulate Matter",
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
    updateFetchedSessions: jest.fn(),
    usernames: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMapParams as jest.Mock).mockReturnValue(mockMapParams);
    (useMobileDetection as jest.Mock).mockReturnValue(false);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>
    );
  };

  it("renders the Google Map component", () => {
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("renders the ThresholdsConfigurator when not in mobile view", () => {
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("thresholds-configurator")).toBeInTheDocument();
  });

  it("renders SessionDetailsModal when in ModalView", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      currentUserSettings: UserSettings.ModalView,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("session-details-modal")).toBeInTheDocument();
  });

  it("renders TimelapseComponent when in TimelapseView", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      currentUserSettings: UserSettings.TimelapseView,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("timelapse-component")).toBeInTheDocument();
  });

  it("renders mobile controls when in mobile view", () => {
    (useMobileDetection as jest.Mock).mockReturnValue(true);
    renderWithProviders(<MapWrapper disableEffects={true} />);

    // Check for the presence of mobile control buttons
    expect(screen.getByText("map.listSessions")).toBeInTheDocument();
    expect(screen.getByText("map.legendTile")).toBeInTheDocument();
    expect(screen.getByText("map.timelapsTile")).toBeInTheDocument();
    expect(screen.getByText("filters.filters")).toBeInTheDocument();
  });

  it("renders desktop session list when not in mobile view", () => {
    (useMobileDetection as jest.Mock).mockReturnValue(false);
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      currentUserSettings: UserSettings.MapView,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByText("Test Session")).toBeInTheDocument();
    expect(screen.getByText("PM2.5")).toBeInTheDocument();

    // Check for the date and time text within the session list
    const sessionList = screen.getByTestId("desktop-container");
    expect(sessionList.textContent).toContain("01/01/2023");
    expect(sessionList.textContent).toContain("00:00");
    expect(sessionList.textContent).toContain("01/02/2023");
  });

  it("renders fixed markers when fixed session type is selected", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      sessionType: SessionTypes.FIXED,
      isActive: true,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("renders mobile markers when mobile session type is selected", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      sessionType: SessionTypes.MOBILE,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("renders indoor overlay and button when indoor sessions are selected", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      isIndoor: "true",
      sessionType: SessionTypes.FIXED,
      currentUserSettings: UserSettings.FiltersView,
    });
    renderWithProviders(<MapWrapper disableSpecificEffects={true} />);

    // Check if indoor button is selected in filters
    const indoorButton = screen.getByTestId("indoor-button");
    expect(indoorButton).toHaveAttribute("data-selected", "true");

    // Check for the indoor overlay text
    const indoorOverlay = screen.getByTestId("indoor-overlay");
    expect(indoorOverlay).toBeInTheDocument();
    expect(screen.getByText("filters.indoorMapOverlay")).toBeInTheDocument();
  });

  it("does not show indoor overlay for mobile sessions", () => {
    (useMapParams as jest.Mock).mockReturnValue({
      ...mockMapParams,
      isIndoor: true,
      sessionType: SessionTypes.MOBILE,
      currentUserSettings: UserSettings.FiltersView,
    });
    renderWithProviders(<MapWrapper disableEffects={true} />);

    // Check that indoor overlay is not present
    expect(screen.queryByTestId("indoor-overlay")).not.toBeInTheDocument();

    // Check that indoor button is not present (mobile sessions don't have indoor/outdoor filters)
    expect(screen.queryByTestId("indoor-button")).not.toBeInTheDocument();
  });

  // it("renders dormant markers when fixed session type is selected and isActive is false", () => {
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     sessionType: SessionTypes.FIXED,
  //     isActive: false,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });

  // it("renders stream markers when streamId is present", () => {
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     streamId: 123,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });

  // it("renders crowd map markers when in CrowdMapView", () => {
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     currentUserSettings: UserSettings.CrowdMapView,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });

  // it("renders legend when in MapLegendView", () => {
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     currentUserSettings: UserSettings.MapLegendView,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByText("map.legendTile")).toBeInTheDocument();
  // });

  // it("renders mobile session list when in SessionListView on mobile", () => {
  //   (useMobileDetection as jest.Mock).mockReturnValue(true);
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     currentUserSettings: UserSettings.SessionListView,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByText("map.listSessions")).toBeInTheDocument();
  // });

  // it("renders mobile session filters when in FiltersView", () => {
  //   (useMapParams as jest.Mock).mockReturnValue({
  //     ...mockMapParams,
  //     currentUserSettings: UserSettings.FiltersView,
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByText("filters.editFilters")).toBeInTheDocument();
  // });

  // it("shows loading overlay when selectors or markers are loading", () => {
  //   (useAppSelector as jest.Mock).mockImplementation((selector) => {
  //     if (selector === selectIsLoading || selector === selectMarkersLoading) {
  //       return true;
  //     }
  //     return false;
  //   });
  //   renderWithProviders(<MapWrapper disableEffects={true} />);
  //   expect(screen.getByTestId("google-map")).toBeInTheDocument();
  // });
});
