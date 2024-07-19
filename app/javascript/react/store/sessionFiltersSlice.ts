import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";
import { SessionType, SessionTypes } from "../types/filters";

interface SessionFilterState {
  selectedSessionType: SessionType;
}

const initialState: SessionFilterState = {
  selectedSessionType: SessionTypes.FIXED,
};

const sessionFilterSlice = createSlice({
  name: "sessionFilter",
  initialState,
  reducers: {
    setSelectedSessionType(state, action: PayloadAction<SessionType>) {
      state.selectedSessionType = action.payload;
    },
  },
});

export const { setSelectedSessionType } = sessionFilterSlice.actions;

export const selectSelectedSessionType = (state: RootState): SessionType =>
  state.sessionFilter.selectedSessionType;

export default sessionFilterSlice.reducer;
