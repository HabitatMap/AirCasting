import React, { useCallback, useState } from "react";
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
  // Workaround for the typescript error
  const TimelapsModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = useCallback((props) => {
    return <S.TimelapsModal {...(props as PopupProps)} />;
  }, []);

  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const [isVisible, setIsVisible] = useState(true);

  const closeHandler = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);

  return (
    <TimelapsModal
      trigger={button}
      modal
      nested
      overlayStyle={{
        margin: 0,
        zIndex: 1,
      }}
      contentStyle={{ margin: 0 }}
      onClose={closeHandler}
      onOpen={onOpen}
      closeOnDocumentClick={false}
    >
      {(close) => (
        <>
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
        </>
      )}
    </TimelapsModal>
  );
});

export { TimelapsComponent };
