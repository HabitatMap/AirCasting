import React from "react";
import { useSelector } from "react-redux";

import { selectThreeMonthsDailyAverage } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { ScrollButton } from "../../ScrollButton/ScrollButton";
import chevronRight from "../../../assets/icons/chevronRight.svg";
import chevronLeft from "../../../assets/icons/chevronLeft.svg";

type ScrollButtonComponentProps = {
  direction: "left" | "right";
};

const ScrollButtonComponent: React.FC<ScrollButtonComponentProps> = ({
  direction,
}) => {
  const icon = direction === "left" ? chevronLeft : chevronRight;
  const altText =
    direction === "left"
      ? "Move calendar page one step back"
      : "Move calendar page one step forward";

  return (
    <ScrollButton 
      onClick={()=>{}}>
      <img src={icon} 
        alt={altText} />
    </ScrollButton>
  );
};

const Calendar = () => {
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const { t } = useTranslation();

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
          <ScrollButtonComponent direction="left" />
          <ScrollButtonComponent direction="right" />
        </S.MobileSwipe>

        <S.ThreeMonths>
          <S.DesktopSwipe>
            <ScrollButtonComponent direction="left" />
          </S.DesktopSwipe>
          {threeMonthsData.map((month) => (
            <Month key={month.monthName} {...month} />
          ))}
          <S.DesktopSwipe>
            <ScrollButtonComponent direction="right" />
          </S.DesktopSwipe>
        </S.ThreeMonths>
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
