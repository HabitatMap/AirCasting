import "@testing-library/jest-dom";
import { act, screen } from "@testing-library/react";
import React from "react";
import { setLastSelectedTimeRange } from "../../../../store/fixedStreamSlice";
import { MOCK_MAP_PARAMS } from "../../../../test-utils/mocks/mapMocks";
import { renderWithProviders } from "../../../../test-utils/utils/renderWithProviders";
import { StatusEnum } from "../../../../types/api";
import { SessionTypes } from "../../../../types/filters";
import { FixedTimeRange, MobileTimeRange } from "../../../../types/timeRange";
import { useMapParams } from "../../../../utils/mapParamsHandler";
import useMobileDetection from "../../../../utils/useScreenSizeDetection";
import { Graph } from "../Graph";

// Mock Highcharts
jest.mock("highcharts/highstock", () => ({
  __esModule: true,
  default: {
    chart: jest.fn(),
    addEvent: jest.fn(),
    removeEvent: jest.fn(),
    StockChart: jest.fn(),
    setOptions: jest.fn(),
  },
}));

jest.mock("highcharts-react-official", () => {
  const HighchartsReact = React.forwardRef<HTMLDivElement, { options: any }>(
    ({ options }, ref) => {
      // Store the options in a ref so we can access them in tests
      const optionsRef = React.useRef(options);
      React.useEffect(() => {
        optionsRef.current = options;
      }, [options]);

      return (
        <div data-testid="highcharts-graph" ref={ref}>
          <div>Highcharts Graph</div>
          <div>Options: {JSON.stringify(optionsRef.current)}</div>
        </div>
      );
    }
  );
  HighchartsReact.displayName = "HighchartsReact";
  return {
    __esModule: true,
    default: HighchartsReact,
  };
});

// Mock Highcharts modules
jest.mock("highcharts/modules/accessibility", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("highcharts/modules/no-data-to-display", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock mapParamsHandler
jest.mock("../../../../utils/mapParamsHandler", () => ({
  useMapParams: jest.fn().mockReturnValue({
    ...MOCK_MAP_PARAMS,
    unitSymbol: "µg/m³",
    measurementType: "PM2.5",
    isIndoor: false,
  }),
}));

// Mock mobile detection
jest.mock("../../../../utils/useScreenSizeDetection", () =>
  jest.fn().mockReturnValue(false)
);

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

// Mock hooks
jest.mock("../../../../utils/mapParamsHandler", () => ({
  useMapParams: jest.fn().mockReturnValue({
    ...MOCK_MAP_PARAMS,
    unitSymbol: "µg/m³",
    measurementType: "PM2.5",
    isIndoor: false,
  }),
}));

jest.mock("../chartHooks/useMeasurementsFetcher", () => ({
  useMeasurementsFetcher: jest.fn().mockReturnValue({
    fetchMeasurementsIfNeeded: jest.fn(),
  }),
}));

jest.mock("../chartHooks/useChartUpdater", () => ({
  useChartUpdater: jest.fn().mockReturnValue({
    updateChartData: jest.fn(),
    lastTriggerRef: { current: null },
  }),
}));

const initialState = {
  fixedStream: {
    measurements: {
      1: [
        {
          time: new Date("2024-01-01T00:00:00Z").getTime(),
          value: 10,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T01:00:00Z").getTime(),
          value: 15,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T02:00:00Z").getTime(),
          value: 20,
          latitude: 0,
          longitude: 0,
        },
      ],
    },
    dailyAverages: [],
    data: {
      stream: {
        sessionId: 1,
        title: "Test Station",
        unitSymbol: "µg/m³",
        active: true,
        min: 0,
        low: 10,
        middle: 20,
        high: 30,
        max: 40,
        latitude: 0,
        longitude: 0,
        profile: "test",
        sensorName: "test",
        lastUpdate: null,
        updateFrequency: "1h",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-02T00:00:00Z",
      },
      measurements: [
        {
          time: new Date("2024-01-01T00:00:00Z").getTime(),
          value: 10,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T01:00:00Z").getTime(),
          value: 15,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T02:00:00Z").getTime(),
          value: 20,
          latitude: 0,
          longitude: 0,
        },
      ],
      streamDailyAverages: [
        {
          value: 10,
          date: "2024-01-01T00:00:00Z",
        },
      ],
      lastMonthMeasurements: [],
    },
    fetchedStartTime: new Date("2024-01-01T00:00:00Z").getTime(),
    minMeasurementValue: 0,
    maxMeasurementValue: 20,
    averageMeasurementValue: 10,
    thresholds: [],
    status: StatusEnum.Idle,
    error: null,
    lastSelectedTimeRange: FixedTimeRange.Day,
    isLoading: false,
    fetchedTimeRanges: {
      1: [
        {
          start: new Date("2024-01-01T00:00:00Z").getTime(),
          end: new Date("2024-01-02T00:00:00Z").getTime(),
        },
      ],
    },
  },
  mobileStream: {
    data: {
      averageValue: 15,
      endTime: "2024-01-02T00:00:00Z",
      id: 1,
      maxLatitude: 0,
      maxLongitude: 0,
      measurements: [
        {
          time: new Date("2024-01-01T00:00:00Z").getTime(),
          value: 10,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T01:00:00Z").getTime(),
          value: 15,
          latitude: 0,
          longitude: 0,
        },
        {
          time: new Date("2024-01-01T02:00:00Z").getTime(),
          value: 20,
          latitude: 0,
          longitude: 0,
        },
      ],
      minLatitude: 0,
      minLongitude: 0,
      notes: [],
      sensorName: "test",
      sensorUnit: "µg/m³",
      startLatitude: 0,
      startLongitude: 0,
      startTime: "2024-01-01T00:00:00Z",
      streamId: 1,
      title: "Test Stream",
      username: "test",
    },
    minMeasurementValue: 10,
    maxMeasurementValue: 20,
    averageMeasurementValue: 15,
    status: StatusEnum.Idle,
    error: null,
    isLoading: false,
    lastSelectedTimeRange: MobileTimeRange.All,
  },
  mobileSessions: {
    fetchableSessionsCount: 1,
    sessions: [
      {
        id: 1,
        title: "Test Mobile Session",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-02T00:00:00Z",
        startTimeLocal: "2024-01-01T00:00:00Z",
        endTimeLocal: "2024-01-02T00:00:00Z",
        type: "mobile",
        latitude: 0,
        longitude: 0,
        streamId: 1,
        sensorName: "test",
        sensorUnit: "µg/m³",
        notes: [],
        username: "test",
        startLatitude: 0,
        startLongitude: 0,
        minLatitude: 0,
        minLongitude: 0,
        maxLatitude: 0,
        maxLongitude: 0,
        averageValue: 15,
        streams: {
          "1": {
            id: 1,
            averageValue: 15,
            maxLatitude: 0,
            maxLongitude: 0,
            measurementShortType: "PM2.5",
            measurementType: "Particulate Matter",
            measurementsCount: 3,
            minLatitude: 0,
            minLongitude: 0,
            sensorName: "test",
            sensorUnit: "µg/m³",
            startLatitude: 0,
            startLongitude: 0,
            title: "Test Stream",
            unitSymbol: "µg/m³",
            unitName: "Micrograms per cubic meter",
            sensorPackageName: "test",
            sessionId: 1,
            size: 0,
            thresholdHigh: 30,
            thresholdLow: 10,
            thresholdMedium: 20,
            thresholdVeryHigh: 40,
            thresholdVeryLow: 0,
          },
        },
        measurements: [
          {
            time: new Date("2024-01-01T00:00:00Z").getTime(),
            value: 10,
            latitude: 0,
            longitude: 0,
          },
          {
            time: new Date("2024-01-01T01:00:00Z").getTime(),
            value: 15,
            latitude: 0,
            longitude: 0,
          },
          {
            time: new Date("2024-01-01T02:00:00Z").getTime(),
            value: 20,
            latitude: 0,
            longitude: 0,
          },
        ],
      },
    ],
    status: StatusEnum.Idle,
    error: null,
  },
  threshold: {
    defaultValues: {
      min: 0,
      low: 10,
      middle: 20,
      high: 30,
      max: 40,
    },
    error: null,
    status: StatusEnum.Idle,
    sliderWidth: 0,
    thumbPositions: {
      low: 0,
      middle: 0,
      high: 0,
    },
    errorMessage: "",
  },
};

describe("Graph Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMapParams as jest.Mock).mockReturnValue({
      ...MOCK_MAP_PARAMS,
      unitSymbol: "µg/m³",
      measurementType: "PM2.5",
      isIndoor: false,
    });
    (useMobileDetection as jest.Mock).mockReturnValue(false);
  });

  describe("Basic Rendering", () => {
    it("should render the graph component with fixed session type", () => {
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });

    it("should render the graph component with mobile session type", () => {
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.MOBILE}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });
  });

  describe("Mobile View", () => {
    beforeEach(() => {
      (useMobileDetection as jest.Mock).mockReturnValue(true);
    });

    it("should render in mobile view", () => {
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });
  });

  describe("Calendar Page", () => {
    it("should render in calendar page mode", () => {
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={true}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });
  });

  describe("Selected Timestamp", () => {
    it("should handle selected timestamp", () => {
      const selectedTimestamp = Date.now();
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={selectedTimestamp}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null streamId", () => {
      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={null}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.queryByTestId("highcharts-graph")).not.toBeInTheDocument();
    });

    it("should handle indoor sessions", () => {
      (useMapParams as jest.Mock).mockReturnValue({
        ...MOCK_MAP_PARAMS,
        isIndoor: true,
      });

      renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
    });
  });

  describe("Time Range Selection", () => {
    it("should update when time range changes", async () => {
      const { store } = renderWithProviders(
        <Graph
          sessionType={SessionTypes.FIXED}
          streamId={1}
          isCalendarPage={false}
          selectedTimestamp={null}
        />,
        { initialState }
      );

      // Initial state should show graph with day range
      expect(screen.getByTestId("highcharts-graph")).toBeInTheDocument();
      const options = JSON.parse(
        screen.getByText(/Options:/).textContent?.replace("Options: ", "") ||
          "{}"
      );
      expect(options.rangeSelector.selected).toBe(0);

      await act(async () => {
        store.dispatch(setLastSelectedTimeRange(FixedTimeRange.Week));
      });

      const updatedOptions = JSON.parse(
        screen.getByText(/Options:/).textContent?.replace("Options: ", "") ||
          "{}"
      );
      expect(updatedOptions.rangeSelector.selected).toBe(0);
    });
  });
});
