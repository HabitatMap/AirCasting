import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  selectIsActiveSessionsFetched,
  selectIsDormantSessionsFetched,
} from "../../store/fixedSessionsSelectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import {
  FixedSessionsTypes,
  selectFixedSessionsType,
  setFixedSessionsType,
} from "../../store/sessionFiltersSlice";
import { useMapParams } from "../../utils/mapParamsHandler";
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import { YearPickerButtons } from "./YearPickerButtons";

const DormantToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { updateTime } = useMapParams();

  const [isDormant, setIsDormant] = useState(false);
  const fixedSessionType = useAppSelector(selectFixedSessionsType);
  const isDormantSessionsFetched = useAppSelector(
    selectIsDormantSessionsFetched
  );
  const isActiveSessionsFetched = useAppSelector(selectIsActiveSessionsFetched);

  const handleToggleClick = useCallback(() => {
    const newDormantState = !isDormant;
    setIsDormant(newDormantState);
    const currentYear = new Date().getFullYear();

    if (newDormantState === true) {
      dispatch(setFixedSessionsType(FixedSessionsTypes.DORMANT));
    } else {
      updateTime(currentYear);
      dispatch(setFixedSessionsType(FixedSessionsTypes.ACTIVE));
    }

    if (!isDormantSessionsFetched || !isActiveSessionsFetched) {
      dispatch(setFetchingData(true));
    }
  }, [isDormant, isDormantSessionsFetched, isActiveSessionsFetched]);

  useEffect(() => {
    setIsDormant(fixedSessionType === FixedSessionsTypes.DORMANT);
  }, [fixedSessionType]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.ToggleSettingsContainer $isActive={isDormant}>
          <S.ToggleWrapper onClick={handleToggleClick}>
            <Toggle
              isChecked={isDormant}
              onChange={handleToggleClick}
              variant="toggle"
              noLabel
              biggerMobileVersion
            />
            <S.CrowdMapToggleText>
              {t("filters.dormantToggleLabel")}{" "}
              <S.CrowdMapToggleOnOff>
                {isDormant ? t("filters.on") : t("filters.off")}
              </S.CrowdMapToggleOnOff>
            </S.CrowdMapToggleText>
          </S.ToggleWrapper>
          {isDormant && (
            <S.CrowdMapGridSizeWrapper $isVisible={isDormant}>
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
