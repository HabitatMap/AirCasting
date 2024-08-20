import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import moment from "moment";
import type { PopupProps } from "reactjs-popup/dist/types";
import closeTimelapseButton from "../../../assets/icons/closeTimelapseButton.svg";
import { DateFormat } from "../../../types/dateFormat";
import { useAutoDismissAlert } from "../../../utils/useAutoDismissAlert";
import NavigationButtons from "./NavigationButtons";
import TimeAxis from "./TimeAxis";
import * as S from "./TimelapseComponent.style";

interface TimelapseComponentProps {
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  timestamps: string[];
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const TimelapseComponent: React.FC<
  TimelapseComponentProps & Omit<PopupProps, "children">
> = React.memo(
  ({
    onClose,
    currentStep,
    totalSteps,
    onNextStep,
    onPreviousStep,
    timestamps,
  }) => {
    const TimelapseModal: React.FC<
      CustomPopupProps & Omit<PopupProps, "children">
    > = useCallback((props) => {
      return <S.TimelapseModal {...(props as PopupProps)} />;
    }, []);

    const { t } = useTranslation();
    const [showReadOnlyPopup, setShowReadOnlyPopup] = useState(false);

    const overlayRef = useRef<HTMLDivElement>(null);

    const closeHandler = useCallback(() => {
      onClose();
    }, [onClose]);

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

    const currentTimestamp = timestamps[currentStep];
    const currentDate = moment
      .utc(currentTimestamp)
      .format(DateFormat.us_without_year);
    const currentTime = moment.utc(currentTimestamp).format("hh:mm A");

    console.log("currentTimestamp", currentTimestamp);

    return (
      <>
        <TimelapseModal
          open={true}
          modal
          nested
          overlayStyle={{
            margin: 0,
            zIndex: 2,
          }}
          contentStyle={{ margin: 0 }}
          onClose={closeHandler}
          closeOnDocumentClick={false}
        >
          {(close) => (
            <div ref={overlayRef}>
              <S.TimeAxisContainer>
                <S.MobileDateContainer>
                  <S.Date>{currentDate}</S.Date>
                  <S.Time>{currentTime}</S.Time>
                </S.MobileDateContainer>
                <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNextStep={onNextStep}
                  onPreviousStep={onPreviousStep}
                />
                <TimeAxis
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  timestamps={timestamps}
                />
              </S.TimeAxisContainer>

              <S.CancelButtonX onClick={close}>
                <img src={closeTimelapseButton} alt={t("navbar.altClose")} />
              </S.CancelButtonX>
            </div>
          )}
        </TimelapseModal>

        {showReadOnlyPopup && (
          <S.SmallPopup open>
            <S.AlertInfo>{t("timelapse.readOnly")}</S.AlertInfo>
          </S.SmallPopup>
        )}
      </>
    );
  }
);

export { TimelapseComponent };
