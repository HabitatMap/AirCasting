import React from "react";

import { setFetchingCrowdMapData } from "../../store/crowdMapSlice";
import { useAppDispatch } from "../../store/hooks";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const CrowdMapGridSize = () => {
  const dispatch = useAppDispatch();
  const { setFilters } = useMapParams();

  const handleGridSize = (gridSize: number) => {
    setFilters(UrlParamsTypes.gridSize, gridSize.toString());
    setTimeout(() => {
      dispatch(setFetchingCrowdMapData(true));
    }, 200);
  };

  return (
    <S.SessionToggleWrapper>
      <S.CrowdMapButton onClick={() => handleGridSize(1)} disabled={false}>
        1
      </S.CrowdMapButton>
      <S.CrowdMapButton onClick={() => handleGridSize(10)} disabled={false}>
        10
      </S.CrowdMapButton>
      <S.CrowdMapButton onClick={() => handleGridSize(20)} disabled={false}>
        20
      </S.CrowdMapButton>
      <S.CrowdMapButton onClick={() => handleGridSize(30)} disabled={false}>
        30
      </S.CrowdMapButton>
      <S.CrowdMapButton onClick={() => handleGridSize(40)} disabled={false}>
        40
      </S.CrowdMapButton>
    </S.SessionToggleWrapper>
  );
};

export { CrowdMapGridSize };
