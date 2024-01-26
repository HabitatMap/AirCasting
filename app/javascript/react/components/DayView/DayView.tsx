import React from "react";

import { ThresholdsValues } from "../WeekView";
import * as S from "./DayView.style";

interface DayViewProps {
  value: number;
  date: Date;
  thresholdsValues: ThresholdsValues;
}

const DayView = ({ value, date, thresholdsValues }: DayViewProps) => {
  return (
    <S.Container>
      <S.BackgroundBarContainer>
        <S.ValueLabel>{value} (µg/m)</S.ValueLabel>
        <S.ValueBar value={value} thresholdsValues={thresholdsValues} />
      </S.BackgroundBarContainer>
      <S.BottomLabel>
        {date.getDate()} {date.toLocaleString("default", { month: "short" })}
      </S.BottomLabel>
    </S.Container>
  );
};

export { DayView };
