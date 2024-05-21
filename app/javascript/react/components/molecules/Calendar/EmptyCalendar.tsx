import React from "react";
import { useSelector } from "react-redux";

import { Month } from "./atoms/Month";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";
import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import * as S from "./Calendar.style";

const EmptyCalendar = () => {
  const threeMonthsData = useSelector(selectThreeMonthsDailyAverage);
  const { t } = useTranslation();

  return (
    threeMonthsData && (
      <S.CalendarContainer>
        <HeaderToggle
          titleText={t("calendarHeader.calendarTitle")}
          componentToToggle={
            <>
              <S.ThreeMonths>
                {threeMonthsData.map((month) => (
                  <Month key={month.monthName} {...month} />
                ))}
              </S.ThreeMonths>
            </>
          }
        />
      </S.CalendarContainer>
    )
  );
};

export { EmptyCalendar };
