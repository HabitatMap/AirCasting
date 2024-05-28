import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { exportSession } from "../../store/exportSessionSlice";

import downloadWhite from "../../assets/icons/downloadWhite.svg";
import { Modal } from "../Modal";
import { screenSizes } from "../../utils/media";

interface SessionDetailsModalProps {
  sessionId: string;
  isOpen: boolean;
  position: {
    bottom: number;
    left: number;
  };
  onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  sessionId,
  isOpen,
  position,
  onClose,
}) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);

  const isMobile = window.innerWidth <= screenSizes.mobile;

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && focusInputRef.current) {
      setTimeout(() => {
        focusInputRef.current!.focus();
      }, 0);
    }
    if (!isOpen) {
    }
  }, [isOpen]);

  return (
    <>
      <Modal
        title={t("exportDataModal.title")}
        buttonName={t("exportDataModal.exportButton")}
        buttonHasIcon
        iconName={downloadWhite}
        isOpen={isOpen}
        onClose={onClose}
        position={position}
      >
        <div>sadasdasdas</div>
      </Modal>
    </>
  );
};

export { SessionDetailsModal };
