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
      $isSelected={isSelected}
      onClick={value !== null ? onClick : undefined}
      $color={getColorForValue({ min, low, middle, high, max }, value)}
      $borderColor={getColorForValue(
        { min, low, middle, high, max },
        value,
        true
      )}
      $hasValue={value !== null}
      data-testid="calendar-cell"
    >
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value !== null ? value : ""}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
