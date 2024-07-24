import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { resetUserThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const SessionTypeToggle = () => {
  const dispatch = useAppDispatch();
  const { searchParams, sessionType } = useMapParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = useCallback(
    (type: SessionType) => {
      console.log("handleClick");
      dispatch(resetUserThresholds());
      dispatch(setLoading(true));
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set(UrlParamsTypes.sessionType, type);
      navigate(`?${newSearchParams.toString()}`);
    },
    [searchParams]
  );

  return (
    <S.SessionToggleWrapper>
      <S.Tab
        $isActive={sessionType === SessionTypes.MOBILE}
        onClick={() => handleClick(SessionTypes.MOBILE)}
      >
        {t("filters.mobileSessions")}
        <S.IconWrapper
          $src={mobileIcon}
          $isActive={sessionType === SessionTypes.MOBILE}
        />
      </S.Tab>
      <S.Tab
        $isActive={sessionType === SessionTypes.FIXED}
        onClick={() => handleClick(SessionTypes.FIXED)}
      >
        {t("filters.fixedSessions")}
        <S.IconWrapper
          $src={pinIcon}
          $isActive={sessionType === SessionTypes.FIXED}
        />
      </S.Tab>
    </S.SessionToggleWrapper>
  );
};

export { SessionTypeToggle };
