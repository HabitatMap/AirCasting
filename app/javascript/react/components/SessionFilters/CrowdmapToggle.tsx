import React from "react";

import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const CrowdMapToggle = () => {
  const { currentUserSettings, goToUserSettings } = useMapParams();

  const handleCrowdMap = () => {
    goToUserSettings(UserSettings.CrowdMapView);
    if (currentUserSettings === UserSettings.CrowdMapView) {
      goToUserSettings(UserSettings.MapView);
    }
  };

  return (
    <S.SessionToggleWrapper>
      {/* temporary solution, ticket: Session Filter [Mobile]: Crowdmap Toggle */}
      <S.CrowdMapButton onClick={handleCrowdMap}>crowdmap</S.CrowdMapButton>
    </S.SessionToggleWrapper>
  );
};

export { CrowdMapToggle };
