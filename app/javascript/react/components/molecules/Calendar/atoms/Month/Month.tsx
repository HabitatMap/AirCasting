import React, { useCallback } from "react";
import { useSelector } from "react-redux";

import { selectThresholds } from "../../../../../store/thresholdSlice";
import type { CalendarMonthlyData } from "../../../../../types/movingStream";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

interface MonthProps extends CalendarMonthlyData {
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
}

const Month: React.FC<MonthProps> = ({
  monthName,
  dayNamesHeader,
  weeks,
  onDayClick,
  selectedDate,
}) => {
  const thresholds = useSelector(selectThresholds);

  // Memoize the click handler
  const handleDayClick = useCallback(
    (date: Date) => {
      if (!date) return;
      onDayClick(date);
    },
    [onDayClick]
  );

  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      <S.MonthContent>
        <DayNamesHeader dayNamesHeader={dayNamesHeader} />
        {weeks.map((week) => (
          <S.Week key={week[0].date}>
            {week.map((day) => (
              <Day
                key={day.date}
                {...day}
                {...thresholds}
                onClick={() => handleDayClick(new Date(day.date))}
                isSelected={
                  selectedDate?.toDateString() ===
                  new Date(day.date).toDateString()
                }
              />
            ))}
          </S.Week>
        ))}
      </S.MonthContent>
    </S.Month>
  );
};

export { Month };
