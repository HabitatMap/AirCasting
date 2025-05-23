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
  return values.some(
    (value) =>
      value === undefined ||
      value === null ||
      value === Infinity ||
      value === -Infinity ||
      isNaN(value)
  );
};

export const isValidValue = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined && isFinite(value);
};

export const formatTime = (minTime: string | null, maxTime: string | null) => {
  const formatDate = (time: string | null) => {
    if (!time) return { date: null, time: null };

    // Check if time is a valid date string before creating moment object
    const dateMoment = moment(time, moment.ISO_8601);

    // Check if the created moment is valid
    if (!dateMoment.isValid()) {
      return { date: null, time: null };
    }

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
  // Make sure min and max are valid numbers before creating moment objects
  if (!isValidValue(min) || !isValidValue(max)) {
    return {
      formattedMinTime: { date: null, time: null },
      formattedMaxTime: { date: null, time: null },
    };
  }

  // Force UTC handling
  const minDate = moment.utc(min);
  const maxDate = moment.utc(max);

  // Verify both dates are valid
  if (!minDate.isValid() || !maxDate.isValid()) {
    return {
      formattedMinTime: { date: null, time: null },
      formattedMaxTime: { date: null, time: null },
    };
  }

  // Check if both timestamps fall on the same day
  const sameDay = minDate.isSame(maxDate, "day");

  // Determine if the minimum timestamp is exactly at the start of its day
  const isMinAtStart = minDate.isSame(minDate.clone().startOf("day"));
  // Determine if the maximum timestamp is exactly at the end of its day
  const isMaxAtEnd = maxDate.isSame(maxDate.clone().endOf("day"));

  return {
    formattedMinTime: {
      date: minDate.format(DateFormat.us),
      time:
        useFullDayFormat && sameDay && isMinAtStart
          ? "00:00:01"
          : minDate.format(DateFormat.time_with_seconds),
    },
    formattedMaxTime: {
      date: maxDate.format(DateFormat.us),
      time:
        useFullDayFormat && sameDay && isMaxAtEnd
          ? "00:00:00"
          : maxDate.format(DateFormat.time_with_seconds),
    },
  };
};
