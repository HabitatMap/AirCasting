import { TimeRange } from "../types/timeRange";

export const getSelectedRangeIndex = (timeRange: TimeRange): number => {
  switch (timeRange) {
    case TimeRange.Day:
      return 0;
    case TimeRange.Week:
      return 1;
    case TimeRange.Month:
      return 2;
    case TimeRange.Custom:
      return 3;
    default:
      return 0;
  }
};

export const mapIndexToTimeRange = (index: number): TimeRange => {
  switch (index) {
    case 0:
      return TimeRange.Day;
    case 1:
      return TimeRange.Week;
    case 2:
      return TimeRange.Month;
    case 3:
      return TimeRange.Custom;
    default:
      return TimeRange.Day;
  }
};
