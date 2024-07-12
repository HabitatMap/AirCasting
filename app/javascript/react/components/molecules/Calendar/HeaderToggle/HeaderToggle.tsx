import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import headerArrowIcon from "../../../../assets/icons/headerArrowIcon.svg";
import returnArrow from "../../../../assets/icons/returnArrow.svg";
import useMobileDetection from "../../../../utils/useScreenSizeDetection";
import * as S from "./HeaderToggle.style";

interface Props {
  titleText: string | JSX.Element;
  startDate?: string;
  endDate?: string;
  componentToToggle: JSX.Element;
  resetThresholds?: () => void;
  isMapPage?: boolean;
}

const HeaderToggle = ({
  titleText,
  startDate,
  endDate,
  componentToToggle,
  resetThresholds,
  isMapPage,
}: Props) => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const displayResetButton = () => {
    if (!resetThresholds) return null;
    return (
      <S.ResetButton onClick={resetThresholds}>
        {t("thresholdConfigurator.resetButton")}
        <img
          src={returnArrow}
          alt={t("thresholdConfigurator.altResetButton")}
        />
      </S.ResetButton>
    );
  };

  const displayMapPageResetButton = () => {
    if (!resetThresholds) return null;
    return (
      <S.ThresholdResetButton onClick={resetThresholds}>
        <img
          src={returnArrow}
          alt={t("thresholdConfigurator.altResetButton")}
        />
      </S.ThresholdResetButton>
    );
  };

  return (
    <>
      {isMobile && !isMapPage && (
        <S.Container>
          <S.RotatedIcon
            src={headerArrowIcon}
            alt={t("headerToggle.arrowIcon")}
            $rotated={!isVisible}
            onClick={toggleVisibility}
          />
          <S.Heading onClick={toggleVisibility}>{titleText}</S.Heading>
        </S.Container>
      )}

      {!isMapPage && !isMobile && (
        <S.Container>
          <S.Heading>
            {titleText}
            {startDate && endDate && (
              <S.DateField>
                <span>{startDate}</span>
                <span>-</span>
                <span>{endDate}</span>
              </S.DateField>
            )}
          </S.Heading>
          {displayResetButton()}
        </S.Container>
      )}

      {isVisible && !isMapPage && componentToToggle}
      {isMobile && isVisible && !isMapPage && displayResetButton()}
      {isMapPage && (
        <S.Wrapper>
          {componentToToggle}
          {displayMapPageResetButton()}
        </S.Wrapper>
      )}
    </>
  );
};

export default HeaderToggle;
