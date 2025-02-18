import moment from "moment-timezone";
import React from "react";

import { useAppSelector } from "../../../../../store/hooks";
import { selectThresholds } from "../../../../../store/thresholdSlice";
import type { CalendarMonthlyData } from "../../../../../types/movingStream";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

interface MonthProps extends CalendarMonthlyData {
  onDayClick: (timestamp: number) => void;
  selectedTimestamp: number | null;
}

const Month: React.FC<MonthProps> = ({
  monthName,
  dayNamesHeader,
  weeks,
  onDayClick,
  selectedTimestamp,
}) => {
  const thresholds = useAppSelector(selectThresholds);

  // Here we assume that each day object already has a date string in "YYYY-MM-DD" format.
  // This way we don’t rely on new Date() which uses the browser’s local timezone.
  const handleDayClick = (dateStr: string) => {
    if (!dateStr) return;
    // Parse the provided date string as UTC midnight.
    const convertedTimestamp = moment
      .utc(dateStr, "YYYY-MM-DD")
      .startOf("day")
      .add(1, "second")
      .valueOf();

    console.log("convertedTimestamp", convertedTimestamp);

    onDayClick(convertedTimestamp);
  };

  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      <S.MonthContent>
        <DayNamesHeader dayNamesHeader={dayNamesHeader} />
        {weeks.map((week) => (
          <S.Week key={week[0].date}>
            {week.map((day) => {
              // Compute the UTC midnight timestamp for comparison.
              const dayTimestamp = moment
                .utc(day.date, "YYYY-MM-DD")
                .startOf("day")
                .add(1, "second")
                .valueOf();
              return (
                <Day
                  key={day.date}
                  {...day}
                  {...thresholds}
                  // Use the day.date string directly.
                  onClick={() => handleDayClick(day.date)}
                  isSelected={
                    selectedTimestamp !== null &&
                    dayTimestamp === selectedTimestamp
                  }
                />
              );
            })}
          </S.Week>
        ))}
      </S.MonthContent>
    </S.Month>
  );
};

export { Month };
