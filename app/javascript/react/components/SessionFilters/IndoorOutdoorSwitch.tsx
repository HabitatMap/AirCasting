import React from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const IndoorOutdoorSwitch = () => {
  const { t } = useTranslation();
  const { isIndoor, setFilter, setUrlParams, updateIndoorFilters } =
    useMapParams();
  const dispatch = useAppDispatch();

  const isIndoorParameterInUrl = isIndoor === "true";

  const handleIndoorClick = () => {
    updateIndoorFilters("true");
    dispatch(setFetchingData(true));
  };

  const handleOutdoorClick = () => {
    updateIndoorFilters("false");
    dispatch(setFetchingData(true));
  };

  return (
    <>
      <S.IndoorToggleHeading>
        {t("filters.placementOfStations")}
      </S.IndoorToggleHeading>
      <S.SingleFilterWrapper $noMarginTop>
        <S.IndoorFilterWrapper>
          <S.IndoorToggleWrapper $isIndoor={isIndoorParameterInUrl}>
            <S.IndoorTab
              $isActive={!isIndoorParameterInUrl}
              $isIndoor={isIndoorParameterInUrl}
              onClick={handleOutdoorClick}
            >
              {t("filters.outdoor")}
            </S.IndoorTab>
            <S.IndoorTab
              $isActive={isIndoorParameterInUrl}
              $isIndoor={isIndoorParameterInUrl}
              onClick={handleIndoorClick}
            >
              {t("filters.indoor")}
            </S.IndoorTab>
          </S.IndoorToggleWrapper>
          {isIndoorParameterInUrl && (
            <S.IndoorToggleInfoWrapper>
              <S.IndoorToggleInfoText>
                {t("filters.indoorMapInfo")}
              </S.IndoorToggleInfoText>
            </S.IndoorToggleInfoWrapper>
          )}
        </S.IndoorFilterWrapper>
        <FilterInfoPopup filterTranslationLabel="filters.indoorInfo" />
      </S.SingleFilterWrapper>
    </>
  );
};

export { IndoorOutdoorSwitch };
