import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { Thresholds } from "../types/thresholds";
import { getErrorMessage } from "../utils/getErrorMessage";

import type { RootState } from "./index";
interface ThumbPositions {
  low: number;
  middle: number;
  high: number;
}

export interface ThresholdState {
  defaultValues: Thresholds;
  error?: string;
  errorMessage: string;
  sliderWidth: number;
  status: StatusEnum;
  thumbPositions: ThumbPositions;
}

export const initialState: ThresholdState = {
  defaultValues: {
    min: 0,
    low: 0,
    middle: 0,
    high: 0,
    max: 0,
  },
  errorMessage: "",
  sliderWidth: 0,
  status: StatusEnum.Idle,
  thumbPositions: {
    low: 0,
    middle: 0,
    high: 0,
  },
};

export const fetchThresholds = createAsyncThunk<
  string[],
  string,
  { rejectValue: string }
>("thresholds/getData", async (filters: string, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<string[], Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchThresholds(filters)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue(message);
  }
});

export const thresholdSlice = createSlice({
  name: "threshold",
  initialState: { ...initialState },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThresholds.pending, (state) => {
        state.status = StatusEnum.Pending;
      })
      .addCase(fetchThresholds.fulfilled, (state, action) => {
        state.status = StatusEnum.Fulfilled;
        state.defaultValues.min = Number(action.payload[0]);
        state.defaultValues.low = Number(action.payload[1]);
        state.defaultValues.middle = Number(action.payload[2]);
        state.defaultValues.high = Number(action.payload[3]);
        state.defaultValues.max = Number(action.payload[4]);
      })
      .addCase(fetchThresholds.rejected, (state, action) => {
        state.status = StatusEnum.Rejected;
        state.error = action.payload;
      });
  },
  reducers: {
    setDefaultThresholdsValues: (
      state,
      { payload: { min, low, middle, high, max } }: PayloadAction<Thresholds>
    ) => {
      state.defaultValues = { min, low, middle, high, max };
    },
    updateSliderWidth: (state, action: PayloadAction<number>) => {
      state.sliderWidth = action.payload;
    },
    updateThumbPositions: (state, action: PayloadAction<ThumbPositions>) => {
      state.thumbPositions = action.payload;
    },
    clearErrorMessage: (state) => {
      state.errorMessage = "";
    },
  },
});

export const {
  setDefaultThresholdsValues,
  updateSliderWidth,
  updateThumbPositions,
  clearErrorMessage,
} = thresholdSlice.actions;

export default thresholdSlice.reducer;

export const selectDefaultThresholds = (state: RootState): Thresholds =>
  state.threshold.defaultValues;

export const selectSliderWidth = (state: RootState): number =>
  state.threshold.sliderWidth;

export const selectThumbPositions = (state: RootState): ThumbPositions =>
  state.threshold.thumbPositions;
