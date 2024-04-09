import React from "react";
import { useSelector } from "react-redux";

import { selectLatestThreeMonthsDailyAverages } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms/Month";
import * as S from "./Calendar.style";
import { Heading } from "../../../pages/CalendarPage/CalendarPage.style";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLatestThreeMonthsDailyAverages);

  return (
    threeMonthsData && (
      <>
        <Heading> Measurements calendar</Heading>
        <S.ThreeMonths>
          {threeMonthsData.map((month) => (
            <Month key={month.monthName} {...month} />
          ))}
        </S.ThreeMonths>
      </>
    )
  );
};

export { Calendar };
