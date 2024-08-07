import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PopupProps } from "reactjs-popup/dist/types";
import closeTimelapsButton from "../../../assets/icons/closeTimelapsButton.svg";
import { useAutoDismissAlert } from "../../../utils/useAutoDismissAlert";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import NavigatioButtons from "./NavigationButtons";
import TimeAxis from "./TimeAxis";
import * as S from "./TimelapseComponent.style";

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

  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const [isVisible, setIsVisible] = useState(true);
  const [showReadOnlyPopup, setShowReadOnlyPopup] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const closeHandler = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (event: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
      ) {
        const clickedElement = event.target as HTMLElement;
        const clickedElementZIndex =
          window.getComputedStyle(clickedElement).zIndex;

        if (parseInt(clickedElementZIndex, 10) <= 2) {
          setShowReadOnlyPopup(true);
        }
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

  return (
    <>
      <TimelapseModal
        open={true}
        modal
        nested
        overlayStyle={{
          margin: 0,
          zIndex: 2,
          bottom: isMobile ? 30 : 0,
          top: isMobile ? 30 : 0,
        }}
        contentStyle={{ margin: 0 }}
        onClose={closeHandler}
        closeOnDocumentClick={false}
      >
        {(close) => (
          <div ref={overlayRef}>
            <S.TimeAxisContainer>
              <NavigatioButtons
                onPrevious={function (): void {
                  throw new Error("Function not implemented.");
                }}
                onNext={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
              <TimeAxis
                startTime={""}
                endTime={""}
                onTimeChange={function (newTime: string): void {
                  throw new Error("Function not implemented.");
                }}
              />
            </S.TimeAxisContainer>

            <S.CancelButtonX onClick={close}>
              <img src={closeTimelapsButton} alt={t("navbar.altClose")} />
            </S.CancelButtonX>
          </div>
        )}
      </TimelapseModal>

      {showReadOnlyPopup && (
        <S.SmallPopup open>
          <S.AlerInfo>{t("timelapse.readOnly")}</S.AlerInfo>
        </S.SmallPopup>
      )}
    </>
  );
});

export { TimelapseComponent };
