import styled from "styled-components";

import {
  cloudyBlue,
  darkMint,
  eveningBlue,
  mint,
  red,
  grey100,
  grey200,
  grey400,
} from "../../assets/styles/colors";
import { H4 } from "../Typography";

interface ColorRanges {
  bottom: number;
  lower: number;
  middle: number;
  higher: number;
  top: number;
}

interface ColorfullRectangleProps {
  value: number;
  colorRanges: ColorRanges;
}

interface LineProps {
  value: number;
  maxValue: number;
}

const getColorForValue = (value: number, colorRanges: ColorRanges): string => {
  if (value > colorRanges.top || value < colorRanges.bottom) {
    return red;
  } else if (value > colorRanges.higher) {
    return eveningBlue;
  } else if (value > colorRanges.middle) {
    return cloudyBlue;
  } else if (value > colorRanges.lower) {
    return darkMint;
  } else {
    return mint;
  }
};

const RectangleContainer = styled.div`
  position: relative;
  width: 185px;
  height: 400px;
`;

const BackgroundContainer = styled.div`
  background-color: ${grey100};
  width: 100%;
  height: 100%;
  position: absolute;
  bottom: 0;
`;

const ColorfullRectangleContainer = styled.div<ColorfullRectangleProps>`
  background-color: ${({ value, colorRanges }) =>
    getColorForValue(value, colorRanges)};
  width: 100%;
  height: ${({ value, colorRanges }) => {
    const definedPercentage = (value / colorRanges.top) * 100;
    if (definedPercentage > 100) {
      return 100;
    }
    return definedPercentage;
  }}%;
  position: absolute;
  bottom: 0;
  border-radius: 16px 16px 0 0;
  z-index: 2;
`;

const Label = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  padding: 6px;
  background-color: ${grey100};
  z-index: 3;
`;

const BottomLabel = styled(H4)`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
`;

const ColorRangeLine = styled.div<LineProps>`
  position: absolute;
  left: 100%;
  width: 20px;
  height: 2px;
  background-color: transparent;
  border-bottom: 1px dashed ${grey200};
  bottom: ${({ value, maxValue }) => (value / maxValue) * 100 - 0.1}%;

  &:after {
    content: "${({ value }) => value}";
    position: absolute;
    top: ${({ value, maxValue }) => (value === maxValue ? "10px" : "-15px")};
    padding-left: 12px;
    color: ${grey400};
    font-size: 12px;
  }
`;

export {
  BackgroundContainer,
  RectangleContainer,
  ColorfullRectangleContainer,
  Label,
  BottomLabel,
  ColorRangeLine,
};
