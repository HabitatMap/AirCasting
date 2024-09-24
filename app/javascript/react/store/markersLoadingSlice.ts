// markersLoadingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";

interface MarkersLoadingState {
  isLoading: boolean;
  totalMarkers: number;
  loadedMarkers: number;
}

const initialState: MarkersLoadingState = {
  isLoading: false,
  totalMarkers: 0,
  loadedMarkers: 0,
};

const markersLoadingSlice = createSlice({
  name: "markersLoading",
  initialState,
  reducers: {
    setMarkersLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTotalMarkers: (state, action: PayloadAction<number>) => {
      state.totalMarkers = action.payload;
      state.loadedMarkers = 0;
    },
    incrementLoadedMarkers: (state) => {
      state.loadedMarkers += 1;
      if (state.loadedMarkers >= state.totalMarkers) {
        state.isLoading = false;
      }
    },
  },
});

export const { setMarkersLoading, setTotalMarkers, incrementLoadedMarkers } =
  markersLoadingSlice.actions;

export default markersLoadingSlice.reducer;

// Selectors
export const selectMarkersLoading = (state: RootState) =>
  state.markersLoading.isLoading;
export const selectLoadedMarkers = (state: RootState) =>
  state.markersLoading.loadedMarkers;
export const selectTotalMarkers = (state: RootState) =>
  state.markersLoading.totalMarkers;
