import React from "react";
import { useSelector } from "react-redux";

import { selectLatestThreeMonthsDailyAverages } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import { useTranslation } from "react-i18next";
import HeaderToggle from "./HeaderToggle/HeaderToggle";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLatestThreeMonthsDailyAverages);
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
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
