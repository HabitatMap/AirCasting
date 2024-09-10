import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export interface Measurement {
  time: number;
  value: number;
  latitude: number;
  longitude: number;
}

export interface MeasurementsState {
  data: Measurement[];
  minMeasurementValue: number;
  maxMeasurementValue: number;
  averageMeasurementValue: number;
  status: StatusEnum;
  error?: Error;
  isLoading: boolean;
}

const initialState: MeasurementsState = {
  data: [],
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
  status: StatusEnum.Idle,
  isLoading: false,
};

export const fetchMeasurements = createAsyncThunk<
  Measurement[],
  { streamId: number; startTime: string; endTime: string },
  { rejectValue: { message: string } }
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
      return rejectWithValue({ message });
    }
  }
);

const measurementsSlice = createSlice({
  name: "measurements",
  initialState,
  reducers: {
    updateMeasurementExtremes(
      state,
      action: PayloadAction<{ min: number; max: number }>
    ) {
      const { min, max } = action.payload;
      const measurementsInRange = state.data.filter(
        (measurement) => measurement.time >= min && measurement.time <= max
      );

      if (measurementsInRange.length > 0) {
        const values = measurementsInRange.map((m) => m.value);
        state.minMeasurementValue = Math.min(...values);
        state.maxMeasurementValue = Math.max(...values);
        state.averageMeasurementValue =
          values.reduce((sum, value) => sum + value, 0) / values.length;
      } else {
        state.minMeasurementValue = 0;
        state.maxMeasurementValue = 0;
        state.averageMeasurementValue = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMeasurements.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
    });
    builder.addCase(fetchMeasurements.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;
      state.data = payload;
      state.isLoading = false;

      if (payload.length > 0) {
        const values = payload.map((m) => m.value);
        state.minMeasurementValue = Math.min(...values);
        state.maxMeasurementValue = Math.max(...values);
        state.averageMeasurementValue =
          values.reduce((sum, value) => sum + value, 0) / values.length;
      } else {
        state.minMeasurementValue = 0;
        state.maxMeasurementValue = 0;
        state.averageMeasurementValue = 0;
      }
    });
    builder.addCase(fetchMeasurements.rejected, (state, { payload }) => {
      state.status = StatusEnum.Rejected;
      state.error = payload;
      state.data = [];
      state.isLoading = false;
    });
  },
});

export const { updateMeasurementExtremes } = measurementsSlice.actions;
export default measurementsSlice.reducer;
