import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectThreeMonthsDailyAverage } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { ScrollButton } from "../../ScrollButton/ScrollButton";
import chevronRight from "../../../assets/icons/chevronRight.svg";
import chevronLeft from "../../../assets/icons/chevronLeft.svg";

import { useAppDispatch } from "../../../store/hooks";
import { movingData, fetchNewMovingStream } from "../../../store/movingCalendarStreamSlice";
import moment, { Moment } from "moment";

type ScrollButtonComponentProps = {
  direction: "left" | "right";
  handleClick: () => void;
};

const ScrollButtonComponent: React.FC<ScrollButtonComponentProps> = ({
  direction,
  handleClick,
}) => {
  const icon = direction === "left" ? chevronLeft : chevronRight;
  const altText =
    direction === "left"
      ? "Move calendar page one step back"
      : "Move calendar page one step forward";

  return (
    <ScrollButton onClick={() => handleClick()}>
      <img src={icon} alt={altText} />
    </ScrollButton>
  );
};

interface MovableCalendar {
  zeroDate: string;
  currentData: string;
  direction: number;
}

const Calendar = () => {
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const mData = useSelector(movingData);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [dateReference, setDateReference] = useState<MovableCalendar>({
    zeroDate: "",
    currentData: "",
    direction: 0,
  });
  const seenMonthsNumber = 3;

  const updateMoveValue = (direction: 1 | 0 | -1) => {
    setDateReference((prevState) => {
      return {
        ...prevState,
        direction: direction,
      };
    });
  };

  useEffect(() => {
    const lastElementIdx = mData.data.length - 1;
    const endDate = mData.data[lastElementIdx].date;
    console.log("Retrieve and save end date on enter - ", endDate);
    setDateReference(prevState => ({ ...prevState, zeroDate: endDate, currentData: endDate }));
  }, []);

  useEffect(() => {
    if (!dateReference.zeroDate || dateReference.direction == 0) return;

    const dateMoment = moment(dateReference.currentData, "YYYY-MM-DD");
    let newEndMoment: Moment;

    if (dateReference.direction === -1) {
      newEndMoment = dateMoment.date(1).subtract(1, "months");
    } else if (dateReference.direction === 1) {
      newEndMoment = dateMoment.date(1).add(1, "months");
    } else {
      newEndMoment = dateMoment.date(1).add(0, "months");
    }

    const newEndDate = newEndMoment.format("YYYY-MM-DD");
    setDateReference(prevState => ({ ...prevState, currentData: newEndDate }));
    const newStartDate = newEndMoment.date(1).subtract(seenMonthsNumber, "months").format("YYYY-MM-DD");
    dispatch(fetchNewMovingStream({ id: 1, startDate: newStartDate, endDate: newEndDate }));

    updateMoveValue(0);
  }, [dateReference.direction]);


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
        <S.MobileSwipe>
          <ScrollButtonComponent direction="left" handleClick={handleLeftClick}/>
          <ScrollButtonComponent direction="right" handleClick={handleRightClick}/>
        </S.MobileSwipe>

        <S.ThreeMonths>
          <S.DesktopSwipe>
            <ScrollButtonComponent direction="left" handleClick={handleLeftClick} />
          </S.DesktopSwipe>
          {threeMonthsData.map((month) => (
            <Month key={month.monthName} {...month} />
          ))}
          <S.DesktopSwipe>
            <ScrollButtonComponent direction="right" handleClick={handleRightClick}/>
          </S.DesktopSwipe>
        </S.ThreeMonths>
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
