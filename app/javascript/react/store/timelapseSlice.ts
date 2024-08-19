import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { Error, StatusEnum } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { RootState } from "./index";

interface TimelapseData {
  time: string;
  value: number;
}

interface TimelapseCluster {
  [clusterId: string]: TimelapseData[];
}

interface TimelapseState {
  data: TimelapseCluster;
  status: StatusEnum;
  error?: Error;
  isLoading: boolean;
  currentStep: number;
}

const initialState: TimelapseState = {
  data: {},
  status: StatusEnum.Idle,
  isLoading: false,
  currentStep: 0,
};

export const fetchTimelapseData = createAsyncThunk<
  TimelapseCluster,
  { clusters: { [key: string]: number[] }; timePeriod: number },
  { rejectValue: { message: string } }
>("timelapse/fetchData", async (params, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<TimelapseCluster, Error> =
      await apiClient.post(API_ENDPOINTS.fetchTimelapseData(), params);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});

const timelapseSlice = createSlice({
  name: "timelapse",
  initialState,
  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },
    resetTimelapse(state) {
      state.currentStep = 0;
      state.data = {};
      state.status = StatusEnum.Idle;
      state.error = undefined;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTimelapseData.pending, (state) => {
      state.status = StatusEnum.Pending;
      state.isLoading = true;
    });
    builder.addCase(fetchTimelapseData.fulfilled, (state, { payload }) => {
      state.status = StatusEnum.Fulfilled;
      state.data = payload;
      state.isLoading = false;
      state.currentStep = Object.keys(payload).length - 1; // Start at the most recent step
    });
    builder.addCase(fetchTimelapseData.rejected, (state, { payload }) => {
      state.status = StatusEnum.Rejected;
      state.error = payload;
      state.isLoading = false;
    });
  },
});

export const { setCurrentStep, resetTimelapse } = timelapseSlice.actions;
export default timelapseSlice.reducer;

export const selectTimelapseData = (state: RootState) => state.timelapse.data;
export const selectIsLoading = (state: RootState) => state.timelapse.isLoading;
export const selectCurrentStep = (state: RootState) =>
  state.timelapse.currentStep;
