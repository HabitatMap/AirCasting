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
import { StatusEnum } from "../../../types/api";

interface MovableCalendarData {
  zeroDate: string;
  currentStartDate: string;
  currentEndDate: string;
  direction: MovesKeys | undefined;
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
  const [isRightButtonDisabled, setIsRightButtonDisabled] = useState(false);
  const [isLeftButtonDisabled, setIsLeftButtonDisabled] = useState(false);
  const [dateReference, setDateReference] = useState<MovableCalendarData>({
    zeroDate: "",
    currentStartDate: "",
    currentEndDate: "",
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
    setIsRightButtonDisabled(false);
    return newEndMoment;
  };

  const handleForwardMovement = (dateMoment: moment.Moment) => {
    let newEndMoment = dateMoment.add(1, "months").endOf("month");
    const zeroDateMoment = moment(dateReference.zeroDate, "DD/MM/YYYY");
    if (newEndMoment.isAfter(zeroDateMoment)) {
      newEndMoment = zeroDateMoment;
      setIsRightButtonDisabled(true);
    }
    return newEndMoment;
  };

  useEffect(() => {
    // Disable forward button at first, becouse
    // we present the newest months just after loading this page
    setIsRightButtonDisabled(true);

    const lastElementIdx = movingCalendarData.data.length - 1;
    const endDate = movingCalendarData.data[lastElementIdx].date;
    const processedEndDate = moment(endDate, "YYYY-MM-DD").format("DD/MM/YYYY");

    const startMoment = moment(endDate, "YYYY-MM-DD");
    const newStartDate = startMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("DD/MM/YYYY");

    setDateReference((prevState) => ({
      ...prevState,
      zeroDate: processedEndDate,
      currentStartDate: newStartDate,
      currentEndDate: processedEndDate,
    }));
  }, []);

  useEffect(() => {
    if (movingCalendarData.status === StatusEnum.NoData) {
      setIsLeftButtonDisabled(true);
    } else {
      setIsLeftButtonDisabled(false);
    }
  }, [movingCalendarData.status]);

  useEffect(() => {
    if (!dateReference.currentEndDate) return;

    const dateMoment = moment(dateReference.currentEndDate, "DD/MM/YYYY");
    let newEndMoment: Moment;

    switch (dateReference.direction) {
      case MovesKeys.MOVE_BACKWARD:
        newEndMoment = handleBackwardMovement(dateMoment);
        break;
      case MovesKeys.MOVE_FORWARD:
        newEndMoment = handleForwardMovement(dateMoment);
        break;
      default:
        console.error("Invalid direction value:", dateReference.direction);
        return;
    }

    const newEndDate = newEndMoment.format("DD/MM/YYYY");

    const newStartDate = newEndMoment
      .date(1)
      .subtract(SEEN_MONTHS_NUMBER - 1, "months")
      .format("DD/MM/YYYY");

    setDateReference((prevState) => ({
      ...prevState,
      currentStartDate: newStartDate,
      currentEndDate: newEndDate,
    }));

    const formattedStartDate = moment(newStartDate, "DD/MM/YYYY").format(
      "YYYY-MM-DD"
    );
    const formattedEndDate = moment(newEndDate, "DD/MM/YYYY").format(
      "YYYY-MM-DD"
    );

    dispatch(
      fetchNewMovingStream({
        id: streamId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
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
          startDate={dateReference.currentStartDate}
          endDate={dateReference.currentEndDate}
          componentToToggle={
            <>
              <S.MobileSwipeContainer>
                <ScrollCalendarButton
                  disabled={isLeftButtonDisabled}
                  direction={MovesKeys.MOVE_BACKWARD}
                  handleClick={handleLeftClick}
                />
                <S.DateField>
                  <span>{dateReference.currentStartDate}</span>
                  <span>-</span>
                  <span>{dateReference.currentEndDate}</span>
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
