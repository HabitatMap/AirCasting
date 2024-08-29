import { TimelapseData } from "../types/timelapse";
import { filterTimestamps } from "../utils/filterTimelapseData";
import { RootState } from "./index";

export const selectTimelapseData = (state: RootState) => state.timelapse.data;

export const selectCurrentTimestamp = (state: RootState) =>
  state.timelapse.currentTimestamp;

export const selectTimelapseIsLoading = (state: RootState) =>
  state.timelapse.isLoading;

export const selectTimelapseTimeRange = (state: RootState) =>
  state.timelapse.timelapseTimeRange;

export const selectFilteredTimelapseData = (state: RootState) => {
  const data = selectTimelapseData(state);
  const timeRange = selectTimelapseTimeRange(state);
  const filteredTimestamps = filterTimestamps(data, timeRange);

  const filteredData: TimelapseData = filteredTimestamps.reduce(
    (acc, timestamp) => {
      acc[timestamp] = data[timestamp];
      return acc;
    },
    {} as TimelapseData
  );
  return filteredData;
};
