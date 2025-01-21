import * as colors from "../assets/styles/colors";
import { Thresholds } from "../types/thresholds";
import hexToRGBA from "./hexToRGB";

const COLORS_FOR_RANGES = (thresholdValues: Thresholds) => [
  {
    max: thresholdValues.min - 1,
    color: colors.grey,
    borderColor: colors.grey,
  }, // grey color for values below min
  {
    max: thresholdValues.low,
    color: colors.green100,
    borderColor: colors.green200,
  },
  {
    max: thresholdValues.middle,
    color: colors.yellow100,
    borderColor: colors.yellow200,
  },
  {
    max: thresholdValues.high,
    color: colors.orange100,
    borderColor: colors.orange200,
  },
  {
    max: thresholdValues.max,
    color: colors.red100,
    borderColor: colors.red200,
  },
  { max: Infinity, color: colors.grey, borderColor: colors.gray300 }, // grey color for values out of scale
];

const getColorForValue = (
  thresholdValues: Thresholds,
  value: string | number | null | undefined,
  isBorder?: boolean
) => {
  const defaultColor = "transparent";

  if (value !== 0 && !value) return defaultColor;

  for (let range of COLORS_FOR_RANGES(thresholdValues)) {
    if (Number(value) <= Number(range.max)) {
      return isBorder ? range.borderColor : range.color;
    }
  }

  return defaultColor;
};

const getColorForCalendarDataCard = (color: string) => {
  switch (color) {
    case colors.green100:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.blue,
        0.4
      )} -32.4%, ${hexToRGBA(colors.blue, 0.05)} 94.94%), ${colors.green100}`;
    case colors.red100:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.royalPurple,
        0.4
      )} -38.43%, ${hexToRGBA(colors.royalPurple, 0)} 94.94%), ${
        colors.red100
      }`;
    case colors.orange100:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.lightCrimson,
        0.4
      )} -2.4%, ${hexToRGBA(colors.lightCrimson, 0)} 94.94%), ${
        colors.orange100
      }`;
    case colors.yellow100:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.rose,
        0.2
      )} -43.4%, ${hexToRGBA(colors.white, 0)} 34.94%), ${colors.yellow100}`;
    default:
      return `linear-gradient(241deg, ${hexToRGBA(
        colors.gray100,
        0.4
      )} -2.4%, ${hexToRGBA(colors.gray100, 0)} 94.94%), ${colors.gray300}`;
  }
};

export { getColorForCalendarDataCard, getColorForValue };
