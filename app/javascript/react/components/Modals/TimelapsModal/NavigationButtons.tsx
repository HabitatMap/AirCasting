import React from "react";
import { useTranslation } from "react-i18next";
import fastForwardButton from "../../../assets/icons/fastForwardButton.svg";
import playButton from "../../../assets/icons/playButton.svg";
import rewindButton from "../../../assets/icons/rewindButton.svg";
import skipLeftButton from "../../../assets/icons/skipLeftButton.svg";
import skipRightButton from "../../../assets/icons/skipRightButton.svg";

import * as S from "./TimelapsComponent.style";

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrevious,
  onNext,
}) => {
  const { t } = useTranslation();

  return (
    <S.NavigationButtonsContainer>
      <S.NavigationButton onClick={onPrevious}>
        <img src={rewindButton} alt={t("navbar.altRewind")} />
      </S.NavigationButton>
      <S.NavigationButton>
        <img src={skipLeftButton} alt={t("navbar.altSkipLeft")} />
      </S.NavigationButton>
      <S.NavigationButton>
        <img src={playButton} alt={t("navbar.altPlay")} />
      </S.NavigationButton>
      <S.NavigationButton>
        <img src={skipRightButton} alt={t("navbar.altSkipRight")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onNext}>
        <img src={fastForwardButton} alt={t("navbar.altFastForward")} />
      </S.NavigationButton>
    </S.NavigationButtonsContainer>
  );
};

export default NavigationButtons;
