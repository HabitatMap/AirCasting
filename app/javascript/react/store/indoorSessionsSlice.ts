import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
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
  error?: string;
}

const initialState: SessionsState = {
  fetchableSessionsCount: 0,
  sessions: [],
  status: StatusEnum.Idle,
  error: undefined,
};

export const fetchIndoorSessions = createAsyncThunk<
  SessionsResponse,
  SessionsData,
  { rejectValue: string }
>("sessions/fetchIndoorSessions", async (sessionsData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionsResponse, Error> =
      await oldApiClient.get(
        API_ENDPOINTS.fetchIndoorSessions(sessionsData.filters)
      );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue(message);
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
      })
      .addCase(fetchIndoorSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.sessions = action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
      })
      .addCase(fetchIndoorSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
  },
});

export default indoorSessionsSlice.reducer;
