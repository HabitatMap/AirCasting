import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { ResetButton } from "./ThresholdButtons/ResetButton";
import { ThresholdButtonVariant } from "./ThresholdButtons/ThresholdButton";
import { UniformDistributionButton } from "./ThresholdButtons/UniformDistributionButton";
import * as S from "./ThresholdConfigurator.style";
import ThresholdSlider from "./ThresholdSlider";

interface ThresholdsConfiguratorProps {
  resetButtonVariant?: ThresholdButtonVariant;
  uniformDistributionButtonVariant?: ThresholdButtonVariant;
  resetButtonText?: string;
  uniformDistributionButtonText?: string;
  swapIconTextPosition?: boolean;
  isMobileOldStyle?: boolean;
  noDisclaimers?: boolean;
  useColorBoxStyle?: boolean;
  useDarkBlueIcon?: boolean;
}

const ThresholdsConfigurator: React.FC<ThresholdsConfiguratorProps> = ({
  resetButtonVariant,
  resetButtonText,
  uniformDistributionButtonVariant,
  uniformDistributionButtonText,
  swapIconTextPosition = false,
  isMobileOldStyle = false,
  noDisclaimers = false,
  useColorBoxStyle = false,
  useDarkBlueIcon = false,
}) => {
  const [errorMessage, setErrorMessage] = useState("");

  const { t } = useTranslation();
  const isMobile = useMobileDetection();
  const { unitSymbol, currentUserSettings } = useMapParams();
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
        isUniformDistributionButtonVisible={isUniformDistributionButtonVisible}
      />
    </S.SliderContainer>
  );

  return (
    <>
      {isMobile || noDisclaimers ? (
        <>
          {renderSlider()}
          <S.ThresholdButtonsMobileWrapper>
            {/* --start -- remove Placeholders after adding the color switch functionality */}
            <S.PlaceholderButton />
            {!uniformDistributionButtonText && <S.PlaceholderButton />}
            {/* -- end -- remove Placeholders after adding the color switch functionality */}
            {uniformDistributionButtonVariant && (
              <UniformDistributionButton
                variant={uniformDistributionButtonVariant}
                hasErrorMessage={setErrorMessage}
                uniformDistributionButtonText={uniformDistributionButtonText}
              />
            )}
            {resetButtonVariant && (
              <ResetButton
                variant={resetButtonVariant}
                resetButtonText={resetButtonText}
                swapIconTextPosition={swapIconTextPosition}
                useDarkBlueIcon={useDarkBlueIcon}
              />
            )}
          </S.ThresholdButtonsMobileWrapper>
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
