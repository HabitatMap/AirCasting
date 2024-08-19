import React from "react";
import * as S from "./TimelapseComponent.style";

interface TimeAxisProps {
  currentStep: number;
  totalSteps: number;
}

const TimeAxis: React.FC<TimeAxisProps> = ({ currentStep, totalSteps }) => {
  // Calculate the percentage of the current step relative to the total steps
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  return (
    <S.AxisContainer>
      {/* Render a progress bar or markers based on the current step */}
      <S.ProgressBar>
        <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
      </S.ProgressBar>
      <S.StepMarkers>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <S.StepMarker
            key={index}
            isActive={index <= currentStep}
            isCurrent={index === currentStep}
          />
        ))}
      </S.StepMarkers>
    </S.AxisContainer>
  );
};

export default TimeAxis;
