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
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const DormantToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [isDormant, setIsDormant] = useState(false);
  const fixedSessionType = useAppSelector(selectFixedSessionsType);
  const isDormantSessionsFetched = useAppSelector(
    selectIsDormantSessionsFetched
  );
  const isActiveSessionsFetched = useAppSelector(selectIsActiveSessionsFetched);

  const handleToggleClick = useCallback(() => {
    const newDormantState = !isDormant;
    setIsDormant(newDormantState);
    newDormantState === true
      ? dispatch(setFixedSessionsType(FixedSessionsTypes.DORMANT))
      : dispatch(setFixedSessionsType(FixedSessionsTypes.ACTIVE));
    (!isDormantSessionsFetched || !isActiveSessionsFetched) &&
      dispatch(setFetchingData(true));
  }, [isDormant, isDormantSessionsFetched, isActiveSessionsFetched]);

  useEffect(() => {
    setIsDormant(fixedSessionType === FixedSessionsTypes.DORMANT);
  }, [fixedSessionType]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.CrowdMapSettingsContainer $isCrowdMapActive={false}>
          <S.CrowdMapToggleWrapper onClick={handleToggleClick}>
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
          </S.CrowdMapToggleWrapper>
        </S.CrowdMapSettingsContainer>
        <FilterInfoPopup filterTranslationLabel="filters.crowdMapInfo" />
      </S.SingleFilterWrapper>
    </S.Wrapper>
  );
};

export { DormantToggle };
