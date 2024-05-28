import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../store/hooks";

import { Modal } from "../Modal";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";

import SessionInfo from "./SessionInfo";
import { ExportDataModal } from "../ExportDataModal";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";

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
  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    bottom: number;
    left: number;
  }>({ bottom: 0, left: 0 });
  const dispatch = useAppDispatch();
  const { sessionId } = useSelector(selectFixedStreamShortInfo);

  const handleOpenDesktopExportModal = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      bottom: window.innerHeight - rect.bottom + rect.height + 1,
      left: rect.left,
    });
    setExportModalOpen(true);
  };

  const handleOpenMobileExportModal = () => {
    setExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
  };

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
        hasActionButton={false}
        isOpen={isOpen}
        onClose={onClose}
        position={position}
        style={{ minWidth: 100, minHeight: 30, borderRadius: 0 }}
      >
        <SessionInfo
          streamId={streamId}
          handleOpenDesktopExportModal={handleOpenDesktopExportModal}
        />
        <ExportDataModal
          sessionId={sessionId}
          isOpen={isExportModalOpen}
          onClose={handleCloseExportModal}
          position={modalPosition}
          onSubmit={(formData) => {}}
        />
      </Modal>
    </>
  );
};

export { SessionDetailsModal };
