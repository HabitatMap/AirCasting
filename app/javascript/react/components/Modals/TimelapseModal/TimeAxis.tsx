import moment from "moment";
import React, { useMemo } from "react";
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
  const progressPercentage = useMemo(() => {
    return (currentStep / (totalSteps - 1)) * 100;
  }, [currentStep, totalSteps]);

  const currentTimestamp = timestamps[currentStep];

  const currentDate = useMemo(() => {
    return moment
      .utc(currentTimestamp, "YYYYMMDDHH:mm:ssZ")
      .format(DateFormat.us);
  }, [currentTimestamp]);

  const currentTime = useMemo(() => {
    return moment.utc(currentTimestamp, "YYYYMMDDHH:mm:ssZ").format("hh:mm A");
  }, [currentTimestamp]);

  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];

  const firstFormattedTime = useMemo(() => {
    return moment.utc(firstTimestamp, "YYYYMMDDHH:mm:ssZ").format("hh:mm A");
  }, [firstTimestamp]);

  const firstFormattedDate = useMemo(() => {
    return moment
      .utc(firstTimestamp, "YYYYMMDDHH:mm:ssZ")
      .format(DateFormat.us_without_year);
  }, [firstTimestamp]);

  const lastFormattedTime = useMemo(() => {
    return moment.utc(lastTimestamp, "YYYYMMDDHH:mm:ssZ").format("hh:mm A");
  }, [lastTimestamp]);

  const lastFormattedDate = useMemo(() => {
    return moment
      .utc(lastTimestamp, "YYYYMMDDHH:mm:ssZ")
      .format(DateFormat.us_without_year);
  }, [lastTimestamp]);

  return (
    <>
      <S.DesktopAxisContainer>
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
            {timestamps.map((_, index) => {
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
      </S.DesktopAxisContainer>

      <S.MobileAxisContainer>
        <S.ProgressBar>
          <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
          <S.RoundMarker $position={progressPercentage} />
          <S.StepMarkers>
            {timestamps.map((_, index) => {
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
      </S.MobileAxisContainer>
    </>
  );
};

export default TimeAxis;
