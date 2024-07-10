import React, { useState } from "react";
import * as S from "./Legend.style";
import { ThresholdsConfigurator } from "../../ThresholdConfigurator";
import { useTranslation } from "react-i18next";

interface LegendProps {
  onClose: () => void;
}

const Legend = ({ onClose }: LegendProps) => {
  const { t } = useTranslation();

  return (
    <S.LegendContainer>
      <S.Header>
        <S.CloseButton onClick={onClose} />
        <S.Title>{t("map.legend.title")}</S.Title>
      </S.Header>
      <S.SliderContainer>
        <ThresholdsConfigurator
          showResetButtonWithText
          resetButtonText={t("map.legend.resetRangesButton")}
          useColorBoxStyle
          useDarkBlueIcon
        />
      </S.SliderContainer>
      <S.ApplyButton onClick={onClose}>
        {t("map.legend.applyButton")}
      </S.ApplyButton>
    </S.LegendContainer>
  );
};

export { Legend };
