import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FALSE, TRUE } from "../../const/booleans";
import {
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
} from "../../store/fixedSessionsSelectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { FixedSessionsTypes } from "../../store/sessionFiltersSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import { YearPickerButtons } from "./YearPickerButtons";

const DormantToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isActive, setFilter, updateActiveFixedSessions } = useMapParams();

  const isDormantParameterInUrl = isActive === FALSE;
  const isDormantSessionsFetched = useAppSelector(
    selectIsDormantSessionsFetched
  );
  const isActiveSessionsFetched = useAppSelector(selectIsActiveSessionsFetched);

  const handleToggleClick = useCallback(() => {
    const isSettingDormant = !isDormantParameterInUrl;
    const fixedSessionsTypeToBeSet = isSettingDormant
      ? FixedSessionsTypes.DORMANT
      : FixedSessionsTypes.ACTIVE;
    const urlParamValue = isSettingDormant ? FALSE : TRUE;
    dispatch(setFetchingData(true));
    setFilter(UrlParamsTypes.isActive, urlParamValue);

    const currentYear = new Date().getFullYear();
    if (fixedSessionsTypeToBeSet === FixedSessionsTypes.ACTIVE) {
      updateActiveFixedSessions(currentYear);
    }

    if (!isDormantSessionsFetched || !isActiveSessionsFetched) {
      dispatch(setFetchingData(true));
    }
  }, [
    dispatch,
    isDormantParameterInUrl,
    isDormantSessionsFetched,
    isActiveSessionsFetched,
    setFilter,
  ]);

  useEffect(() => {
    if (
      (isDormantParameterInUrl && !isDormantSessionsFetched) ||
      (!isDormantParameterInUrl && !isActiveSessionsFetched)
    ) {
      dispatch(setFetchingData(true));
    }
  }, [
    isDormantParameterInUrl,
    dispatch,
    isDormantSessionsFetched,
    isActiveSessionsFetched,
  ]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.ToggleSettingsContainer $isActive={isDormantParameterInUrl}>
          <S.ToggleWrapper onClick={handleToggleClick}>
            <Toggle
              isChecked={isDormantParameterInUrl}
              onChange={handleToggleClick}
              variant="toggle"
              noLabel
              biggerMobileVersion
            />
            <S.CrowdMapToggleText>
              {t("filters.dormantToggleLabel")}{" "}
              <S.CrowdMapToggleOnOff>
                {isDormantParameterInUrl ? t("filters.on") : t("filters.off")}
              </S.CrowdMapToggleOnOff>
            </S.CrowdMapToggleText>
          </S.ToggleWrapper>
          {isDormantParameterInUrl && (
            <S.CrowdMapGridSizeWrapper $isVisible={isDormantParameterInUrl}>
              <S.DormantYearPickerWrapper>
                {t("filters.yearPickerHeader")}
                <YearPickerButtons />
              </S.DormantYearPickerWrapper>
            </S.CrowdMapGridSizeWrapper>
          )}
        </S.ToggleSettingsContainer>
        <FilterInfoPopup filterTranslationLabel="filters.dormantInfo" />
      </S.SingleFilterWrapper>
    </S.Wrapper>
  );
};

export { DormantToggle };
