import React from "react";
import { useSelector } from "react-redux";

import { selectLatestThreeMonthsDailyAverages } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import { Heading } from "./../../../pages/CalendarPage/CalendarPage.style";
import { useTranslation } from "react-i18next";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLatestThreeMonthsDailyAverages);
  const { t } = useTranslation();

  return (
    threeMonthsData && (
      <S.CalendarContainer>
        <Heading>{t("calendarHeader.calendarTitle")}</Heading>
        <S.ThreeMonths>
          {threeMonthsData.map((month) => (
            <Month key={month.monthName} {...month} />
          ))}
        </S.ThreeMonths>
      </S.CalendarContainer>
    )
  );
};

export { Calendar };
