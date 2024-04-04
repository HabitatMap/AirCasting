import styled from "styled-components";

import { H6, H5 } from "../Typography";
import { Thresholds } from "../../types/thresholds";
import { getColorForValue } from "../../utils/thresholdColors";
import media from "../../utils/media";
import * as colors from "../../assets/styles/colors";

interface ValueBarProps {
  $value: number;
  $thresholdsValues: Thresholds;
}

const calculateBarHeight = (value: number, { max }: Thresholds): number => {
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
  ${(props) => getColorForValue(props.$thresholdsValues, props.$value)};
  background-color: ${(props) =>
    getColorForValue(props.$thresholdsValues, props.$value)};
  width: 100%;
  height: ${(props) =>
    `${calculateBarHeight(props.$value, props.$thresholdsValues)}%`};
  position: absolute;
  bottom: 0;
  z-index: 2;

  @media ${media.desktop} {
    ${(props) =>
      props.$value < props.$thresholdsValues.max
        ? "border-radius: 16px 16px 0 0;"
        : ""};
  }
`;

const BottomLabel = styled(H6)`
  position: absolute;
  left: 50%;
  bottom: -20px;
  transform: translateX(-50%) rotate(-41.5deg);
  text-align: center;
  white-space: nowrap;
  font-weight: 600;

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
