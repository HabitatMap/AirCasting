import * as colors from "../assets/styles/colors";
import { Thresholds } from "../types/thresholds";
import hexToRGBA from "./hexToRGB";

const COLORS_FOR_RANGES = (thresholdValues: Thresholds) => [
  { max: thresholdValues.min - 1, color: colors.grey }, // grey color for values below min
  { max: thresholdValues.low, color: colors.green },
  { max: thresholdValues.middle, color: colors.yellow },
  { max: thresholdValues.high, color: colors.orange },
  { max: thresholdValues.max, color: colors.red },
  { max: Infinity, color: colors.grey }, // grey color for values out of scale
];

const getColorForValue = (
  thresholdValues: Thresholds,
  value: string | number | null | undefined
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

const getColorForCalendarDataCard = (color: string) => {
  switch (color) {
    case colors.green:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.blue,
        0.4
      )} -32.4%, ${hexToRGBA(colors.blue, 0.05)} 94.94%), ${colors.green}`;
    case colors.red:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.royalPurple,
        0.4
      )} -38.43%, ${hexToRGBA(colors.royalPurple, 0)} 94.94%), ${colors.red}`;
    case colors.orange:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.lightCrimson,
        0.4
      )} -2.4%, ${hexToRGBA(colors.lightCrimson, 0)} 94.94%), ${colors.orange}`;
    case colors.yellow:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.rose,
        0.2
      )} -43.4%, ${hexToRGBA(colors.white, 0)} 34.94%), ${colors.yellow}`;
    default:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.gray100,
        0.4
      )} -2.4%, ${hexToRGBA(colors.gray100, 0)} 94.94%), ${colors.gray300}`;
  }
};

export { getColorForCalendarDataCard, getColorForValue };
