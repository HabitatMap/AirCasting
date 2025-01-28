import React from "react";

import type { CalendarCellData } from "../../../../../types/movingStream";
import type { Thresholds } from "../../../../../types/thresholds";
import { getColorForValue } from "../../../../../utils/thresholdColors";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData, Thresholds {
  onClick: () => void;
  isSelected: boolean;
}

const Day: React.FC<DayProps> = ({
  dayNumber,
  value,
  date,
  onClick,
  isSelected,
  min,
  low,
  middle,
  high,
  max,
}: DayProps) => {
  return (
    <S.Day
      $borderColor={getColorForValue(thresholds, value, true)}
      $color={getColorForValue({ min, low, middle, high, max }, value)}
      $isSelected={isSelected}
      onClick={onClick}
    >
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value !== null ? value : "-"}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
