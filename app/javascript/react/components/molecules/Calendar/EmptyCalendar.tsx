import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import HeaderToggle from "./HeaderToggle/HeaderToggle";

interface EmptyCalendarProps {
  onDayClick?: (date: Date) => void;
}

const EmptyCalendar: React.FC<EmptyCalendarProps> = ({ onDayClick }) => {
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDayClick?.(date);
    },
    [onDayClick]
  );

  const monthComponents = useMemo(() => {
    if (!threeMonthsData) return null;

    return threeMonthsData.map((month) => (
      <Month
        key={month.monthName}
        {...month}
        onDayClick={handleDayClick}
        selectedDate={selectedDate}
      />
    ));
  }, [threeMonthsData, handleDayClick, selectedDate]);

  if (!threeMonthsData) return null;

  return (
    <S.CalendarContainer>
      <HeaderToggle
        titleText={t("calendarHeader.calendarTitle")}
        componentToToggle={<S.ThreeMonths>{monthComponents}</S.ThreeMonths>}
      />
    </S.CalendarContainer>
  );
};

export { EmptyCalendar };
