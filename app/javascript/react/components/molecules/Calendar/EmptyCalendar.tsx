import React from "react";

import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../store/hooks";
import { selectThreeMonthsDailyAverage } from "../../../store/movingStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import HeaderToggle from "./HeaderToggle/HeaderToggle";

const EmptyCalendar = () => {
  const threeMonthsData = useAppSelector(selectThreeMonthsDailyAverage);
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
