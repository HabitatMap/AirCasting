import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { green, orange, red, yellow } from "../../assets/styles/colors";

const threasholdsColors = [green, yellow, orange, red];

const ThresholdConfiguratorContainer = styled.div`
  width: 100%;
  height: 30px;
  background-color: #ededed;
  position: relative;
  display: flex;
`;

interface ThresholdRangeProps {
  $start: number;
  $end: number;
  $percentage: number;
  $color: string;
}

const ThresholdRange = styled.div<ThresholdRangeProps>`
  background-color: ${(p) => p.$color};
  height: inherit;
  width: ${(p) => `${p.$percentage}%`};
`;

const convertToPercentage = (arr: number[]): number[] => {
  const max: number = Math.max(...arr);
  const scaledArr: number[] = arr.map((value) => (value / max) * 100);
  return scaledArr;
};

interface RangeProps {
  start: number;
  end: number;
  percentage: number;
}

const ThresholdConfigurator = () => {
  const defaultThresholds = [0, 2, 10, 5, 3];
  // TODO will be saved in redux
  const [thresholds, setThresholds] = useState(defaultThresholds);
  //  TODO will be calculated in a selector based on state and just read here.
  const [ranges, setRanges] = useState<RangeProps[]>([]);

  useEffect(() => {
    if (thresholds.length > 0) {
      const ascendingThresholds = thresholds.slice().sort((a, b) => a - b);
      const percentageThreasholds = convertToPercentage(ascendingThresholds);

      const updatedRanges: RangeProps[] = [];
      percentageThreasholds.forEach((value, index, array) => {
        if (index + 1 === array.length) {
          return true;
        }
        const percentage = array[index + 1] - value;
        const range = { start: value, end: array[index + 1], percentage };
        updatedRanges.push(range);
      });

      setRanges(updatedRanges);
    }
  }, [thresholds]);

  return (
    <ThresholdConfiguratorContainer>
      {ranges.map(({ start, end, percentage }, index) => (
        <ThresholdRange
          $start={start}
          $end={end}
          $color={threasholdsColors[index]}
          $percentage={percentage}
          key={index}
        />
      ))}
    </ThresholdConfiguratorContainer>
  );
};

export { ThresholdConfigurator };
