import React from "react";

import { Month } from "./atoms/Month";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { ScrollCalendarButton } from "./atoms/ScrollCalendarButton/ScrollCalendarButton";
import { MovesKeys } from "../../../types/movesKeys";
import * as S from "./Calendar.style";
import useCalendarHook from "./CalendarHook";

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
  const showError = isLeftButtonDisabled || isRightButtonDisabled;

  return (
    threeMonthsData && (
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
              <S.RedErrorMessage
                style={{ visibility: showError ? "visible" : "hidden" }}
              >
                {showError && t("calendarPage.noDataMessage")}
              </S.RedErrorMessage>
              <S.ThreeMonths>
                <S.DesktopSwipeLeftContainer>
                  <ScrollCalendarButton
                    disabled={isLeftButtonDisabled}
                    direction={MovesKeys.MOVE_BACKWARD}
                    handleClick={handleLeftClick}
                  />
                </S.DesktopSwipeLeftContainer>
                {threeMonthsData.map((month) => (
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
