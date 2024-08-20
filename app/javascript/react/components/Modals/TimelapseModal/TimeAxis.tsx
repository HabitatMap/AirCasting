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
      <S.DateContainer>
        <S.Time>00:00 AM</S.Time>
        <S.Date>01/01</S.Date>
      </S.DateContainer>
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
      <S.DateContainer>
        <S.Time>00:00 AM</S.Time>
        <S.Date>01/01</S.Date>
      </S.DateContainer>
    </S.AxisContainer>
  );
};

export default TimeAxis;
