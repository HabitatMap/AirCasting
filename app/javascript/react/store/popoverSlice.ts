import { createSlice } from "@reduxjs/toolkit";

const popoverSlice = createSlice({
  name: "popover",
  initialState: {
    openMarkerKey: null,
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

export const { openPopover, closePopover } = popoverSlice.actions;
export default popoverSlice.reducer;
