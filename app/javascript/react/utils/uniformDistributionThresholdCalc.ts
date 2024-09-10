import { RootState } from "../store";
import { selectMeasurementsExtremes } from "../store/measurementsSelectors";
import { Thresholds } from "../types/thresholds";

export const calculateUniformThresholds = (
  min: number,
  max: number
): Thresholds => {
  const step = Math.max(Math.floor((max - min) / 4), 1);

  const lowThreshold = min + step;
  const middleThreshold = lowThreshold + step;
  const highThreshold = middleThreshold + step;
  const maxThreshold = Math.max(highThreshold + step, max);

  return {
    min,
    low: lowThreshold,
    middle: middleThreshold,
    high: highThreshold,
    max: maxThreshold,
  };
};

export const calculateMinMaxValues = (
  state: RootState
): { min: number; max: number } | null => {
  const { minMeasurementValue, maxMeasurementValue } =
    selectMeasurementsExtremes(state);

  if (minMeasurementValue !== null && maxMeasurementValue !== null) {
    return {
      min: Math.floor(minMeasurementValue),
      max: Math.ceil(maxMeasurementValue),
    };
  } else {
    console.warn("No measurement data available");
    return null;
  }
};
