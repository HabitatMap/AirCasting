import React from "react";
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
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import { YearPickerButtons } from "./YearPickerButtons";

const DormantToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { updateTime } = useMapParams();
  const { isActive, setUrlParams } = useMapParams();

  const isDormantParameterInUrl = isActive === "false";
  const isDormantSessionsFetched = useAppSelector(
    selectIsDormantSessionsFetched
  );
  const isActiveSessionsFetched = useAppSelector(selectIsActiveSessionsFetched);

  const handleToggleClick = () => {
    dispatch(setFetchingData(true));
    const currentYear = new Date().getFullYear();

    if (!isDormantParameterInUrl) {
      dispatch(setFixedSessionsType(FixedSessionsTypes.DORMANT));
      setUrlParams([
        {
          key: UrlParamsTypes.isActive,
          value: "false",
        },
      ]);
    } else {
      updateTime(currentYear);

      dispatch(setFixedSessionsType(FixedSessionsTypes.ACTIVE));
      setUrlParams([
        {
          key: UrlParamsTypes.isActive,
          value: "true",
        },
      ]);
    }
    (!isDormantSessionsFetched || !isActiveSessionsFetched) &&
      dispatch(setFetchingData(true));
  };

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
