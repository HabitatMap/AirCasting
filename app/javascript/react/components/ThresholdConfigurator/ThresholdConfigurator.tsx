import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { ResetButton } from "./ThresholdButtons/ResetButton";
import * as S from "./ThresholdConfigurator.style";
import ThresholdSlider from "./ThresholdSlider";
import { UniformDistributionButton } from "./ThresholdButtons/UniformDistributionButton";
import { UserSettings } from "../../types/userStates";
import { ThresholdButtonVariant } from "./ThresholdButtons/ThresholdButton";

interface ThresholdsConfiguratorProps {
  resetButtonVariant?: ThresholdButtonVariant;
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
  const { unitSymbol, sessionId, currentUserSettings } = useMapParams();
  const isUniformDistributionButtonVisible =
    currentUserSettings === UserSettings.ModalView ||
    currentUserSettings === UserSettings.CalendarView;

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
          {resetButtonVariant && sessionId && (
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
          <S.ThresholdButtonsWrapper>
            {resetButtonVariant && (
              <ResetButton
                variant={resetButtonVariant}
                resetButtonText={resetButtonText}
                swapIconTextPosition={swapIconTextPosition}
                useDarkBlueIcon={useDarkBlueIcon}
              />
            )}
            {isUniformDistributionButtonVisible && (
              <UniformDistributionButton hasErrorMessage={setErrorMessage} />
            )}
          </S.ThresholdButtonsWrapper>
        </>
      )}
    </>
  );
};

export { ThresholdsConfigurator };
