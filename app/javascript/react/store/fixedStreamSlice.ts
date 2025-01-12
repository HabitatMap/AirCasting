import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient, oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import { FixedTimeRange } from "../types/timeRange";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./index";

export interface Measurement {
  time: number;
  value: number;
  latitude: number;
  longitude: number;
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
    [streamId: number]: Measurement[];
  };
  fetchedTimeRanges: {
    [streamId: number]: Array<{
      start: number;
      end: number;
    }>;
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

const fixedStreamSlice = createSlice({
  name: "fixedStream",
  initialState,
  reducers: {
    updateFixedMeasurementExtremes(
      state,
      action: PayloadAction<{ streamId: number; min: number; max: number }>
    ) {
      const { streamId, min, max } = action.payload;
      const allMeasurements = state.measurements[streamId] || [];

      const values = allMeasurements
        .filter((m) => m.time >= min && m.time <= max)
        .map((m) => m.value);

      if (values.length > 0) {
        state.minMeasurementValue = Math.min(...values);
        state.maxMeasurementValue = Math.max(...values);
        state.averageMeasurementValue =
          values.reduce((sum, value) => sum + value, 0) / values.length;
      } else {
        state.minMeasurementValue = null;
        state.maxMeasurementValue = null;
        state.averageMeasurementValue = null;
      }
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
      state.fetchedTimeRanges[action.payload] = [];
    },

    updateStreamMeasurements(
      state,
      action: PayloadAction<{ streamId: number; measurements: Measurement[] }>
    ) {
      const { streamId, measurements } = action.payload;
      const existingMeasurements = state.measurements[streamId] || [];

      const existingMap = new Map(existingMeasurements.map((m) => [m.time, m]));

      measurements.forEach((measurement) => {
        if (!existingMap.has(measurement.time)) {
          existingMap.set(measurement.time, measurement);
        }
      });

      state.measurements[streamId] = Array.from(existingMap.values()).sort(
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

    updateFetchedTimeRanges(
      state,
      action: PayloadAction<{
        streamId: number;
        start: number;
        end: number;
      }>
    ) {
      const { streamId, start, end } = action.payload;
      if (!state.fetchedTimeRanges[streamId]) {
        state.fetchedTimeRanges[streamId] = [];
      }

      const ranges = [...state.fetchedTimeRanges[streamId]];

      // Add new range
      ranges.push({ start, end });

      // Sort ranges by start time
      ranges.sort((a, b) => a.start - b.start);

      // Merge overlapping ranges
      const mergedRanges = ranges.reduce((acc, curr) => {
        if (acc.length === 0) return [curr];

        const prev = acc[acc.length - 1];

        // If ranges overlap or are adjacent (within 1 second)
        if (curr.start <= prev.end + 1000) {
          prev.end = Math.max(prev.end, curr.end);
          return acc;
        }

        return [...acc, curr];
      }, [] as Array<{ start: number; end: number }>);

      state.fetchedTimeRanges[streamId] = mergedRanges;

      console.log("Merged Time Ranges:", {
        streamId,
        newRange: { start: new Date(start), end: new Date(end) },
        mergedRanges: mergedRanges.map((range) => ({
          start: new Date(range.start),
          end: new Date(range.end),
        })),
      });
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
      state.isLoading = false;
      state.error = null;

      const streamId = Number(action.meta?.arg?.streamId);
      if (streamId) {
        const existingMeasurements = state.measurements[streamId] || [];
        const existingMap = new Map(
          existingMeasurements.map((m) => [m.time, m])
        );

        action.payload.forEach((measurement) => {
          if (!existingMap.has(measurement.time)) {
            existingMap.set(measurement.time, measurement);
          }
        });

        state.measurements[streamId] = Array.from(existingMap.values()).sort(
          (a, b) => a.time - b.time
        );

        console.log("Raw timestamps:", {
          startTime: action.meta.arg.startTime,
          endTime: action.meta.arg.endTime,
        });

        const startTime = Number(action.meta.arg.startTime);
        const endTime = Number(action.meta.arg.endTime);

        console.log("Parsed timestamps:", {
          startTime,
          endTime,
          startDate: new Date(startTime),
          endDate: new Date(endTime),
        });

        if (!state.fetchedTimeRanges[streamId]) {
          state.fetchedTimeRanges[streamId] = [];
        }

        if (!isNaN(startTime) && !isNaN(endTime)) {
          state.fetchedTimeRanges[streamId].push({
            start: startTime,
            end: endTime,
          });

          console.log("Fetched New Time Range:", {
            streamId,
            range: {
              start: new Date(startTime),
              end: new Date(endTime),
            },
            allRanges: state.fetchedTimeRanges[streamId].map((range) => ({
              start: new Date(range.start),
              end: new Date(range.end),
            })),
          });
        } else {
          console.error("Failed to parse timestamps:", {
            startTimeString: action.meta.arg.startTime,
            endTimeString: action.meta.arg.endTime,
          });
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
  resetFixedMeasurementExtremes,
  resetTimeRange,
  updateFetchedTimeRanges,
} = fixedStreamSlice.actions;

export const selectFixedStreamState = (state: RootState) => state.fixedStream;

export const selectFixedData = createSelector(
  [selectFixedStreamState],
  (fixedStream) => fixedStream.data
);

export const selectIsLoading = createSelector(
  [selectFixedStreamState],
  (fixedStream) => fixedStream.isLoading
);

export const selectLastSelectedFixedTimeRange = createSelector(
  [selectFixedStreamState],
  (fixedStream) => fixedStream.lastSelectedTimeRange
);

export const selectStreamMeasurements = createSelector(
  [
    selectFixedStreamState,
    (_state: RootState, streamId: number | null) => streamId,
  ],
  (fixedStream, streamId) =>
    streamId ? fixedStream.measurements[streamId] || [] : []
);

export const selectFetchedTimeRanges = createSelector(
  [
    selectFixedStreamState,
    (_state: RootState, streamId: number | null) => streamId,
  ],
  (fixedStream, streamId) =>
    streamId ? fixedStream.fetchedTimeRanges[streamId] || [] : []
);
