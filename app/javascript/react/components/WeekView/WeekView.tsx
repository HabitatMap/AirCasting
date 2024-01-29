import React from "react";

import * as S from "./WeekView.style";
import { ThresholdsValues } from "../../utils/ThresholdsValues";
import { DayView } from "../DayView/DayView";

interface WeekData {
  value: number;
  date: Date;
}

interface WeekViewProps {
  weeklyData: WeekData[];
  thresholdsValues: ThresholdsValues;
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
          $position={getThresholdLabelPosition(value, maxValue)}
          $value={value}
          $isMaxValue={value === maxValue}
        />
      ))}
    </S.ThresholdsLabelContainer>
  );
};

const WeekView = ({ weeklyData, thresholdsValues }: WeekViewProps) => {
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
      <ThresholdsIndicator
        values={[
          thresholdsValues.min,
          thresholdsValues.middle,
          thresholdsValues.max,
        ]}
      />
    </S.Container>
  );
};

export { WeekView };
