import moment from "moment-timezone";
import React from "react";
import { useSelector } from "react-redux";

import { selectThresholds } from "../../../../../store/thresholdSlice";
import type { CalendarMonthlyData } from "../../../../../types/movingStream";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

interface MonthProps extends CalendarMonthlyData {
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
  timezone: string;
}

const Month: React.FC<MonthProps> = ({
  monthName,
  dayNamesHeader,
  weeks,
  onDayClick,
  selectedDate,
  timezone,
}) => {
  const thresholds = useSelector(selectThresholds);

  const handleDayClick = (date: Date) => {
    if (!date) return;

    console.log("Raw date clicked:", date);

    // Convert directly from the given date without shifting to UTC
    const convertedDate = moment(date)
      .tz(timezone, true)
      .startOf("day")
      .toDate();

    console.log("Final stored date:", convertedDate);

    onDayClick(convertedDate);
  };

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
                onClick={() => handleDayClick(moment.utc(day.date).toDate())}
                isSelected={
                  selectedDate?.toDateString() ===
                  moment.utc(day.date).toDate().toDateString()
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
