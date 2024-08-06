import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PopupProps } from "reactjs-popup/dist/types";
import closeTimelapsButton from "../../../assets/icons/closeTimelapsButton.svg";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import NavigatioButtons from "./NavigationButtons";
import TimeAxis from "./TimeAxis";
import * as S from "./TimelapsComponent.style";

interface TimelapsComponentProps {
  onClose: () => void;
  button: JSX.Element | ((isOpen: boolean) => JSX.Element) | undefined;
  onOpen?: () => void;
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const TimelapsComponent: React.FC<
  TimelapsComponentProps & Omit<PopupProps, "children">
> = React.memo(({ onClose, button, onOpen }) => {
  const TimelapsModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = useCallback((props) => {
    return <S.TimelapsModal {...(props as PopupProps)} />;
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
        setShowReadOnlyPopup(true);
        setTimeout(() => {
          setShowReadOnlyPopup(false);
        }, 3000); // hide the popup after 3 seconds
      }
    },
    [overlayRef]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOverlayClick);
    return () => {
      document.removeEventListener("mousedown", handleOverlayClick);
    };
  }, [handleOverlayClick]);

  return (
    <>
      <TimelapsModal
        trigger={button}
        modal
        nested
        overlayStyle={{
          margin: 0,
          zIndex: 2,
        }}
        contentStyle={{ margin: 0 }}
        onClose={closeHandler}
        onOpen={onOpen}
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

            {!isMobile && (
              <S.CancelButtonX onClick={close}>
                <img src={closeTimelapsButton} alt={t("navbar.altClose")} />
              </S.CancelButtonX>
            )}
          </div>
        )}
      </TimelapsModal>

      {showReadOnlyPopup && (
        <S.SmallPopup open>
          <div>{t("This is read-only mode")}</div>
        </S.SmallPopup>
      )}
    </>
  );
});

export { TimelapsComponent };
