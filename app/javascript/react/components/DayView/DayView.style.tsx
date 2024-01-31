import styled from "styled-components";

import { H6, H5 } from "../Typography";
import { thresholdsValues } from "../WeekView/WeeklyMockData";
import { ThresholdsValues } from "../../utils/ThresholdsValues";
import media from "../../utils/media";
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
  return colors.grey200;
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
  width: 30px;
  height: 100%;

  @media ${media.desktop} {
    width: 185px;
  }
`;

const BackgroundBarContainer = styled.div<ValueBarProps>`
  background-color: ${({ value }) => getColorForValue(value)};
  width: 100%;
  height: ${({ value, thresholdsValues }) =>
    `${calculateBarHeight(value, thresholdsValues)}%`};
  position: absolute;
  bottom: 0;
  z-index: 2;

  @media ${media.desktop} {
    ${({ value }) =>
      value < thresholdsValues.max ? "border-radius: 16px 16px 0 0;" : ""}
  }
`;

const BottomLabel = styled(H6)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%) rotate(-41.5deg);
  text-align: center;
  white-space: nowrap;
  font-weight: 600;
  bottom: -20px;

  @media ${media.desktop} {
    display: flex;
    transform: translateX(-50%) rotate(0deg);
    font-size: 16px;
    font-weight: 400;
  }
`;

const MobileLabel = styled(H6)`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%) translateY(-5px);
  z-index: 3;

  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopLabel = styled(H5)`
  display: none;

  @media ${media.desktop} {
    display: flex;
    position: absolute;
    padding: 6px;
    background-color: ${colors.grey100};
    z-index: 3;
  }
`;

export {
  Container,
  BackgroundBarContainer,
  BottomLabel,
  DesktopLabel,
  MobileLabel,
};
