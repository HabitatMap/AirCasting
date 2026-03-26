import { configureStore } from "@reduxjs/toolkit";
import { apiClient } from "../../api/apiClient";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import {
  fetchNewMovingStream,
  movingStreamSlice,
} from "../../store/movingCalendarStreamSlice";

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
  configureStore({
    reducer: { movingCalendarStream: movingStreamSlice.reducer },
  });

describe("fetchNewMovingStream", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  it("calls fetchFixedStreamDailyAverages endpoint for a non-government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchFixedStreamDailyAverages(
      1,
      "2024-01-01",
      "2024-01-31"
    );

    await store.dispatch(
      fetchNewMovingStream({
        id: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sensorName: "AirBeam-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("calls fetchStationStreamDailyAverages endpoint for a government sensor", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationStreamDailyAverages(
      1,
      "2024-01-01",
      "2024-01-31"
    );

    await store.dispatch(
      fetchNewMovingStream({
        id: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sensorName: "Government-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("calls fetchFixedStreamDailyAverages endpoint when sensorName is undefined", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchFixedStreamDailyAverages(
      1,
      "2024-01-01",
      "2024-01-31"
    );

    await store.dispatch(
      fetchNewMovingStream({
        id: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });

  it("is case-insensitive for the government prefix check", async () => {
    const store = buildStore();
    const expectedUrl = API_ENDPOINTS.fetchStationStreamDailyAverages(
      1,
      "2024-01-01",
      "2024-01-31"
    );

    await store.dispatch(
      fetchNewMovingStream({
        id: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sensorName: "GOVERNMENT-NO2",
      })
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expectedUrl);
  });
});
