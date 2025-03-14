// Test utilities and mock data for Graph component tests
import { FixedTimeRange, MobileTimeRange } from "../../../types/timeRange";
// Remove the import of parseDateString and create our own test version
// import { parseDateString } from "../../../utils/dateParser";

// Create a simplified date parser for tests that works reliably
export const parseDateString = (dateStr: string): number => {
  return new Date(dateStr).getTime();
};

// Mock data types
export interface MockMeasurement {
  time: number;
  value: number;
}

export interface MockMobilePoint {
  time: number;
  value: number;
  position: { lat: number; lng: number };
}

export interface MockFetchedTimeRange {
  start: number;
  end: number;
}

// Mock data for fixed session
export const mockFixedStreamShortInfo = {
  startTime: "2023-01-01T00:00:00Z",
  endTime: "2023-01-02T00:00:00Z",
  title: "Fixed Session",
  sensorName: "AirBeam",
  lastMeasurementValue: 20,
  minMeasurementValue: 5,
  maxMeasurementValue: 35,
  lastMeasurementDateLabel: "2023-01-02",
  parameterName: "PM2.5",
  unitName: "µg/m³",
  unitSymbol: "µg/m³",
  location: "",
  address: "",
  latitude: 40.7128,
  longitude: -74.006,
  streamId: 1,
  isIndoor: false,
  lastHourAverage: 22,
  lastDayAverage: 25,
  lastWeekAverage: 18,
  lastMonthAverage: 15,
  thresholdVeryLow: 0,
  thresholdLow: 10,
  thresholdMedium: 20,
  thresholdHigh: 30,
  thresholdVeryHigh: 40,
  // Add missing properties needed for FixedStreamShortInfo
  averageValue: 25,
  sessionId: 123,
  active: true,
  min: 5,
  max: 35,
  id: 1,
  timezone: "UTC",
  provider: "AirBeam",
  username: "tester",
  sessionTitle: "Fixed Session",
};

// Mock data for mobile session
export const mockMobileStreamShortInfo = {
  startTime: "2023-01-01T00:00:00Z",
  endTime: "2023-01-02T00:00:00Z",
  title: "Mobile Session",
  sensorName: "AirBeam",
  profile: {
    username: "test_user",
  },
  sessionId: 123,
  parameterName: "PM2.5",
  unitName: "µg/m³",
  unitSymbol: "µg/m³",
  startLatitude: 40.7128,
  startLongitude: -74.006,
  avValue: 25,
  // Add missing properties needed for MobileStreamShortInfo
  minMeasurementValue: 5,
  maxMeasurementValue: 35,
  averageValue: 25,
};

// Mock threshold data
export const mockThresholds = {
  min: 0,
  max: 100,
  low: 25,
  middle: 50,
  high: 75,
};

// Mock fixed measurements
export const mockFixedMeasurements: MockMeasurement[] = [
  { time: parseDateString("2023-01-01T01:00:00Z"), value: 25 },
  { time: parseDateString("2023-01-01T02:00:00Z"), value: 35 },
  { time: parseDateString("2023-01-01T03:00:00Z"), value: 45 },
];

// Mock mobile points with proper x and y properties for GraphPoint
export const mockMobilePoints = [
  {
    time: parseDateString("2023-01-01T01:00:00Z"),
    value: 25,
    position: { lat: 0, lng: 0 },
    // Add x and y properties needed for GraphPoint
    x: parseDateString("2023-01-01T01:00:00Z"),
    y: 25,
  },
  {
    time: parseDateString("2023-01-01T02:00:00Z"),
    value: 35,
    position: { lat: 0, lng: 0 },
    x: parseDateString("2023-01-01T02:00:00Z"),
    y: 35,
  },
  {
    time: parseDateString("2023-01-01T03:00:00Z"),
    value: 45,
    position: { lat: 0, lng: 0 },
    x: parseDateString("2023-01-01T03:00:00Z"),
    y: 45,
  },
];

// Mock fetched time ranges
export const mockFetchedTimeRanges: MockFetchedTimeRange[] = [
  {
    start: parseDateString("2023-01-01T00:00:00Z"),
    end: parseDateString("2023-01-02T00:00:00Z"),
  },
];

// Mock map params
export const mockMapParams = {
  unitSymbol: "µg/m³",
  measurementType: "PM2.5",
  isIndoor: "false",
  sensorName: "Airbeam3-PM2.5",
  // Additional props needed by useMapParams
  boundEast: 0,
  boundNorth: 0,
  boundSouth: 0,
  boundWest: 0,
  currentCenter: { lat: 0, lng: 0 },
  currentUserSettings: {},
  currentZoom: 10,
  fetchedSessions: 0,
  getParameterTime: () => "",
  isIndoorSelected: false,
  isMapLoaded: true,
  isSensorSelected: true,
  isSessionsLoaded: true,
  isSessionsLoading: false,
  isStreamingAllowed: true,
  measurementUnit: "µg/m³",
  onMapLoaded: () => {},
  onSessionsFetch: () => {},
  parameter: "PM2.5",
  parameterForUrl: "PM2.5",
  parameterIdSelected: "",
  searchLocation: "",
  selectedParameter: "PM2.5",
  selectedSensorId: "",
  selectedSessionIds: [],
  selectedStreams: [],
  selectedStreamIds: [],
  setParameterForUrl: () => {},
  setParameterIdSelected: () => {},
  setSelectedSensorId: () => {},
  toggleIndoorSelected: () => {},
  updateQueryParams: () => {},
  crowdMapLevel: 0,
  isCrowdMapLayerOn: false,
  profileName: "",
  setProfileName: () => {},
  setParameterParams: () => {},
};

// Mock time ranges
export const mockFixedTimeRange = FixedTimeRange.Day;
export const mockMobileTimeRange = MobileTimeRange.All;
