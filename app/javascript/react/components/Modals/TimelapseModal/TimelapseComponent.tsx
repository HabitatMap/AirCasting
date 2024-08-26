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

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const TimelapseComponent: React.FC<
  TimelapseComponentProps & Omit<PopupProps, "children">
> = React.memo(({ onClose }) => {
  const TimelapseModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = useCallback((props) => {
    return <S.TimelapseModal {...(props as PopupProps)} />;
  }, []);

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
  }, [dispatch]);

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
          "YYYY-MM-DD HH:mm:ss UTC"
        );
        return parsedTimestamp.isAfter(startTime);
      })
      .sort((a, b) =>
        moment
          .utc(a, "YYYY-MM-DD HH:mm:ss UTC")
          .diff(moment.utc(b, "YYYY-MM-DD HH:mm:ss UTC"))
      );

    if (filtered.length === 0) {
      return Object.keys(fullTimestamps).sort((a, b) =>
        moment
          .utc(a, "YYYY-MM-DD HH:mm:ss UTC")
          .diff(moment.utc(b, "YYYY-MM-DD HH:mm:ss UTC"))
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

  const handleNextStep = () => {
    if (currentStep < filteredTimestamps.length - 1) {
      setCurrentStep((prevStep) => prevStep + 1);
      dispatch(setCurrentTimestamp(filteredTimestamps[currentStep + 1]));
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
      dispatch(setCurrentTimestamp(filteredTimestamps[currentStep - 1]));
    }
  };

  const handleGoToStart = () => {
    setCurrentStep(0);
    dispatch(setCurrentTimestamp(filteredTimestamps[0]));
  };

  const handleGoToEnd = () => {
    const lastIndex = filteredTimestamps.length - 1;
    setCurrentStep(lastIndex);
    dispatch(setCurrentTimestamp(filteredTimestamps[lastIndex]));
  };

  const handleOverlayClick = useCallback(
    (event: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
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
    .utc(currentTimestamp, "YYYY-MM-DD HH:mm:ss UTC")
    .format(DateFormat.us_without_year);
  const currentTime = moment
    .utc(currentTimestamp, "YYYY-MM-DD HH:mm:ss UTC")
    .format("hh:mm A");

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
