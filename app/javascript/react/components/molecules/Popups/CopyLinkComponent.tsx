import React, { useEffect, useRef, useState } from "react";

import { PopupProps } from "reactjs-popup/dist/types";

import { useTranslation } from "react-i18next";
import { useAutoDismissAlert } from "../../../utils/useAutoDismissAlert";
import {
  CopyLinkModal,
  CopyLinkModalData,
} from "../../organisms/Modals/CopyLinkModal";
import { ConfirmationMessage } from "../../organisms/Modals/atoms/ConfirmationMessage";
import * as S from "./Popups.style";

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const CopyLinkPopup: React.FC<
  CustomPopupProps & Omit<PopupProps, "children">
> = (props) => {
  return <S.SmallPopup {...(props as PopupProps)} />;
};

interface CopyLinkComponentProps {
  button: JSX.Element | ((isOpen: boolean) => JSX.Element) | undefined;
  isIconOnly: boolean;
  showBelowButton?: boolean;
  onOpen?:
    | ((event?: React.SyntheticEvent<Element, Event> | undefined) => void)
    | undefined;
  onClose?:
    | ((
        event?:
          | React.SyntheticEvent<Element, Event>
          | KeyboardEvent
          | TouchEvent
          | MouseEvent
          | undefined
      ) => void)
    | undefined;
}

const CopyLinkComponent = ({
  button,
  isIconOnly,
  showBelowButton,
  onOpen,
  onClose,
}: CopyLinkComponentProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleCopySubmit = (
    formData: CopyLinkModalData,
    close: { (): void; (): void }
  ) => {
    close();
    setShowConfirmation(true);
    onClose && onClose();
  };

  const handleCopyError = (error: Error) => {
    console.error("Error copying link: ", error.message);
    alert(t("alert.linkShortenedFailed"));
  };

  const rect = buttonRef.current && buttonRef.current.getBoundingClientRect();

  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({ top: rect.top, left: rect.left });
    }
  };

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [buttonRef.current]);

  useAutoDismissAlert(showConfirmation, setShowConfirmation);

  useEffect(() => {
    updateButtonPosition();
  }, [rect?.top, rect?.left]);

  return (
    <S.WrapperButton ref={buttonRef}>
      <CopyLinkPopup
        trigger={button}
        position={`${showBelowButton ? "bottom" : "top"} center`}
        nested
        arrow
        closeOnDocumentClick
        onOpen={onOpen}
        onClose={onClose}
        contentStyle={
          showBelowButton
            ? {
                top: buttonPosition.top + 35,
                left: buttonPosition.left - 40,
                position: "absolute",
              }
            : {}
        }
      >
        {(close) => (
          <CopyLinkModal
            onSubmit={(formData) => handleCopySubmit(formData, close)}
            onError={handleCopyError}
          />
        )}
      </CopyLinkPopup>
      {showConfirmation && (
        <S.ConfirmationPopup
          open={showConfirmation}
          closeOnDocumentClick={false}
          arrow={false}
          contentStyle={{
            top: `${
              showBelowButton
                ? buttonPosition.top + 35
                : buttonPosition.top - 45
            }px`,
            left: `${
              isIconOnly
                ? buttonPosition.left - 12
                : showBelowButton
                ? buttonPosition.left + 20
                : buttonPosition.left + 38
            }px`,
            position: "absolute",
          }}
        >
          <ConfirmationMessage
            message={t("copyLinkModal.confirmationMessage")}
          />
        </S.ConfirmationPopup>
      )}
    </S.WrapperButton>
  );
};

export { CopyLinkComponent };
