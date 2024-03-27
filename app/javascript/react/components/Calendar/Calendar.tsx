import React from "react";

import * as S from "./Calendar.style";
import MonthView from "./Month";

const Calendar = () => {
  return (
    <>
      <S.ThreeMonths>
        <MonthView></MonthView>
        <MonthView></MonthView>
        <MonthView></MonthView>
      </S.ThreeMonths>
    </>
  );
};

export default Calendar;
