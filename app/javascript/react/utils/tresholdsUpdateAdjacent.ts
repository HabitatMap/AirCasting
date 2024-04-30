import { Thresholds } from "../types/thresholds";

export const updateAdjacentThresholds = (
  thresholdKey: keyof Thresholds,
  newValue: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  thresholdValues: Thresholds
) => {
  switch (thresholdKey) {
    case "low":
      if (
        newValue >= thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          middle: Math.min(newValue + 1, thresholdValues.max),
        }));
      }
      if (
        newValue >= thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          high: Math.min(newValue + 2, thresholdValues.max),
        }));
      }
      break;
    case "middle":
      if (
        newValue <= thresholdValues.low &&
        thresholdValues.low !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: Math.max(newValue - 1, thresholdValues.min),
        }));
      }
      if (
        newValue > thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          high: Math.min(newValue + 1, thresholdValues.max),
        }));
      }
      break;
    case "high":
      if (
        newValue <= thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          middle: Math.max(newValue - 1, thresholdValues.min),
        }));
      }
      if (
        newValue <= thresholdValues.low &&
        thresholdValues.low !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: Math.max(newValue - 2, thresholdValues.min),
        }));
      }
      break;
    case "max":
      if (
        newValue < thresholdValues.low &&
        thresholdValues.low !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: newValue,
        }));
      }
      if (
        newValue < thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          middle: newValue,
        }));
      }
      if (
        newValue < thresholdValues.high &&
        thresholdValues.high !== thresholdValues.min
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          high: newValue,
        }));
      }
      break;
    default:
      break;
  }
};
