import React from "react";

import { getColorForValue } from "../../../../../utils/thresholdColors";
import * as S from "./Day.style";

interface DayProps {
  dayNumber: string;
  value: number;
  isCurrentMonth: boolean;
  date: Date;
  min: number;
  low: number;
  middle: number;
  high: number;
  max: number;
  onClick?: () => void;
}

const Day = ({ dayNumber, value, date, onClick, ...thresholds }: DayProps) => {
  return (
    <S.Day
      $color={getColorForValue(thresholds, value)}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
