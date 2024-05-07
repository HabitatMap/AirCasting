import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import moment, { Moment } from "moment";

import { selectThreeMonthsDailyAverage } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import { Heading } from "./../../../pages/CalendarPage/CalendarPage.style";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { ScrollButton } from "../../ScrollButton/ScrollButton";
import { useAppDispatch } from "../../../store/hooks";
import {
  movingData,
  fetchNewMovingStream,
} from "../../../store/movingCalendarStreamSlice";
import chevronRight from "../../../assets/icons/chevronRight.svg";
import chevronLeft from "../../../assets/icons/chevronLeft.svg";
import * as S from "./Calendar.style";

type ScrollButtonComponentProps = {
  direction: "left" | "right";
  handleClick: () => void;
  disabled?: boolean;
};

const ScrollButtonComponent: React.FC<ScrollButtonComponentProps> = ({
  direction,
  handleClick,
  disabled = false,
}) => {
  const icon = direction === "left" ? chevronLeft : chevronRight;
  const altText =
    direction === "left"
      ? "Move calendar page one step back"
      : "Move calendar page one step forward";

  return (
    <ScrollButton onClick={handleClick} disabled={disabled}>
      <img src={icon} alt={altText} />
    </ScrollButton>
  );
};

interface MovableCalendarData {
  zeroDate: string;
  currentData: string;
  direction: number | undefined;
  triggerDirectionUpdate: number;
}

const Calendar = () => {
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const movingCalendarData = useSelector(movingData);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const seenMonthsNumber = 3;
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
        newEndMoment = dateMoment.date(1).subtract(1, "months");
        if (setIsButtonDisabled) {
          setIsButtonDisabled(false);
        }
        break;
      case 1:
        newEndMoment = dateMoment.date(1).add(1, "months");

        const zeroDateMoment = moment(dateReference.zeroDate, "YYYY-MM-DD");
        const shouldDisableButton = newEndMoment.isSameOrAfter(zeroDateMoment);

        if (shouldDisableButton) {
          setIsButtonDisabled(shouldDisableButton);
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
      .subtract(seenMonthsNumber, "months")
      .format("YYYY-MM-DD");

    setDateReference((prevState) => ({
      ...prevState,
      currentData: newEndDate,
    }));
    
    dispatch(
      fetchNewMovingStream({
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
            <S.ThreeMonths>
              {threeMonthsData.map((month) => (
                <Month key={month.monthName} {...month} />
              ))}
            </S.ThreeMonths>
          }
        />
        <S.MobileSwipeContainer>
          <ScrollButtonComponent
            direction="left"
            handleClick={handleLeftClick}
          />
          <ScrollButtonComponent
            disabled={isButtonDisabled}
            direction="right"
            handleClick={handleRightClick}
          />
        </S.MobileSwipeContainer>

        <S.ThreeMonths>
          <S.DesktopSwipeContainer>
            <ScrollButtonComponent
              direction="left"
              handleClick={handleLeftClick}
            />
          </S.DesktopSwipeContainer>
          {threeMonthsData.map((month) => (
            <Month key={month.monthName} {...month} />
          ))}
          <S.DesktopSwipeContainer>
            <ScrollButtonComponent
              disabled={isButtonDisabled}
              direction="right"
              handleClick={handleRightClick}
            />
          </S.DesktopSwipeContainer>
        </S.ThreeMonths>
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
