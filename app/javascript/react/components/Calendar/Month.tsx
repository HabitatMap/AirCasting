import React from "react";

import * as S from "./Calendar.style";
import {
  today,
  getDayNumber,
  getFullWeeksOfMonth,
} from "../../utils/datesHelper";
import { yellow } from "../../assets/styles/colors";

const MonthView = () => {
  const weeks = getFullWeeksOfMonth(today.year(), today.month());

  return (
    <S.Month>
      <S.MonthName>February</S.MonthName>
      {weeks.map((week) => (
        <S.Week key={week[0]}>
          {week.map((day) => (
            <S.Day
              key={day}
              $hasBackground={true}
              $color={yellow}
              $isCurrentMonth={true}
            >
              <S.DayNumber $isVisible={true}>{getDayNumber(day)}</S.DayNumber>
              <S.Value $isVisible={true}>100</S.Value>
            </S.Day>
          ))}
        </S.Week>
      ))}
    </S.Month>
  );
};

export default MonthView;
