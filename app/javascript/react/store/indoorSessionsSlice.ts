import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { SessionsData } from "./fixedSessionsSlice";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

interface IndoorSession {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
  lastHourlyAverageValue: number;
  isIndoor: boolean;
  isActive: boolean;
  title: string;
  streams: {
    [key: string]: {
      streamDailyAverage: number;
      measurementShortType: string;
      sensorName: string;
      unitSymbol: string;
      id: number;
    };
  };
}

interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: IndoorSession[];
}

interface SessionsState {
  fetchableSessionsCount: number;
  activeIndoorSessions: IndoorSession[];
  dormantIndoorSessions: IndoorSession[];
  status: StatusEnum;
  error: ApiError | null;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  activeIndoorSessions: [],
  dormantIndoorSessions: [],
  status: StatusEnum.Idle,
  error: null,
};

const createSessionFetchThunk = (
  type: FixedSessionsTypes,
  endpoint: (filters: string) => string
) => {
  return createAsyncThunk<
    SessionsResponse,
    SessionsData,
    { rejectValue: ApiError }
  >(
    `sessions/fetch${
      type.charAt(0).toUpperCase() + type.slice(1)
    }FixedSessions`,
    async (sessionsData, { rejectWithValue }) => {
      try {
        const response: AxiosResponse<SessionsResponse> =
          await oldApiClient.get(endpoint(sessionsData.filters));
        return response.data;
      } catch (error) {
        const message = getErrorMessage(error);
        const apiError: ApiError = {
          message,
          additionalInfo: {
            action: `fetch${
              type.charAt(0).toUpperCase() + type.slice(1)
            }FixedSessions`,
            endpoint: endpoint(sessionsData.filters),
          },
        };
        logError(error, apiError);
        return rejectWithValue(apiError);
      }
    },
    {
      condition: (_, { getState }) => {
        const { fixedSessions } = getState() as RootState;
        return fixedSessions.status !== StatusEnum.Pending;
      },
    }
  );
};

export const fetchActiveIndoorSessions = createSessionFetchThunk(
  FixedSessionsTypes.ACTIVE,
  API_ENDPOINTS.fetchActiveFixedSessions
);

export const fetchDormantIndoorSessions = createSessionFetchThunk(
  FixedSessionsTypes.DORMANT,
  API_ENDPOINTS.fetchDormantFixedSessions
);

const indoorSessionsSlice = createSlice({
  name: "indoorSessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveIndoorSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchActiveIndoorSessions.fulfilled,
        (state, action: PayloadAction<SessionsResponse>) => {
          state.status = StatusEnum.Fulfilled;
          state.activeIndoorSessions = action.payload.sessions;
          state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
          state.error = null;
        }
      )
      .addCase(
        fetchActiveIndoorSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      )
      .addCase(fetchDormantIndoorSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchDormantIndoorSessions.fulfilled,
        (state, action: PayloadAction<SessionsResponse>) => {
          state.status = StatusEnum.Fulfilled;
          state.dormantIndoorSessions = action.payload.sessions;
          state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
          state.error = null;
        }
      )
      .addCase(
        fetchDormantIndoorSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
  },
});

export default indoorSessionsSlice.reducer;
