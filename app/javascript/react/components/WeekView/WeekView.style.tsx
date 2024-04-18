import styled from "styled-components";

import { gray200, gray400 } from "../../assets/styles/colors";
import { media } from "../../utils/media";

const labelBorderWidth = "1px";
const labelLineHeight = "12px";

const Container = styled.div`
  display: flex;
  height: 285px;
  width: 100%;
  padding: 20px;

  @media ${media.desktop} {
    height: 430px;
  }
`;

const WeekContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  @media ${media.desktop} {
    gap: 20px;
  }
`;

const ThresholdLabel = styled.div<{
  $position: number;
  $value: number;
  $isMaxValue: boolean;
}>`
  position: absolute;
  min-width: 30px;
  text-align: right;

  ${({ $isMaxValue, $position }) =>
    $isMaxValue
      ? `
          border-top: ${labelBorderWidth} dashed ${gray200};
          bottom: calc(${$position}% - ${labelLineHeight} - ${labelBorderWidth});
        `
      : `
          border-bottom: ${labelBorderWidth} dashed ${gray200};
          bottom: ${$position}%;
        `}

  &:after {
    content: "${({ $value }) => $value}";
    color: ${gray400};
    font-size: 10px;
    font-weight: 700;
    line-height: ${labelLineHeight};

    @media ${media.desktop} {
      font-size: 12px;
    }
  }
`;

const ThresholdsLabelContainer = styled.div`
  position: relative;
  height: 100%;
  width: 20px;
`;

const MobileLabel = styled.div`
  @media ${media.desktop} {
    display: none;
  }
`;

const DesktopLabel = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
  }
`;

export {
  Container,
  WeekContainer,
  ThresholdLabel,
  ThresholdsLabelContainer,
  MobileLabel,
  DesktopLabel,
};
