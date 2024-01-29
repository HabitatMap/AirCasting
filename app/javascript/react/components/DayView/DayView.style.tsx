import styled from "styled-components";

import { H4 } from "../Typography";
import { thresholdsValues } from "../WeekView/WeeklyMockData";
import { ThresholdsValues } from "../../utils/ThresholdsValues";
import * as colors from "../../assets/styles/colors";

interface ValueBarProps {
  value: number;
  thresholdsValues: ThresholdsValues;
}

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
  return colors.red;
};

const calculateBarHeight = (
  value: number,
  { max }: ThresholdsValues
): number => {
  const definedPercentage = (value / max) * 100;
  if (definedPercentage > 100) return 100;
  return definedPercentage;
};

const Container = styled.div`
  background-color: ${colors.grey100};
  position: relative;
  width: 185px;
  height: 400px;
`;

const BackgroundBarContainer = styled.div<ValueBarProps>`
  background-color: ${({ value }) => getColorForValue(value)};
  width: 100%;
  height: ${({ value, thresholdsValues }) =>
    `${calculateBarHeight(value, thresholdsValues)}%`};
  position: absolute;
  bottom: 0;
  border-radius: 16px 16px 0 0;
  z-index: 2;
`;

const TopLabel = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  padding: 6px;
  background-color: ${colors.grey100};
  z-index: 3;
`;

const BottomLabel = styled(H4)`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
`;

export { Container, BackgroundBarContainer, TopLabel, BottomLabel };
