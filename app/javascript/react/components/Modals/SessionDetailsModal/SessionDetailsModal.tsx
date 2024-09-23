import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { gray200 } from "../../../assets/styles/colors";
import { SessionType } from "../../../types/filters";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import * as S from "./SessionDetailsModal.style";

import type { PopupProps } from "reactjs-popup/dist/types";
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
  // Workaround for the typescript error
  const SessionModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = useCallback((props) => {
    return <S.SessionDetailsModal {...(props as PopupProps)} />;
  }, []);

  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const [isVisible, setIsVisible] = useState(true);

  const closeHandler = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);

  const sessionInfoProps = useMemo(
    () => ({
      sessionType,
      streamId,
      isVisible,
      setIsVisible,
    }),
    [sessionType, streamId, isVisible]
  );

  return (
    <SessionModal
      open={true}
      modal
      nested
      overlayStyle={{
        margin: 0,
        zIndex: 1,
        bottom: isMobile ? "4.7rem" : "6.4rem",
        borderBottom: `1px solid ${gray200}`,
      }}
      contentStyle={{ margin: 0 }}
      onClose={closeHandler}
      closeOnDocumentClick={false}
    >
      {(close) => (
        <>
          {/* <SessionInfo {...sessionInfoProps} />
          {isVisible && (
            <Graph
              streamId={streamId}
              sessionType={sessionType}
              isCalendarPage={false}
            />
          )}
          {!isMobile && (
            <S.CancelButtonX onClick={close}>
              <img src={circleCloseIcon} alt={t("navbar.altClose")} />
            </S.CancelButtonX>
          )} */}
        </>
      )}
    </SessionModal>
  );
});

export { SessionDetailsModal };
