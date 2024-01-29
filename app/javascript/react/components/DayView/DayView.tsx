import React from "react";

import * as S from "./DayView.style";
import { ThresholdsValues } from "../../utils/ThresholdsValues";

interface DayViewProps {
  value: number;
  date: Date;
  thresholdsValues: ThresholdsValues;
}

const DayView = ({ value, date, thresholdsValues }: DayViewProps) => {
  return (
    <S.Container>
      <S.TopLabel>{value} (µg/m)</S.TopLabel>
      <S.BackgroundBarContainer value={value} thresholdsValues={thresholdsValues} />
      <S.BottomLabel>
        {date.getDate()} {date.toLocaleString("default", { month: "short" })}
      </S.BottomLabel>
    </S.Container>
  );
};

export { DayView };
