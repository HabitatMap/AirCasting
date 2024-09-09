import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./";

export interface Session {
  id: number;
  endTimeLocal: string;
  startTimeLocal: string;
  title: string;
  type: string;
  username: string;
  streams: {
    [key: string]: {
      averageValue: number;
      id: number;
      maxLatitude: number;
      maxLongitude: number;
      measurementShortType: string;
      measurementType: string;
      measurementsCount: number;
      minLatitude: number;
      minLongitude: number;
      sensorName: string;
      sensorPackageName: string;
      sessionId: number;
      size: number;
      startLatitude: number;
      startLongitude: number;
      thresholdHigh: number;
      thresholdLow: number;
      thresholdMedium: number;
      thresholdVeryHigh: number;
      thresholdVeryLow: number;
      unitName: string;
      unitSymbol: string;
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
  error: string | null;
}

interface SessionsData {
  filters: string;
  isAdditional?: boolean;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  sessions: [],
  status: StatusEnum.Idle,
  error: null,
};

export const fetchMobileSessions = createAsyncThunk<
  SessionsResponse,
  SessionsData,
  { rejectValue: string }
>(
  "sessions/fetchMobileSessions",
  async (sessionsData, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<SessionsResponse> = await oldApiClient.get(
        API_ENDPOINTS.fetchMobileSessions(sessionsData.filters)
      );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      logError(error, {
        action: "fetchMobileSessions",
        endpoint: API_ENDPOINTS.fetchMobileSessions(sessionsData.filters),
        message,
      });
      return rejectWithValue(message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { mobileSessions } = getState() as RootState;
      return mobileSessions.status !== StatusEnum.Pending;
    },
  }
);

export const mobileSessionsSlice = createSlice({
  name: "mobileSessions",
  initialState,
  reducers: {
    clearMobileSessions: (state) => {
      state.sessions = [];
      state.fetchableSessionsCount = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMobileSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(fetchMobileSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.error = null;
        if (action.meta.arg.isAdditional) {
          state.sessions = [...state.sessions, ...action.payload.sessions];
        } else {
          state.sessions = action.payload.sessions;
        }
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
      })
      .addCase(fetchMobileSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || "An unknown error occurred";
      });
  },
});

export const { clearMobileSessions } = mobileSessionsSlice.actions;
export default mobileSessionsSlice.reducer;
