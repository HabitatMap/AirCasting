import { createSelector } from "@reduxjs/toolkit";
import { RootState } from ".";
import { StatusEnum } from "../types/api";

// Add selectors for each relevant slice
const selectFixedStreamLoading = (state: RootState) =>
  state.fixedStream.status === StatusEnum.Pending;
const selectFixedSessionsLoading = (state: RootState) =>
  state.fixedSessions.status === StatusEnum.Pending;
const selectMobileSessionsLoading = (state: RootState) =>
  state.mobileSessions.status === StatusEnum.Pending;
const selectMobileStreamLoading = (state: RootState) =>
  state.mobileStream.status === StatusEnum.Pending;

// Combine loading states
export const selectIsLoading = createSelector(
  [
    selectFixedStreamLoading,
    selectFixedSessionsLoading,
    selectMobileSessionsLoading,
    selectMobileStreamLoading,
  ],
  (
    fixedStreamLoading,
    fixedSessionsLoading,
    mobileSessionsLoading,
    mobileStreamLoading
  ) =>
    fixedStreamLoading ||
    fixedSessionsLoading ||
    mobileSessionsLoading ||
    mobileStreamLoading
);
