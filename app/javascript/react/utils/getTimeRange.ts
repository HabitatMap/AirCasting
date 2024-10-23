import { TimeRange } from "../types/timeRange";

export const getSelectedRangeIndex = (timeRange: TimeRange): number => {
  switch (timeRange) {
    case TimeRange.Hour:
      return 0;
    case TimeRange.Day:
      return 1;
    case TimeRange.Week:
      return 2;
    case TimeRange.Month:
      return 3;
    case TimeRange.Custom:
      return 4;
    default:
      return 1;
  }
};

export const mapIndexToTimeRange = (index: number): TimeRange => {
  switch (index) {
    case 0:
      return TimeRange.Hour;
    case 1:
      return TimeRange.Day;
    case 2:
      return TimeRange.Week;
    case 3:
      return TimeRange.Month;
    case 4:
      return TimeRange.Custom;
    default:
      return TimeRange.Day;
  }
};
