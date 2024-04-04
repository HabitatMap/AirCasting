import React from "react";

import { CalendarMonthlyData } from "../../../../../types/fixedStream";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

const Month = ({ monthName, dayNamesHeader, weeks }: CalendarMonthlyData) => {
  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      <S.MonthContent>
        <DayNamesHeader dayNamesHeader={dayNamesHeader} />
        {weeks.map((week) => (
          <S.Week key={week[0].date}>
            {week.map((day) => (
              <Day key={day.date} {...day} />
            ))}
          </S.Week>
        ))}
      </S.MonthContent>
    </S.Month>
  );
};

export { Month };
