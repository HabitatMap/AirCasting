import { FixedTimeRange, MobileTimeRange } from "../types/timeRange";

export const getSelectedRangeIndex = (
  timeRange: FixedTimeRange | MobileTimeRange,
  fixedSessionTypeSelected: boolean
): number => {
  if (fixedSessionTypeSelected) {
    switch (timeRange) {
      case FixedTimeRange.Day:
        return 0;
      case FixedTimeRange.Week:
        return 1;
      case FixedTimeRange.Month:
        return 2;
      case FixedTimeRange.Custom:
        return 3;
      default:
        return 0;
    }
  } else {
    switch (timeRange) {
      case MobileTimeRange.FiveMinutes:
        return 0;
      case MobileTimeRange.Hour:
        return 1;
      case MobileTimeRange.All:
        return 2;
      default:
        return 0;
    }
  }
};

export const mapIndexToTimeRange = (
  index: number,
  fixedSessionTypeSelected: boolean
): FixedTimeRange | MobileTimeRange => {
  if (fixedSessionTypeSelected) {
    switch (index) {
      case 0:
        return FixedTimeRange.Day;
      case 1:
        return FixedTimeRange.Week;
      case 2:
        return FixedTimeRange.Month;
      case 3:
        return FixedTimeRange.Custom;
      default:
        return FixedTimeRange.Day;
    }
  } else {
    switch (index) {
      case 0:
        return MobileTimeRange.FiveMinutes;
      case 1:
        return MobileTimeRange.Hour;
      case 2:
        return MobileTimeRange.All;
      default:
        return MobileTimeRange.FiveMinutes;
    }
  }
};
