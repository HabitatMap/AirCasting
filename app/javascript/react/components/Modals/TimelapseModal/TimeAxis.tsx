import React, { useState, useEffect, useCallback, useMemo } from "react";
import moment from "moment";
import { DateFormat } from "../../../types/dateFormat";
import * as S from "./TimelapseComponent.style";

interface TimeAxisProps {
  currentStep: number;
  totalSteps: number;
  timestamps: string[];
  onStepChange: (step: number) => void;
}

const TimeAxis: React.FC<TimeAxisProps> = ({
  currentStep,
  totalSteps,
  timestamps,
  onStepChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);

  const progressPercentage = useMemo(() => {
    const step =
      isDragging && dragPosition !== null ? dragPosition : currentStep;
    return (step / (totalSteps - 1)) * 100;
  }, [currentStep, totalSteps, isDragging, dragPosition]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      let clientX: number;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const progressBar = document.querySelector(
        ".progress-bar"
      ) as HTMLElement;
      const progressBarRect = progressBar.getBoundingClientRect();
      const mousePosition = clientX - progressBarRect.left;
      const percentage = (mousePosition / progressBarRect.width) * 100;
      const closestStep = Math.round((percentage / 100) * (totalSteps - 1));

      setDragPosition(Math.max(0, Math.min(totalSteps - 1, closestStep)));
    },
    [isDragging, totalSteps]
  );

  const handleEnd = useCallback(() => {
    if (isDragging && dragPosition !== null) {
      onStepChange(dragPosition);
    }
    setIsDragging(false);
    setDragPosition(null);
  }, [isDragging, dragPosition, onStepChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove);
      document.addEventListener("touchend", handleEnd);
    } else {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const currentTimestamp = timestamps[currentStep];

  const currentDate = useMemo(() => {
    return moment(currentTimestamp, DateFormat.us_timestamp).format(
      DateFormat.us
    );
  }, [currentTimestamp]);

  const currentTime = useMemo(() => {
    return moment(currentTimestamp, DateFormat.us_timestamp).format(
      DateFormat.time
    );
  }, [currentTimestamp]);

  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];

  const firstFormattedTime = useMemo(() => {
    return moment(firstTimestamp, DateFormat.us_timestamp).format(
      DateFormat.time
    );
  }, [firstTimestamp]);

  const firstFormattedDate = useMemo(() => {
    return moment(firstTimestamp, DateFormat.us_timestamp).format(
      DateFormat.us_without_year
    );
  }, [firstTimestamp]);

  const lastFormattedTime = useMemo(() => {
    return moment(lastTimestamp, DateFormat.us_timestamp).format(
      DateFormat.time
    );
  }, [lastTimestamp]);

  const lastFormattedDate = useMemo(() => {
    return moment(lastTimestamp, DateFormat.us_timestamp).format(
      DateFormat.us_without_year
    );
  }, [lastTimestamp]);

  return (
    <>
      <S.DesktopAxisContainer>
        <S.DateContainer>
          <S.Time>{firstFormattedTime}</S.Time>
          <S.Date>{firstFormattedDate}</S.Date>
        </S.DateContainer>
        <S.ProgressBar
          className="progress-bar"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
          <S.RoundMarker
            $position={progressPercentage}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
          >
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
        <S.ProgressBar className="progress-bar" onTouchStart={handleStart}>
          <S.ProgressFiller style={{ width: `${progressPercentage}%` }} />
          <S.RoundMarker
            $position={progressPercentage}
            onTouchStart={handleStart}
          />
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
