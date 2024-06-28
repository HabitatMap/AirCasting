import { createSlice } from "@reduxjs/toolkit";

import { Thresholds } from "../types/thresholds";

import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "./index";

export interface ThresholdState {
  userAdjustedValues: boolean;
  values: Thresholds;
}

export const initialState: ThresholdState = {
  userAdjustedValues: false,
  values: {
    min: 0,
    low: 0,
    middle: 0,
    high: 0,
    max: 0,
  },
};

export const thresholdSlice = createSlice({
  name: "threshold",
  initialState: { ...initialState },
  reducers: {
    updateAll: (
      state,
      { payload: { min, low, middle, high, max } }: PayloadAction<Thresholds>
    ) => {
      state.values.min = min;
      state.values.low = low;
      state.values.middle = middle;
      state.values.high = high;
      state.values.max = max;
    },
    setUserAdjustedValues(state, action: PayloadAction<boolean>) {
      state.userAdjustedValues = action.payload;
    },
  },
});

export const { setUserAdjustedValues, updateAll } = thresholdSlice.actions;
export default thresholdSlice.reducer;

export const selectThreshold = (state: RootState): Thresholds =>
  state.threshold.values;
export const selectUserAdjustedValues = (state: RootState): boolean =>
  state.threshold.userAdjustedValues;
