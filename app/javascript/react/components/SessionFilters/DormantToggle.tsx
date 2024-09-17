import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../utils/mapParamsHandler";
import { Toggle } from "../Toggle/Toggle";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import { YearPickerButtons } from "./YearPickerButtons";

const DormantToggle = () => {
  const { t } = useTranslation();
  const { isActive, updateIsActive, updateTime } = useMapParams();

  const [isDormant, setIsDormant] = useState(!isActive);

  const handleToggleClick = useCallback(() => {
    const newDormantState = !isDormant;
    setIsDormant(newDormantState);
    const currentYear = new Date().getFullYear();

    if (newDormantState) {
      updateIsActive(false);
    } else {
      updateTime(currentYear);
      updateIsActive(true);
      // Trigger data refetching here if needed
    }
  }, [isDormant, updateIsActive, updateTime]);

  useEffect(() => {
    setIsDormant(!isActive);
  }, [isActive]);

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
