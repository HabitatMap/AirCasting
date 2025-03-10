import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../store/hooks";
import { selectEmptyCalendarData } from "../../../store/movingStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
interface EmptyCalendarProps {
  onDayClick?: (timestamp: number) => void;
}

const EmptyCalendar: React.FC<EmptyCalendarProps> = ({ onDayClick }) => {
  const threeMonthsData = useAppSelector(selectEmptyCalendarData);
  const { t } = useTranslation();
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(
    null
  );
  const handleDayClick = useCallback(
    (timestamp: number) => {
      setSelectedTimestamp(timestamp);
      onDayClick?.(timestamp);
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
        selectedTimestamp={selectedTimestamp}
      />
    ));
  }, [threeMonthsData, handleDayClick, selectedTimestamp]);

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
