import React from "react";
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
}

const Calendar: React.FC<CalendarProps> = ({
  streamId,
  minCalendarDate,
  maxCalendarDate,
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

  const sortedThreeMonthsData = isMobile()
    ? [...threeMonthsData].reverse()
    : threeMonthsData;

  return (
    sortedThreeMonthsData && (
      <S.CalendarContainer>
        <HeaderToggle
          titleText={t("calendarHeader.calendarTitle")}
          startDate={dateReference.firstVisibleDataPointDate}
          endDate={dateReference.lastVisibleDataPointDate}
          componentToToggle={
            <>
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
              <S.ThreeMonths>
                <S.DesktopSwipeLeftContainer>
                  <ScrollCalendarButton
                    disabled={isLeftButtonDisabled}
                    direction={MovesKeys.MOVE_BACKWARD}
                    handleClick={handleLeftClick}
                  />
                </S.DesktopSwipeLeftContainer>
                {sortedThreeMonthsData.map((month) => (
                  <Month key={month.monthName} {...month} />
                ))}
                <S.DesktopSwipeRightContainer>
                  <ScrollCalendarButton
                    disabled={isRightButtonDisabled}
                    direction={MovesKeys.MOVE_FORWARD}
                    handleClick={handleRightClick}
                  />
                </S.DesktopSwipeRightContainer>
              </S.ThreeMonths>
            </>
          }
        />
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
