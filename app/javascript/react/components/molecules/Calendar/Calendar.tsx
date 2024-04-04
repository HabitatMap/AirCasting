import React from "react";
import { useSelector } from "react-redux";

import { selectLatestThreeMonthsDailyAverages } from "../../../store/fixedStreamSelectors";
import { Month } from "./atoms";
import * as S from "./Calendar.style";

const Calendar = () => {
  const threeMonthsData = useSelector(selectLatestThreeMonthsDailyAverages);

  return (
    threeMonthsData && (
      <>
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
