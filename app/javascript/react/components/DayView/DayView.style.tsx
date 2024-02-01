import styled from "styled-components";

import { H6, H5 } from "../Typography";
import { thresholdsValues } from "../WeekView/WeeklyMockData";
import { ThresholdsValues } from "../../utils/ThresholdsValues";
import { getColorForValue } from "../../utils/ThresholdColors";
import media from "../../utils/media";
import * as colors from "../../assets/styles/colors";

interface ValueBarProps {
  value: number;
  thresholdsValues: ThresholdsValues;
}

const calculateBarHeight = (
  value: number,
  { max }: ThresholdsValues
): number => {
  const definedPercentage = (value / max) * 100;
  if (definedPercentage > 100) return 100;
  return definedPercentage;
};

const Container = styled.div`
  background-color: ${colors.gray100};
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
    background-color: ${colors.gray100};
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
