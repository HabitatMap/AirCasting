import { thresholdsValues } from "../components/WeekView/WeeklyMockData";
import * as colors from "../assets/styles/colors";

const COLORS_FOR_RANGES = [
  { max: thresholdsValues.low, color: colors.green },
  { max: thresholdsValues.middle, color: colors.yellow },
  { max: thresholdsValues.high, color: colors.orange },
  { max: thresholdsValues.max, color: colors.red },
];

const getColorForValue = (value: number) => {
  for (let range of COLORS_FOR_RANGES) {
    if (value <= range.max) {
      return range.color;
    }
  }
  return colors.gray200;
};

export { getColorForValue };
