import React from "react";

import { Thresholds } from "../../types/thresholds";
import * as S from "./DayView.style";

interface DayViewProps {
  value: number;
  date: Date;
  thresholdsValues: Thresholds;
  onClick?: (date: Date) => void;
}

const DayView = ({ value, date, thresholdsValues, onClick }: DayViewProps) => {
  const handleClick = () => {
    onClick?.(date);
  };

  return (
    <S.Container onClick={handleClick}>
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
