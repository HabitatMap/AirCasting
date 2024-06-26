import React from "react";
import { useTranslation } from "react-i18next";

import circleCloseIcon from "../../../assets/icons/circleCloseIcon.svg";
import { SessionType } from "../../../types/filters";
import useMobileDetection from "../../../utils/useScreenSizeDetection";
import { Graph } from "../../Graph";
import { ThresholdsConfigurator } from "../../ThresholdConfigurator";
import * as S from "./SessionDetailsModal.style";
import SessionInfo from "./SessionInfo";

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
> = ({ onClose, sessionType, streamId }) => {
  const { t } = useTranslation();

  // Workaround for the typescript error
  const SessionModal: React.FC<
    CustomPopupProps & Omit<PopupProps, "children">
  > = (props) => {
    return <S.SessionDetailsModal {...(props as PopupProps)} />;
  };

  const isMobile = useMobileDetection();

  return (
    <SessionModal
      open={true}
      modal
      nested
      overlayStyle={{ margin: 0 }}
      contentStyle={{ margin: 0 }}
      onClose={onClose}
      closeOnDocumentClick={false}
    >
      {(close) => (
        <>
          <S.CancelButtonX onClick={close}>
            <img src={circleCloseIcon} alt={t("closeWhite.altCloseButton")} />
          </S.CancelButtonX>
          <SessionInfo sessionType={sessionType} streamId={streamId} />
          <Graph streamId={streamId} sessionType={sessionType} />
          {!isMobile && <ThresholdsConfigurator isMapPage={true} />}
        </>
      )}
    </SessionModal>
  );
};

export { SessionDetailsModal };
