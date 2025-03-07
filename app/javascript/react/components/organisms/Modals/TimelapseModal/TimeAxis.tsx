import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DateFormat } from "../../../../types/dateFormat";
import useScreenSizeDetection from "../../../../utils/useScreenSizeDetection";
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
  const isMobile = useScreenSizeDetection(768);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);

  const progressPercentage = useMemo(() => {
    const step =
      isDragging && dragPosition !== null ? dragPosition : currentStep;
    return (step / (totalSteps - 1)) * 100;
  }, [currentStep, totalSteps, isDragging, dragPosition]);

  const calculateStepFromPosition = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return 0;
      const progressBarRect = progressBarRef.current.getBoundingClientRect();
      const relativePosition = clientX - progressBarRect.left;
      const percentage = (relativePosition / progressBarRect.width) * 100;
      const closestStep = Math.round((percentage / 100) * (totalSteps - 1));
      return Math.max(0, Math.min(totalSteps - 1, closestStep));
    },
    [totalSteps]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => {
      let clientX: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      const closestStep = calculateStepFromPosition(clientX);
      onStepChange(closestStep);
    },
    [calculateStepFromPosition, onStepChange]
  );

  const handleStart = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    (event.target as Element).setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      const clientX = e.clientX;
      const closestStep = calculateStepFromPosition(clientX);
      setDragPosition(closestStep);
      onStepChange(closestStep);
    },
    [isDragging, calculateStepFromPosition, onStepChange]
  );

  const handleEnd = useCallback(
    (event: PointerEvent) => {
      event.preventDefault();
      if (isDragging && dragPosition !== null) {
        onStepChange(dragPosition);
      }

      (event.target as Element).releasePointerCapture(event.pointerId);
      setIsDragging(false);
      setDragPosition(null);
    },
    [isDragging, dragPosition, onStepChange]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<Element>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        const clientX = e.touches[0].clientX;
        const closestStep = calculateStepFromPosition(clientX);
        setDragPosition(closestStep);
        onStepChange(closestStep);
      }
    },
    [isDragging, calculateStepFromPosition, onStepChange]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging && dragPosition !== null) {
      onStepChange(dragPosition);
    }
    setIsDragging(false);
    setDragPosition(null);
  }, [isDragging, dragPosition, onStepChange]);

  useEffect(() => {
    if (isDragging) {
      if (isMobile) {
        document.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd);
      } else {
        window.addEventListener("pointermove", handleMove, {
          passive: false,
        });
        window.addEventListener("pointerup", handleEnd);
      }
    } else {
      if (isMobile) {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      } else {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleEnd);
      }
    }
    return () => {
      if (isMobile) {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      } else {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleEnd);
      }
    };
  }, [
    isDragging,
    isMobile,
    handleTouchMove,
    handleTouchEnd,
    handleMove,
    handleEnd,
  ]);

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

  const isStepActive = (index: number) => {
    const stepPosition = (index / (totalSteps - 1)) * 100;
    const margin = 0.5;
    return progressPercentage >= stepPosition - margin;
  };

  return (
    <>
      {!isMobile ? (
        <S.DesktopAxisContainer>
          <S.DateContainer>
            <S.Time>{firstFormattedTime}</S.Time>
            <S.Date>{firstFormattedDate}</S.Date>
          </S.DateContainer>
          <S.ProgressBar
            ref={progressBarRef}
            onMouseDown={handleClick}
            onTouchStart={handleClick}
            onPointerDown={handleClick}
          >
            <S.ProgressFiller
              style={{ width: `${progressPercentage}%` }}
              $isDragging={isDragging}
            />
            <S.RoundMarker
              $position={progressPercentage}
              $isDragging={isDragging}
              onPointerDown={handleStart}
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
                    $isActive={isStepActive(index)}
                    $isCurrent={index === currentStep}
                    $isDragging={isDragging}
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
      ) : (
        <S.MobileAxisContainer>
          <S.ProgressBar
            ref={progressBarRef}
            className="progress-bar"
            onTouchStart={(e) => {
              e.preventDefault();
              handleClick(e);
            }}
            onPointerDown={handleStart}
          >
            <S.ProgressFiller
              style={{ width: `${progressPercentage}%` }}
              $isDragging={isDragging}
            />
            <S.RoundMarker
              $position={progressPercentage}
              onTouchStart={handleTouchStart}
              onPointerDown={handleStart}
              $isDragging={isDragging}
            />
            <S.StepMarkers>
              {timestamps.map((_, index) => {
                const position = (index / (totalSteps - 1)) * 100;
                return (
                  <S.StepMarker
                    key={index}
                    $isActive={isStepActive(index)}
                    $isCurrent={index === currentStep}
                    $position={position}
                    $isDragging={isDragging}
                  />
                );
              })}
            </S.StepMarkers>
          </S.ProgressBar>
        </S.MobileAxisContainer>
      )}
    </>
  );
};

export default TimeAxis;
