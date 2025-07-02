import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

export interface FixedSessionGeneral {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
  isIndoor: boolean;
  latitude: number;
  longitude: number;
  title: string;
  username: string;
  lastHourlyAverageValue: number;
  averageValue: number | null;
  streams: {
    [key: string]: {
      measurementShortType: string;
      sensorName: string;
      unitSymbol: string;
      id: number;
    };
  };
}

interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: FixedSessionGeneral[];
}

interface SessionsState {
  fetchableSessionsCount: number;
  activeSessions: FixedSessionGeneral[];
  dormantSessions: FixedSessionGeneral[];
  isActiveSessionsFetched: boolean;
  isDormantSessionsFetched: boolean;
  status: StatusEnum;
  error: ApiError | null;
}

export interface SessionsData {
  filters: string;
  isAdditional?: boolean;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  activeSessions: [],
  dormantSessions: [],
  isActiveSessionsFetched: false,
  isDormantSessionsFetched: false,
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

export const fetchActiveFixedSessions = createSessionFetchThunk(
  FixedSessionsTypes.ACTIVE,
  API_ENDPOINTS.fetchActiveFixedSessions
);

export const fetchDormantFixedSessions = createSessionFetchThunk(
  FixedSessionsTypes.DORMANT,
  API_ENDPOINTS.fetchDormantFixedSessions
);

const fixedSessionsSlice = createSlice({
  name: "fixedSessions",
  initialState,
  reducers: {
    cleanSessions(state) {
      state.fetchableSessionsCount = 0;
      state.activeSessions = [];
      state.dormantSessions = [];
      state.isActiveSessionsFetched = false;
      state.isDormantSessionsFetched = false;
      state.status = StatusEnum.Idle;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchActiveFixedSessions.fulfilled,
        (state, action: PayloadAction<SessionsResponse>) => {
          state.status = StatusEnum.Fulfilled;
          state.activeSessions = action.payload.sessions;
          state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
          state.isActiveSessionsFetched = true;
          state.error = null;
        }
      )
      .addCase(
        fetchActiveFixedSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
    builder
      .addCase(fetchDormantFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(fetchDormantFixedSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.dormantSessions = action.meta?.arg.isAdditional
          ? [...state.dormantSessions, ...action.payload.sessions]
          : action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
        state.isDormantSessionsFetched = true;
        state.error = null;
      })
      .addCase(
        fetchDormantFixedSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
  },
});

export const { cleanSessions } = fixedSessionsSlice.actions;
export default fixedSessionsSlice.reducer;
