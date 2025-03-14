import { act, render } from "@testing-library/react";
import React from "react";
import { selectIsLoading } from "../../../store";
import * as fixedSelectors from "../../../store/fixedStreamSelectors";
import * as redux from "../../../store/hooks";
import * as mobileSelectors from "../../../store/mobileStreamSelectors";
import * as mobileStreamSlice from "../../../store/mobileStreamSlice";
import * as thresholdSelectors from "../../../store/thresholdSlice";
import { SessionTypes } from "../../../types/filters";
import { MobileTimeRange } from "../../../types/timeRange";
import * as mapParamsHandler from "../../../utils/mapParamsHandler";
import * as useChartUpdaterModule from "./chartHooks/useChartUpdater";
import * as useMeasurementsFetcherModule from "./chartHooks/useMeasurementsFetcher";
import { Graph } from "./Graph";
import {
  mockFixedMeasurements,
  mockFixedStreamShortInfo,
  mockFixedTimeRange,
  mockMapParams,
  mockMobileStreamShortInfo,
  mockThresholds,
} from "./testUtils";

// Setup mock for useMeasurementsFetcher
const fetchMeasurementsIfNeededMock = jest.fn().mockResolvedValue(undefined);
const useMeasurementsFetcherMock = {
  fetchMeasurementsIfNeeded: fetchMeasurementsIfNeededMock,
};

// Setup mock for useChartUpdater
const useChartUpdaterMock = {
  updateChartData: jest.fn(),
  lastTriggerRef: { current: null },
};

// Define a simple props type for the mock component
interface HighchartsProps {
  ref?: React.RefObject<any>;
  [key: string]: any;
}

// Mock HighchartsReact with a div that has the correct testId
jest.mock("highcharts-react-official", () => ({
  __esModule: true,
  default: function HighchartsReact(props: HighchartsProps) {
    React.useEffect(() => {
      if (props.ref && props.ref.current) {
        props.ref.current.chart = {
          xAxis: [
            {
              setExtremes: jest.fn(),
              getExtremes: jest.fn().mockReturnValue({ min: 1000, max: 2000 }),
            },
          ],
          reflow: jest.fn(),
          hideLoading: jest.fn(),
        };
      }
    }, [props.ref]);
    return <div data-testid="highcharts-container">Highcharts Mock</div>;
  },
}));

jest.mock("highcharts/highstock", () => ({
  __esModule: true,
  default: {
    addEvent: jest.fn(),
    removeEvent: jest.fn(),
    dateFormat: jest.fn(() => "mocked-date"),
  },
}));

jest.mock("highcharts/modules/accessibility", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("highcharts/modules/no-data-to-display", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the i18next hook
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the screen size detection hook
jest.mock("../../../utils/useScreenSizeDetection", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

describe("Graph Component", () => {
  // Mock the Redux hooks and selectors
  const dispatchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup fake timers
    jest.useFakeTimers();

    // Set mockMobilePoints to empty initially
    jest.spyOn(mobileSelectors, "selectMobileStreamPoints").mockReturnValue([]);

    // Create valid mock return values
    jest
      .spyOn(fixedSelectors, "selectStreamMeasurements")
      .mockReturnValue(mockFixedMeasurements as any);

    // Mock useAppSelector to return default values
    jest.spyOn(redux, "useAppSelector").mockImplementation((selector: any) => {
      if (selector === selectIsLoading) return false;

      // Handle the selector used inside the component to get measurements
      if (typeof selector === "function") {
        return mockFixedMeasurements;
      }

      return [];
    });

    // Mock mobile time range
    jest
      .spyOn(mobileStreamSlice, "selectLastSelectedMobileTimeRange")
      .mockReturnValue(MobileTimeRange.All);

    // Setup specific selector mocks
    jest
      .spyOn(thresholdSelectors, "selectThresholds")
      .mockReturnValue(mockThresholds);

    jest
      .spyOn(fixedSelectors, "selectFixedStreamShortInfo")
      .mockReturnValue(mockFixedStreamShortInfo as any);

    jest
      .spyOn(mobileSelectors, "selectMobileStreamShortInfo")
      .mockReturnValue(mockMobileStreamShortInfo as any);

    jest
      .spyOn(fixedSelectors, "selectLastSelectedFixedTimeRange")
      .mockReturnValue(mockFixedTimeRange);

    jest.spyOn(redux, "useAppDispatch").mockReturnValue(dispatchMock);

    // Mock map params handler
    jest
      .spyOn(mapParamsHandler, "useMapParams")
      .mockReturnValue(mockMapParams as any);

    // Mock useMeasurementsFetcher
    jest
      .spyOn(useMeasurementsFetcherModule, "useMeasurementsFetcher")
      .mockReturnValue(useMeasurementsFetcherMock);

    // Mock useChartUpdater
    jest
      .spyOn(useChartUpdaterModule, "useChartUpdater")
      .mockReturnValue(useChartUpdaterMock);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the Graph component for fixed sessions", async () => {
    // Mock that we have measurement data
    jest
      .spyOn(fixedSelectors, "selectStreamMeasurements")
      .mockReturnValue(mockFixedMeasurements as any);

    const rangeDisplayRef = React.createRef<HTMLDivElement>();

    // Render the component
    render(
      <Graph
        sessionType={SessionTypes.FIXED}
        streamId={1}
        isCalendarPage={false}
        rangeDisplayRef={rangeDisplayRef}
        selectedTimestamp={null}
        onDayClick={jest.fn()}
      />
    );

    // Advance timers to trigger the initial fetch in setTimeout(_, 50)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Verify initial data loading was triggered for fixed session
    expect(fetchMeasurementsIfNeededMock).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      true, // Fixed sessions should load data in chunks
      false,
      "initial"
    );
  });

  it("loads all data upfront for mobile sessions", async () => {
    // Mock that we have NO mobile points initially
    jest.spyOn(mobileSelectors, "selectMobileStreamPoints").mockReturnValue([]);

    // Create clear start and end times
    const mockStartTime = 1600000000000;
    const mockEndTime = 1600100000000;

    // Mock stream info with explicit start/end times
    const mockMobileStreamWithTimes = {
      ...mockMobileStreamShortInfo,
      startTime: new Date(mockStartTime).toISOString(),
      endTime: new Date(mockEndTime).toISOString(),
    };

    jest
      .spyOn(mobileSelectors, "selectMobileStreamShortInfo")
      .mockReturnValue(mockMobileStreamWithTimes as any);

    const rangeDisplayRef = React.createRef<HTMLDivElement>();

    render(
      <Graph
        sessionType={SessionTypes.MOBILE}
        streamId={1}
        isCalendarPage={false}
        rangeDisplayRef={rangeDisplayRef}
        selectedTimestamp={null}
        onDayClick={jest.fn()}
      />
    );

    // Run all timers to ensure the effect has time to execute
    act(() => {
      jest.advanceTimersByTime(150); // Make sure we run past all timeouts
    });

    // Verify initial data loading was triggered for mobile session with the correct parameters
    expect(fetchMeasurementsIfNeededMock).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      false, // Mobile sessions should load all data upfront (not in chunks)
      false,
      "initial"
    );
  });
});
