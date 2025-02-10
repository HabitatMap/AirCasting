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
  // Force UTC handling
  const minDate = moment.utc(min);
  const maxDate = moment.utc(max);

  // Check if dates are on the same day in UTC
  const sameDay = minDate.format("YYYY-MM-DD") === maxDate.format("YYYY-MM-DD");

  const formattedMinTime = {
    date: minDate.format(DateFormat.us),
    time:
      useFullDayFormat && sameDay
        ? "00:00:00"
        : minDate.format(DateFormat.time_with_seconds),
  };

  const formattedMaxTime = {
    date: maxDate.format(DateFormat.us),
    time:
      useFullDayFormat && sameDay
        ? "00:00:00"
        : maxDate.format(DateFormat.time_with_seconds),
  };

  return {
    formattedMinTime,
    formattedMaxTime,
  };
};
