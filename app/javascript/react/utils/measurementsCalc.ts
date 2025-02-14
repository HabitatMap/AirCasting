import moment from "moment";
import { DateFormat } from "../types/dateFormat";

export const calculateMeasurementStats = (
  measurements: { value: number }[]
): { min: number; max: number; avg: number } => {
  if (measurements.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const values = measurements.map((m) => m.value);
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const avg = Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );

  return { min, max, avg };
};

export const isNoData = (...values: (number | null | undefined)[]): boolean => {
  return values.some((value) => value === undefined || value === null);
};

export const isValidValue = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined && isFinite(value);
};

export const formatTime = (minTime: string | null, maxTime: string | null) => {
  const formatDate = (time: string | null) => {
    if (!time) return { date: null, time: null };

    const dateMoment = moment(time);
    const dateString = dateMoment.format(DateFormat.us);
    const timeString = dateMoment.format(DateFormat.time_with_seconds);

    return { date: dateString, time: timeString };
  };

  return {
    formattedMinTime: formatDate(minTime),
    formattedMaxTime: formatDate(maxTime),
  };
};

export const formatTimeExtremes = (
  min: number,
  max: number,
  useFullDayFormat: boolean = false
) => {
  // Create moments in UTC first
  const minDateUtc = moment.utc(min);
  const maxDateUtc = moment.utc(max);

  // Convert to local time for display
  const minDate = minDateUtc.local();
  const maxDate = maxDateUtc.local();

  // Check if both timestamps fall on the same day in local time
  const sameDay = minDate.isSame(maxDate, "day");

  // For full day format, check if the UTC times correspond to local midnight
  const isFullDay =
    useFullDayFormat &&
    sameDay &&
    minDate.hours() === 0 &&
    minDate.minutes() === 0 &&
    minDate.seconds() === 0 &&
    maxDate.hours() === 23 &&
    maxDate.minutes() === 59 &&
    maxDate.seconds() === 59;

  return {
    formattedMinTime: {
      date: minDate.format(DateFormat.us),
      time: isFullDay
        ? "00:00:00"
        : minDate.format(DateFormat.time_with_seconds),
    },
    formattedMaxTime: {
      date: maxDate.format(DateFormat.us),
      time: isFullDay
        ? "23:59:59"
        : maxDate.format(DateFormat.time_with_seconds),
    },
  };
};
