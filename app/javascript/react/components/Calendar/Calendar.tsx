import React from "react";
import { useSelector } from "react-redux";

import * as S from "./Calendar.style";
import MonthView from "./Month";
import { selectLastThreeMonthsDailyAverages } from "../../store/fixedStreamSelectors";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLastThreeMonthsDailyAverages);

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
