import React, { useCallback } from "react";

import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { setUrlParams, timeFrom, timeTo } = useMapParams();

  const getDynamicYearsArray = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }

    return years;
  };

  const handleYear = useCallback(
    (year: number) => {
      const beginning = new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000;
      const end = new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000;

      setUrlParams([
        {
          key: UrlParamsTypes.timeFrom,
          value: beginning.toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: end.toString(),
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
    <S.CrowdMapGridButtonsContainer>
      {getDynamicYearsArray().map((year) => (
        <S.CrowdGridSizeButton
          key={year}
          onClick={() => handleYear(year)}
          $isActive={timestampToYear(timeFrom) === year}
        >
          {year}
        </S.CrowdGridSizeButton>
      ))}
    </S.CrowdMapGridButtonsContainer>
  );
};

export { YearPickerButtons };
