import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { selectFixedSessionsState } from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectMobileSessionsState } from "../../store/mobileSessionsSelectors";
import { SessionTypes } from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CloseButton } from "../Map/Legend/Legend.style";
import { ProfileNamesInput } from "./ProfileNamesInput";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";

interface MobileSessionFiltersProps {
  onClose: () => void;
}

const MobileSessionFilters = ({ onClose }: MobileSessionFiltersProps) => {
  const { t } = useTranslation();
  const fixedSessionsState = useAppSelector(selectFixedSessionsState);
  const mobileSessionsState = useAppSelector(selectMobileSessionsState);
  const { sessionType } = useMapParams();

  const sessionsCount = useMemo(() => {
    switch (sessionType) {
      case SessionTypes.FIXED:
        return fixedSessionsState.sessions.length;
      case SessionTypes.MOBILE:
        return mobileSessionsState.sessions.length;
    }
  }, [fixedSessionsState, mobileSessionsState, sessionType]);

  return (
    <S.MobileSessionFilters className="mobileSessionFilters">
      <S.ModalContent>
        <S.Header>
          <CloseButton onClick={onClose}></CloseButton>
          <S.HeaderTitle>{t("filters.editFilters")}</S.HeaderTitle>
        </S.Header>
        <SessionTypeToggle />
        <ProfileNamesInput />
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
