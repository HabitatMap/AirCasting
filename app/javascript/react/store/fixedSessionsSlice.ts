import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { getErrorMessage } from "../utils/getErrorMessage";
import { StatusEnum } from "../types/api";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";

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
      measurementShortType: string;
      sensorName: string;
      unitSymbol: string;
      id: number;
    }
  }
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

export const fetchSessions = createAsyncThunk<
  SessionsResponse,
  SessionsData,
  { rejectValue: string }
>("sessions/fetchSessions", async (sessionsData, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<SessionsResponse, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchSessions(sessionsData.filters)
    )
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue(message);
  }
});

export const fixedSessionsSlice = createSlice({
  name: "fixedSessions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.sessions = action.payload.sessions;
        state.fetchableSessionsCount = action.payload.fetchableSessionsCount;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
  },
});

export default fixedSessionsSlice.reducer;



