import { configureStore } from "@reduxjs/toolkit";
import { apiClient, oldApiClient } from "../../api/apiClient";
import { API_ENDPOINTS } from "../../api/apiEndpoints";
import exportSessionReducer, {
  exportSession,
} from "../../store/exportSessionSlice";

jest.mock("../../api/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
  },
  oldApiClient: {
    get: jest.fn(),
  },
}));

jest.mock("../../utils/cookieManager", () => ({
  CookieManager: {
    arePreferenceCookiesAllowed: jest.fn(() => false),
  },
}));

const buildStore = () =>
  configureStore({ reducer: { session: exportSessionReducer } });

describe("exportSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the legacy session export endpoint for an AirBeam stream", async () => {
    (oldApiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const store = buildStore();

    await store.dispatch(
      exportSession({
        sessionsIds: [42],
        email: "user@example.com",
        sensorName: "AirBeam-PM2.5",
      })
    );

    expect(oldApiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.exportSessionData([42], "user@example.com")
    );
  });

  it("calls the station stream export endpoint for a Government stream", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const store = buildStore();

    await store.dispatch(
      exportSession({
        sessionsIds: [99],
        email: "user@example.com",
        sensorName: "Government-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.exportStationStreamData([99], "user@example.com")
    );
    expect(oldApiClient.get).not.toHaveBeenCalled();
  });

  it("calls the legacy endpoint when sensorName is undefined", async () => {
    (oldApiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const store = buildStore();

    await store.dispatch(
      exportSession({ sessionsIds: [1], email: "user@example.com" })
    );

    expect(oldApiClient.get).toHaveBeenCalled();
  });

  it("is case-insensitive for the Government prefix check", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const store = buildStore();

    await store.dispatch(
      exportSession({
        sessionsIds: [77],
        email: "user@example.com",
        sensorName: "government-no2",
      })
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.exportStationStreamData([77], "user@example.com")
    );
  });

  it("calls the station stream export endpoint for multiple Government streams", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const store = buildStore();

    await store.dispatch(
      exportSession({
        sessionsIds: [10, 20, 30],
        email: "user@example.com",
        sensorName: "Government-PM2.5",
      })
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.exportStationStreamData([10, 20, 30], "user@example.com")
    );
    expect(oldApiClient.get).not.toHaveBeenCalled();
  });
});
