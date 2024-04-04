import React from "react";

import { yellow } from "../../../../../assets/styles/colors";
import { CalendarCellData } from "../../../../../types/fixedStream";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData {}

const Day = ({ date, value }: DayProps) => (
  <S.Day
    key={date}
    $hasBackground={true}
    $color={yellow}
    $isCurrentMonth={true}
  >
    <S.DayNumber $isVisible={true}>{date}</S.DayNumber>
    <S.Value $isVisible={true}>{value}</S.Value>
  </S.Day>
);

export { Day };
