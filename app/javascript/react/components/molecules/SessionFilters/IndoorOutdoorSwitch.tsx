import React from "react";
import { useTranslation } from "react-i18next";

import { FALSE, TRUE } from "../../../const/booleans";
import { useAppDispatch } from "../../../store/hooks";
import { setFetchingData } from "../../../store/mapSlice";
import { UrlParamsTypes, useMapParams } from "../../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const IndoorOutdoorSwitch = () => {
  const { t } = useTranslation();
  const { isIndoor, updateIndoorFilters, setFilter } = useMapParams();
  const dispatch = useAppDispatch();

  const isIndoorParameterInUrl = isIndoor === TRUE;

  const handleIndoorClick = () => {
    updateIndoorFilters(TRUE);
    dispatch(setFetchingData(true));
  };

  const handleOutdoorClick = () => {
    setFilter(UrlParamsTypes.isIndoor, FALSE);
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
