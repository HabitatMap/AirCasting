import React from "react";

import { Thresholds } from "../../../types/thresholds";
import * as S from "./DayView.style";

interface DayViewProps {
  value: number;
  date: Date;
  thresholdsValues: Thresholds;
}

const DayView = ({ value, date, thresholdsValues }: DayViewProps) => {
  return (
    <S.Container>
      <S.DesktopLabel>{value} (µg/m)</S.DesktopLabel>
      <S.BackgroundBarContainer
        $value={value}
        $thresholdsValues={thresholdsValues}
      >
        <S.MobileLabel>{value}</S.MobileLabel>
      </S.BackgroundBarContainer>
      <S.BottomLabel>
        {date.getDate()} {date.toLocaleString("default", { month: "short" })}
      </S.BottomLabel>
    </S.Container>
  );
};

export { DayView };
