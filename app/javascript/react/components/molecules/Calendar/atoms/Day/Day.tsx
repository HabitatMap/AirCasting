import React from "react";

import { CalendarCellData } from "../../../../../types/movingStream";
import { Thresholds } from "../../../../../types/thresholds";
import { getColorForValue } from "../../../../../utils/thresholdColors";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData, Thresholds {}

const Day = ({ dayNumber, value, date, ...thresholds }: DayProps) => {
  return (
    <S.Day
      $color={getColorForValue(thresholds, value)}
      $borderColor={getColorForValue(thresholds, value, true)}
    >
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
