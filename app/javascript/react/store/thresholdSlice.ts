import { AxiosResponse } from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { StatusEnum } from "../types/api";
import { Thresholds } from "../types/thresholds";
import { getErrorMessage } from "../utils/getErrorMessage";

import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "./index";

export interface ThresholdState {
  defaultValues: Thresholds;
  error?: string;
  status: StatusEnum;
  userAdjustedValues: boolean;
  userValues?: Thresholds;
}

export const initialState: ThresholdState = {
  defaultValues: {
    min: 0,
    low: 0,
    middle: 0,
    high: 0,
    max: 0,
  },
  status: StatusEnum.Idle,
  userAdjustedValues: false,
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
    resetUserThresholds: (state) => {
      state.userAdjustedValues = false;
      state.userValues = undefined;
    },
    setUserAdjustedThresholds(state, action: PayloadAction<boolean>) {
      state.userAdjustedValues = action.payload;
    },
    setUserThresholdValues: (
      state,
      { payload: { min, low, middle, high, max } }: PayloadAction<Thresholds>
    ) => {
      state.userValues = { min, low, middle, high, max };
    },
  },
});

export const {
  resetUserThresholds,
  setUserAdjustedThresholds,
  setUserThresholdValues,
} = thresholdSlice.actions;
export default thresholdSlice.reducer;

export const selectDefaultThresholds = (state: RootState): Thresholds =>
  state.threshold.defaultValues;

export const selectThresholds = (state: RootState): Thresholds =>
  state.threshold.userValues || state.threshold.defaultValues;

export const selectUserAdjustedThresholds = (state: RootState): boolean =>
  state.threshold.userAdjustedValues;
