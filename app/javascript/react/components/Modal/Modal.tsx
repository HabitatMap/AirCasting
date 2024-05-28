import React, { useRef, useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  ModalContainer,
  ModalContent,
  ButtonsWrapper,
  FlexWrapper,
  BlueButton,
  CancelButton,
  CancelButtonX,
  ModalText,
} from "./Modal.style";
import circleCloseIcon from "../../assets/icons/circleCloseIcon.svg";
import { KeyboardKeys } from "../../types/keyboardKeys";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  hasCloseButton?: boolean;
  hasActionButton?: boolean;
  handleActionButton?: (event: React.FormEvent) => void;
  buttonName?: string;
  buttonHasIcon?: boolean;
  iconName?: string;
  onClose?: () => void;
  children: React.ReactNode;
  position: {
    bottom: number;
    left: number;
    top?: number;
    right?: number;
  };
  style?: {
    minWidth: number;
    minHeight: number;
    borderRadius?: number;
  };
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  hasCloseButton = false,
  hasActionButton = true,
  handleActionButton,
  buttonName,
  buttonHasIcon: hasIcon,
  iconName,
  onClose,
  position,
  children,
  style = { minWidth: 40, minHeight: 20 },
}) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleCloseModal = () => {
    onClose?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === KeyboardKeys.Escape) {
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
    <ModalContainer
      isOpen={isOpen}
      position={position}
      onKeyDown={handleKeyDown}
    >
      <ModalContent $minWidth={style.minWidth} $minHeight={style.minHeight}>
        <FlexWrapper>
          <CancelButtonX onClick={handleCloseModal}>
            <img src={circleCloseIcon} alt={t("closeWhite.altCloseButton")} />
          </CancelButtonX>
          {title ? <ModalText>{title}</ModalText> : null}
        </FlexWrapper>
        {children}
        <ButtonsWrapper>
          {hasCloseButton && (
            <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
          )}{" "}
          {hasActionButton && (
            <BlueButton onClick={handleActionButton || (() => {})}>
              {buttonName || ""}
              {hasIcon ? (
                <img src={iconName} alt={t("{iconName}.altResetButton")} />
              ) : null}
            </BlueButton>
          )}
        </ButtonsWrapper>
      </ModalContent>
    </ModalContainer>
  );
};

export { Modal };
