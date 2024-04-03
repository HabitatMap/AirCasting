import React from "react";

import { yellow } from "../../assets/styles/colors";
import { CalendarMonthlyData } from "../../types/fixedStream";
import * as S from "./Calendar.style";

const MonthView = ({ weeks, monthName }: CalendarMonthlyData) => {
  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      {weeks.map((week) => (
        <S.Week key={week[0].date}>
          {week.map((day) => (
            <S.Day
              key={day.date}
              $hasBackground={true}
              $color={yellow}
              $isCurrentMonth={true}
            >
              <S.DayNumber $isVisible={true}>{day.date}</S.DayNumber>
              <S.Value $isVisible={true}>{day.value}</S.Value>
            </S.Day>
          ))}
        </S.Week>
      ))}
    </S.Month>
  );
};

export default MonthView;
