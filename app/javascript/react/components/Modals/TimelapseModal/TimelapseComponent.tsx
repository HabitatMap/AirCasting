import moment, { Moment } from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { PopupProps } from "reactjs-popup/dist/types";
import closeTimelapseButton from "../../../assets/icons/closeTimelapseButton.svg";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  selectTimelapseData,
  selectTimelapseIsLoading,
  setCurrentTimestamp,
} from "../../../store/timelapseSlice";
import { DateFormat } from "../../../types/dateFormat";
import { TimeRanges } from "../../../types/timelapse";
import { useAutoDismissAlert } from "../../../utils/useAutoDismissAlert";
import NavigationButtons from "./NavigationButtons";
import TimeAxis from "./TimeAxis";
import * as S from "./TimelapseComponent.style";
import TimeRangeButtons from "./TimeRangeButtons";

interface TimelapseComponentProps {
  onClose: () => void;
}

const TimelapseComponent: React.FC<
  TimelapseComponentProps & Omit<PopupProps, "children">
> = React.memo(({ onClose }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [showReadOnlyPopup, setShowReadOnlyPopup] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isLoading = useAppSelector(selectTimelapseIsLoading);
  const fullTimestamps = useAppSelector(selectTimelapseData);
  const [timeRange, setTimeRange] = useState<TimeRanges>(TimeRanges.HOURS_24);
  const [currentStep, setCurrentStep] = useState(0);

  const resetTimelapse = useCallback(() => {
    setCurrentStep(0);
    dispatch(setCurrentTimestamp(""));
  }, []);

  const filteredTimestamps = useMemo(() => {
    const now = moment.utc();
    let startTime: Moment;

    switch (timeRange) {
      case TimeRanges.HOURS_24:
        startTime = now.clone().subtract(24, "hours");
        break;
      case TimeRanges.DAYS_3:
        startTime = now.clone().subtract(3, "days");
        break;
      case TimeRanges.DAYS_7:
        startTime = now.clone().subtract(7, "days");
        break;
      default:
        startTime = now.clone().subtract(24, "hours");
        break;
    }

    const filtered = Object.keys(fullTimestamps)
      .filter((timestamp) => {
        const parsedTimestamp = moment.utc(
          timestamp,
          DateFormat.us_with_time_seconds_utc
        );
        return parsedTimestamp.isAfter(startTime);
      })
      .sort((a, b) =>
        moment
          .utc(a, DateFormat.us_with_time_seconds_utc)
          .diff(moment.utc(b, DateFormat.us_with_time_seconds_utc))
      );

    if (filtered.length === 0) {
      return Object.keys(fullTimestamps).sort((a, b) =>
        moment
          .utc(a, DateFormat.us_with_time_seconds_utc)
          .diff(moment.utc(b, DateFormat.us_with_time_seconds_utc))
      );
    }

    return filtered;
  }, [timeRange, fullTimestamps]);

  useEffect(() => {
    setCurrentStep(0);
  }, [timeRange]);

  const closeHandler = useCallback(() => {
    resetTimelapse();
    onClose();
  }, [onClose, resetTimelapse]);

  const handleNextStep = useCallback(() => {
    if (currentStep < filteredTimestamps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      dispatch(setCurrentTimestamp(filteredTimestamps[nextStep]));
    }
  }, [currentStep, filteredTimestamps]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      dispatch(setCurrentTimestamp(filteredTimestamps[prevStep]));
    }
  }, [currentStep, filteredTimestamps]);

  const handleGoToStart = useCallback(() => {
    setCurrentStep(0);
    dispatch(setCurrentTimestamp(filteredTimestamps[0]));
  }, [filteredTimestamps, dispatch]);

  const handleGoToEnd = useCallback(() => {
    const lastIndex = filteredTimestamps.length - 1;
    setCurrentStep(lastIndex);
    dispatch(setCurrentTimestamp(filteredTimestamps[lastIndex]));
  }, [filteredTimestamps]);

  const handleOverlayClick = useCallback(
    (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;

      const isMapButton = targetElement.closest(".map-button");

      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node) &&
        !isMapButton
      ) {
        setShowReadOnlyPopup(true);
      }
    },
    [overlayRef]
  );

  useAutoDismissAlert(showReadOnlyPopup, setShowReadOnlyPopup);

  useEffect(() => {
    document.addEventListener("mousedown", handleOverlayClick);
    return () => {
      document.removeEventListener("mousedown", handleOverlayClick);
    };
  }, [handleOverlayClick]);

  const currentTimestamp = filteredTimestamps[currentStep];
  const currentDate = moment
    .utc(currentTimestamp, DateFormat.us_with_time_seconds_utc)
    .format(DateFormat.us_without_year);
  const currentTime = moment
    .utc(currentTimestamp, DateFormat.us_with_time_seconds_utc)
    .format(DateFormat.time);

  return (
    <>
      {!isLoading && (
        <S.TimelapseModal
          open={true}
          modal
          nested
          overlayStyle={{ margin: 0, zIndex: 2 }}
          contentStyle={{ margin: 0 }}
          onClose={closeHandler}
          closeOnDocumentClick={false}
        >
          <div ref={overlayRef}>
            <S.TimeAxisContainer>
              <S.MobileDateContainer>
                <S.Date>{currentDate}</S.Date>
                <S.Time>{currentTime}</S.Time>
              </S.MobileDateContainer>
              <NavigationButtons
                currentStep={currentStep}
                totalSteps={filteredTimestamps.length}
                onNextStep={handleNextStep}
                onPreviousStep={handlePreviousStep}
                onGoToStart={handleGoToStart}
                onGoToEnd={handleGoToEnd}
              />
              <TimeAxis
                currentStep={currentStep}
                totalSteps={filteredTimestamps.length}
                timestamps={filteredTimestamps}
              />
            </S.TimeAxisContainer>
            <TimeRangeButtons
              timeRange={timeRange}
              onSelectTimeRange={setTimeRange}
            />
            <S.CancelButtonX onClick={closeHandler}>
              <img src={closeTimelapseButton} alt={t("navbar.altClose")} />
            </S.CancelButtonX>
          </div>
        </S.TimelapseModal>
      )}

      {showReadOnlyPopup && (
        <S.SmallPopup open>
          <S.AlertInfo>{t("timelapse.readOnly")}</S.AlertInfo>
        </S.SmallPopup>
      )}
    </>
  );
});

export { TimelapseComponent };
