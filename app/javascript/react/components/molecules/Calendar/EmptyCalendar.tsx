import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import { Month } from "./atoms/Month/Month";
import * as S from "./Calendar.style";
import HeaderToggle from "./HeaderToggle/HeaderToggle";

const EmptyCalendar = () => {
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
                <Month key={month.monthName} {...month} onDayClick={() => {}} />
              ))}
            </S.ThreeMonths>
          }
        />
      </S.CalendarContainer>
    )
  );
};

export { EmptyCalendar };
