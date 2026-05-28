import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./index";

const popoverSlice = createSlice({
  name: "popover",
  initialState: {
    openMarkerKey: null as string | null,
    initialSlide: 0,
  },
  reducers: {
    openPopover: (state, action) => {
      state.openMarkerKey = action.payload.markerKey;
      state.initialSlide = action.payload.initialSlide || 0;
    },
    closePopover: (state) => {
      state.openMarkerKey = null;
      state.initialSlide = 0;
    },
  },
});

export const selectOpenMarkerKey = (state: RootState) =>
  state.popover.openMarkerKey;
export const selectPopoverInitialSlide = (state: RootState) =>
  state.popover.initialSlide;

export const { openPopover, closePopover } = popoverSlice.actions;
export default popoverSlice.reducer;
