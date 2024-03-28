import React from "react";
import { useSelector } from "react-redux";

import * as S from "./Calendar.style";
import MonthView from "./Month";
import { selectThreeMonthsDailyAverages } from "../../store/fixedStreamSlice";

const Calendar = () => {
  const monthlyData = useSelector(selectThreeMonthsDailyAverages);

  return (
    <>
      <S.ThreeMonths>
        <MonthView {...monthlyData} />
      </S.ThreeMonths>
    </>
  );
};

export default Calendar;
