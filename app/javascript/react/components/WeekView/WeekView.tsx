import React from "react";

import { DayView } from "../DayView";
import * as S from "./WeekView.style";

interface WeekData {
  value: number;
  date: Date;
}

export interface ThresholdsValues {
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
}

interface WeekViewProps {
  weeklyData: WeekData[];
  thresholdsValues: ThresholdsValues;
}

const getThresholdLabelPosition = (value: number, maxValue: number): number =>
  (value / maxValue) * 100;

const WeekView = ({ weeklyData, thresholdsValues }: WeekViewProps) => {
  const { min, middle, max } = thresholdsValues;

  return (
    <S.Container>
      <S.WeekContainer>
        {weeklyData.map(({ value, date }, index) => (
          <DayView
            key={index}
            value={value}
            date={date}
            thresholdsValues={thresholdsValues}
          />
        ))}
      </S.WeekContainer>
      <S.ThresholdsLabelContainer>
        {[min, middle, max].map((value) => (
          <S.ThresholdLabel
            $position={getThresholdLabelPosition(value, max)}
            $value={value}
            $isMaxValue={value === max}
          />
        ))}
      </S.ThresholdsLabelContainer>
    </S.Container>
  );
};

export { WeekView };
