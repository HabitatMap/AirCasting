import { createSelector } from "@reduxjs/toolkit";

import { StatusEnum } from "../types/api";
import { RootState } from "./";

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

export const selectIsLoading = createSelector(
  [
    selectFixedStreamLoading,
    selectFixedSessionsLoading,
    selectMobileSessionsLoading,
    selectMobileStreamLoading,
    selectTimelapseLoading,
    selectCrowdMapLoading,
  ],
  (
    fixedStreamLoading,
    fixedSessionsLoading,
    mobileSessionsLoading,
    mobileStreamLoading,
    timelapseLoading,
    crowdMapLoading
  ) => {
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
