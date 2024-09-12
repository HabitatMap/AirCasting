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
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
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
          action: "fetchFixedStreamById",
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
      const newMin = Math.min(...values);
      const newMax = Math.max(...values);
      const newAvg =
        values.reduce((sum, value) => sum + value, 0) / values.length;

      state.minMeasurementValue = newMin;
      state.maxMeasurementValue = newMax;
      state.averageMeasurementValue = newAvg;
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
        state.data.measurements = action.payload;
        state.isLoading = false;
        state.error = null;

        if (action.payload.length > 0) {
          const values = action.payload.map((m) => m.value);
          state.minMeasurementValue = Math.min(...values);
          state.maxMeasurementValue = Math.max(...values);
          state.averageMeasurementValue =
            values.reduce((sum, value) => sum + value, 0) / values.length;
        } else {
          state.minMeasurementValue = 0;
          state.maxMeasurementValue = 0;
          state.averageMeasurementValue = 0;
        }
      }
    );
    builder.addCase(
      fetchMeasurements.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.data = initialState.data;
        state.isLoading = false;
      }
    );
  },
});

export default fixedStreamSlice.reducer;

export const { updateFixedMeasurementExtremes } = fixedStreamSlice.actions;
export const selectFixedData = (state: RootState) => state.fixedStream.data;
export const selectIsLoading = (state: RootState) =>
  state.fixedStream.isLoading;
