import React from "react";

import {
  selectFixedExtremes,
  selectFixedStreamShortInfo,
} from "../../../../store/fixedStreamSelectors";
import { useAppSelector } from "../../../../store/hooks";
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

  const streamShortInfo: StreamShortInfo = useAppSelector(
    fixedSessionTypeSelected
      ? selectFixedStreamShortInfo
      : selectMobileStreamShortInfo
  );
  const extremes = useAppSelector(
    fixedSessionTypeSelected ? selectFixedExtremes : selectMobileExtremes
  );
  const thresholds = useAppSelector(selectThresholds);

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
      />
      <ModalDesktopHeader
        streamShortInfo={streamShortInfo}
        thresholds={thresholds}
        extremes={extremes}
        fixedSessionTypeSelected={fixedSessionTypeSelected}
        streamId={streamId}
      />
    </S.InfoContainer>
  );
};

export default SessionInfo;
