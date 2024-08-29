import { debounce } from "lodash";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CrowdMapGridSize } from "./CrowdMapGridSize";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const YearPicker = () => {
  const { currentUserSettings, previousUserSettings } = useMapParams();
  const { t } = useTranslation();

  const getInitialMobileState = () =>
    window.matchMedia("(max-width: 1023px)").matches;

  const getInitialCrowdMapState = () => {
    return getInitialMobileState()
      ? previousUserSettings === UserSettings.CrowdMapView
      : currentUserSettings === UserSettings.CrowdMapView;
  };

  const [isMobile, setIsMobile] = useState(getInitialMobileState);
  const [isCrowdMapActive, setIsCrowdMapActive] = useState(
    getInitialCrowdMapState
  );

  useEffect(() => {
    const checkMobile = debounce(() => {
      const mobileState = window.matchMedia("(max-width: 1023px)").matches;
      setIsMobile(mobileState);
    }, 200);

    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      checkMobile.cancel();
    };
  }, []);

  useEffect(() => {
    const newCrowdMapState = isMobile
      ? previousUserSettings === UserSettings.CrowdMapView
      : currentUserSettings === UserSettings.CrowdMapView;

    if (newCrowdMapState !== isCrowdMapActive) {
      setIsCrowdMapActive(newCrowdMapState);
    }
  }, [currentUserSettings, previousUserSettings, isMobile, isCrowdMapActive]);

  return (
    <S.SingleFilterWrapper>
      <S.YearPickerSettingsContainer>
        <S.YearPickerWrapper>
          {t("filters.yearPickerHeader")}
          <CrowdMapGridSize />
        </S.YearPickerWrapper>
      </S.YearPickerSettingsContainer>
      <FilterInfoPopup filterTranslationLabel="filters.crowdMapInfo" />
    </S.SingleFilterWrapper>
  );
};

export { YearPicker };
