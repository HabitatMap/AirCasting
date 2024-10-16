import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import { Toggle } from "../Toggle/Toggle";
import { CrowdMapGridSize } from "./CrowdMapGridSize";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const CrowdMapToggle = () => {
  const {
    currentUserSettings,
    goToUserSettings,
    previousUserSettings,
    setUrlAndLocalStorageParams,
    updatePreviousUserSettings,
  } = useMapParams();
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
  const [renderGridSize, setRenderGridSize] = useState(isCrowdMapActive);

  const isFiltersViewActive = currentUserSettings === UserSettings.FiltersView;

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

  const handleToggleClick = useCallback(() => {
    const newCheckedState = !isCrowdMapActive;

    if (isMobile && isFiltersViewActive) {
      updatePreviousUserSettings(
        newCheckedState ? UserSettings.CrowdMapView : UserSettings.MapView
      );
    } else {
      goToUserSettings(
        newCheckedState ? UserSettings.CrowdMapView : UserSettings.MapView
      );
    }

    if (newCheckedState) {
      setRenderGridSize(true);
      setIsCrowdMapActive(true);
    } else {
      setIsCrowdMapActive(false);
      setTimeout(() => setRenderGridSize(false), 500);
    }
  }, [
    isCrowdMapActive,
    isMobile,
    isFiltersViewActive,
    setUrlAndLocalStorageParams,
    goToUserSettings,
  ]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.ToggleSettingsContainer $isActive={isCrowdMapActive}>
          <S.ToggleWrapper onClick={handleToggleClick}>
            <Toggle
              isChecked={isCrowdMapActive}
              onChange={handleToggleClick}
              variant="toggle"
              noLabel
              biggerMobileVersion
            />
            <S.CrowdMapToggleText>
              {t("filters.crowdMapLabel")}{" "}
              <S.CrowdMapToggleOnOff>
                {isCrowdMapActive ? t("filters.on") : t("filters.off")}
              </S.CrowdMapToggleOnOff>
            </S.CrowdMapToggleText>
          </S.ToggleWrapper>
          {renderGridSize && (
            <S.CrowdMapGridSizeWrapper $isVisible={isCrowdMapActive}>
              {t("filters.crowdMapGridCellSizeHeader")}
              <CrowdMapGridSize />
            </S.CrowdMapGridSizeWrapper>
          )}
        </S.ToggleSettingsContainer>
        <FilterInfoPopup filterTranslationLabel="filters.crowdMapInfo" />
      </S.SingleFilterWrapper>
    </S.Wrapper>
  );
};

export { CrowdMapToggle };
