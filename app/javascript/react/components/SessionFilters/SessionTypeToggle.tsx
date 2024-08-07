import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { selectDefaultThresholds } from "../../store/thresholdSlice";
import {
  FixedBasicParameterTypes,
  SessionType,
  SessionTypes,
} from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const SessionTypeToggle = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const { searchParams, sessionType, setUrlParams, currentUserSettings } =
    useMapParams();
  const { t } = useTranslation();

  const handleClick = useCallback(
    (type: SessionType) => {
      dispatch(setLoading(true));
      const defaultThresholds = useAppSelector(selectDefaultThresholds);

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
          value: isMobile ? UserSettings.FiltersView : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.sessionId,
          value: "",
        },
        {
          key: UrlParamsTypes.streamId,
          value: "",
        },
        {
          key: UrlParamsTypes.measurementType,
          value: FixedBasicParameterTypes.PARTICULATE_MATTER,
        },
        {
          key: UrlParamsTypes.sensorName,
          value:
            type === SessionTypes.FIXED ? "Government-PM2.5" : "AirBeam-PM2.5",
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: "µg/m³",
        },
        {
          key: UrlParamsTypes.thresholdMin,
          value: defaultThresholds.min.toString(),
        },
        {
          key: UrlParamsTypes.thresholdLow,
          value: defaultThresholds.low.toString(),
        },
        {
          key: UrlParamsTypes.thresholdMiddle,
          value: defaultThresholds.middle.toString(),
        },
        {
          key: UrlParamsTypes.thresholdHigh,
          value: defaultThresholds.high.toString(),
        },
        {
          key: UrlParamsTypes.thresholdMax,
          value: defaultThresholds.max.toString(),
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
          />
        </S.Tab>
      </S.SessionToggleWrapper>
      <FilterInfoPopup filterTranslationLabel="filters.mobileFixedInfo" />
    </S.SingleFilterWrapper>
  );
};

export { SessionTypeToggle };
