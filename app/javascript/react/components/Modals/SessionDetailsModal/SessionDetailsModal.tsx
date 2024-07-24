import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import circleCloseIcon from "../../../assets/icons/circleCloseIcon.svg";
import { SessionType } from "../../../types/filters";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import { Graph } from "../../Graph";
import * as S from "./SessionDetailsModal.style";
import SessionInfo from "./SessionInfo/SessionInfo";
import { setModalHeight } from "../../../store/mapSlice";

import type { PopupProps } from "reactjs-popup/dist/types";
import { gray200 } from "../../../assets/styles/colors";
import { useAppDispatch } from "../../../store/hooks";

interface SessionDetailsModalProps {
  onClose: () => void;
  sessionType: SessionType;
  streamId: number | null;
}

type CustomPopupProps = {
  children:
    | React.ReactNode
    | ((close: () => void, isOpen: boolean) => React.ReactNode);
};

const SessionDetailsModal: React.FC<
  SessionDetailsModalProps & Omit<PopupProps, "children">
> = React.memo(({ onClose, sessionType, streamId }) => {
  const [isVisible, setIsVisible] = useState(true);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();
  const isMobile = useMobileDetection();

  useEffect(() => {
    const updateHeight = () => {
      if (modalContentRef.current) {
        dispatch(setModalHeight(modalContentRef.current.clientHeight));
      }
    };

    // Update height on mount and whenever visibility changes
    updateHeight();

    // Update height on window resize
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [isVisible, dispatch]);

  // Workaround for the TypeScript error
  const SessionModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = (props) => {
    return <S.SessionDetailsModal {...(props as PopupProps)} />;
  };

  return (
    <SessionModal
      open={true}
      modal
      nested
      overlayStyle={{
        margin: 0,
        zIndex: 1,
        bottom: "4.7rem",
        borderBottom: `1px solid ${gray200}`,
      }}
      contentStyle={{ margin: 0 }}
      onClose={onClose}
      closeOnDocumentClick={false}
    >
      {(close) => (
        <div ref={modalContentRef}>
          <SessionInfo
            sessionType={sessionType}
            streamId={streamId}
            isVisible={isVisible}
            setIsVisible={setIsVisible}
          />
          {isVisible && <Graph streamId={streamId} sessionType={sessionType} />}
          {!isMobile && (
            <S.CancelButtonX onClick={close}>
              <img src={circleCloseIcon} alt={t("navbar.altClose")} />
            </S.CancelButtonX>
          )}
        </div>
      )}
    </SessionModal>
  );
});

export { SessionDetailsModal };
