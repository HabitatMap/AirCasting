import React from "react";
import { useSelector } from "react-redux";

import moment from "moment";
import { selectThresholds } from "../../../../../store/thresholdSlice";
import { CalendarCellData } from "../../../../../types/calendar";
import { Day } from "../Day";
import { DayNamesHeader } from "../DayNamesHeader";
import * as S from "./Month.style";

interface MonthProps {
  monthName: string;
  dayNamesHeader: string[];
  weeks: CalendarCellData[][];
  onDayClick?: (timestampDate: number) => void;
}

export const Month: React.FC<MonthProps> = ({
  monthName,
  dayNamesHeader,
  weeks,
  onDayClick,
}) => {
  const thresholds = useSelector(selectThresholds);

  const timestampDayStart = (date: Date) => {
    const selectedDayWithoutTime = moment(date).format("YYYY-MM-DD");
    const dayStart = new Date(selectedDayWithoutTime).getTime();
    return dayStart;
  };

  return (
    <S.Month>
      <S.MonthName>{monthName}</S.MonthName>
      <S.MonthContent>
        <DayNamesHeader dayNamesHeader={dayNamesHeader} />
        {weeks.map((week) => (
          <S.Week key={week[0].date.toISOString()}>
            {week.map((day) => (
              <Day
                key={day.date.toISOString()}
                {...day}
                {...thresholds}
                dayNumber={day.date.getDate().toString()}
                onClick={() => onDayClick?.(timestampDayStart(day.date))}
              />
            ))}
          </S.Week>
        ))}
      </S.MonthContent>
    </S.Month>
  );
};

export type { MonthProps };
