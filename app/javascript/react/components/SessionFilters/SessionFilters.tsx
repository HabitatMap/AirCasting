import React from "react";
import { useTranslation } from "react-i18next";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import {
  selectSelectedSessionType,
  setSelectedSessionType,
} from "../../store/sessionFiltersSlice";
import { resetUserThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import * as S from "./SessionFilters.style";

const SessionFilters = () => {
  const dispatch = useAppDispatch();
  const selectedSessionType = useAppSelector(selectSelectedSessionType);
  const { t } = useTranslation();

  const handleClick = (type: SessionType) => {
    dispatch(setSelectedSessionType(type));
    dispatch(resetUserThresholds());
    dispatch(setLoading(true));
  };

  return (
    <S.SessionFilters>
      <S.SessionToggleWrapper>
        <S.Tab
          $isActive={selectedSessionType === SessionTypes.MOBILE}
          onClick={() => handleClick(SessionTypes.MOBILE)}
        >
          {t("filters.mobileSessions")}
          <S.IconWrapper
            $src={mobileIcon}
            $isActive={selectedSessionType === SessionTypes.MOBILE}
          />
        </S.Tab>
        <S.Tab
          $isActive={selectedSessionType === SessionTypes.FIXED}
          onClick={() => handleClick(SessionTypes.FIXED)}
        >
          {t("filters.fixedSessions")}
          <S.IconWrapper
            $src={pinIcon}
            $isActive={selectedSessionType === SessionTypes.FIXED}
          />
        </S.Tab>
      </S.SessionToggleWrapper>
    </S.SessionFilters>
  );
};

export { SessionFilters };
