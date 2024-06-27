import { createSlice } from "@reduxjs/toolkit";

import { Threshold, Thresholds } from "../types/thresholds";

import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "./index";

export interface ThresholdState extends Thresholds {}

export const initialState: ThresholdState = {
  min: 0,
  low: 9,
  middle: 35,
  high: 55,
  max: 150,
};

export const thresholdSlice = createSlice({
  name: "threshold",
  initialState: { ...initialState },
  reducers: {
    updateAll: (
      state,
      {
        payload: { min, low, middle, high, max },
      }: PayloadAction<ThresholdState>
    ) => {
      state.min = min;
      state.low = low;
      state.middle = middle;
      state.high = high;
      state.max = max;
    },
    updateGivenIndex: (
      state,
      { payload: { name, value } }: PayloadAction<Threshold>
    ) => {
      state[name] = value;
    },
    resetToInitialValues: (state) => {
      state = { ...initialState };
    },
  },
});

export const { updateAll, updateGivenIndex, resetToInitialValues } =
  thresholdSlice.actions;
export const selectThreshold = (state: RootState) => state.threshold;
export default thresholdSlice.reducer;
