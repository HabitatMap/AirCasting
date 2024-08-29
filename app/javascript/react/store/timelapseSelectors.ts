import { RootState } from "./index";

export const selectTimelapseData = (state: RootState) => state.timelapse.data;

export const selectCurrentTimestamp = (state: RootState) =>
  state.timelapse.currentTimestamp;

export const selectTimelapseIsLoading = (state: RootState) =>
  state.timelapse.isLoading;

export const selectTimelapseTimeRange = (state: RootState) =>
  state.timelapse.timelapseTimeRange;
