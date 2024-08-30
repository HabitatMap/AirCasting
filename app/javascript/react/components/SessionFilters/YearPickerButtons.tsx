import React, { useCallback } from "react";

import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const years = ["2024", "2023", "2022", "2021", "2020"];

const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { setUrlParams, timeFrom, timeTo } = useMapParams();

  const handleYear = useCallback(
    (year: string) => {
      setUrlParams([
        {
          key: UrlParamsTypes.timeFrom,
          value: "1692662400",
        },
        {
          key: UrlParamsTypes.timeTo,
          value: "1724371199",
        },
      ]);
      setTimeout(() => {
        dispatch(setFetchingData(true));
      }, 200);
    },
    [dispatch, setUrlParams, timeFrom, timeTo]
  );

  return (
    <S.CrowdMapGridButtonsContainer>
      {years.map((year) => (
        <S.CrowdGridSizeButton
          key={year}
          onClick={() => handleYear(year)}
          $isActive={timeFrom === year}
        >
          {year}
        </S.CrowdGridSizeButton>
      ))}
    </S.CrowdMapGridButtonsContainer>
  );
};

export { YearPickerButtons };
