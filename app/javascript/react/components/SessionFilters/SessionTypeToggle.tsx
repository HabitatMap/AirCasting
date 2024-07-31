import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { resetUserThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const SessionTypeToggle = () => {
  const dispatch = useAppDispatch();
  const { searchParams, sessionType, setUrlParams, currentUserSettings } =
    useMapParams();
  const { t } = useTranslation();

  const handleClick = useCallback(
    (type: SessionType) => {
      dispatch(resetUserThresholds());
      dispatch(setLoading(true));
      setUrlParams([
        {
          key: UrlParamsTypes.sessionType,
          value: type,
        },
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
      ]);
    },
    [searchParams]
  );

  return (
    <S.SingleFilterWrapper>
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
            onClick={() => handleClick(SessionTypes.FIXED)}
          />
        </S.Tab>
      </S.SessionToggleWrapper>
      <FilterInfoPopup filterTranslationLabel="filters.mobileFixedInfo" />
    </S.SingleFilterWrapper>
  );
};

export { SessionTypeToggle };
