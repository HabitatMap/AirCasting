import styled from "styled-components";

import { backgroundGray, cloudyBlue, darkMint, eveningBlue, mint, red } from "../../assets/styles/colors";

const totalBarWidth = 400

interface ColorRanges {
  bottom: number
  lower: number
  middle: number
  higher: number
  top: number
}

interface ColorfullRectangleProps {
  value: number;
  colorRanges: ColorRanges
}

const getColorForValue = (value: number, colorRanges: ColorRanges): string => {
  if (value > colorRanges.top || value < colorRanges.bottom) {
    return red
  } else if (value > colorRanges.higher) {
    return eveningBlue
  } else if (value > colorRanges.middle) {
    return cloudyBlue
  } else if (value > colorRanges.lower) {
    return darkMint
  } else {
    return mint
  }
}

const RectangleContainer = styled.div`
  position: relative;
  width: 185px;
  height: ${totalBarWidth}px;
`;

const BackgroundContainer = styled.div`
  background-color: ${backgroundGray};
  width: 100%;
  height: 100%;
  position: absolute;
  bottom: 0;
`;

const ColorfullRectangleContainer = styled.div<ColorfullRectangleProps>`
  background-color: ${({ value, colorRanges }) => getColorForValue(value, colorRanges)};
  width: 100%;
  height: ${({ value, colorRanges }) => ((value / colorRanges.top) * 100) }%;
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
  background-color: ${backgroundGray}; 
  z-index: 3;
`;

const BottomLabel = styled.div`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
`;

const HorizontalStack = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
`;

export {
  BackgroundContainer,
  RectangleContainer,
  ColorfullRectangleContainer,
  Label,
  BottomLabel,
  HorizontalStack
};
