import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ModalContainer,
  ModalContent,
  ButtonsWrapper,
  FlexWrapper,
  ActionButton,
  CancelButtonX,
} from "./ExportModal.style";
import closeButton from "../../assets/icons/closeButton.svg";

interface ModalProps {
  isOpen: boolean;
  hasActionButton?: boolean;
  handleActionButton?: (event: React.FormEvent) => void;
  buttonName?: string;
  buttonHasIcon: boolean;
  iconName: string;
  onClose?: () => void;
  position: {
    bottom: number;
    left: number;
  };
  children: React.ReactNode;
}

const ExportModal: React.FC<ModalProps> = ({
  isOpen,
  hasActionButton = true,
  handleActionButton,
  buttonName,
  buttonHasIcon: hasIcon,
  iconName,
  onClose,
  position,
  children,
}) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleCloseModal = () => {
    onClose?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement && isOpen) {
      modalElement.showModal();
    } else if (modalElement) {
      modalElement.close();
    }
  }, [isOpen]);

  const { t } = useTranslation();

  return (
    <>
      <ModalContainer
        isOpen={isOpen}
        bottom={position.bottom}
        left={position.left}
        onKeyDown={handleKeyDown}
      >
        <ModalContent>
          <FlexWrapper>
            <CancelButtonX onClick={handleCloseModal}>
              <img src={closeButton} alt={t("closeWhite.altCloseButton")} />
            </CancelButtonX>
          </FlexWrapper>
          {children}
          <ButtonsWrapper>
            {hasActionButton && (
              <ActionButton onClick={handleActionButton || (() => {})}>
                {buttonName || ""}
                {hasIcon ? (
                  <img src={iconName} alt={t(`${iconName}.altResetButton`)} />
                ) : null}
              </ActionButton>
            )}
          </ButtonsWrapper>
        </ModalContent>
      </ModalContainer>
    </>
  );
};

export { ExportModal };
