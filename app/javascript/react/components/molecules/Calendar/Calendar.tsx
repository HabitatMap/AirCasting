import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MovesKeys } from "../../../types/movesKeys";
import isMobile from "../../../utils/useScreenSizeDetection";
import { Month } from "./atoms/Month";
import { ScrollCalendarButton } from "./atoms/ScrollCalendarButton/ScrollCalendarButton";
import * as S from "./Calendar.style";
import useCalendarHook from "./CalendarHook";
import HeaderToggle from "./HeaderToggle/HeaderToggle";

interface CalendarProps {
  streamId: number;
  minCalendarDate: string;
  maxCalendarDate: string;
  onDayClick: (timestamp: number | null) => void;
  selectedTimestamp: number | null;
  isLoading?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  streamId,
  minCalendarDate,
  maxCalendarDate,
  onDayClick,
  selectedTimestamp,
  isLoading,
}) => {
  const {
    threeMonthsData,
    dateReference,
    isLeftButtonDisabled,
    isRightButtonDisabled,
    handleLeftClick,
    handleRightClick,
  } = useCalendarHook({ streamId, minCalendarDate, maxCalendarDate });
  const { t } = useTranslation();

  const isMobileView = isMobile();

  const sortedThreeMonthsData = useMemo(
    () => (isMobileView ? [...threeMonthsData].reverse() : threeMonthsData),
    [threeMonthsData, isMobileView]
  );

  // Use timestamp (number) instead of Date.
  const handleDayClick = useCallback(
    (timestamp: number) => {
      if (timestamp === undefined || timestamp === null) return;

      if (selectedTimestamp !== null && timestamp === selectedTimestamp) {
        onDayClick(null);
      } else {
        onDayClick(timestamp);
      }
    },
    [selectedTimestamp, onDayClick]
  );

  const MobileSwipeComponent = () => (
    <S.MobileSwipeContainer>
      <ScrollCalendarButton
        disabled={isLeftButtonDisabled}
        direction={MovesKeys.MOVE_BACKWARD}
        handleClick={handleLeftClick}
      />
      <S.DateField>
        <span>{dateReference.firstVisibleDataPointDate}</span>
        <span>-</span>
        <span>{dateReference.lastVisibleDataPointDate}</span>
      </S.DateField>
      <ScrollCalendarButton
        disabled={isRightButtonDisabled}
        direction={MovesKeys.MOVE_FORWARD}
        handleClick={handleRightClick}
      />
    </S.MobileSwipeContainer>
  );

  const DesktopSwipeComponent = () => (
    <>
      <S.DesktopSwipeLeftContainer>
        <ScrollCalendarButton
          disabled={isLeftButtonDisabled}
          direction={MovesKeys.MOVE_BACKWARD}
          handleClick={handleLeftClick}
        />
      </S.DesktopSwipeLeftContainer>
      <S.DesktopSwipeRightContainer>
        <ScrollCalendarButton
          disabled={isRightButtonDisabled}
          direction={MovesKeys.MOVE_FORWARD}
          handleClick={handleRightClick}
        />
      </S.DesktopSwipeRightContainer>
    </>
  );

  const CalendarContent = () => (
    <>
      {isMobileView && <MobileSwipeComponent />}
      <S.ThreeMonths>
        {!isMobileView && <DesktopSwipeComponent />}
        {sortedThreeMonthsData.map((month) => (
          <Month
            key={month.monthName}
            {...month}
            onDayClick={handleDayClick}
            selectedTimestamp={selectedTimestamp}
          />
        ))}
      </S.ThreeMonths>
    </>
  );

  return (
    sortedThreeMonthsData && (
      <S.CalendarContainer>
        <HeaderToggle
          titleText={t("calendarHeader.calendarTitle")}
          startDate={dateReference.firstVisibleDataPointDate}
          endDate={dateReference.lastVisibleDataPointDate}
          componentToToggle={<CalendarContent />}
        />
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
