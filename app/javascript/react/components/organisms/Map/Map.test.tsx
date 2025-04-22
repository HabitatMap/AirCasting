import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom"; // Add this import for toBeInTheDocument matcher
import { render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { UserSettings } from "../../../types/userStates";
import { useMapParams } from "../../../utils/mapParamsHandler";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import { MapWrapper } from "./map-wrapper";

// Mock the Google Maps component
jest.mock("@vis.gl/react-google-maps", () => ({
  Map: () => <div data-testid="google-map">Google Map</div>,
}));

// Mock the mapParamsHandler hook
jest.mock("../../../utils/mapParamsHandler", () => {
  const UrlParamsTypes = {
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
  };

  return {
    useMapParams: jest.fn(),
    UrlParamsTypes,
    getParam: jest.fn((param, defaultValue) => defaultValue),
    setUrlParams: jest.fn(),
  };
});

// Mock useMobileDetection
jest.mock("../../../utils/useScreenSizeDetection", () => jest.fn());

// Mock i18next
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

// Mock other components that are rendered within Map
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

// Mock Redux actions
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
}));

jest.mock("../../../store/fixedSessionsSelectors", () => ({
  selectFixedSessionsList: jest.fn().mockReturnValue([]),
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
  selectIndoorSessionsList: jest.fn().mockReturnValue(() => []),
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
      realtimeMapUpdates: () => ({ realtimeMapUpdates: false }), // Changed to false to prevent infinite loop
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
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

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
});
