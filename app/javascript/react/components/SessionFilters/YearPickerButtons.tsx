import React, { useCallback } from "react";

import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
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

const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { setUrlParams, timeFrom, timeTo } = useMapParams();

  const handleYear = useCallback(
    (year: number) => {
      setUrlParams([
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(year).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(year).toString(),
        },
      ]);
      setTimeout(() => {
        dispatch(setFetchingData(true));
      }, 200);
    },
    [dispatch, setUrlParams, timeFrom, timeTo]
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
