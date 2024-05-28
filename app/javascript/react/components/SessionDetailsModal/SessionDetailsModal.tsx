import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../store/hooks";
import { exportSession } from "../../store/exportSessionSlice";

import chartIcon from "../../assets/icons/chartIcon.svg";
import { Modal } from "../Modal";
import { screenSizes } from "../../utils/media";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import { useSelector } from "react-redux";

import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { ActionButton } from "../ActionButton/ActionButton";
import downloadImage from "../../assets/icons/download.svg";
import shareLink from "../../assets/icons/shareLink.svg";
import { copyCurrentURL } from "../../utils/copyCurrentUrl";

interface SessionDetailsModalProps {
  streamId: number;
  isOpen: boolean;
  position: {
    bottom: number;
    left: number;
    top?: number;
    right?: number;
  };
  style?: { minWidth: number; minHeight: number; borderRadius?: number };
  onClose: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  position,
  streamId,
  onClose,
}) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const {
    unitSymbol,
    title,
    profile,
    sensorName,
    lastUpdate,
    updateFrequency,
    lastMeasurementValue,
    lastMeasurementDateLabel,
    active,
    sessionId,
    startTime,
    endTime,
    min,
    max,
  } = useSelector(selectFixedStreamShortInfo);

  const isMobile = window.innerWidth <= screenSizes.mobile;

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
  }, []);

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
        title={title}
        buttonName={t("sessionDetailsModal.calendar")}
        buttonHasIcon
        iconName={chartIcon}
        isOpen={isOpen}
        onClose={onClose}
        position={position}
        style={{ minWidth: 100, minHeight: 30 }}
      >
        <div>Sesion name {title}</div>
        <div>sensor name {sensorName}</div>
        <div>average {lastMeasurementValue}</div>
        <div>
          {min}
          {max}
        </div>
        <div>
          {startTime}-{endTime}
        </div>
        <ActionButton
          onClick={handleOpenMobileExportModal}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          <img src={downloadImage} />
        </ActionButton>
        <ActionButton
          onClick={copyCurrentURL}
          aria-label={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </Modal>
    </>
  );
};

export { SessionDetailsModal };
