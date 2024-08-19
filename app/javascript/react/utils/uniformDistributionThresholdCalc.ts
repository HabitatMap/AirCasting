import { Thresholds } from "../types/thresholds";

export const calculateUniformThresholds = (
  min: number,
  max: number
): Thresholds => {
  const middle = (min + max) / 2;
  const low = (min + middle) / 2;
  const high = (middle + max) / 2;

  return {
    min,
    low,
    middle,
    high,
    max,
  };
};
