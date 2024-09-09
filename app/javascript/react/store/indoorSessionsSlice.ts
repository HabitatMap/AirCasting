import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { SessionsData } from "./fixedSessionsSlice";

interface IndoorSession {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
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
  sessions: IndoorSession[];
  status: StatusEnum;
  error: ApiError | null;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  sessions: [],
  status: StatusEnum.Idle,
  error: null,
};

export const fetchIndoorSessions = createAsyncThunk<
  SessionsResponse,
  SessionsData,
  { rejectValue: ApiError }
>("sessions/fetchIndoorSessions", async (sessionsData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionsResponse> = await oldApiClient.get(
      API_ENDPOINTS.fetchIndoorSessions(sessionsData.filters)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchIndoorSessions",
        endpoint: API_ENDPOINTS.fetchIndoorSessions(sessionsData.filters),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

const indoorSessionsSlice = createSlice({
  name: "indoorSessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIndoorSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
        state.error = null;
      })
      .addCase(
        fetchIndoorSessions.fulfilled,
        (state, action: PayloadAction<SessionsResponse>) => {
          state.status = StatusEnum.Fulfilled;
          state.sessions = action.payload.sessions;
          state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
          state.error = null;
        }
      )
      .addCase(
        fetchIndoorSessions.rejected,
        (state, action: PayloadAction<ApiError | undefined>) => {
          state.status = StatusEnum.Rejected;
          state.error = action.payload || { message: "Unknown error occurred" };
        }
      );
  },
});

export default indoorSessionsSlice.reducer;
