import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
} from "../../store/fixedSessionsSelectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import {
  FixedSessionsTypes,
  setFixedSessionsType,
} from "../../store/sessionFiltersSlice";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import {
  beginningOfTheYear,
  endOfTheYear,
  YearPickerButtons,
} from "./YearPickerButtons";

const DormantToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { updateTime } = useMapParams();
  const { isActive, setFilter, setUrlParams, currentUserSettings } =
    useMapParams();

  const isDormantParameterInUrl = isActive === "false";
  const isDormantSessionsFetched = useAppSelector(
    selectIsDormantSessionsFetched
  );
  const isActiveSessionsFetched = useAppSelector(selectIsActiveSessionsFetched);

  const isMobile: boolean = useMobileDetection();

  const handleToggleClick = useCallback(() => {
    const isSettingDormant = !isDormantParameterInUrl;
    const fixedSessionsType = isSettingDormant
      ? FixedSessionsTypes.DORMANT
      : FixedSessionsTypes.ACTIVE;
    const urlParamValue = isSettingDormant ? "false" : "true";
    dispatch(setFetchingData(true));
    const currentYear = new Date().getFullYear();
    dispatch(setFixedSessionsType(fixedSessionsType));
    setFilter(UrlParamsTypes.isActive, urlParamValue);
    if (fixedSessionsType === FixedSessionsTypes.DORMANT) {
      setUrlParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile
            ? UserSettings.FiltersView
            : currentUserSettings === UserSettings.CrowdMapView
            ? UserSettings.CrowdMapView
            : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.timeFrom,
          value: beginningOfTheYear(currentYear).toString(),
        },
        {
          key: UrlParamsTypes.timeTo,
          value: endOfTheYear(currentYear).toString(),
        },
        {
          key: UrlParamsTypes.isActive,
          value: "false",
        },
      ]);
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
