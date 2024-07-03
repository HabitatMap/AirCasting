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
      if (
        newValue >= thresholdValues.middle &&
        thresholdValues.middle !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          middle: Math.min(newValue + minThresholdDifference, thresholdValues.max),
        }));
      }
      if (
        newValue >= thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          high: Math.min(newValue + maxThresholdDifference, thresholdValues.max),
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
          low: Math.max(newValue - minThresholdDifference, thresholdValues.min),
        }));
      }
      if (
        newValue > thresholdValues.high &&
        thresholdValues.high !== thresholdValues.max
      ) {
        setThresholdValues((prevValues) => ({
          ...prevValues,
          high: Math.min(newValue + minThresholdDifference, thresholdValues.max),
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
            middle: Math.max(newValue - minThresholdDifference, thresholdValues.min),
          }));
        }
        if (
          newValue <= thresholdValues.low &&
          thresholdValues.low !== thresholdValues.min
        ) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            low: Math.max(newValue - maxThresholdDifference, thresholdValues.min),
          }));
        }
        if (newValue >= thresholdValues.max) {
          setThresholdValues((prevValues) => ({
            ...prevValues,
            max: newValue,
            high: newValue - minThresholdDifference,
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
