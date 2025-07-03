import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AxiosResponse } from "axios";
import { apiClient, oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { type ApiError, StatusEnum } from "../types/api";
import type { FixedStream } from "../types/fixedStream";
import { FixedTimeRange } from "../types/timeRange";
import { CookieManager } from "../utils/cookieManager";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import type { RootState } from "./index";

export interface FixedMeasurement {
  time: number;
  value: number;
}

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
    [streamId: number]: FixedMeasurement[];
  };
  fetchedTimeRanges: { [streamId: number]: { start: number; end: number }[] };
}

export const initialState: FixedStreamState = {
  data: {
    stream: {
      lastUpdate: null,
      updateFrequency: "",
      startTime: "",
      endTime: null,
      profile: "",
      sensorName: "",
      sessionId: 0,
      title: "",
      unitSymbol: "",
      active: true,
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
    lastMonthMeasurements: [],
  },
  fetchedStartTime: null,
  minMeasurementValue: null,
  maxMeasurementValue: null,
  averageMeasurementValue: null,
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
  lastSelectedTimeRange: (() => {
    // Load from localStorage only if preference cookies are allowed
    if (
      typeof window !== "undefined" &&
      CookieManager.arePreferenceCookiesAllowed()
    ) {
      const saved = localStorage.getItem("lastSelectedTimeRange");
      if (
        saved &&
        Object.values(FixedTimeRange).includes(saved as FixedTimeRange)
      ) {
        return saved as FixedTimeRange;
      }
    }
    return FixedTimeRange.Day;
  })(),
  measurements: {},
  fetchedTimeRanges: {},
};

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

export const fetchMeasurements = createAsyncThunk(
  "fixedStream/fetchMeasurements",
  async (
    params: {
      streamId: number;
      startTime: string;
      endTime: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response: AxiosResponse<FixedMeasurement[], Error> =
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

export const checkDataAvailability = createAsyncThunk(
  "fixedStream/checkDataAvailability",
  async (
    { streamId, start, end }: { streamId: number; start: number; end: number },
    { getState }
  ) => {
    const state = getState() as RootState;
    const fetchedRanges = state.fixedStream.fetchedTimeRanges[streamId] || [];

    return fetchedRanges.some(
      (range) => range.start <= start && range.end >= end
    );
  }
);

const fixedStreamSlice = createSlice({
  name: "fixedStream",
  initialState,
  reducers: {
    updateFixedMeasurementExtremes(
      state,
      action: PayloadAction<{ streamId: number; min: number; max: number }>
    ) {
      const { min, max } = action.payload;
      const measurements = state.data.measurements || [];

      // Filter measurements within the visible range
      const visibleMeasurements = measurements.filter(
        (m) => m.time >= min && m.time <= max
      );

      if (visibleMeasurements.length > 0) {
        // Calculate min, max, and average in a single pass
        const {
          min: minValue,
          max: maxValue,
          sum,
        } = visibleMeasurements.reduce(
          (acc, measurement) => ({
            min: Math.min(acc.min, measurement.value),
            max: Math.max(acc.max, measurement.value),
            sum: acc.sum + measurement.value,
          }),
          {
            min: visibleMeasurements[0].value,
            max: visibleMeasurements[0].value,
            sum: 0,
          }
        );

        state.minMeasurementValue = minValue;
        state.maxMeasurementValue = maxValue;
        state.averageMeasurementValue = sum / visibleMeasurements.length;
      } else {
        state.minMeasurementValue = null;
        state.maxMeasurementValue = null;
        state.averageMeasurementValue = null;
      }
    },

    resetFixedStreamState(state) {
      state.lastSelectedTimeRange = FixedTimeRange.Day;
      if (CookieManager.arePreferenceCookiesAllowed()) {
        localStorage.setItem("lastSelectedTimeRange", FixedTimeRange.Day);
      }
      return initialState;
    },

    setLastSelectedTimeRange(state, action: PayloadAction<FixedTimeRange>) {
      state.lastSelectedTimeRange = action.payload;
      if (CookieManager.arePreferenceCookiesAllowed()) {
        localStorage.setItem("lastSelectedTimeRange", action.payload);
      }
    },

    resetLastSelectedTimeRange(state) {
      state.lastSelectedTimeRange = FixedTimeRange.Day;
      if (CookieManager.arePreferenceCookiesAllowed()) {
        localStorage.setItem("lastSelectedTimeRange", FixedTimeRange.Day);
      }
    },

    resetStreamMeasurements(state, action: PayloadAction<number>) {
      state.data.measurements = [];
    },

    updateStreamMeasurements(
      state,
      action: PayloadAction<{
        streamId: number;
        measurements: FixedMeasurement[];
      }>
    ) {
      const { measurements } = action.payload;
      const existingMeasurements = state.data.measurements || [];

      const existingMap = new Map(existingMeasurements.map((m) => [m.time, m]));

      measurements.forEach((measurement) => {
        if (!existingMap.has(measurement.time)) {
          existingMap.set(measurement.time, measurement);
        }
      });

      state.data.measurements = Array.from(existingMap.values()).sort(
        (a, b) => a.time - b.time
      );
    },

    resetFixedMeasurementExtremes(state) {
      state.minMeasurementValue = null;
      state.maxMeasurementValue = null;
      state.averageMeasurementValue = null;
    },
    resetTimeRange: (state) => {
      state.lastSelectedTimeRange = FixedTimeRange.Day;
      localStorage.setItem("lastSelectedTimeRange", FixedTimeRange.Day);
    },
    updateFetchedTimeRanges: (
      state,
      action: PayloadAction<{ streamId: number; start: number; end: number }>
    ) => {
      const { streamId, start, end } = action.payload;
      if (!state.fetchedTimeRanges[streamId]) {
        state.fetchedTimeRanges[streamId] = [];
      }
      state.fetchedTimeRanges[streamId].push({ start, end });
    },
    clearFetchedTimeRanges: (state, action: PayloadAction<number>) => {
      const streamId = action.payload;
      if (state.fetchedTimeRanges[streamId]) {
        state.fetchedTimeRanges[streamId] = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFixedStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(fetchFixedStreamById.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(fetchFixedStreamById.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      state.error = action.payload || {
        message: "Unknown error occurred fetching stream",
      };
      state.data = initialState.data;
      state.isLoading = false;
    });

    builder.addCase(fetchMeasurements.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });

    builder.addCase(fetchMeasurements.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.error = null;

      const streamId = Number(action.meta?.arg?.streamId);
      if (streamId) {
        const existingMeasurements = state.data.measurements || [];
        const existingMap = new Map(
          existingMeasurements.map((m) => [m.time, m])
        );

        action.payload.forEach((measurement) => {
          if (!existingMap.has(measurement.time)) {
            existingMap.set(measurement.time, measurement);
          }
        });

        state.data.measurements = Array.from(existingMap.values()).sort(
          (a, b) => a.time - b.time
        );

        // After updating measurements, calculate extremes for visible range if we have measurements
        if (state.data.measurements.length > 0) {
          // Use the time range from the fetch if available
          const startTime = Number(action.meta?.arg?.startTime);
          const endTime = Number(action.meta?.arg?.endTime);

          // Filter measurements within the visible range
          const visibleMeasurements = state.data.measurements.filter(
            (m) => m.time >= startTime && m.time <= endTime
          );

          if (visibleMeasurements.length > 0) {
            // Calculate min, max, and average in a single pass
            const {
              min: minValue,
              max: maxValue,
              sum,
            } = visibleMeasurements.reduce(
              (acc, measurement) => ({
                min: Math.min(acc.min, measurement.value),
                max: Math.max(acc.max, measurement.value),
                sum: acc.sum + measurement.value,
              }),
              {
                min: visibleMeasurements[0].value,
                max: visibleMeasurements[0].value,
                sum: 0,
              }
            );

            state.minMeasurementValue = minValue;
            state.maxMeasurementValue = maxValue;
            state.averageMeasurementValue = sum / visibleMeasurements.length;
          }
        }
      }
    });

    builder.addCase(fetchMeasurements.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      state.error = {
        message:
          (action.error && action.error.message) ||
          "Unknown error occurred fetching measurements",
      };
    });

    builder.addCase(resetLastSelectedTimeRange, (state) => {
      state.lastSelectedTimeRange = FixedTimeRange.Day;
    });
  },
});

export const {
  updateFixedMeasurementExtremes,
  resetFixedStreamState,
  setLastSelectedTimeRange,
  resetLastSelectedTimeRange,
  resetStreamMeasurements,
  updateStreamMeasurements,
  resetFixedMeasurementExtremes,
  resetTimeRange,
  updateFetchedTimeRanges,
  clearFetchedTimeRanges,
} = fixedStreamSlice.actions;

export default fixedStreamSlice.reducer;
