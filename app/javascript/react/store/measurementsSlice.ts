import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./index";

interface Measurement {
  time: number;
  value: number;
  latitude: number;
  longitude: number;
}

export interface MeasurementsState {
  data: Measurement[];
  status: StatusEnum;
  error?: Error;
  isLoading: boolean;
}

const initialState: MeasurementsState = {
  data: [],
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
      const response: AxiosResponse<Measurement[], Error> = await apiClient.get(
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
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMeasurements.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
    });
    builder.addCase(fetchMeasurements.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;
      state.data = payload;
      state.isLoading = false;
    });
    builder.addCase(fetchMeasurements.rejected, (state, { payload }) => {
      state.status = StatusEnum.Rejected;
      state.error = payload;
      state.data = [];
      state.isLoading = false;
    });
  },
});

export default measurementsSlice.reducer;
export const selectMeasurementsData = (state: RootState) =>
  state.measurements.data;
export const selectMeasurementsIsLoading = (state: RootState) =>
  state.measurements.isLoading;
