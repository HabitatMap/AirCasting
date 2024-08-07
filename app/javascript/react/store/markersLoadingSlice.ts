import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";

interface MarkersLoadingState {
  isLoading: boolean;
}

const initialState: MarkersLoadingState = {
  isLoading: false,
};

const markersLoadingSlice = createSlice({
  name: "markersLoading",
  initialState,
  reducers: {
    setMarkersLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setMarkersLoading } = markersLoadingSlice.actions;

export const selectMarkersLoading = (state: RootState) =>
  state.markersLoading.isLoading;

export default markersLoadingSlice.reducer;
