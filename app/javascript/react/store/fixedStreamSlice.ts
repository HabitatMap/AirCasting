import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient, oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";

import { FixedTimeRange } from "../types/timeRange";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./index";

export interface FixedStreamState {
  data: FixedStream;
  fetchedStartTime: number | null;
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
  status: StatusEnum;
  error: ApiError | null;
  isLoading: boolean;
  lastSelectedTimeRange: FixedTimeRange;
  measurements: {
    [streamId: number]: Measurement[];
  };
}

const initialState: FixedStreamState = {
  data: {
    stream: {
      title: "",
      profile: "",
      lastUpdate: "",
      sensorName: "",
      unitSymbol: "",
      updateFrequency: "",
      active: true,
      sessionId: 0,
      startTime: "",
      endTime: "",
      min: 0,
      low: 0,
      middle: 0,
      high: 0,
      max: 0,
      latitude: 0,
      longitude: 0,
      firstMeasurementTime: 0,
    },
    measurements: [],
    streamDailyAverages: [],
    lastMonthMeasurements: [],
  },
  fetchedStartTime: null,
  minMeasurementValue: null,
  maxMeasurementValue: null,
  averageMeasurementValue: null,
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
  lastSelectedTimeRange: FixedTimeRange.Day,
  measurements: {},
};

export interface Measurement {
  time: number;
  value: number;
  latitude: number;
  longitude: number;
}

// Thunk for fetching stream data by ID
export const fetchFixedStreamById = createAsyncThunk<
  FixedStream,
  number,
  { rejectValue: ApiError }
>("fixedStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<FixedStream> = await apiClient.get(
      API_ENDPOINTS.fetchFixedStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchFixedStreamById",
        endpoint: API_ENDPOINTS.fetchFixedStreamById(id),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

// Thunk for fetching measurements
export const fetchMeasurements = createAsyncThunk(
  "fixedStream/fetchMeasurements",
  async (
    params: {
      streamId: number;
      startTime: string;
      endTime: string;
      isBackground?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response: AxiosResponse<Measurement[], Error> =
        await oldApiClient.get(
          API_ENDPOINTS.fetchMeasurements(
            params.streamId,
            params.startTime,
            params.endTime
          )
        );
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Reducer
const fixedStreamSlice = createSlice({
  name: "fixedStream",
  initialState,
  reducers: {
    updateFixedMeasurementExtremes(
      state,
      action: PayloadAction<{ min: number; max: number }>
    ) {
      const { min, max } = action.payload;
      let startTime = min;
      let endTime = max;

      const values = state.data.measurements
        .filter(
          (measurement) =>
            measurement.time >= startTime && measurement.time <= endTime
        )
        .map((m) => m.value);

      const newMin = values.length > 0 ? Math.min(...values) : 0;
      const newMax = values.length > 0 ? Math.max(...values) : 0;
      const newAvg =
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;

      state.minMeasurementValue = newMin;
      state.maxMeasurementValue = newMax;
      state.averageMeasurementValue = newAvg;
    },
    resetFixedStreamState(state) {
      return initialState;
    },
    setLastSelectedTimeRange(state, action: PayloadAction<FixedTimeRange>) {
      state.lastSelectedTimeRange = action.payload;
      localStorage.setItem("lastSelectedTimeRange", action.payload);
    },
    resetLastSelectedTimeRange(state) {
      state.lastSelectedTimeRange = FixedTimeRange.Day;
      localStorage.setItem("lastSelectedTimeRange", FixedTimeRange.Day);
    },
    resetStreamMeasurements(state, action: PayloadAction<number>) {
      state.measurements[action.payload] = [];
    },
    updateStreamMeasurements(
      state,
      action: PayloadAction<{ streamId: number; measurements: Measurement[] }>
    ) {
      const { streamId, measurements } = action.payload;
      const existingMeasurements = state.measurements[streamId] || [];
      const existingTimestamps = new Set(
        existingMeasurements.map((m) => m.time)
      );

      const uniqueNewMeasurements = measurements.filter(
        (m) => !existingTimestamps.has(m.time)
      );

      if (uniqueNewMeasurements.length > 0) {
        state.measurements[streamId] = [
          ...existingMeasurements,
          ...uniqueNewMeasurements,
        ].sort((a, b) => a.time - b.time);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFixedStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(
      fetchFixedStreamById.fulfilled,
      (state, action: PayloadAction<FixedStream>) => {
        state.status = StatusEnum.Fulfilled;
        state.data = action.payload;
        state.isLoading = false;
        state.error = null;
      }
    );
    builder.addCase(
      fetchFixedStreamById.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.data = initialState.data;
        state.isLoading = false;
      }
    );
    builder.addCase(fetchMeasurements.pending, (state, action) => {
      if (!action.meta.arg.isBackground) {
        state.status = StatusEnum.Pending;
        state.error = null;
        state.isLoading = true;
      }
    });
    builder.addCase(fetchMeasurements.fulfilled, (state, action) => {
      if (!action.meta.arg.isBackground) {
        state.status = StatusEnum.Fulfilled;
        state.isLoading = false;
        state.error = null;
      }

      // Get streamId from the thunk arg
      const streamId = Number(action.meta?.arg?.streamId);
      if (streamId) {
        const existingMeasurements = state.measurements[streamId] || [];
        const existingTimestamps = new Set(
          existingMeasurements.map((m) => m.time)
        );

        const uniqueNewMeasurements = action.payload.filter(
          (m) => !existingTimestamps.has(m.time)
        );

        if (uniqueNewMeasurements.length > 0) {
          state.measurements[streamId] = [
            ...existingMeasurements,
            ...uniqueNewMeasurements,
          ].sort((a, b) => a.time - b.time);
        }
      }
    });
    builder.addCase(fetchMeasurements.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      state.error = {
        message: action.error.message || "Unknown error occurred",
      };
      state.isLoading = false;
    });
  },
});

export default fixedStreamSlice.reducer;

export const {
  updateFixedMeasurementExtremes,
  resetFixedStreamState,
  setLastSelectedTimeRange,
  resetLastSelectedTimeRange,
  resetStreamMeasurements,
  updateStreamMeasurements,
} = fixedStreamSlice.actions;

export const selectFixedData = (state: RootState) => state.fixedStream.data;
export const selectIsLoading = (state: RootState) =>
  state.fixedStream.isLoading;
export const selectLastSelectedFixedTimeRange = (state: RootState) =>
  state.fixedStream.lastSelectedTimeRange;
export const selectStreamMeasurements = (
  state: RootState,
  streamId: number | null
) => (streamId ? state.fixedStream.measurements[streamId] || [] : []);
