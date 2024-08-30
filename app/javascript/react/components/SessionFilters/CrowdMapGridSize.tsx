import React, { useCallback } from "react";

import { setFetchingCrowdMapData } from "../../store/crowdMapSlice";
import { useAppDispatch } from "../../store/hooks";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const gridSizes = [1, 10, 20, 30, 40];
export const defaultGridSize = 51 - gridSizes[2];

const CrowdMapGridSize = () => {
  const dispatch = useAppDispatch();
  const { setFilter, gridSize } = useMapParams();

  const handleGridSize = useCallback(
    (size: number) => {
      setFilter(UrlParamsTypes.gridSize, (51 - size).toString());
      setTimeout(() => {
        dispatch(setFetchingCrowdMapData(true));
      }, 200);
    },
    [dispatch, gridSize, setFilter]
  );

  return (
    <S.SectionButtonsContainer>
      {gridSizes.map((size) => (
        <S.SectionButton
          key={size}
          onClick={() => handleGridSize(size)}
          $isActive={gridSize === 51 - size}
        >
          {size}
        </S.SectionButton>
      ))}
    </S.SectionButtonsContainer>
  );
};

export { CrowdMapGridSize };
