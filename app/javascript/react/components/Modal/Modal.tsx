import React, { useRef, useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  ModalContainer,
  ModalContent,
  ButtonsWrapper,
  FlexWrapper,
  ActionButton,
  CancelButton,
  CancelButtonX,
  ModalText,
} from "./Modal.style";
import closeButton from "../../assets/icons/closeButton.svg";

interface ModalProps {
  isOpen: boolean;
  title: string;
  hasCloseButton?: boolean;
  hasActionButton?: boolean;
  handleActionButton?: (event: React.FormEvent) => void;
  buttonName?: string;
  buttonHasIcon: boolean;
  iconName: string;
  onClose?: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  hasCloseButton = true,
  hasActionButton = true,
  handleActionButton,
  buttonName,
  buttonHasIcon: hasIcon,
  iconName,
  onClose,
  children,
}) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);

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
    <ModalContainer isOpen={isOpen} onKeyDown={handleKeyDown}>
      <ModalContent>
        <FlexWrapper>
          <CancelButtonX onClick={handleCloseModal}>
            <img src={closeButton} alt={t("closeWhite.altCloseButton")} />
          </CancelButtonX>
          {title ? <ModalText>{title}</ModalText> : null}
        </FlexWrapper>
        {children}
        <ButtonsWrapper>
          {hasCloseButton && (
            <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
          )}{" "}
          {hasActionButton && (
            <ActionButton onClick={handleActionButton || (() => {})}>
              {buttonName || ""}
              {hasIcon ? (
                <img src={iconName} alt={t("{iconName}.altResetButton")} />
              ) : null}
            </ActionButton>
          )}
        </ButtonsWrapper>
      </ModalContent>
    </ModalContainer>
  );
};

export { Modal };
