import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { ApiError, StatusEnum } from "../types/api";
import { MobileStream } from "../types/mobileStream";
import { MobileTimeRange } from "../types/timeRange";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import {
  MILLISECONDS_IN_A_5_MINUTES,
  MILLISECONDS_IN_AN_HOUR,
} from "../utils/timeRanges";

export interface MobileStreamState {
  data: MobileStream;
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
  status: StatusEnum;
  error: ApiError | null;
  isLoading: boolean;
  lastSelectedTimeRange: MobileTimeRange;
}

export const initialState: MobileStreamState = {
  data: {
    averageValue: 0,
    endTime: "",
    id: 0,
    maxLatitude: 0,
    maxLongitude: 0,
    measurements: [],
    minLatitude: 0,
    minLongitude: 0,
    notes: [],
    sensorName: "",
    sensorUnit: "",
    startLatitude: 0,
    startLongitude: 0,
    startTime: "",
    streamId: 0,
    title: "",
    username: "",
  },
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
  status: StatusEnum.Idle,
  error: null,
  isLoading: false,
  lastSelectedTimeRange: MobileTimeRange.All,
};

export const fetchMobileStreamById = createAsyncThunk<
  MobileStream,
  number,
  { rejectValue: ApiError }
>("mobileStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<MobileStream, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchMobileStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: "fetchMobileStreamById",
        endpoint: API_ENDPOINTS.fetchMobileStreamById(id),
      },
    };

    logError(error, apiError);

    return rejectWithValue(apiError);
  }
});

export const mobileStreamSlice = createSlice({
  name: "mobileStream",
  initialState,
  reducers: {
    updateMobileMeasurementExtremes(
      state,
      action: PayloadAction<{ min: number; max: number }>
    ) {
      const { min, max } = action.payload;
      let startTime = min;
      let endTime: number;

      switch (state.lastSelectedTimeRange) {
        case MobileTimeRange.FiveMinutes:
          endTime = startTime + MILLISECONDS_IN_A_5_MINUTES;
          break;
        case MobileTimeRange.Hour:
          endTime = startTime + MILLISECONDS_IN_AN_HOUR;
          break;
        case MobileTimeRange.All:
          endTime = max;
          break;
        default:
          endTime = startTime + MILLISECONDS_IN_A_5_MINUTES;
      }

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
    resetMobileStreamState(state) {
      return initialState;
    },
    setLastSelectedMobileTimeRange(
      state,
      action: PayloadAction<MobileTimeRange>
    ) {
      state.lastSelectedTimeRange = action.payload;
      localStorage.setItem("lastSelectedMobileTimeRange", action.payload);
    },

    resetLastSelectedMobileTimeRange(state) {
      state.lastSelectedTimeRange = MobileTimeRange.All;
      localStorage.setItem("lastSelectedMobileTimeRange", MobileTimeRange.All);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMobileStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(
      fetchMobileStreamById.fulfilled,
      (state, action: PayloadAction<MobileStream>) => {
        state.status = StatusEnum.Fulfilled;
        state.data = action.payload;
        state.error = null;
        state.isLoading = false;
      }
    );
    builder.addCase(
      fetchMobileStreamById.rejected,
      (state, action: PayloadAction<ApiError | undefined>) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload || { message: "Unknown error occurred" };
        state.data = initialState.data;
        state.isLoading = false;
      }
    );
  },
});

export const {
  updateMobileMeasurementExtremes,
  resetMobileStreamState,
  setLastSelectedMobileTimeRange,
  resetLastSelectedMobileTimeRange,
} = mobileStreamSlice.actions;

export default mobileStreamSlice.reducer;
