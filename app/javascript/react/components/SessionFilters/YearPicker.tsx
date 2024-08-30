import React from "react";
import { useTranslation } from "react-i18next";

import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";
import { YearPickerButtons } from "./YearPickerButtons";

const YearPicker = () => {
  const { t } = useTranslation();

  return (
    <S.SingleFilterWrapper>
      <S.YearPickerSettingsContainer>
        <S.YearPickerWrapper>
          {t("filters.yearPickerHeader")}
          <YearPickerButtons />
        </S.YearPickerWrapper>
      </S.YearPickerSettingsContainer>
      <FilterInfoPopup filterTranslationLabel="filters.crowdMapInfo" />
    </S.SingleFilterWrapper>
  );
};

export { YearPicker };
