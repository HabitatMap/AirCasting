import moment, { Moment } from "moment";
import { DateFormat } from "../types/dateFormat";
import { TimeRanges } from "../types/timelapse";

export const filterTimestamps = (
  timestamps: { [timestamp: string]: any },
  timeRange: TimeRanges
): string[] => {
  const now = moment.utc();
  let startTime: Moment;

  switch (timeRange) {
    case TimeRanges.HOURS_24:
      startTime = now.clone().subtract(24, "hours");
      break;
    case TimeRanges.DAYS_3:
      startTime = now.clone().subtract(3, "days");
      break;
    case TimeRanges.DAYS_7:
      startTime = now.clone().subtract(7, "days");
      break;
    default:
      startTime = now.clone().subtract(24, "hours");
      break;
  }

  const filtered = Object.keys(timestamps)
    .filter((timestamp) => {
      const parsedTimestamp = moment.utc(
        timestamp,
        DateFormat.us_with_time_seconds_utc
      );
      return parsedTimestamp.isAfter(startTime);
    })
    .sort((a, b) =>
      moment
        .utc(a, DateFormat.us_with_time_seconds_utc)
        .diff(moment.utc(b, DateFormat.us_with_time_seconds_utc))
    );

  if (filtered.length === 0) {
    return Object.keys(timestamps).sort((a, b) =>
      moment
        .utc(a, DateFormat.us_with_time_seconds_utc)
        .diff(moment.utc(b, DateFormat.us_with_time_seconds_utc))
    );
  }

  return filtered;
};
