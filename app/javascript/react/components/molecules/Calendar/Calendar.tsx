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
import { MovesKeys } from "../../../types/movesKeys";
import * as S from "./Calendar.style";

interface MovableCalendarData {
  zeroDate: string;
  currentDate: string;
  direction: number | undefined;
  triggerDirectionUpdate: number;
}

interface CalendarProps {
  streamId: number;
}

const Calendar: React.FC<CalendarProps> = ({ streamId }) => {
  const SEEN_MONTHS_NUMBER = 3;

  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const movingCalendarData = useSelector(movingData);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [dateReference, setDateReference] = useState<MovableCalendarData>({
    zeroDate: "",
    currentDate
: "",
    direction: undefined,
    triggerDirectionUpdate: 0,
  });

  const updateMoveValue = (direction: MovesKeys) => {
    setDateReference((prevState) => {
      return {
        ...prevState,
        direction: direction,
        triggerDirectionUpdate: prevState.triggerDirectionUpdate + 1,
      };
    });
  };

  const handleBackwardMovement = (dateMoment: moment.Moment) => {
    const newEndMoment = dateMoment.subtract(1, "months").endOf("month");
    setIsButtonDisabled(false);
    return newEndMoment;
  };

  const handleForwardMovement = (dateMoment: moment.Moment) => {
    let newEndMoment = dateMoment.add(1, "months").endOf("month");
    const zeroDateMoment = moment(dateReference.zeroDate, "YYYY-MM-DD");
    if (newEndMoment.isAfter(zeroDateMoment)) {
      newEndMoment = zeroDateMoment;
      setIsButtonDisabled(true);
    }
    return newEndMoment;
  };

  useEffect(() => {
    // Disable forward button at first, becouse
    // we present the newest months just after loading this page
    setIsButtonDisabled(true);

    const lastElementIdx = movingCalendarData.data.length - 1;
    const endDate = movingCalendarData.data[lastElementIdx].date;
    setDateReference((prevState) => ({
      ...prevState,
      zeroDate: endDate,
      currentDate
  : endDate,
    }));
  }, []);

  useEffect(() => {
    if (!dateReference.currentDate
  ) return;

    const dateMoment = moment(dateReference.currentDate
  , "YYYY-MM-DD");
    let newEndMoment: Moment;

    switch (dateReference.direction) {
      case -1:
        newEndMoment = handleBackwardMovement(dateMoment);
        break;
      case 1:
        newEndMoment = handleForwardMovement(dateMoment);
        break;
      default:
        console.error("Invalid direction value:", dateReference.direction);
        return;
    }

    const newEndDate = newEndMoment.format("YYYY-MM-DD");

    const newStartDate = newEndMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("YYYY-MM-DD");

    setDateReference((prevState) => ({
      ...prevState,
      currentDate
  : newEndDate,
    }));

      dispatch(
        fetchNewMovingStream({
          id: streamId,
          startDate: newStartDate,
          endDate: newEndDate,
        })
      );
  }, [dateReference.triggerDirectionUpdate]);

  const handleLeftClick = () => {
    updateMoveValue(MovesKeys.MOVE_BACKWARD);
  };

  const handleRightClick = () => {
    updateMoveValue(MovesKeys.MOVE_FORWARD);
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
                  direction={MovesKeys.MOVE_BACKWARD}
                  handleClick={handleLeftClick}
                />
                <ScrollCalendarButton
                  disabled={isButtonDisabled}
                  direction={MovesKeys.MOVE_FORWARD}
                  handleClick={handleRightClick}
                />
              </S.MobileSwipeContainer>

              <S.ThreeMonths>
                <S.DesktopSwipeContainer>
                  <ScrollCalendarButton
                    direction={MovesKeys.MOVE_BACKWARD}
                    handleClick={handleLeftClick}
                  />
                </S.DesktopSwipeContainer>
                {threeMonthsData.map((month) => (
                  <Month key={month.monthName} {...month} />
                ))}
                <S.DesktopSwipeContainer>
                  <ScrollCalendarButton
                    disabled={isButtonDisabled}
                    direction={MovesKeys.MOVE_FORWARD}
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
