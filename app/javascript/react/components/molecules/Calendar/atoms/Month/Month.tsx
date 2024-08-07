import React from "react";

import { CalendarMonthlyData } from "../../../../../types/movingStream";
import { useMapParams } from "../../../../../utils/mapParamsHandler";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

const Month = ({ monthName, dayNamesHeader, weeks }: CalendarMonthlyData) => {
  const { thresholds } = useMapParams();

  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      <S.MonthContent>
        <DayNamesHeader dayNamesHeader={dayNamesHeader} />
        {weeks.map((week) => (
          <S.Week key={week[0].date}>
            {week.map((day) => (
              <Day key={day.date} {...day} {...thresholds} />
            ))}
          </S.Week>
        ))}
      </S.MonthContent>
    </S.Month>
  );
};

export { Month };
