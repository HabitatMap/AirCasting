import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SessionsState {
  activeSessionsData: any; // Replace 'any' with the actual type of activeSessionsData
}

const initialState: SessionsState = {
  activeSessionsData: null,
};

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setActiveSessionsData: (state, action: PayloadAction<any>) => {
      state.activeSessionsData = action.payload;
    },
  },
});

export const { setActiveSessionsData } = sessionsSlice.actions;
export default sessionsSlice.reducer;
