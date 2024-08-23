import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";
import { FilterInfoPopup } from "./FilterInfoPopup";
import { Toggle } from "../Toggle/Toggle";
const CrowdMapToggle = () => {
  const {
    currentUserSettings,
    goToUserSettings,
    previousUserSettings,
    setUrlParams,
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
      setUrlParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: newCheckedState
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
      ]);
    } else {
      goToUserSettings(
        newCheckedState ? UserSettings.CrowdMapView : UserSettings.MapView
      );
    }
    setIsCrowdMapActive(newCheckedState);
  }, [
    isCrowdMapActive,
    isMobile,
    isFiltersViewActive,
    setUrlParams,
    goToUserSettings,
  ]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.CrowdMapSettingsContainer>
          <S.CrowdMapToggleWrapper onClick={handleToggleClick}>
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
                {isCrowdMapActive
                  ? t("filters.crowdMapToggleOn")
                  : t("filters.crowdMapToggleOff")}
              </S.CrowdMapToggleOnOff>
            </S.CrowdMapToggleText>
          </S.CrowdMapToggleWrapper>
        </S.CrowdMapSettingsContainer>
        <FilterInfoPopup filterTranslationLabel="filters.crowdMapInfo" />
      </S.SingleFilterWrapper>
    </S.Wrapper>
  );
};

export { CrowdMapToggle };
