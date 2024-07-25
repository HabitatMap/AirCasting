import React from "react";

import { useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const CrowdMapToggle = () => {
  const { searchParams, sessionType } = useMapParams();

  const handleCrowdmap = () => {
    console.log("test");
  };

  return (
    <S.SessionToggleWrapper>
      {/* temporary solution, ticket: Session Filter [Mobile]: Crowdmap Toggle */}
      <S.CrowdMapButton onClick={handleCrowdmap}>crowdmap</S.CrowdMapButton>
    </S.SessionToggleWrapper>
  );
};

export { CrowdMapToggle };
