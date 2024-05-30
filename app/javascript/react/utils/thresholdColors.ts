import { Thresholds } from "../types/thresholds";
import * as colors from "../assets/styles/colors";

const COLORS_FOR_RANGES = (thresholdValues: Thresholds) => [
  { max: thresholdValues.low, color: colors.green },
  { max: thresholdValues.middle, color: colors.yellow },
  { max: thresholdValues.high, color: colors.orange },
  { max: thresholdValues.max, color: colors.red },
];

const getColorForValue = (
  thresholdValues: Thresholds,
  value: number | null
) => {

  const defaultColor = "transparent";
  if (value === null || value === undefined) return defaultColor;


  for (let range of COLORS_FOR_RANGES(thresholdValues)) {
    if (value <= range.max) {
      return range.color;
    }
  }
  return defaultColor;
};

export { getColorForValue };
