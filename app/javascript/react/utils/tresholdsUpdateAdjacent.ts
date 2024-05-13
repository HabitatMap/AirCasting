import { Thresholds } from "../types/thresholds";

const minThresholdDifference = 1;
const maxThresholdDifference = 2;

export const updateAdjacentThresholds = (
  thresholdKey: keyof Thresholds,
  newValue: number,
  setThresholdValues: React.Dispatch<React.SetStateAction<Thresholds>>,
  thresholdValues: Thresholds
) => {
  switch (thresholdKey) {
    case "low":
      // Update middle and high thresholds only if newValue is less than the max
      if (newValue < thresholdValues.max) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          middle: Math.min(newValue + minThresholdDifference, thresholdValues.middle),
          high: Math.min(newValue + maxThresholdDifference, thresholdValues.high),
        }));
      }
      break;
    case "middle":
      // Update low and high thresholds only if newValue is greater than the min and less than the max
      if (newValue > thresholdValues.min && newValue < thresholdValues.max) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: Math.max(newValue - minThresholdDifference, thresholdValues.low),
          high: Math.min(newValue + minThresholdDifference, thresholdValues.high),
        }));
      }
      break;
    case "high":
      // Update low and middle thresholds only if newValue is greater than the min
      if (newValue > thresholdValues.min) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: Math.max(newValue - maxThresholdDifference, thresholdValues.low),
          middle: Math.max(newValue - minThresholdDifference, thresholdValues.middle),
        }));
      }
      break;
    case "max":
      // Update low, middle, and high thresholds if newValue is less than the current value
      if (newValue < thresholdValues.low) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          low: newValue,
          middle: newValue,
          high: newValue,
        }));
      }
      break;
    default:
      break;
  }
};
