import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { green, orange, red, yellow } from "../../assets/styles/colors";

const threasholdsColors = [green, yellow, orange, red];

const ThresholdConfiguratorContainer = styled.div`
  width: 100%;
  height: 30px;
  background-color: #ededed;
  position: relative;
`;

interface ThresholdRangeProps {
  $start: number;
  $end: number;
  $color: string;
}

const ThresholdRange = styled.div<ThresholdRangeProps>`
  position: absolute;
  background-color: ${(p) => p.$color};
  left: ${(p) => p.$start};
  height: inherit;
`;

const convertToPercentage = (arr: number[]): number[] => {
  const max: number = Math.max(...arr);
  const scaledArr: number[] = arr.map((value) => (value / max) * 100);
  return scaledArr;
};

const ThresholdConfigurator = () => {
  const defaultThresholds = [0, 2, 10, 5, 3];
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [ranges, setRanges] = useState<{ start: number; end: number }[]>([]);

  useEffect(() => {
    if (thresholds.length > 0) {
      const ascendingThresholds = thresholds.slice().sort((a, b) => a - b);
      const percentageThreasholds = convertToPercentage(ascendingThresholds);

      const updatedRanges: { start: number; end: number }[] = [];
      percentageThreasholds.forEach((value, index, array) => {
        if (index + 1 === array.length) {
          return true;
        }

        const range = { start: value, end: array[index + 1] };
        updatedRanges.push(range);
      });

      setRanges(updatedRanges);
    }
  }, [thresholds]);

  return (
    <ThresholdConfiguratorContainer>
      {ranges.map(({ start, end }, index) => (
        <ThresholdRange
          $start={start}
          $end={end}
          $color={threasholdsColors[index]}
          key={index}
        />
      ))}
    </ThresholdConfiguratorContainer>
  );
};

export { ThresholdConfigurator };
