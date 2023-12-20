import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "./index";

interface ThresholdState {
  th1: number;
  th2: number;
  th3: number;
  th4: number;
  th5: number;
}

interface Threshold {
  name: keyof ThresholdState;
  value: number;
}

const initialState: ThresholdState = {
  th1: 10,
  th2: 30,
  th3: 50,
  th4: 80,
  th5: 120,
};

export const thresholdSlice = createSlice({
  name: "threshold",
  initialState,
  reducers: {
    updateAll: (state,{ payload: { th1, th2, th3, th4, th5 } }: PayloadAction<ThresholdState>) => {
      state.th1 = th1;
      state.th2 = th2;
      state.th3 = th3;
      state.th4 = th4;
      state.th5 = th5;
    },
    updateGivenIndex: (state, { payload: { name, value }}: PayloadAction<Threshold>) => {
      state[name] = value;
    },
  },
});

export const { updateAll, updateGivenIndex } = thresholdSlice.actions;
export const selectThreshold = (state: RootState) => state.threshold;
export default thresholdSlice.reducer;
