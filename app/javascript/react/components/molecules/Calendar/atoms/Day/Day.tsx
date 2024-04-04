import React from "react";

import { yellow } from "../../../../../assets/styles/colors";
import { CalendarCellData } from "../../../../../types/fixedStream";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData {}

const Day = ({ dayNumber, value }: DayProps) => (
  <S.Day $hasBackground={true} $color={yellow} $isCurrentMonth={true}>
    <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
    <S.Value $isVisible={true}>{value}</S.Value>
  </S.Day>
);

export { Day };
