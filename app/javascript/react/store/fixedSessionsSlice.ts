import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { RootState } from ".";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

export interface FixedSession {
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
  sessions: FixedSession[];
}

interface SessionsState {
  fetchableSessionsCount: number;
  activeSessions: FixedSession[];
  dormantSessions: FixedSession[];
  isActiveSessionsFetched: boolean;
  isDormantSessionsFetched: boolean;
  status: StatusEnum;
  error?: string;
}

export interface SessionsData {
  filters: string;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  activeSessions: [],
  dormantSessions: [],
  isActiveSessionsFetched: false,
  isDormantSessionsFetched: false,
  status: StatusEnum.Idle,
  error: undefined,
};

const createSessionFetchThunk = (
  type: FixedSessionsTypes,
  endpoint: (filters: string) => string
) => {
  return createAsyncThunk<
    SessionsResponse,
    SessionsData,
    { rejectValue: string }
  >(
    `sessions/fetch${
      type.charAt(0).toUpperCase() + type.slice(1)
    }FixedSessions`,
    async (sessionsData, { rejectWithValue }) => {
      try {
        const response: AxiosResponse<SessionsResponse, Error> =
          await oldApiClient.get(
            API_ENDPOINTS.fetchActiveFixedSessions(sessionsData.filters)
          );

        return response.data;
      } catch (error) {
        const message = getErrorMessage(error);
        return rejectWithValue(message);
      }
    },
    {
      condition: (_, { getState }) => {
        const { fixedSessions } = getState() as RootState;
        if (fixedSessions.status === StatusEnum.Pending) {
          return false;
        }
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
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchActiveFixedSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.activeSessions = action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
        state.isActiveSessionsFetched = true;
      })
      .addCase(fetchActiveFixedSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
    builder
      .addCase(fetchDormantFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchDormantFixedSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.dormantSessions = action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
        state.isDormantSessionsFetched = true;
      })
      .addCase(fetchDormantFixedSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
  },
});

export const { cleanSessions } = fixedSessionsSlice.actions;

export default fixedSessionsSlice.reducer;
