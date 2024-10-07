import React, { useMemo } from "react";
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
  const fixedSessionTypeSelected = useMemo(
    () => sessionType === SessionTypes.FIXED,
    [sessionType]
  );
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

  const toggleVisibility = () => setIsVisible(!isVisible);

  const commonProps = {
    streamShortInfo,
    thresholds,
    extremes,
  };

  if (isMobile) {
    return (
      <S.InfoContainer>
        <ModalMobileHeader
          {...commonProps}
          toggleVisibility={toggleVisibility}
          isVisible={isVisible}
          isMobile={isMobile}
        />
      </S.InfoContainer>
    );
  }

  return (
    <S.InfoContainer>
      <ModalDesktopHeader
        {...commonProps}
        fixedSessionTypeSelected={fixedSessionTypeSelected}
        streamId={streamId}
      />
    </S.InfoContainer>
  );
};

export default React.memo(SessionInfo);
