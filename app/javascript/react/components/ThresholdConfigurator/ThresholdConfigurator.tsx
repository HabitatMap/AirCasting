import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { ResetButton, ResetButtonVariant } from "./ResetButton";
import * as S from "./ThresholdConfigurator.style";
import ThresholdSlider from "./ThresholdSlider";

interface ThresholdsConfiguratorProps {
  resetButtonVariant?: ResetButtonVariant;
  resetButtonText?: string;
  swapIconTextPosition?: boolean;
  isMobileOldStyle?: boolean;
  noDisclaimers?: boolean;
  useColorBoxStyle?: boolean;
  useDarkBlueIcon?: boolean;
}

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  resetButtonVariant,
  resetButtonText,
  swapIconTextPosition = false,
  isMobileOldStyle = false,
  noDisclaimers = false,
  useColorBoxStyle = false,
  useDarkBlueIcon = false,
}) => {
  const [errorMessage, setErrorMessage] = useState("");

  const { t } = useTranslation();
  const isMobile = useMobileDetection();
  const { unitSymbol } = useMapParams();

  const renderSlider = () => (
    <S.SliderContainer $isMobileOldStyle={isMobileOldStyle}>
      {errorMessage && <S.ErrorMessage>{errorMessage}</S.ErrorMessage>}
      <ThresholdSlider
        isMobileOldStyle={isMobileOldStyle}
        useColorBoxStyle={useColorBoxStyle}
        setErrorMessage={setErrorMessage}
      />
    </S.SliderContainer>
  );

  return (
    <>
      {isMobile || noDisclaimers ? (
        <>
          {renderSlider()}
          {resetButtonVariant && (
            <ResetButton
              variant={resetButtonVariant}
              resetButtonText={resetButtonText}
              swapIconTextPosition={swapIconTextPosition}
              useDarkBlueIcon={useDarkBlueIcon}
            />
          )}
        </>
      ) : (
        <>
          <S.DesktopContainer>
            <S.ThresholdsDisclaimer>
              {t("thresholdConfigurator.disclaimer")}
            </S.ThresholdsDisclaimer>
            {renderSlider()}
            <S.Units>({unitSymbol})</S.Units>
          </S.DesktopContainer>
          {resetButtonVariant && (
            <ResetButton
              variant={resetButtonVariant}
              resetButtonText={resetButtonText}
              swapIconTextPosition={swapIconTextPosition}
              useDarkBlueIcon={useDarkBlueIcon}
            />
          )}
        </>
      )}
    </>
  );
};

export { ThresholdsConfigurator };
