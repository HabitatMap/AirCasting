import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { selectFixedSessionsState } from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectMobileSessionsState } from "../../store/mobileSessionsSelectors";
import { selectBasicParametersModalOpen } from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CloseButton } from "../Map/Legend/Legend.style";
import { CrowdMapToggle } from "./CrowdmapToggle";
import {
  MobileDeviceParameterFilter,
  ParameterFilter,
} from "./ParameterFilter";
import { ProfileNamesInput } from "./ProfileNamesInput";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";
import { TagsInput } from "./TagsInput";

interface MobileSessionFiltersProps {
  onClose: () => void;
}

const MobileSessionFilters = ({ onClose }: MobileSessionFiltersProps) => {
  const fixedSessionsState = useAppSelector(selectFixedSessionsState);
  const mobileSessionsState = useAppSelector(selectMobileSessionsState);
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );
  const [basicModalOpen, setBasicModalOpen] = useState(
    basicParametersModalOpen
  );
  const { sessionType } = useMapParams();
  const { t } = useTranslation();

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const sessionsCount = useMemo(() => {
    switch (sessionType) {
      case SessionTypes.FIXED:
        return fixedSessionsState.sessions.length;
      case SessionTypes.MOBILE:
        return mobileSessionsState.sessions.length;
    }
  }, [fixedSessionsState, mobileSessionsState, sessionType]);

  useEffect(() => {
    setBasicModalOpen(basicParametersModalOpen);
  }, [basicParametersModalOpen]);

  return (
    <S.MobileSessionFilters>
      {basicModalOpen ? (
        <MobileDeviceParameterFilter
          sessionsCount={sessionsCount}
          onClose={onClose}
        />
      ) : (
        <>
          <S.ModalContent>
            <S.Header>
              <CloseButton onClick={onClose}></CloseButton>
              <S.HeaderTitle>{t("filters.editFilters")}</S.HeaderTitle>
            </S.Header>
            <SessionTypeToggle />
            <ParameterFilter />
            <ProfileNamesInput />
            <TagsInput />
            {!fixedSessionTypeSelected && <CrowdMapToggle />}
          </S.ModalContent>
          <S.ShowSessionsButton onClick={onClose}>
            {t("filters.showSessions")} ({sessionsCount})
          </S.ShowSessionsButton>
        </>
      )}
    </S.MobileSessionFilters>
  );
};

export { MobileSessionFilters };
