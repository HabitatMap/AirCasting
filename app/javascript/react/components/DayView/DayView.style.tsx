import styled from "styled-components";

import * as colors from "../../assets/styles/colors";
import { H4 } from "../Typography";
import { ThresholdsValues } from "../WeekView";
import { thresholdsValues } from "../WeekView/WeeklyMockData";

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
  display: flex;
  flex-direction: column;
  position: relative;
  width: 12%;
  height: 100%;
`;

const BackgroundBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${colors.grey100};
`;

const ValueBar = styled.div<ValueBarProps>`
  background-color: ${({ value }) => getColorForValue(value)};
  height: ${({ value, thresholdsValues }) =>
    `${calculateBarHeight(value, thresholdsValues)}%`};
  width: 100%;
  margin-top: auto;
  border-radius: 16px 16px 0 0;
`;

const ValueLabel = styled.span`
  padding: 8px;
  position: absolute;
`;

const BottomLabel = styled(H4)`
  position: absolute;
  text-align: center;
  display: block;
  bottom: -25px;
  width: 100%;
`;

export { Container, BackgroundBarContainer, ValueBar, ValueLabel, BottomLabel };
