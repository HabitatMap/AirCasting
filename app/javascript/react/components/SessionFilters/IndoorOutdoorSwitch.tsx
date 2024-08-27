import React from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const IndoorOutdoorSwitch = () => {
  const { t } = useTranslation();
  const { isIndoor, setUrlParams, sensorName } = useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();

  const handleIndoorClick = () => {
    dispatch(setFetchingData(true));
    setUrlParams([
      {
        key: UrlParamsTypes.isIndoor,
        value: "true",
      },
      {
        key: UrlParamsTypes.currentUserSettings,
        value: isMobile ? UserSettings.FiltersView : UserSettings.IndoorView,
      },
    ]);
  };

  const handleOutdoorClick = () => {
    dispatch(setFetchingData(true));
    setUrlParams([
      {
        key: UrlParamsTypes.isIndoor,
        value: "false",
      },
      {
        key: UrlParamsTypes.currentUserSettings,
        value: isMobile ? UserSettings.FiltersView : UserSettings.MapView,
      },
    ]);
  };

  return (
    <>
      <S.IndoorToggleHeading>
        {t("filters.placementOfStations")}
      </S.IndoorToggleHeading>
      <S.SingleFilterWrapper $noMarginTop>
        <S.IndoorFilterWrapper>
          <S.IndoorToggleWrapper $isIndoor={isIndoor === "true"}>
            <S.IndoorTab
              $isActive={isIndoor === "false"}
              $isIndoor={isIndoor === "true"}
              onClick={handleOutdoorClick}
            >
              {t("filters.outdoor")}
            </S.IndoorTab>
            <S.IndoorTab
              $isActive={isIndoor === "true"}
              $isIndoor={isIndoor === "true"}
              onClick={handleIndoorClick}
            >
              {t("filters.indoor")}
            </S.IndoorTab>
          </S.IndoorToggleWrapper>
          {isIndoor === "true" && (
            <S.IndoorToggleInfoWrapper>
              <S.IndoorToggleInfoText>
                {t("filters.indoorMapInfo")}
              </S.IndoorToggleInfoText>
              {!sensorName.startsWith("Air") && (
                <S.IndoorToggleInfoText>
                  {t("filters.nonAirbeamIndoor")}
                </S.IndoorToggleInfoText>
              )}
            </S.IndoorToggleInfoWrapper>
          )}
        </S.IndoorFilterWrapper>
        <FilterInfoPopup filterTranslationLabel="filters.indoorInfo" />
      </S.SingleFilterWrapper>
    </>
  );
};

export { IndoorOutdoorSwitch };
