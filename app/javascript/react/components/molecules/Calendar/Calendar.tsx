import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import moment, { Moment } from "moment";

import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import { Month } from "./atoms/Month";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { useAppDispatch } from "../../../store/hooks";
import {
  movingData,
  fetchNewMovingStream,
} from "../../../store/movingCalendarStreamSlice";
import { ScrollCalendarButton } from "./atoms/ScrollCalendarButton/ScrollCalendarButton";
import * as S from "./Calendar.style";

interface MovableCalendarData {
  zeroDate: string;
  currentData: string;
  direction: number | undefined;
  triggerDirectionUpdate: number;
}

const Calendar = () => {
  const SEEN_MONTHS_NUMBER = 3;

  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const movingCalendarData = useSelector(movingData);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [dateReference, setDateReference] = useState<MovableCalendarData>({
    zeroDate: "",
    currentData: "",
    direction: undefined,
    triggerDirectionUpdate: 0,
  });

  const updateMoveValue = (direction: 1 | -1) => {
    setDateReference((prevState) => {
      return {
        ...prevState,
        direction: direction,
        triggerDirectionUpdate: prevState.triggerDirectionUpdate + 1,
      };
    });
  };

  const handleBackwardMovement = (dateMoment: moment.Moment) => {
    const newEndMoment = dateMoment.date(1).subtract(1, "months");
    setIsButtonDisabled(false);
    return newEndMoment;
  };

  const handleForwardMovement = (dateMoment: moment.Moment) => {
    const newEndMoment = dateMoment.date(1).add(1, "months");
    const zeroDateMoment = moment(dateReference.zeroDate, "YYYY-MM-DD");
    const shouldDisableButton = newEndMoment.isSameOrAfter(zeroDateMoment);
    setIsButtonDisabled(shouldDisableButton);
    return shouldDisableButton ? null : newEndMoment;
  };

  useEffect(() => {
    const lastElementIdx = movingCalendarData.data.length - 1;
    const endDate = movingCalendarData.data[lastElementIdx].date;
    setDateReference((prevState) => ({
      ...prevState,
      zeroDate: endDate,
      currentData: endDate,
    }));
  }, []);

  useEffect(() => {
    if (!dateReference.currentData) return;

    const dateMoment = moment(dateReference.currentData, "YYYY-MM-DD");
    let newEndMoment: Moment;

    switch (dateReference.direction) {
      case -1:
        newEndMoment = handleBackwardMovement(dateMoment);
        break;
      case 1:
        const newEndForwardMoment = handleForwardMovement(dateMoment);
        if (newEndForwardMoment !== null) {
          newEndMoment = newEndForwardMoment;
        } else {
          return;
        }
        break;
      default:
        console.error("Invalid direction value:", dateReference.direction);
        return;
    }

    const newEndDate = newEndMoment.format("YYYY-MM-DD");
    const newStartDate = newEndMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER, "months")
      .format("YYYY-MM-DD");

    setDateReference((prevState) => ({
      ...prevState,
      currentData: newEndDate,
    }));

    dispatch(
      fetchNewMovingStream({
        // pass here proper STREAM ID
        id: 1,
        startDate: newStartDate,
        endDate: newEndDate,
      })
    );
  }, [dateReference.triggerDirectionUpdate]);

  const handleLeftClick = () => {
    updateMoveValue(-1);
  };

  const handleRightClick = () => {
    updateMoveValue(1);
  };

  return (
    threeMonthsData && (
      <S.CalendarContainer>
        <HeaderToggle
          titleText={t("calendarHeader.calendarTitle")}
          componentToToggle={
            <>
              <S.MobileSwipeContainer>
                <ScrollCalendarButton
                  direction="left"
                  handleClick={handleLeftClick}
                />
                <ScrollCalendarButton
                  disabled={isButtonDisabled}
                  direction="right"
                  handleClick={handleRightClick}
                />
              </S.MobileSwipeContainer>

              <S.ThreeMonths>
                <S.DesktopSwipeContainer>
                  <ScrollCalendarButton
                    direction="left"
                    handleClick={handleLeftClick}
                  />
                </S.DesktopSwipeContainer>
                {threeMonthsData.map((month) => (
                  <Month key={month.monthName} {...month} />
                ))}
                <S.DesktopSwipeContainer>
                  <ScrollCalendarButton
                    disabled={isButtonDisabled}
                    direction="right"
                    handleClick={handleRightClick}
                  />
                </S.DesktopSwipeContainer>
              </S.ThreeMonths>
            </>
          }
        />
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
