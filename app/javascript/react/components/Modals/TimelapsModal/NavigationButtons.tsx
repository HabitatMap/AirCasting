import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
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

const Button = styled.button`
  padding: 10px 20px;
  margin: 5px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrevious,
  onNext,
}) => {
  const { t } = useTranslation();

  return (
    <S.NavigationButtonsContainer>
      <S.NavigationButton onClick={onPrevious}>
        <img src={rewindButton} alt={t("navbar.altClose")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onNext}>
        <img src={skipLeftButton} alt={t("navbar.altClose")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onNext}>
        <img src={playButton} alt={t("navbar.altClose")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onNext}>
        <img src={skipRightButton} alt={t("navbar.altClose")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onNext}>
        <img src={fastForwardButton} alt={t("navbar.altClose")} />
      </S.NavigationButton>
    </S.NavigationButtonsContainer>
  );
};

export default NavigationButtons;
