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
  id: number;
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
    updateAll: (state, action: PayloadAction<ThresholdState>) => {
      state.th1 = action.payload.th1;
      state.th2 = action.payload.th2;
      state.th3 = action.payload.th3;
      state.th4 = action.payload.th4;
      state.th5 = action.payload.th5;
    },
    updateGivenIndex: (state, action: PayloadAction<Threshold>) => {
      const { id, value } = action.payload;
      const key = `th${id}` as keyof ThresholdState;
      console.log(key)
      if (key in state) {
        state[key] = value;
      } else {
        console.log("No update possible, the key is out of the range.");
      }
    },
  },
});

export const { updateAll, updateGivenIndex } = thresholdSlice.actions;
export const selectThreshold = (state: RootState) => state.threshold;
export default thresholdSlice.reducer;
