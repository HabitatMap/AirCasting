import { AxiosError, AxiosResponse } from "axios";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { RootState } from "./index";

export interface FixedStreamState {
  data: FixedStream;
  status: StatusEnum;
  error: string | null;
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
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
  status: StatusEnum.Idle,
  error: null,
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
  isLoading: false,
};

export const fetchFixedStreamById = createAsyncThunk<
  FixedStream,
  number,
  { rejectValue: string }
>("fixedStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<FixedStream> = await apiClient.get(
      API_ENDPOINTS.fetchFixedStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    logError(error, {
      action: "fetchFixedStreamById",
      endpoint: API_ENDPOINTS.fetchFixedStreamById(id),
      message,
    });
    return rejectWithValue(message);
  }
});

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
    builder.addCase(fetchFixedStreamById.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;
      state.data = payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(fetchFixedStreamById.rejected, (state, { payload }) => {
      state.status = StatusEnum.Rejected;
      state.error = payload || "Unknown error occurred";
      state.data = initialState.data;
      state.isLoading = false;
    });
  },
});

export const { updateFixedMeasurementExtremes } = fixedStreamSlice.actions;
export default fixedStreamSlice.reducer;
export const selectFixedData = (state: RootState) => state.fixedStream.data;
export const selectIsLoading = (state: RootState) =>
  state.fixedStream.isLoading;
