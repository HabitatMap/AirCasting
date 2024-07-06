import moment from "moment";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import {
  selectFixedExtremes,
  selectFixedStreamShortInfo,
} from "../../../../store/fixedStreamSelectors";
import {
  selectMobileExtremes,
  selectMobileStreamShortInfo,
} from "../../../../store/mobileStreamSelectors";
import { selectThresholds } from "../../../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../../../types/filters";
import { MobileStreamShortInfo as StreamShortInfo } from "../../../../types/mobileStream";
import useMobileDetection from "../../../../utils/useScreenSizeDetection";
import * as S from "../SessionDetailsModal.style";
import ModalDesktopHeader from "./ModalDesktopHeader";
import ModalMobileHeader from "./ModalMobileHeader";

interface SessionInfoProps {
  sessionType: SessionType;
  streamId: number | null;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  sessionType,
  streamId,
  isVisible,
  setIsVisible,
}) => {
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const isMobile = useMobileDetection();

  const streamShortInfo: StreamShortInfo = useSelector(
    fixedSessionTypeSelected
      ? selectFixedStreamShortInfo
      : selectMobileStreamShortInfo
  );
  const extremes = useSelector(
    fixedSessionTypeSelected ? selectFixedExtremes : selectMobileExtremes
  );
  const thresholds = useSelector(selectThresholds);
  const { t } = useTranslation();

  const formattedTime = (time: string) => {
    return moment.utc(time).format("MM/DD/YYYY HH:mm");
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <S.InfoContainer>
      <ModalMobileHeader
        toggleVisibility={toggleVisibility}
        isVisible={isVisible}
        streamShortInfo={streamShortInfo}
        thresholds={thresholds}
        extremes={extremes}
        isMobile={isMobile}
        formattedTime={formattedTime}
      />
      <ModalDesktopHeader
        streamShortInfo={streamShortInfo}
        thresholds={thresholds}
        extremes={extremes}
        fixedSessionTypeSelected={fixedSessionTypeSelected}
        streamId={streamId}
        formattedTime={formattedTime}
        sessionType={sessionType}
      />
    </S.InfoContainer>
  );
};

export default SessionInfo;
