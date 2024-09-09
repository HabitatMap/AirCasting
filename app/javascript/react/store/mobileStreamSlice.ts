import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { MobileStream } from "../types/mobileStream";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

export interface MobileStreamState {
  data: MobileStream;
  status: StatusEnum;
  error: string | null;
  minMeasurementValue: number | null;
  maxMeasurementValue: number | null;
  averageMeasurementValue: number | null;
  isLoading: boolean;
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
  status: StatusEnum.Idle,
  error: null,
  minMeasurementValue: 0,
  maxMeasurementValue: 0,
  averageMeasurementValue: 0,
  isLoading: false,
};

export const fetchMobileStreamById = createAsyncThunk<
  MobileStream,
  number,
  { rejectValue: string }
>("mobileStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<MobileStream, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchMobileStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    logError(error, {
      action: "fetchMobileSessions",
      endpoint: API_ENDPOINTS.fetchMobileStreamById(id),
      message,
    });
    return rejectWithValue(message);
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
    builder.addCase(fetchMobileStreamById.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.error = null;
      state.isLoading = true;
    });
    builder.addCase(fetchMobileStreamById.fulfilled, (state, action) => {
      state.status = StatusEnum.Fulfilled;
      state.data = action.payload;
      state.error = null;
      state.isLoading = false;
    });
    builder.addCase(fetchMobileStreamById.rejected, (state, action) => {
      state.status = StatusEnum.Rejected;
      state.error = action.payload || "Unknown error occurred";
      state.data = initialState.data;
      state.isLoading = false;
    });
  },
});

export const { updateMobileMeasurementExtremes } = mobileStreamSlice.actions;

export default mobileStreamSlice.reducer;
