import React, { useCallback } from "react";

import { setFetchingCrowdMapData } from "../../store/crowdMapSlice";
import { useAppDispatch } from "../../store/hooks";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const gridSizes = [2024, 2023, 2022, 2021, 2020];
export const defaultGridSize = 51 - gridSizes[2];

const YearPickerButtons = () => {
  const dispatch = useAppDispatch();
  const { setFilters, gridSize } = useMapParams();

  const handleGridSize = useCallback(
    (size: number) => {
      setFilters(UrlParamsTypes.gridSize, (51 - size).toString());
      setTimeout(() => {
        dispatch(setFetchingCrowdMapData(true));
      }, 200);
    },
    [dispatch, gridSize, setFilters]
  );

  return (
    <S.CrowdMapGridButtonsContainer>
      {gridSizes.map((size) => (
        <S.CrowdGridSizeButton
          key={size}
          onClick={() => handleGridSize(size)}
          $isActive={gridSize === 51 - size}
        >
          {size}
        </S.CrowdGridSizeButton>
      ))}
    </S.CrowdMapGridButtonsContainer>
  );
};

export { YearPickerButtons };
