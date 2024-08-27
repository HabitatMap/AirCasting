import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import mobileIcon from "../../assets/icons/mobileIcon.svg";
import pinIcon from "../../assets/icons/pin.svg";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import {
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomParametersModalOpen,
  setCustomSensorsModalOpen,
} from "../../store/sessionFiltersSlice";
import { resetUserThresholds } from "../../store/thresholdSlice";
import {
  ParameterTypes,
  SessionType,
  SessionTypes,
  UnitSymbols,
} from "../../types/filters";
import { SENSOR_NAMES } from "../../types/sensors";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const SessionTypeToggle = () => {
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const { currentUserSettings, searchParams, sessionType, setUrlParams } =
    useMapParams();
  const { t } = useTranslation();

  const handleClick = useCallback(
    (type: SessionType) => {
      dispatch(resetUserThresholds());
      dispatch(setBasicParametersModalOpen(false));
      dispatch(setCustomParametersModalOpen(false));
      dispatch(setBasicSensorsModalOpen(false));
      dispatch(setCustomSensorsModalOpen(false));
      dispatch(setFetchingData(true));
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
          value: ParameterTypes.PARTICULATE_MATTER,
        },
        {
          key: UrlParamsTypes.sensorName,
          value:
            type === SessionTypes.FIXED
              ? SENSOR_NAMES.PARTICULATE_MATTER.GOVERNMENT_PM25
              : SENSOR_NAMES.PARTICULATE_MATTER.AIRBEAM_PM25,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: UnitSymbols.ParticulateMatter,
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
