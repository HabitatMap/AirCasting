import React from "react";

import { setSelectedDate } from "../../../../../store/calendarSlice";
import { useAppDispatch } from "../../../../../store/hooks";
import { CalendarCellData } from "../../../../../types/movingStream";
import { Thresholds } from "../../../../../types/thresholds";
import { parseDateString } from "../../../../../utils/dateParser";
import { getColorForValue } from "../../../../../utils/thresholdColors";
import * as S from "./Day.style";

interface DayProps extends CalendarCellData, Thresholds {}

const Day = ({ dayNumber, value, date, ...thresholds }: DayProps) => {
  const dispatch = useAppDispatch();
  const dateNumber = parseDateString(date);
  return (
    <S.Day
      $color={getColorForValue(thresholds, value)}
      onClick={() => {
        dispatch(setSelectedDate(dateNumber));
      }}
    >
      <S.DayNumber $isVisible={true}>{dayNumber}</S.DayNumber>
      <S.ValueContainer $isVisible={true}>
        <S.Value>{value}</S.Value>
      </S.ValueContainer>
    </S.Day>
  );
};

export { Day };
