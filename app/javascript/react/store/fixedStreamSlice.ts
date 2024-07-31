import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { FixedStream } from "../types/fixedStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./index";

interface FixedStreamState {
  data: FixedStream;
  status: StatusEnum;
  error?: Error;
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
  isLoading: boolean;
  minTime: number | null;
  maxTime: number | null;
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
      sessionId: "",
      startTime: "",
      endTime: "",
      min: 0,
      low: 0,
      middle: 0,
      high: 0,
      max: 0,
    },
    measurements: [],
    streamDailyAverages: [],
  },
  status: StatusEnum.Idle,
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
  minTime: 0,
  maxTime: 0,
  isLoading: false,
};

export const fetchFixedStreamById = createAsyncThunk<
  FixedStream,
  number,
  { rejectValue: { message: string } }
>("fixedStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<FixedStream, Error> = await apiClient.get(
      API_ENDPOINTS.fetchFixedStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
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

      state.minTime = min;
      state.maxTime = max;

      const measurementsInRange = state.data.measurements.filter(
        (measurement) => measurement.time >= min && measurement.time <= max
      );

      if (measurementsInRange.length > 0) {
        const values = measurementsInRange.map((m) => m.value);
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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFixedStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
    });
    builder.addCase(fetchFixedStreamById.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;
      state.data = payload;
      state.isLoading = false;
    });
    builder.addCase(fetchFixedStreamById.rejected, (state, { payload }) => {
      state.status = StatusEnum.Rejected;
      state.error = payload;
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
