import React from "react";

import { getColorForValue } from "../../../../../utils/thresholdColors";
import { CalendarCellData } from "../../../../../types/fixedStream";
import { Thresholds } from "../../../../../types/thresholds";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData, Thresholds {}

const Day = ({ dayNumber, value, date, ...thresholds }: DayProps) => {
  return (
    <S.Day $color={getColorForValue(thresholds, value)}>
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.Value $isVisible={true}>{value}</S.Value>
    </S.Day>
  );
};

export { Day };
