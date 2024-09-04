import React, { useCallback } from "react";

import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

export const beginningOfTheYear = (year: number): number =>
  new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000;

export const endOfTheYear = (year: number): number =>
  new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000;

export const getLastFiveYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }

  return years;
};

console.log("YearPickerButtons");
const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { timeFrom, updateTime } = useMapParams();

  const handleYear = useCallback(
    (year: number) => {
      updateTime(year);
      dispatch(setFetchingData(true));
    },
    [dispatch, updateTime]
  );

  const timestampToYear = (timestamp: string): number => {
    const date = new Date(Number(timestamp) * 1000);
    return date.getUTCFullYear();
  };

  return (
    <S.SectionButtonsContainer>
      {getLastFiveYears().map((year) => (
        <S.SectionButton
          key={year}
          onClick={() => handleYear(year)}
          $isActive={timestampToYear(timeFrom) === year}
        >
          {year}
        </S.SectionButton>
      ))}
    </S.SectionButtonsContainer>
  );
};

export { YearPickerButtons };
