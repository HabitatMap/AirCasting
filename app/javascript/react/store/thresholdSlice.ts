import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "./index";
import { Threshold, Thresholds } from "../types/thresholds";

interface ThresholdState extends Thresholds {}

const initialState: ThresholdState = {
  min: 10,
  low: 30,
  middle: 50,
  high: 80,
  max: 120,
};

export const thresholdSlice = createSlice({
  name: "threshold",
  initialState,
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
  },
});

export const { updateAll, updateGivenIndex } = thresholdSlice.actions;
export const selectThreshold = (state: RootState) => state.threshold;
export default thresholdSlice.reducer;
