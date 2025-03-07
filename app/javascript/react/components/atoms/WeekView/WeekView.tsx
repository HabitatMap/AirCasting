import React from "react";

import { Thresholds } from "../../../types/thresholds";
import { DayView } from "../DayView/DayView";
import * as S from "./WeekView.style";

interface WeekData {
  value: number;
  date: Date;
}

interface WeekViewProps {
  weeklyData: WeekData[];
  thresholdsValues: Thresholds;
}

interface ThresholdIndicatorProps {
  values: number[];
}

const getThresholdLabelPosition = (value: number, maxValue: number): number =>
  (value / maxValue) * 100;

const ThresholdsIndicator = ({ values }: ThresholdIndicatorProps) => {
  const maxValue = Math.max.apply(null, values);

  return (
    <S.ThresholdsLabelContainer>
      {values.map((value) => (
        <S.ThresholdLabel
          key={value}
          $position={getThresholdLabelPosition(value, maxValue)}
          $value={value}
          $isMaxValue={value === maxValue}
        />
      ))}
    </S.ThresholdsLabelContainer>
  );
};

const WeekView = ({ weeklyData, thresholdsValues }: WeekViewProps) => {
  const { min, low, middle, high, max } = thresholdsValues;

  return (
    <S.Container>
      <S.WeekContainer>
        {weeklyData
          .sort((a, b) => (a.date > b.date ? 1 : -1))
          .map(({ value, date }, index) => (
            <DayView
              key={index}
              value={value}
              date={date}
              thresholdsValues={thresholdsValues}
            />
          ))}
      </S.WeekContainer>
      <S.DesktopLabel>
        <ThresholdsIndicator values={[min, middle, max]} />
      </S.DesktopLabel>
      <S.MobileLabel>
        <ThresholdsIndicator values={[min, low, middle, high, max]} />
      </S.MobileLabel>
    </S.Container>
  );
};

export { WeekView };
