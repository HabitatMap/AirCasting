import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../store/hooks";

import { fetchFixedStreamById } from "../../store/fixedStreamSlice";

import SessionInfo from "./SessionInfo";
import { ExportDataModal } from "../ExportDataModal";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import * as S from "./SessionDetailsModal.style";
import circleCloseIcon from "../../assets/icons/circleCloseIcon.svg";
import type { PopupProps } from "reactjs-popup/dist/types";

interface SessionDetailsModalProps {
  streamId: number;
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const SessionDetailsModal: React.FC<
  SessionDetailsModalProps & Omit<PopupProps, "children">
> = ({ streamId }) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    bottom: number;
    left: number;
  }>({ bottom: 0, left: 0 });
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { sessionId } = useSelector(selectFixedStreamShortInfo);

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
  }, []);

  // Workaround for the typescript error
  const SessionModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = (props) => {
    return <S.SessionDetailsModal {...(props as PopupProps)} />;
  };

  return (
    <SessionModal
      trigger={
        <button
          style={{ position: "absolute", top: "0", left: "0", zIndex: 1000 }}
        >
          Open Modal
        </button>
      }
      modal
      nested
      overlayStyle={{ margin: 0 }}
      contentStyle={{ margin: 0 }}
    >
      {(close) => (
        <>
          <S.CancelButtonX onClick={close}>
            <img src={circleCloseIcon} alt={t("closeWhite.altCloseButton")} />
          </S.CancelButtonX>
          <SessionInfo
            streamId={streamId}
            handleOpenDesktopExportModal={() => setExportModalOpen(true)}
          />
        </>
      )}
    </SessionModal>
  );
};

export { SessionDetailsModal };
