import { createSelector } from "@reduxjs/toolkit";

import { StatusEnum } from "../types/api";
import { RootState } from "./";

// Add selectors for each relevant slice
const selectFixedStreamLoading = (state: RootState) =>
  state.fixedStream.status === StatusEnum.Pending;
const selectFixedSessionsLoading = (state: RootState) =>
  state.fixedSessions.status === StatusEnum.Pending;
export const selectMobileSessionsLoading = (state: RootState) =>
  state.mobileSessions.status === StatusEnum.Pending;
const selectMobileStreamLoading = (state: RootState) =>
  state.mobileStream.status === StatusEnum.Pending;
const selectTimelapseLoading = (state: RootState) =>
  state.timelapse.status === StatusEnum.Pending;
const selectCrowdMapLoading = (state: RootState) =>
  state.crowdMap.status === StatusEnum.Pending;

// Create a properly memoized selector for the combined loading state
// The issue was that the selector was returning its inputs without transformation
export const selectIsLoading = createSelector(
  [
    selectFixedStreamLoading,
    selectFixedSessionsLoading,
    selectMobileSessionsLoading,
    selectMobileStreamLoading,
    selectTimelapseLoading,
    selectCrowdMapLoading,
  ],
  // Explicitly create a new boolean value to ensure proper memoization
  (
    fixedStreamLoading,
    fixedSessionsLoading,
    mobileSessionsLoading,
    mobileStreamLoading,
    timelapseLoading,
    crowdMapLoading
  ) => {
    // Return a new boolean value instead of just combining the inputs
    return Boolean(
      fixedStreamLoading ||
        fixedSessionsLoading ||
        mobileSessionsLoading ||
        mobileStreamLoading ||
        timelapseLoading ||
        crowdMapLoading
    );
  }
);
