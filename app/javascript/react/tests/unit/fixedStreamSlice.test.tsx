import { configureStore } from "@reduxjs/toolkit";
import { apiClient } from "../../api/apiClient";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import fixedStreamReducer, {
  fetchFixedStreamById,
  fetchMeasurements,
} from "../../store/fixedStreamSlice";
import { FixedStream } from "../../types/fixedStream";

jest.mock("../../api/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock("../../utils/cookieManager", () => ({
  CookieManager: {
    arePreferenceCookiesAllowed: jest.fn(() => false),
  },
}));

const buildStore = () =>
  configureStore({ reducer: { fixedStream: fixedStreamReducer } });

const mockMeasurements = [
  { time: 1000000, value: 42 },
  { time: 1000001, value: 43 },
];

const mockFixedStream: FixedStream = {
  stream: {
    lastUpdate: null,
    updateFrequency: "1min",
    startTime: "2024-01-01T00:00:00Z",
    endTime: null,
    profile: "test-profile",
    sensorName: "AirBeam-PM2.5",
    sessionId: 1,
    title: "Test Stream",
    unitSymbol: "µg/m³",
    active: true,
    min: 0,
    low: 12,
    middle: 35,
    high: 55,
    max: 150,
    latitude: 40.7,
    longitude: -74.0,
  },
  measurements: [],
  streamDailyAverages: [],
  lastMonthMeasurements: [],
};

describe("fetchFixedStreamById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockFixedStream });
  });

  it("calls fetchFixedStreamById endpoint for a non-government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchFixedStreamById(1);

    await store.dispatch(
      fetchFixedStreamById({ id: 1, sensorName: "AirBeam-PM2.5" })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("calls fetchStationStreamById endpoint for a government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationStreamById(1);

    await store.dispatch(
      fetchFixedStreamById({ id: 1, sensorName: "Government-PM2.5" })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("is case-insensitive for the government prefix check", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationStreamById(1);

    await store.dispatch(
      fetchFixedStreamById({ id: 1, sensorName: "GOVERNMENT-NO2" })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });
});

describe("fetchMeasurements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockMeasurements });
  });

  it("calls fetchFixedMeasurements endpoint for a non-government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchFixedMeasurements(
      1,
      "1000000",
      "2000000"
    );

    await store.dispatch(
      fetchMeasurements({
        streamId: 1,
        startTime: "1000000",
        endTime: "2000000",
        sensorName: "AirBeam-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("calls fetchStationMeasurements endpoint for a government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationMeasurements(
      1,
      "1000000",
      "2000000"
    );

    await store.dispatch(
      fetchMeasurements({
        streamId: 1,
        startTime: "1000000",
        endTime: "2000000",
        sensorName: "Government-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("calls fetchFixedMeasurements endpoint when sensorName is undefined", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchFixedMeasurements(
      1,
      "1000000",
      "2000000"
    );

    await store.dispatch(
      fetchMeasurements({
        streamId: 1,
        startTime: "1000000",
        endTime: "2000000",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("is case-insensitive for the government prefix check", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationMeasurements(
      1,
      "1000000",
      "2000000"
    );

    await store.dispatch(
      fetchMeasurements({
        streamId: 1,
        startTime: "1000000",
        endTime: "2000000",
        sensorName: "GOVERNMENT-NO2",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });
});
