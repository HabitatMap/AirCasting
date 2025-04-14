import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { PopupProps } from "reactjs-popup/dist/types";
import closeTimelapseButton from "../../../../assets/icons/closeTimelapseButton.svg";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  resetTimelapseData,
  setCurrentTimestamp,
} from "../../../../store/timelapseSlice";
import { DateFormat } from "../../../../types/dateFormat";

import {
  selectTimelapseData,
  selectTimelapseIsLoading,
  selectTimelapseTimeRange,
} from "../../../../store/timelapseSelectors";
import { filterTimestamps } from "../../../../utils/filterTimelapseData";
import { useAutoDismissAlert } from "../../../../utils/useAutoDismissAlert";
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
  const [showReadOnlyPopup, setShowReadOnlyPopup] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isLoading = useAppSelector(selectTimelapseIsLoading);
  const fullTimestamps = useAppSelector(selectTimelapseData);
  const timeRange = useAppSelector(selectTimelapseTimeRange);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const resetTimelapse = useCallback(() => {
    setCurrentStep(0);
    dispatch(setCurrentTimestamp(""));
  }, [dispatch]);

  const filteredTimestamps = useMemo(() => {
    return filterTimestamps(fullTimestamps, timeRange);
  }, [fullTimestamps, timeRange]);

  useEffect(() => {
    setCurrentStep(0);
    if (filteredTimestamps.length > 0) {
      dispatch(setCurrentTimestamp(filteredTimestamps[0]));
    }
  }, [timeRange, filteredTimestamps, dispatch]);

  const closeHandler = useCallback(() => {
    resetTimelapse();
    dispatch(resetTimelapseData());
    onClose();
  }, [onClose, resetTimelapse, dispatch]);

  const handleNextStep = useCallback(() => {
    if (currentStep < filteredTimestamps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      dispatch(setCurrentTimestamp(filteredTimestamps[nextStep]));
    }
  }, [currentStep, filteredTimestamps, dispatch]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      dispatch(setCurrentTimestamp(filteredTimestamps[prevStep]));
    }
  }, [currentStep, filteredTimestamps, dispatch]);

  const handleGoToStart = useCallback(() => {
    setCurrentStep(0);
    dispatch(setCurrentTimestamp(filteredTimestamps[0]));
  }, [filteredTimestamps, dispatch]);

  const handleGoToEnd = useCallback(() => {
    const lastIndex = filteredTimestamps.length - 1;
    setCurrentStep(lastIndex);
    dispatch(setCurrentTimestamp(filteredTimestamps[lastIndex]));
  }, [filteredTimestamps, dispatch]);

  const handleStepChange = useCallback(
    (newStep: number) => {
      setCurrentStep(newStep);
      dispatch(setCurrentTimestamp(filteredTimestamps[newStep]));
    },
    [filteredTimestamps, dispatch]
  );

  const handleOverlayClick = useCallback(
    (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;
      const isMapButton = targetElement.closest(".active-overlay");

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

  useEffect(() => {
    return () => {
      // Reset the current timestamp when the component unmounts
      dispatch(setCurrentTimestamp(""));
    };
  }, [dispatch]);

  const currentTimestamp = filteredTimestamps[currentStep];
  const currentDate = moment(currentTimestamp, DateFormat.us_timestamp).format(
    DateFormat.us_without_year
  );
  const currentTime = moment(currentTimestamp, DateFormat.us_timestamp).format(
    DateFormat.time
  );

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
                onStepChange={handleStepChange}
              />
            </S.TimeAxisContainer>
            <TimeRangeButtons />
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
