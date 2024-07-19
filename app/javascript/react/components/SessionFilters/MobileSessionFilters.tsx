import React, { useMemo } from "react";

import { useTranslation } from "react-i18next";
import { selectFixedSessionsState } from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectMobileSessionsState } from "../../store/mobileSessionsSelectors";
import { selectSelectedSessionType } from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { CloseButton } from "../Map/Legend/Legend.style";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";

interface MobileSessionFiltersProps {
  onClose: () => void;
}

const MobileSessionFilters = ({ onClose }: MobileSessionFiltersProps) => {
  const { t } = useTranslation();

  const selectedSessionType = useAppSelector(selectSelectedSessionType);
  const fixedSessionsState = useAppSelector(selectFixedSessionsState);
  const mobileSessionsState = useAppSelector(selectMobileSessionsState);

  let sessionsCount;

  useMemo(() => {
    if (selectedSessionType === SessionTypes.FIXED) {
      sessionsCount = fixedSessionsState.sessions.length;
    } else if (selectedSessionType === SessionTypes.MOBILE) {
      sessionsCount = mobileSessionsState.sessions.length;
    }
  }, [fixedSessionsState, mobileSessionsState, selectedSessionType]);

  return (
    <S.MobileSessionFilters>
      <S.ModalContent>
        <S.Header>
          <CloseButton onClick={onClose}></CloseButton>
          <S.HeaderTitle>{t("filters.editFilters")}</S.HeaderTitle>
        </S.Header>
        <SessionTypeToggle />
      </S.ModalContent>
      <S.ShowSessionsButton
        // temporarily onClose
        onClick={onClose}
      >
        {t("filters.showSessions")} ({sessionsCount})
      </S.ShowSessionsButton>
    </S.MobileSessionFilters>
  );
};

export { MobileSessionFilters };
