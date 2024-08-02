import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RealtimeMapUpdatesState {
  realtimeMapUpdates: boolean;
}

const initialState: RealtimeMapUpdatesState = {
  realtimeMapUpdates: false,
};

const realtimeMapUpdatesSlice = createSlice({
  name: "realtimeMapUpdates",
  initialState,
  reducers: {
    setRealtimeMapUpdates(state, action: PayloadAction<boolean>) {
      state.realtimeMapUpdates = action.payload;
    },
  },
});

export const { setRealtimeMapUpdates } = realtimeMapUpdatesSlice.actions;
export default realtimeMapUpdatesSlice.reducer;
