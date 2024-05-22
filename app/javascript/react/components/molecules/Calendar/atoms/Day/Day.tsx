import React from "react";

import { getColorForValue } from "../../../../../utils/thresholdColors";
import { CalendarCellData } from "../../../../../types/movingStream";
import { Thresholds } from "../../../../../types/thresholds";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData, Thresholds {}

const Day = ({ dayNumber, value, date, ...thresholds }: DayProps) => {
  return (
    <S.Day $color={getColorForValue(thresholds, value)}>
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
