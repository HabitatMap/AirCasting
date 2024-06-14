import * as colors from "../assets/styles/colors";
import { Thresholds } from "../types/thresholds";

const COLORS_FOR_RANGES = (thresholdValues: Thresholds) => [
  { max: thresholdValues.low, color: colors.green },
  { max: thresholdValues.middle, color: colors.yellow },
  { max: thresholdValues.high, color: colors.orange },
  { max: thresholdValues.max, color: colors.red },
  { max: Infinity, color: colors.red }, // red color for values out of scale
];

const getColorForValue = (
  thresholdValues: Thresholds,
  value: number | null
) => {
  const defaultColor = "transparent";

  if (value !== 0 && !value) return defaultColor;

  for (let range of COLORS_FOR_RANGES(thresholdValues)) {
    if (Number(value) <= Number(range.max)) {
      return range.color;
    }
  }

  return defaultColor;
};

export { getColorForValue };
