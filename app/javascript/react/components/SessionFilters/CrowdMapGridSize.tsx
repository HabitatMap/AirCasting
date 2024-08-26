import React, { useCallback } from "react";

import { setFetchingCrowdMapData } from "../../store/crowdMapSlice";
import { useAppDispatch } from "../../store/hooks";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const gridSizes = [1, 10, 20, 30, 40];

const CrowdMapGridSize = () => {
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

export { CrowdMapGridSize };
