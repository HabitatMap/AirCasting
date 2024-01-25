import React from "react";
import moment from "moment";

import * as S from "./Month.style";

import { yellow } from "../../assets/styles/colors";

const getFullWeeksOfMonth = (year: number, month: number) => {
  let start = moment([year, month]).startOf("month").startOf("week");
  let end = moment([year, month]).endOf("month").endOf("week");

  let weeks = [];
  while (start <= end) {
    let week = [];
    for (let i = 0; i < 7; i++) {
      week.push(start.clone().add(i, "days").format("YYYY-MM-DD"));
    }
    weeks.push(week);
    start.add(1, "week");
  }
  return weeks;
};

const getDayNumber = (date: string) => {
  return moment(date).format("D");
};

const Month = () => {
  const weeks = getFullWeeksOfMonth(2024, 2);
  console.log(weeks);

  return (
    <S.Month>
      {weeks.map((week) => (
        <S.Week>
          {week.map((day) => (
            <S.Day shouldColor={true} color={yellow} isCurrentMonth={true}>
              <S.DayNumber shouldDisplay={true}>
                {getDayNumber(day)}
              </S.DayNumber>
              <S.Value shouldDisplay={true}>100</S.Value>
            </S.Day>
          ))}
        </S.Week>
      ))}
    </S.Month>
  );
};

export default Month;
