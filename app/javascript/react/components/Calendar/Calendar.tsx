import React from "react";
import { useSelector } from "react-redux";

import { selectLatestThreeMonthsDailyAverages } from "../../store/fixedStreamSelectors";
import MonthView from "./Month";
import * as S from "./Calendar.style";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLatestThreeMonthsDailyAverages);

  return (
    threeMonthsData && (
      <>
        <S.ThreeMonths>
          {threeMonthsData.map((month) => (
            <MonthView key={month.monthName} {...month} />
          ))}
        </S.ThreeMonths>
      </>
    )
  );
};

export default Calendar;
