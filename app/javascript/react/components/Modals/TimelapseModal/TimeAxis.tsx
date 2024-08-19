import React from "react";
import * as S from "./TimelapseComponent.style";

interface TimeAxisProps {
  currentStep: number;
  totalSteps: number;
}

const TimeAxis: React.FC<TimeAxisProps> = ({ currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  return (
    <S.AxisContainer>
      <S.ProgressBar>
        <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
        <S.StepMarkers>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const position = (index / (totalSteps - 1)) * 100;
            return (
              <S.StepMarker
                key={index}
                $isActive={index <= currentStep}
                $isCurrent={index === currentStep}
                $position={position}
              />
            );
          })}
        </S.StepMarkers>
      </S.ProgressBar>
    </S.AxisContainer>
  );
};

export default TimeAxis;
