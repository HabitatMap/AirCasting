import moment from "moment";
import React from "react";
import { DateFormat } from "../../../types/dateFormat";
import * as S from "./TimelapseComponent.style";

interface TimeAxisProps {
  currentStep: number;
  totalSteps: number;
  timestamps: string[];
}

const TimeAxis: React.FC<TimeAxisProps> = ({
  currentStep,
  totalSteps,
  timestamps,
}) => {
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  const currentTimestamp = timestamps[currentStep];
  const currentDate = moment.utc(currentTimestamp).format(DateFormat.us);
  const currentTime = moment.utc(currentTimestamp).format("hh:mm A");

  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];

  const firstFormattedTime = moment.utc(firstTimestamp).format("hh:mm A");
  const firstFormattedDate = moment
    .utc(firstTimestamp)
    .format(DateFormat.us_without_year);
  const lastFormattedTime = moment.utc(lastTimestamp).format("hh:mm A");
  const lastFormattedDate = moment
    .utc(lastTimestamp)
    .format(DateFormat.us_without_year);

  return (
    <S.AxisContainer>
      <S.DateContainer>
        <S.Time>{firstFormattedTime}</S.Time>
        <S.Date>{firstFormattedDate}</S.Date>
      </S.DateContainer>
      <S.ProgressBar>
        <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
        <S.RoundMarker $position={progressPercentage}>
          <S.Tooltip>
            <span>{currentTime}</span>
            <span>{currentDate}</span>
          </S.Tooltip>
        </S.RoundMarker>
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
        <S.Time>{lastFormattedTime}</S.Time>
        <S.Date>{lastFormattedDate}</S.Date>
      </S.DateContainer>
    </S.AxisContainer>
  );
};

export default TimeAxis;
