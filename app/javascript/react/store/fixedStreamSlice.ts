import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient, oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./index";

export interface FixedStreamState {
  data: FixedStream;
  fetchedStartTime: number | null; // Similar to Elm's fetchedStartTime
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
  status: StatusEnum;
  error: ApiError | null;
  isLoading: boolean;
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
    },
    measurements: [],
    streamDailyAverages: [],
  },
  fetchedStartTime: null, // To track the earliest fetched data
  minMeasurementValue: null,
  maxMeasurementValue: null,
  averageMeasurementValue: null,
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
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
export const fetchMeasurements = createAsyncThunk<
  Measurement[],
  { streamId: number; startTime: string; endTime: string },
  { rejectValue: ApiError }
>(
  "measurements/getData",
  async ({ streamId, startTime, endTime }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<Measurement[], Error> =
        await oldApiClient.get(
          API_ENDPOINTS.fetchMeasurements(streamId, startTime, endTime)
        );
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);

      const apiError: ApiError = {
        message,
        additionalInfo: {
          action: "fetchMeasurements",
          endpoint: API_ENDPOINTS.fetchMeasurements(
            streamId,
            startTime,
            endTime
          ),
        },
      };

      logError(error, apiError);

      return rejectWithValue(apiError);
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
      const measurementsInRange = state.data.measurements.filter(
        (measurement) => {
          const time = measurement.time;
          return time >= min && time <= max;
        }
      );
      const values = measurementsInRange.map((m) => m.value);
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
    builder.addCase(fetchMeasurements.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(
      fetchMeasurements.fulfilled,
      (state, action: PayloadAction<Measurement[]>) => {
        state.status = StatusEnum.Fulfilled;

        const validNewMeasurements = action.payload.filter(
          (m) => m.time !== undefined && m.value !== undefined
        );

        // Check if new measurements cover a time range earlier than previously fetched
        const earliestNewTime = Math.min(
          ...validNewMeasurements.map((m) => m.time)
        );
        if (
          state.fetchedStartTime === null ||
          earliestNewTime < state.fetchedStartTime
        ) {
          state.fetchedStartTime = earliestNewTime;
        }

        // Merge new measurements with existing ones, ensuring no duplicates
        const mergedMeasurements = [
          ...validNewMeasurements,
          ...state.data.measurements,
        ].sort((a, b) => a.time - b.time);

        state.data.measurements = Array.from(
          new Map(mergedMeasurements.map((m) => [m.time, m])).values()
        );

        state.isLoading = false;
        state.error = null;

        // Update min, max, and average values based on new measurements
        const values = state.data.measurements.map((m) => m.value);
        if (values.length > 0) {
          state.minMeasurementValue = Math.min(...values);
          state.maxMeasurementValue = Math.max(...values);
          state.averageMeasurementValue =
            values.reduce((sum, value) => sum + value, 0) / values.length;
        }
      }
    );
    builder.addCase(
      fetchMeasurements.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.isLoading = false;
      }
    );
  },
});

export default fixedStreamSlice.reducer;

export const { updateFixedMeasurementExtremes, resetFixedStreamState } =
  fixedStreamSlice.actions;

export const selectFixedData = (state: RootState) => state.fixedStream.data;
export const selectIsLoading = (state: RootState) =>
  state.fixedStream.isLoading;
