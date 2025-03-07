import React from "react";
import { useTranslation } from "react-i18next";
import { ThresholdsConfigurator } from "../../ThresholdConfigurator";
import { ThresholdButtonVariant } from "../../ThresholdConfigurator/ThresholdButtons/ThresholdButton";
import * as S from "./Legend.style";

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
          resetButtonVariant={ThresholdButtonVariant.TextWithIcon}
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
