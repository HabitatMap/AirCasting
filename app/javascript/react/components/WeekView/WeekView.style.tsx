import styled from "styled-components";

import { grey200, grey400 } from "../../assets/styles/colors";

const labelBorderWith = "1px";
const labelLineHeight = "12px";

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 40vh;
  padding: 20px;
  margin-bottom: 40px;
`;

const WeekContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
`;

const ThresholdLabel = styled.div<{
  $position: number;
  $value: number;
  $isMaxValue: boolean;
}>`
  position: absolute;
  border-bottom: ${labelBorderWith} dashed ${grey200};
  ${({ $isMaxValue, $position }) =>
    $isMaxValue
      ? `bottom: calc(${$position}% - ${labelLineHeight} - ${labelBorderWith});`
      : `bottom: ${$position}%;`}

  &:after {
    content: "${({ $value }) => $value}";
    padding-left: 10px;
    color: ${grey400};
    font-size: 12px;
    line-height: ${labelLineHeight};
  }
`;

const ThresholdsLabelContainer = styled.div`
  position: relative;
  height: 100%;
  width: 20px;
`;

export { Container, WeekContainer, ThresholdLabel, ThresholdsLabelContainer };
