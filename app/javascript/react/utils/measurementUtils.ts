import { useSearchParams } from "react-router-dom";
import { Measurement } from "../types/fixedStream";

export const updateMeasurementExtremesFromUrl = (
  measurements: Measurement[]
) => {
  const [searchParams] = useSearchParams();

  const minTime = parseInt(searchParams.get("minTime") || "0", 10);
  const maxTime = parseInt(searchParams.get("maxTime") || "0", 10);

  if (!minTime || !maxTime) {
    console.warn("minTime and maxTime are not properly set in the URL");
    return null;
  }

  const measurementsInRange = measurements.filter((measurement) => {
    const time = measurement.time;
    return time >= minTime && time <= maxTime;
  });

  const values = measurementsInRange.map((m) => m.value);

  if (values.length === 0) {
    return {
      minMeasurementValue: null,
      maxMeasurementValue: null,
      averageMeasurementValue: null,
    };
  }

  const minMeasurementValue = Math.min(...values);
  const maxMeasurementValue = Math.max(...values);
  const averageMeasurementValue =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    minMeasurementValue,
    maxMeasurementValue,
    averageMeasurementValue,
  };
};
