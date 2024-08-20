import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import fastForwardButton from "../../../assets/icons/fastForwardButton.svg";
import pauseButton from "../../../assets/icons/pauseButton.svg";
import playButton from "../../../assets/icons/playButton.svg";
import rewindButton from "../../../assets/icons/rewindButton.svg";
import skipLeftButton from "../../../assets/icons/skipLeftButton.svg";
import skipRightButton from "../../../assets/icons/skipRightButton.svg";

import * as S from "./TimelapseComponent.style";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onNextStep,
  onPreviousStep,
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isPlaying) {
      interval = setInterval(() => {
        if (currentStep < totalSteps - 1) {
          onNextStep();
        } else {
          setIsPlaying(false);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, totalSteps, onNextStep]);

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <S.NavigationButtonsContainer>
      <S.NavigationButton onClick={onPreviousStep} disabled={currentStep === 0}>
        <img src={rewindButton} alt={t("timelapse.altRewind")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={onPreviousStep} disabled={currentStep === 0}>
        <img src={skipLeftButton} alt={t("timelapse.altSkipLeft")} />
      </S.NavigationButton>
      <S.NavigationButton onClick={handlePlayPause}>
        <img
          src={isPlaying ? pauseButton : playButton}
          alt={t("timelapse.altPlay")}
        />
      </S.NavigationButton>
      <S.NavigationButton
        onClick={onNextStep}
        disabled={currentStep === totalSteps - 1}
      >
        <img src={skipRightButton} alt={t("timelapse.altSkipRight")} />
      </S.NavigationButton>
      <S.NavigationButton
        onClick={onNextStep}
        disabled={currentStep === totalSteps - 1}
      >
        <img src={fastForwardButton} alt={t("timelapse.altFastForward")} />
      </S.NavigationButton>
    </S.NavigationButtonsContainer>
  );
};

export default NavigationButtons;
