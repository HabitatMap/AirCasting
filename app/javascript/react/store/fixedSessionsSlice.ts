import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./";

interface Session {
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
  sessions: Session[];
}

interface SessionsState {
  fetchableSessionsCount: number;
  sessions: Session[];
  status: StatusEnum;
  error?: string;
}

interface SessionsData {
  filters: string;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  sessions: [],
  status: StatusEnum.Idle,
  error: undefined,
};

export const fetchFixedSessions = createAsyncThunk<
  SessionsResponse,
  SessionsData,
  { rejectValue: string }
>(
  "sessions/fetchFixedSessions",
  async (sessionsData, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<SessionsResponse, Error> =
        await oldApiClient.get(
          API_ENDPOINTS.fetchFixedSessions(sessionsData.filters)
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

const fixedSessionsSlice = createSlice({
  name: "fixedSessions",
  initialState,
  reducers: {
    cleanSessions(state) {
      state.fetchableSessionsCount = 0;
      state.sessions = [];
      state.status = StatusEnum.Idle;
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFixedSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchFixedSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.sessions = action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
      })
      .addCase(fetchFixedSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
  },
});

export const { cleanSessions } = fixedSessionsSlice.actions;

export default fixedSessionsSlice.reducer;
