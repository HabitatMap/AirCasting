import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PopupProps } from "reactjs-popup/dist/types";
import circleCloseIcon from "../../../assets/icons/circleCloseIcon.svg";
import { gray200 } from "../../../assets/styles/colors";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
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
        bottom: isMobile ? "4.7rem" : "26.4rem",
        borderBottom: `1px solid ${gray200}`,
      }}
      contentStyle={{ margin: 0 }}
      onClose={closeHandler}
      onOpen={onOpen}
      closeOnDocumentClick={false}
    >
      {(close) => (
        <>
          {!isMobile && (
            <S.CancelButtonX onClick={close}>
              <img src={circleCloseIcon} alt={t("navbar.altClose")} />
            </S.CancelButtonX>
          )}
        </>
      )}
    </TimelapsModal>
  );
});

export { TimelapsComponent };
